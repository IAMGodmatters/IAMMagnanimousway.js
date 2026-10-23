#!/usr/bin/env node
/**
 * Read-only audit of public server-rendered links.
 *
 * Does not sign in, click buttons, send forms, buy anything, enumerate accounts,
 * or follow external domains. Interactive operations are covered by separate
 * authenticated browser/Playwright tests.
 */
import assert from 'node:assert/strict';

const origin='https://iammagnanimousway.com';
const timeoutMs=Number(process.env.LINK_AUDIT_TIMEOUT_MS||9000);
const maxPages=180;
const inaccessiblePrefixes=[
 '/api/','/store-api/','/oauth/','/.well-known/','/billing/',
 '/logout','/signout','/unsubscribe','/delete','/remove',
 '/payments/','/checkout/','/stripe/','/actions/','/webhook/'
];
const exclude=path=>inaccessiblePrefixes.some(p=>path===p||path.startsWith(p));
const normalize=href=>{
 try{
  const u=new URL(href,origin);
  if(u.origin!==origin||!['http:','https:'].includes(u.protocol))return null;
  const p=u.pathname.replace(/\/+/g,'/');
  if(exclude(p))return null;
  // Never replay sign-in credentials, tokens, or state-bearing query strings.
  return origin+p;
 }catch{return null;}
};

async function request(url){
 let current=url;
 for(let i=0;i<4;i++){
  const response=await fetch(current,{
   method:'GET',redirect:'manual',
   headers:{'user-agent':'Magnanimous-ReadOnly-Link-Audit/1.0','accept':'text/html,application/xml,text/xml;q=0.9'},
   signal:AbortSignal.timeout(timeoutMs)
  });
  if(response.status>=300&&response.status<400){
   const target=response.headers.get('location');
   if(!target)return {status:response.status,final:current,html:'',error:'redirect without location'};
   const next=normalize(new URL(target,current).href);
   if(!next)return {status:response.status,final:current,html:'',externalRedirect:true};
   current=next;
   continue;
  }
  const html=(response.headers.get('content-type')||'').includes('html')?(await response.text()).slice(0,2000000):'';
  return {status:response.status,final:current,html};
 }
 return {status:0,final:current,html:'',error:'too many redirects'};
}
const hrefs=html=>{
 const found=[];
 const re=/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;
 for(const match of html.matchAll(re)){
  const url=normalize(match[2].replace(/&amp;/g,'&'));
  if(url)found.push(url);
 }
 return found;
};
async function batch(urls,limit=6){
 const results=[];
 for(let i=0;i<urls.length;i+=limit){
  const part=await Promise.all(urls.slice(i,i+limit).map(async u=>{
   try{return {url:u,...await request(u)}}
   catch(error){return {url:u,status:0,error:String(error),html:''}}
  }));
  results.push(...part);
 }
 return results;
}

const sitemapResponse=await request(origin+'/sitemap.xml');
assert.equal(sitemapResponse.status,200,'Live sitemap must be available');
let sitemapBody=sitemapResponse.html;
if(!sitemapBody){
 const res=await fetch(origin+'/sitemap.xml',{signal:AbortSignal.timeout(timeoutMs)});
 sitemapBody=await res.text();
}
const locs=[...sitemapBody.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
 .map(x=>normalize(x[1])).filter(Boolean);
assert.ok(locs.length>=10,'Public sitemap unexpectedly empty or inaccessible');
const core=Array.from(new Set([origin+'/',...locs]));
const first=await batch(core);
const discovered=new Set(core);
for(const result of first)for(const href of hrefs(result.html||''))discovered.add(href);
const secondary=[...discovered].filter(u=>!core.includes(u)).slice(0,maxPages-core.length);
const second=await batch(secondary);
const all=[...first,...second];
const broken=all.filter(x=>!((x.status>=200&&x.status<400)||x.status===401||x.status===403));
const inaccessible=all.filter(x=>x.status===401||x.status===403);
const redirectedExternal=all.filter(x=>x.externalRedirect);
const summary={
 audited_at:new Date().toISOString(),
 origin,
 sitemap_count:locs.length,
 static_links_checked:all.length,
 http_ok_or_redirect:all.length-broken.length-inaccessible.length,
 auth_gated:inaccessible.map(x=>x.url),
 external_redirects:redirectedExternal.map(x=>x.url),
 failed:broken.map(x=>({url:x.url,status:x.status,error:x.error||''}))
};
console.log(JSON.stringify(summary,null,2));
if(broken.length){console.error('FAIL: broken internal GET links detected');process.exitCode=1;}
else console.log('PASS: all sampled sitemap and server-rendered internal links resolve or are auth-gated');

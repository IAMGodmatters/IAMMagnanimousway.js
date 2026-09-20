import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import dns from 'node:dns/promises';
import {spawn} from 'node:child_process';

const host=process.env.HOST||'0.0.0.0';
const port=Number(process.env.PORT||8792);
const token=String(process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN||'');
const chromium=process.env.CHROMIUM_BIN||'/usr/bin/chromium';
const proxy=String(process.env.MAGNANIMOUS_BROWSER_PROXY||'').trim();

function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))}
function authorized(req){return token&&String(req.headers['x-magnanimous-service-token']||'')===token}
async function body(req,limit=1024*1024){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>limit)throw new Error('Request body too large.');chunks.push(c)}return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{}}
function privateIp(ip=''){
 const s=String(ip).toLowerCase();
 if(s==='::1'||s.startsWith('fc')||s.startsWith('fd')||s.startsWith('fe80:'))return true;
 if(/^127\./.test(s)||/^10\./.test(s)||/^169\.254\./.test(s)||/^192\.168\./.test(s))return true;
 const m=s.match(/^172\.(\d+)\./);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return true;
 return false;
}
async function safeUrl(value){
 const url=new URL(String(value||''));
 if(!['http:','https:'].includes(url.protocol))throw new Error('Only public http(s) URLs are allowed.');
 const hostname=url.hostname.toLowerCase();
 if(['localhost','localhost.localdomain'].includes(hostname)||hostname.endsWith('.local')||hostname.endsWith('.internal'))throw new Error('Private browser targets are blocked.');
 if(/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)||hostname.includes(':')){
  if(privateIp(hostname))throw new Error('Private or local browser targets are blocked.');
 }
 if(!proxy){
  const records=await dns.lookup(hostname,{all:true,verbatim:true});
  if(!records.length||records.some(r=>privateIp(r.address)))throw new Error('Private or local browser targets are blocked.');
 }
 return url.toString();
}
async function run(args,{timeout=45000,env={}}={}){
 return await new Promise((resolve,reject)=>{
  const child=spawn(chromium,args,{stdio:['ignore','pipe','pipe'],shell:false,env:{...process.env,...env}});
  const out=[],err=[];let osz=0,esz=0;const cap=8*1024*1024;
  child.stdout.on('data',c=>{if(osz<cap){const b=Buffer.from(c).subarray(0,cap-osz);out.push(b);osz+=b.length}});
  child.stderr.on('data',c=>{if(esz<cap){const b=Buffer.from(c).subarray(0,cap-esz);err.push(b);esz+=b.length}});
  const timer=setTimeout(()=>child.kill('SIGKILL'),Math.max(1000,Math.min(Number(timeout)||45000,90000)));
  child.on('error',reject);
  child.on('close',(code)=>{clearTimeout(timer);resolve({code,stdout:Buffer.concat(out),stderr:Buffer.concat(err)})});
 });
}
async function render(spec={}){
 const url=await safeUrl(spec.url);
 const mode=['dom','screenshot','pdf'].includes(spec.mode)?spec.mode:'dom';
 const width=Math.max(320,Math.min(Number(spec.width||1440),3840));
 const height=Math.max(240,Math.min(Number(spec.height||1000),4000));
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-browser-'));
 try{
  const profile=path.join(dir,'profile');
  const config=path.join(dir,'config');
  const cache=path.join(dir,'cache');
  const runtime=path.join(dir,'runtime');
  const crash=path.join(config,'chromium','Crash Reports');
  await Promise.all([profile,config,cache,runtime,crash].map(p=>fs.mkdir(p,{recursive:true})));
  const common=[
   '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions','--disable-sync',
   '--metrics-recording-only','--mute-audio','--noerrdialogs','--disable-crash-reporter','--disable-breakpad','--disable-quic',
   '--force-webrtc-ip-handling-policy=disable_non_proxied_udp','--window-size='+width+','+height,
   '--user-data-dir='+profile,'--disk-cache-dir='+cache
  ];
  if(proxy){
  const proxyHost=new URL(proxy).hostname;
  common.push('--proxy-server='+proxy,'--proxy-bypass-list=<-loopback>','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE '+proxyHost);
 }
  if(mode==='dom'){
   const browserEnv={HOME:dir,XDG_CONFIG_HOME:config,XDG_CACHE_HOME:cache,XDG_RUNTIME_DIR:runtime,TMPDIR:dir};
   const r=await run([...common,'--dump-dom',url],{timeout:spec.timeout_ms,env:browserEnv});
   if(r.code!==0)throw new Error('Chromium render failed: '+r.stderr.toString('utf8').slice(-1200));
   const html=r.stdout.toString('utf8').slice(0,2000000);
   const netError=html.match(/ERR_[A-Z0-9_]+/);
   if(netError||html.includes('error-code'))throw new Error('Chromium navigation failed: '+(netError?.[0]||'network error page'));
   return{ok:true,mode,url,html};
  }
  const output=path.join(dir,mode==='pdf'?'page.pdf':'page.png');
  const flag=mode==='pdf'?'--print-to-pdf='+output:'--screenshot='+output;
  const browserEnv={HOME:dir,XDG_CONFIG_HOME:config,XDG_CACHE_HOME:cache,XDG_RUNTIME_DIR:runtime,TMPDIR:dir};
  const r=await run([...common,flag,url],{timeout:spec.timeout_ms,env:browserEnv});
  if(r.code!==0)throw new Error('Chromium render failed: '+r.stderr.toString('utf8').slice(-1200));
  const value=await fs.readFile(output);
  return{ok:true,mode,url,content_type:mode==='pdf'?'application/pdf':'image/png',base64:value.toString('base64'),bytes:value.length,width,height};
 }finally{await fs.rm(dir,{recursive:true,force:true})}
}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/health')return json(res,200,{ok:true,identity:'Magnanimous Browser',engine:'Chromium',private_network_targets:false,egress_proxy_required:true,egress_proxy_configured:Boolean(proxy)});
  if(!authorized(req))return json(res,401,{detail:'Magnanimous internal service token required.'});
  if(req.method==='POST'&&req.url==='/render')return json(res,200,await render(await body(req)));
  return json(res,404,{detail:'Magnanimous browser route not found.'});
 }catch(error){return json(res,400,{detail:String(error?.message||error),code:'MAGNANIMOUS_BROWSER_ERROR'})}
});
server.listen(port,host,()=>console.log('Magnanimous Browser listening on '+host+':'+port));

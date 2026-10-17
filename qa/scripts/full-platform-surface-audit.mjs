import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const appRoot=path.join(root,'frontend','app');
const componentRoot=path.join(root,'frontend','components');
const outRoot=path.join(root,'frontend','out');
const reportDir=path.join(root,'artifacts');
const liveBase=String(process.env.LIVE_BASE_URL||'').trim().replace(/\/$/,'');
const liveEnabled=Boolean(liveBase);

function walk(dir,predicate=()=>true){
 const out=[];
 if(!fs.existsSync(dir))return out;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())out.push(...walk(full,predicate));
  else if(predicate(full))out.push(full);
 }
 return out;
}

const sourceFiles=[...walk(appRoot,f=>/\.(?:tsx|ts|jsx|js)$/.test(f)),...walk(componentRoot,f=>/\.(?:tsx|ts|jsx|js)$/.test(f))];
const htmlFiles=walk(outRoot,f=>f.endsWith('.html'));
if(!sourceFiles.length)throw new Error('No frontend source files found.');
if(!htmlFiles.length)throw new Error('No built frontend HTML found. Run the frontend build before this audit.');

function posix(p){return p.split(path.sep).join('/')}
function routeFromHtml(file){
 const rel=posix(path.relative(outRoot,file));
 if(rel==='index.html')return '/';
 if(rel.endsWith('/index.html'))return '/'+rel.slice(0,-'/index.html'.length);
 if(rel.endsWith('.html'))return '/'+rel.slice(0,-5);
 return '/'+rel;
}
function normalizeRoute(value){
 if(!value)return '/';
 let v=value.split('#')[0].split('?')[0]||'/';
 try{v=decodeURI(v)}catch{}
 if(v.length>1)v=v.replace(/\/+$/,'');
 return v||'/';
}
const generatedRoutes=new Set(htmlFiles.map(routeFromHtml).map(normalizeRoute));
const generatedAssets=new Set(walk(outRoot).map(f=>'/'+posix(path.relative(outRoot,f))));

const allowedRuntimePrefixes=['/api/','/.well-known/','/funnels/'];
const allowedRuntimeExact=new Set(['/health','/mcp','/persistent','/restore','/research','/agency','/email']);
function internalTargetExists(target){
 const route=normalizeRoute(target);
 if(generatedRoutes.has(route))return true;
 if(generatedAssets.has(route)||generatedAssets.has(route+'/index.html')||generatedAssets.has(route+'.html'))return true;
 if(allowedRuntimeExact.has(route)||allowedRuntimePrefixes.some(prefix=>route.startsWith(prefix)))return true;
 if(/\.[A-Za-z0-9]{1,8}$/.test(route))return generatedAssets.has(route);
 return false;
}

const findings={errors:[],warnings:[]};
const counters={source_files:sourceFiles.length,html_files:htmlFiles.length,generated_routes:generatedRoutes.size,static_internal_links:0,external_links:0,rendered_buttons:0,rendered_images:0};
const externalLinks=new Set();

function add(kind,item){findings[kind].push(item)}
function rel(file){return posix(path.relative(root,file))}

for(const file of sourceFiles){
 const text=fs.readFileSync(file,'utf8');
 const badHrefPatterns=[
  [/href\s*=\s*["']\s*#["']/g,'placeholder href="#"'],
  [/href\s*=\s*["']\s*["']/g,'empty href'],
  [/href\s*=\s*["']\s*javascript:/gi,'javascript: href']
 ];
 for(const [re,label] of badHrefPatterns){if(re.test(text))add('errors',{file:rel(file),type:'navigation-placeholder',detail:label})}
 if(/onClick\s*=\s*\{\s*\(?.*?\)?\s*=>\s*\{\s*\}\s*\}/s.test(text))add('errors',{file:rel(file),type:'empty-button-handler',detail:'Empty onClick handler found.'});
 if(/\b(?:COMING SOON|NOT YET IMPLEMENTED|PLACEHOLDER BUTTON)\b/i.test(text))add('warnings',{file:rel(file),type:'placeholder-copy',detail:'Customer-facing placeholder language found; verify this is intentional.'});
}

function htmlEntities(value){return value.replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/').replace(/&#47;/g,'/')}
function textContent(value){return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}

for(const file of htmlFiles){
 const html=fs.readFileSync(file,'utf8');
 const route=routeFromHtml(file);
 for(const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi)){
  const raw=htmlEntities(String(match[1]||'').trim());
  if(!raw||raw==='#'||/^javascript:/i.test(raw)){
   add('errors',{file:rel(file),route,type:'rendered-broken-anchor',target:raw||'(empty)'});continue;
  }
  if(raw.startsWith('#'))continue;
  if(/^(?:mailto:|tel:|sms:|data:|blob:)/i.test(raw))continue;
  if(/^https?:\/\//i.test(raw)){
   externalLinks.add(raw);counters.external_links++;continue;
  }
  if(raw.startsWith('/')){
   counters.static_internal_links++;
   if(!internalTargetExists(raw))add('errors',{file:rel(file),route,type:'missing-internal-target',target:raw});
  }
 }
 for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)){
  counters.rendered_buttons++;
  const attrs=match[1]||'',body=match[2]||'';
  const accessible=textContent(body)||/\baria-label\s*=\s*["'][^"']+["']/i.test(attrs)||/\btitle\s*=\s*["'][^"']+["']/i.test(attrs);
  if(!accessible)add('errors',{file:rel(file),route,type:'button-accessibility',detail:'Rendered button has no visible text, aria-label, or title.'});
 }
 for(const match of html.matchAll(/<img\b([^>]*)>/gi)){
  counters.rendered_images++;
  const attrs=match[1]||'';
  if(!/\balt\s*=\s*["'][^"']*["']/i.test(attrs))add('errors',{file:rel(file),route,type:'image-accessibility',detail:'Rendered image is missing alt attribute.'});
 }
}

async function fetchWithTimeout(url,options={},timeoutMs=15000){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{return await fetch(url,{...options,signal:controller.signal,redirect:'follow',headers:{'user-agent':'Magnanimous-Production-Surface-Audit/1.0',...(options.headers||{})}})}
 finally{clearTimeout(timer)}
}

async function mapLimit(items,limit,worker){
 const results=new Array(items.length);let cursor=0;
 async function runner(){while(true){const i=cursor++;if(i>=items.length)return;results[i]=await worker(items[i],i)}}
 await Promise.all(Array.from({length:Math.min(limit,items.length)},runner));
 return results;
}

const live={enabled:liveEnabled,base_url:liveBase||null,routes_checked:0,routes_ok:0,external_checked:0,external_ok:0,external_restricted:0};
if(liveEnabled){
 const routes=[...generatedRoutes].sort();
 await mapLimit(routes,8,async route=>{
  const url=liveBase+(route==='/'?'/':route);
  live.routes_checked++;
  try{
   const response=await fetchWithTimeout(url,{method:'GET'},20000);
   const type=String(response.headers.get('content-type')||'');
   if(response.status>=400){add('errors',{route,type:'production-route-http',status:response.status,url});return}
   if(!type.includes('text/html')){add('errors',{route,type:'production-route-content-type',status:response.status,content_type:type,url});return}
   live.routes_ok++;
  }catch(error){add('errors',{route,type:'production-route-network',url,detail:String(error?.message||error)})}
 });
 const externals=[...externalLinks].sort();
 await mapLimit(externals,8,async url=>{
  live.external_checked++;
  try{
   let response=await fetchWithTimeout(url,{method:'HEAD'},12000);
   if([405,501].includes(response.status))response=await fetchWithTimeout(url,{method:'GET',headers:{Range:'bytes=0-1023'}},12000);
   if(response.status===404||response.status===410){add('errors',{type:'external-link-dead',url,status:response.status});return}
   if([401,403,429].includes(response.status)){live.external_restricted++;add('warnings',{type:'external-link-restricted',url,status:response.status,detail:'Endpoint is live but restricts automated probes.'});return}
   if(response.status>=500){add('warnings',{type:'external-link-server-error',url,status:response.status});return}
   live.external_ok++;
  }catch(error){add('warnings',{type:'external-link-unverified',url,detail:String(error?.message||error)})}
 });
}

const report={
 generated_at:new Date().toISOString(),
 audit:'Magnanimous full platform customer-facing surface integrity',
 scope:{
  source:'frontend/app + frontend/components',
  built_output:'frontend/out/**/*.html',
  production:liveEnabled?'every generated static route + every rendered external anchor':'not requested in this run',
  safety:'read-only GET/HEAD checks only; no form submissions, purchases, deletions, messages, calls, or other consequential mutations'
 },
 counters,
 live,
 errors:findings.errors,
 warnings:findings.warnings,
 pass:findings.errors.length===0
};
fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,'full-platform-surface-audit.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,counters,live,errors:findings.errors.length,warnings:findings.warnings.length},null,2));
if(findings.errors.length){
 console.error('\nSurface audit errors:');
 for(const item of findings.errors.slice(0,100))console.error('-',JSON.stringify(item));
 if(findings.errors.length>100)console.error(`- ... ${findings.errors.length-100} more errors in artifacts/full-platform-surface-audit.json`);
 process.exit(1);
}

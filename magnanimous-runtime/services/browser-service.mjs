import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
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
function safeUrl(value){
 const url=new URL(String(value||''));
 if(!['http:','https:'].includes(url.protocol))throw new Error('Only public http(s) URLs are allowed.');
 const hostname=url.hostname.toLowerCase();
 if(['localhost','localhost.localdomain'].includes(hostname)||hostname.endsWith('.local')||hostname.endsWith('.internal'))throw new Error('Private browser targets are blocked.');
 if(net.isIP(hostname)&&privateIp(hostname))throw new Error('Private or local browser targets are blocked.');
 return url.toString();
}
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function ensureProxyReady(attempts=12){
 if(!proxy)return;
 const health=new URL('/health',proxy).toString();
 let lastError='';
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const response=await fetch(health,{headers:{'cache-control':'no-store'}});
   if(response.ok)return;
   lastError='HTTP '+response.status;
  }catch(error){lastError=String(error?.message||error)}
  await sleep(Math.min(1000,150+(attempt*100)));
 }
 throw new Error('Magnanimous browser egress is not ready: '+lastError);
}
async function fetchSnapshot(url){
 if(!proxy||!token)throw new Error('Magnanimous browser egress snapshot service is not configured.');
 await ensureProxyReady();
 const api=new URL('/fetch',proxy).toString();
 const response=await fetch(api,{
  method:'POST',
  headers:{'content-type':'application/json','x-magnanimous-service-token':token},
  body:JSON.stringify({url,max_bytes:5*1024*1024})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data?.detail||('Magnanimous browser egress returned HTTP '+response.status));
 if(!data?.base64)throw new Error('Magnanimous browser egress returned no snapshot body.');
 return data;
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
function snapshotHtml(snapshot){
 const type=String(snapshot.content_type||'').toLowerCase();
 const bytes=Buffer.from(String(snapshot.base64||''),'base64');
 if(type.includes('html')||type.startsWith('text/')){
  const html=bytes.toString('utf8');
  if(type.includes('html')){
   return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi,'')
    .replace(/\s(src|href)=["']https?:\/\/[^"']+["']/gi,' data-magnanimous-$1=""');
  }
  return '<!doctype html><meta charset="utf-8"><pre style="white-space:pre-wrap;font:16px/1.5 system-ui,sans-serif">'+
   html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
 }
 if(type.startsWith('image/')){
  return '<!doctype html><style>html,body{margin:0;background:#111;min-height:100%;display:grid;place-items:center}img{max-width:100%;max-height:100vh}</style><img src="data:'+type+';base64,'+snapshot.base64+'">';
 }
 return '<!doctype html><meta charset="utf-8"><pre>Magnanimous browser snapshot: '+String(snapshot.url||'')+' ('+type+')</pre>';
}
async function render(spec={}){
 const url=safeUrl(spec.url);
 const mode=['dom','screenshot','pdf'].includes(spec.mode)?spec.mode:'dom';
 const width=Math.max(320,Math.min(Number(spec.width||1440),3840));
 const height=Math.max(240,Math.min(Number(spec.height||1000),4000));
 const snapshot=await fetchSnapshot(url);
 const bytes=Buffer.from(String(snapshot.base64||''),'base64');

 if(mode==='dom'){
  const type=String(snapshot.content_type||'').toLowerCase();
  if(!(type.includes('html')||type.startsWith('text/')))throw new Error('DOM mode requires a text or HTML public resource.');
  return{ok:true,mode,url:snapshot.url||url,status:Number(snapshot.status||200),content_type:type,html:bytes.toString('utf8').slice(0,2000000),bytes:Number(snapshot.bytes||bytes.length)};
 }

 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-browser-'));
 try{
  const profile=path.join(dir,'profile'),config=path.join(dir,'config'),cache=path.join(dir,'cache'),runtime=path.join(dir,'runtime'),crash=path.join(config,'chromium','Crash Reports');
  await Promise.all([profile,config,cache,runtime,crash].map(p=>fs.mkdir(p,{recursive:true})));
  const localPage=path.join(dir,'snapshot.html');
  await fs.writeFile(localPage,snapshotHtml(snapshot),'utf8');
  const common=[
   '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions','--disable-sync',
   '--metrics-recording-only','--mute-audio','--noerrdialogs','--disable-crash-reporter','--disable-breakpad','--disable-quic',
   '--force-webrtc-ip-handling-policy=disable_non_proxied_udp','--window-size='+width+','+height,
   '--user-data-dir='+profile,'--disk-cache-dir='+cache
  ];
  const output=path.join(dir,mode==='pdf'?'page.pdf':'page.png');
  const flag=mode==='pdf'?'--print-to-pdf='+output:'--screenshot='+output;
  const browserEnv={HOME:dir,XDG_CONFIG_HOME:config,XDG_CACHE_HOME:cache,XDG_RUNTIME_DIR:runtime,TMPDIR:dir};
  const target='file://'+localPage;
  const result=await run([...common,flag,target],{timeout:spec.timeout_ms,env:browserEnv});
  if(result.code!==0)throw new Error('Chromium snapshot render failed: '+result.stderr.toString('utf8').slice(-1200));
  const value=await fs.readFile(output);
  return{ok:true,mode,url:snapshot.url||url,status:Number(snapshot.status||200),content_type:mode==='pdf'?'application/pdf':'image/png',base64:value.toString('base64'),bytes:value.length,width,height,snapshot_mode:true};
 }finally{await fs.rm(dir,{recursive:true,force:true})}
}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/health'){
   let egress_ready=!proxy;
   if(proxy){try{await ensureProxyReady(2);egress_ready=true}catch{}}
   return json(res,egress_ready?200:503,{ok:egress_ready,identity:'Magnanimous Browser',engine:'Chromium snapshot renderer',private_network_targets:false,egress_proxy_required:true,egress_proxy_configured:Boolean(proxy),egress_ready,network_mode:'safe-egress-snapshot'});
  }
  if(!authorized(req))return json(res,401,{detail:'Magnanimous internal service token required.'});
  if(req.method==='POST'&&req.url==='/render')return json(res,200,await render(await body(req)));
  return json(res,404,{detail:'Magnanimous browser route not found.'});
 }catch(error){return json(res,400,{detail:String(error?.message||error),code:'MAGNANIMOUS_BROWSER_ERROR'})}
});
server.listen(port,host,()=>console.log('Magnanimous Browser listening on '+host+':'+port));

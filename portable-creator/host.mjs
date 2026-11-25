import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ObsWebSocketClient } from './obs-client.mjs';
import { LiveEventRuntime } from './live-event-runtime.mjs';

const args=process.argv.slice(2);
function arg(name,fallback){const i=args.indexOf(name);return i>=0?args[i+1]:fallback;}
const ROOT=path.resolve(arg('--root',path.dirname(fileURLToPath(import.meta.url))));
const APP=path.join(ROOT,'app');
const DATA=path.join(ROOT,'data');
const VAULT=path.join(DATA,'vault.enc');
const PORT=Math.max(1024,Math.min(65535,Number(arg('--port','3219'))||3219));
const MODEL_HOST='127.0.0.1';
const MODEL_PORT=9931;
const MAX_BODY=1024*1024;
const MAX_PROJECTS=200;
const MAX_PROJECT_TEXT=150000;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
let vaultData=null;
let vaultKey=null;
let vaultSalt=null;
let chatBusy=false;
let chatWindow=Date.now();
let chatCount=0;
let serverPort=PORT;
let obsClient=null;
const OBS_PORT=4455;
const liveEvents=new LiveEventRuntime();

fs.mkdirSync(DATA,{recursive:true});

function securityHeaders(res,type='application/json; charset=utf-8'){
 res.setHeader('content-type',type);
 res.setHeader('cache-control','no-store, max-age=0');
 res.setHeader('x-content-type-options','nosniff');
 res.setHeader('referrer-policy','no-referrer');
 res.setHeader('x-frame-options','DENY');
 res.setHeader('permissions-policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
}
function send(res,status,data,type){
 securityHeaders(res,type);
 res.statusCode=status;
 res.end(type?.startsWith('application/json')?JSON.stringify(data):data);
}
function json(res,status,data){send(res,status,data,'application/json; charset=utf-8');}
function allowedRequest(req,mutation=false){
 const expectedHost='127.0.0.1:'+serverPort;
 if(String(req.headers.host||'').toLowerCase()!==expectedHost)return false;
 const origin=String(req.headers.origin||'');
 if(mutation&&origin!=='http://127.0.0.1:'+serverPort)return false;
 return !origin||origin==='http://127.0.0.1:'+serverPort;
}
async function readJson(req){
 const type=String(req.headers['content-type']||'').toLowerCase();
 if(!type.includes('application/json')){const error=new Error('JSON content type is required.');error.status=415;throw error;}
 const chunks=[];let bytes=0;
 for await(const chunk of req){bytes+=chunk.length;if(bytes>MAX_BODY){const error=new Error('Request is too large.');error.status=413;throw error;}chunks.push(chunk);}
 if(!chunks.length)return {};
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{const error=new Error('Request JSON is invalid.');error.status=400;throw error;}
}
function deriveKey(passphrase,salt){
 return crypto.scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
}
function encryptVault(data,key,salt){
 const iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);
 return {version:1,kdf:'scrypt',cipher:'aes-256-gcm',salt:salt.toString('hex'),iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('base64')};
}
function saveVault(){
 if(!vaultData||!vaultKey||!vaultSalt)throw new Error('Unlock the encrypted USB workspace first.');
 const envelope=encryptVault(vaultData,vaultKey,vaultSalt);
 const target=VAULT+'.tmp';
 fs.writeFileSync(target,JSON.stringify(envelope),{encoding:'utf8',mode:0o600});
 fs.renameSync(target,VAULT);
}
function unlockVault(passphrase){
 if(typeof passphrase!=='string'||passphrase.length<12||passphrase.length>512)throw new Error('Use a workspace passphrase with at least 12 characters.');
 lockVault();
 if(!fs.existsSync(VAULT)){
  vaultSalt=crypto.randomBytes(16);
  vaultKey=deriveKey(passphrase,vaultSalt);
  vaultData={schema:1,projects:[],createdAt:new Date().toISOString()};
  saveVault();
  return {created:true,projectCount:0};
 }
 const envelope=JSON.parse(fs.readFileSync(VAULT,'utf8'));
 if(envelope?.version!==1||envelope?.kdf!=='scrypt'||envelope?.cipher!=='aes-256-gcm')throw new Error('The workspace file uses an unsupported format.');
 vaultSalt=Buffer.from(envelope.salt,'hex');
 const iv=Buffer.from(envelope.iv,'hex');
 const tag=Buffer.from(envelope.tag,'hex');
 const ciphertext=Buffer.from(envelope.ciphertext,'base64');
 if(vaultSalt.length!==16||iv.length!==12||tag.length!==16||ciphertext.length>50*1024*1024)throw new Error('The encrypted workspace is damaged or invalid.');
 const candidate=deriveKey(passphrase,vaultSalt);
 try{
  const decipher=crypto.createDecipheriv('aes-256-gcm',candidate,iv);
  decipher.setAuthTag(tag);
  const plain=Buffer.concat([decipher.update(ciphertext),decipher.final()]).toString('utf8');
  const parsed=JSON.parse(plain);
  if(parsed?.schema!==1||!Array.isArray(parsed.projects))throw new Error('Workspace data format is invalid.');
  vaultKey=candidate;
  vaultData=parsed;
  return {created:false,projectCount:parsed.projects.length};
 }catch(error){
  candidate.fill(0);lockVault();
  throw new Error('The passphrase is incorrect or the encrypted workspace cannot be verified.');
 }
}
function lockVault(){
 if(vaultKey)vaultKey.fill(0);
 vaultKey=null;vaultSalt=null;vaultData=null;
}
async function modelStatus(){
 if(process.env.MAGNANIMOUS_LOCAL_MODEL_ENABLED!=='true')return {ready:false,reason:'No local model was started by the portable launcher.'};
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),1200);
 try{
  const response=await fetch('http://'+MODEL_HOST+':'+MODEL_PORT+'/v1/models',{signal:controller.signal});
  if(!response.ok)return {ready:false,reason:'The local model runtime did not pass its health check.'};
  const data=await response.json().catch(()=>({}));
  return {ready:true,name:String(data?.data?.[0]?.id||'Local GGUF model').slice(0,120)};
 }catch{return {ready:false,reason:'The local model runtime is not responding.'};}
 finally{clearTimeout(timeout);}
}
function safeProject(value){
 const title=String(value?.title||'Untitled project').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,120)||'Untitled project';
 const content=String(value?.content||'').replace(/\u0000/g,'').slice(0,MAX_PROJECT_TEXT);
 const type=['script','lesson','storyboard','live-show','idea','other'].includes(value?.type)?value.type:'other';
 return {id:crypto.randomUUID(),title,content,type,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}
async function handleApi(req,res,url){
 if(req.method==='GET'&&url.pathname==='/api/health'){
  const model=await modelStatus();
  return json(res,200,{ok:true,mode:'offline-portable',networkRequiredForBroadcast:true,model,vault:{initialized:fs.existsSync(VAULT),unlocked:Boolean(vaultData),projectCount:vaultData?.projects?.length||0}});
 }
 if(req.method==='GET'&&url.pathname==='/api/vault/status'){
  return json(res,200,{initialized:fs.existsSync(VAULT),unlocked:Boolean(vaultData),projectCount:vaultData?.projects?.length||0});
 }
 if(req.method==='POST'&&url.pathname==='/api/vault/unlock'){
  const body=await readJson(req);
  try{return json(res,200,{ok:true,...unlockVault(String(body.passphrase||''))});}
  catch(error){return json(res,401,{detail:error.message});}
 }
 if(req.method==='POST'&&url.pathname==='/api/vault/lock'){
  lockVault();return json(res,200,{ok:true,locked:true});
 }
 if(req.method==='GET'&&url.pathname==='/api/projects'){
  if(!vaultData)return json(res,423,{detail:'Unlock the encrypted USB workspace first.'});
  return json(res,200,{projects:vaultData.projects.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))});
 }
 if(req.method==='POST'&&url.pathname==='/api/projects'){
  if(!vaultData)return json(res,423,{detail:'Unlock the encrypted USB workspace first.'});
  const body=await readJson(req);
  const project=safeProject(body);
  const previousBytes=Buffer.byteLength(JSON.stringify(vaultData));
  const nextBytes=previousBytes+Buffer.byteLength(JSON.stringify(project));
  if(vaultData.projects.length>=MAX_PROJECTS||nextBytes>25*1024*1024)return json(res,413,{detail:'The workspace limit has been reached. Export or remove old projects before adding more.'});
  vaultData.projects.push(project);saveVault();
  return json(res,201,{project:{id:project.id,title:project.title,type:project.type,updatedAt:project.updatedAt}});
 }
 if(req.method==='GET'&&url.pathname==='/api/obs/status'){
  if(!obsClient?.connected)return json(res,200,{connected:false,recording:false});
  try{const status=await obsClient.getRecordStatus();return json(res,200,{connected:true,recording:Boolean(status.outputActive),recordingPaused:Boolean(status.outputPaused)});}
  catch{return json(res,200,{connected:Boolean(obsClient?.connected),recording:false,statusUnavailable:true});}
 }
 if(req.method==='POST'&&url.pathname==='/api/obs/connect'){
  const body=await readJson(req);
  if(body.password!==undefined&&typeof body.password!=='string')return json(res,400,{detail:'OBS password must be text.'});
  const password=body.password||'';
  if(password.length>512)return json(res,400,{detail:'OBS password is too long.'});
  if(obsClient)obsClient.disconnect();
  const candidate=new ObsWebSocketClient({port:OBS_PORT});
  try{
   const result=await candidate.connect(password);
   obsClient=candidate;
   return json(res,200,{ok:true,...result,host:'127.0.0.1',port:OBS_PORT});
  }catch(error){candidate.disconnect();obsClient=null;return json(res,502,{detail:error.message||'OBS connection failed.'});}
 }
 if(req.method==='POST'&&url.pathname==='/api/obs/disconnect'){
  if(obsClient)obsClient.disconnect();
  obsClient=null;
  return json(res,200,{ok:true,connected:false});
 }
 if(req.method==='GET'&&url.pathname==='/api/obs/scenes'){
  if(!obsClient?.connected)return json(res,409,{detail:'Connect to OBS first.'});
  try{return json(res,200,await obsClient.getScenes());}
  catch(error){return json(res,502,{detail:error.message||'Could not read OBS scenes.'});}
 }
 if(req.method==='POST'&&url.pathname==='/api/obs/scene'){
  if(!obsClient?.connected)return json(res,409,{detail:'Connect to OBS first.'});
  const body=await readJson(req);
  try{return json(res,200,{ok:true,...await obsClient.setProgramScene(String(body.sceneName||''))});}
  catch(error){return json(res,400,{detail:error.message||'Could not switch OBS scene.'});}
 }
 if(req.method==='POST'&&url.pathname==='/api/obs/recording/start'){
  if(!obsClient?.connected)return json(res,409,{detail:'Connect to OBS first.'});
  try{await obsClient.startRecording();return json(res,200,{ok:true,recording:true});}
  catch(error){return json(res,502,{detail:error.message||'OBS could not start recording.'});}
 }
 if(req.method==='POST'&&url.pathname==='/api/obs/recording/stop'){
  if(!obsClient?.connected)return json(res,409,{detail:'Connect to OBS first.'});
  try{const result=await obsClient.stopRecording();return json(res,200,{ok:true,recording:false,outputPath:String(result.outputPath||'')});}
  catch(error){return json(res,502,{detail:error.message||'OBS could not stop recording.'});}
 }
 if(req.method==='GET'&&url.pathname==='/api/live/events/status'){
  return json(res,200,liveEvents.status());
 }
 if(req.method==='POST'&&url.pathname==='/api/live/events/ingest'){
  const body=await readJson(req);
  if(body.event?.provider!=='manual')return json(res,403,{status:'provider_untrusted',detail:'Browser intake accepts operator-entered manual events only; provider adapters must authenticate in the local companion.'});
  const result=liveEvents.ingest(body.event);
  if(result.status==='accepted')return json(res,202,result);
  if(result.status==='duplicate')return json(res,200,result);
  if(result.status==='rate_limited')return json(res,429,result);
  if(result.status==='queue_full')return json(res,503,result);
  return json(res,400,result);
 }
 if(req.method==='POST'&&url.pathname==='/api/live/events/consume'){
  const body=await readJson(req);
  const limit=Number.isInteger(body.limit)?Math.max(1,Math.min(50,body.limit)):10;
  return json(res,200,{events:liveEvents.consume(limit),...liveEvents.status()});
 }
 if(req.method==='POST'&&url.pathname==='/api/chat'){
  const body=await readJson(req),prompt=String(body.prompt||'').trim();
  if(!prompt||prompt.length>6000)return json(res,400,{detail:'Enter a prompt of 1–6,000 characters.'});
  const model=await modelStatus();
  if(!model.ready)return json(res,503,{detail:'No local AI model is ready. Add a compatible GGUF model and llama-server runtime to the USB package; nothing will be sent to a cloud service.'});
  if(chatBusy)return json(res,429,{detail:'The local model is already answering. Wait for the current request to finish.'});
  if(Date.now()-chatWindow>60000){chatWindow=Date.now();chatCount=0;}
  if(chatCount>=8)return json(res,429,{detail:'The local generation safety limit is eight requests per minute.'});
  chatBusy=true;chatCount++;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
  try{
   const response=await fetch('http://'+MODEL_HOST+':'+MODEL_PORT+'/v1/chat/completions',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({model:model.name,messages:[
     {role:'system',content:'You are Magnanimous AI, the disclosed offline creative assistant. The user is creating content, scripts, lessons, show rundowns, storyboards or live-host material. Be useful, accurate and creative. You have no internet access, no external tools, no ability to execute code or control accounts, and must not claim otherwise. Mark uncertain facts as uncertain. Do not impersonate a real person or clone a voice without permission.'},
     {role:'user',content:prompt}
    ],temperature:0.7,max_tokens:1000,stream:false}),
    signal:controller.signal
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)return json(res,502,{detail:'The local model returned an error. Check the model file, available memory and runtime log.'});
   const answer=String(data?.choices?.[0]?.message?.content||'').trim();
   if(!answer)return json(res,502,{detail:'The local model returned an empty answer.'});
   return json(res,200,{answer,provider:'local-gguf',model:model.name,offline:true});
  }catch(error){
   return json(res,error?.name==='AbortError'?504:503,{detail:error?.name==='AbortError'?'The local generation timed out. Try a smaller model or shorter prompt.':'The local model runtime could not be reached.'});
  }finally{clearTimeout(timeout);chatBusy=false;}
 }
 return json(res,404,{detail:'Portable creator route not found.'});
}
function serveStatic(req,res,url){
 const pathname=decodeURIComponent(url.pathname);
 const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
 const target=path.resolve(APP,relative);
 if(target!==APP&&!target.startsWith(APP+path.sep))return json(res,403,{detail:'Path traversal is not allowed.'});
 if(!fs.existsSync(target)||!fs.statSync(target).isFile())return json(res,404,{detail:'File not found.'});
 const ext=path.extname(target).toLowerCase();
 if(!Object.hasOwn(MIME,ext))return json(res,415,{detail:'This file type is not served.'});
 const type=MIME[ext];
 securityHeaders(res,type);
 res.statusCode=200;
 fs.createReadStream(target).pipe(res);
}
const server=http.createServer(async(req,res)=>{
 try{
  if(!allowedRequest(req,req.method!=='GET'&&req.method!=='HEAD'))return json(res,403,{detail:'Only the local portable application origin is accepted.'});
  const url=new URL(req.url||'/', 'http://127.0.0.1:'+serverPort);
  if(url.pathname.startsWith('/api/'))return await handleApi(req,res,url);
  if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{detail:'Method not allowed.'});
  return serveStatic(req,res,url);
 }catch(error){return json(res,Number(error?.status)||500,{detail:Number(error?.status)?error.message:'The local workspace could not complete the request.'});}
});
server.listen(PORT,'127.0.0.1',()=>{
 serverPort=server.address().port;
 console.log('Magnanimous Portable Creator listening at http://127.0.0.1:'+serverPort);
 console.log('Local-only mode. No remote network listener is open.');
});
function close(){
 if(obsClient)obsClient.disconnect();
 obsClient=null;
 lockVault();
 server.close(()=>process.exit(0));
}
process.on('SIGINT',close);
process.on('SIGTERM',close);

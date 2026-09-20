import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

const host=process.env.HOST||'0.0.0.0';
const port=Number(process.env.PORT||8791);
const root=path.resolve(process.env.MAGNANIMOUS_SANDBOX_ROOT||'/workspace');
const token=String(process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN||'');
const maxOutput=Math.max(64*1024,Math.min(Number(process.env.MAGNANIMOUS_SANDBOX_MAX_OUTPUT||1048576),8*1024*1024));

function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))}
function authorized(req){return token&&String(req.headers['x-magnanimous-service-token']||'')===token}
function safePath(input=''){
 const clean=String(input||'').replace(/\\/g,'/').replace(/^\/+/,'');
 const resolved=path.resolve(root,clean||'.');
 if(resolved!==root&&!resolved.startsWith(root+path.sep))throw new Error('Path escapes sandbox workspace.');
 return resolved;
}
async function body(req,limit=2*1024*1024){
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Request body too large.');chunks.push(chunk)}
 return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{};
}
function safeEnv(input={}){
 const allowed={};
 for(const [k,v] of Object.entries(input||{})){
  if(!/^[A-Z_][A-Z0-9_]{0,80}$/.test(k))continue;
  if(/TOKEN|SECRET|PASSWORD|KEY|COOKIE|AUTH/i.test(k))continue;
  allowed[k]=String(v).slice(0,4000);
 }
 return allowed;
}
async function execCommand(spec={}){
 const argv=Array.isArray(spec.argv)?spec.argv.map(String):[];
 if(!argv.length||argv.length>64)throw new Error('argv must contain 1-64 entries.');
 const command=argv[0];
 if(command.includes('/')||!['node','python3','python','sh','bash','git'].includes(command))throw new Error('Command is not allowed in the Magnanimous sandbox.');
 if((command==='sh'||command==='bash')&&!spec.allow_shell)throw new Error('Shell execution requires allow_shell=true inside the isolated sandbox service.');
 const cwd=safePath(spec.cwd||'.'),timeout=Math.max(100,Math.min(Number(spec.timeout_ms||10000),60000));
 await fs.mkdir(cwd,{recursive:true});
 return await new Promise((resolve)=>{
  const child=spawn(command,argv.slice(1),{
   cwd,env:{PATH:process.env.PATH||'/usr/local/bin:/usr/bin:/bin',HOME:'/workspace',LANG:'C.UTF-8',...safeEnv(spec.env)},
   shell:false,stdio:['ignore','pipe','pipe']
  });
  let stdout=[],stderr=[],outSize=0,errSize=0,truncated=false,finished=false;
  const collect=(target,chunk,isErr=false)=>{
   if(finished)return;
   const current=isErr?errSize:outSize,remaining=Math.max(0,maxOutput-current);
   if(remaining<=0){truncated=true;return}
   const part=chunk.subarray(0,remaining);target.push(part);
   if(isErr)errSize+=part.length;else outSize+=part.length;
   if(part.length<chunk.length)truncated=true;
  };
  child.stdout.on('data',c=>collect(stdout,Buffer.from(c),false));
  child.stderr.on('data',c=>collect(stderr,Buffer.from(c),true));
  const timer=setTimeout(()=>{child.kill('SIGKILL')},timeout);
  child.on('close',(code,signal)=>{
   finished=true;clearTimeout(timer);
   resolve({ok:code===0,exit_code:code,signal:signal||null,stdout:Buffer.concat(stdout).toString('utf8'),stderr:Buffer.concat(stderr).toString('utf8'),truncated});
  });
  child.on('error',error=>{finished=true;clearTimeout(timer);resolve({ok:false,exit_code:null,signal:null,stdout:'',stderr:String(error.message||error),truncated:false})});
 });
}

const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/health')return json(res,200,{ok:true,identity:'Magnanimous Sandbox',isolation:'container',shell_default:false});
  if(!authorized(req))return json(res,401,{detail:'Magnanimous internal service token required.'});
  const url=new URL(req.url,'http://sandbox.local');
  if(req.method==='POST'&&url.pathname==='/exec'){
   const spec=await body(req);return json(res,200,await execCommand(spec));
  }
  if(req.method==='POST'&&url.pathname==='/files/write'){
   const spec=await body(req);const target=safePath(spec.path);await fs.mkdir(path.dirname(target),{recursive:true});
   const value=spec.base64?Buffer.from(String(spec.base64),'base64'):Buffer.from(String(spec.text??''),'utf8');
   if(value.length>4*1024*1024)return json(res,413,{detail:'File write exceeds sandbox limit.'});
   await fs.writeFile(target,value);return json(res,200,{ok:true,path:String(spec.path),bytes:value.length});
  }
  if(req.method==='GET'&&url.pathname==='/files/read'){
   const rel=url.searchParams.get('path')||'';const value=await fs.readFile(safePath(rel));
   if(value.length>4*1024*1024)return json(res,413,{detail:'File read exceeds sandbox limit.'});
   return json(res,200,{ok:true,path:rel,base64:value.toString('base64'),bytes:value.length});
  }
  return json(res,404,{detail:'Magnanimous sandbox route not found.'});
 }catch(error){return json(res,400,{detail:String(error?.message||error),code:'MAGNANIMOUS_SANDBOX_ERROR'})}
});
server.listen(port,host,()=>console.log('Magnanimous Sandbox listening on '+host+':'+port));

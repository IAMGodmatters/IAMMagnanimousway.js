import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const host=process.env.HOST||'0.0.0.0';
const port=Number(process.env.PORT||8793);
const token=String(process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN||'');

function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))}
function authorized(req){return token&&String(req.headers['x-magnanimous-service-token']||'')===token}
async function body(req,limit=12*1024*1024){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>limit)throw new Error('Request body too large.');chunks.push(c)}return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{}}
async function run(args,timeout=30000){
 return await new Promise((resolve,reject)=>{
  const child=spawn('convert',args,{stdio:['ignore','pipe','pipe'],shell:false});
  const err=[];child.stderr.on('data',c=>err.push(Buffer.from(c)));
  const timer=setTimeout(()=>child.kill('SIGKILL'),Math.max(1000,Math.min(Number(timeout)||30000,60000)));
  child.on('error',reject);
  child.on('close',code=>{clearTimeout(timer);resolve({code,stderr:Buffer.concat(err).toString('utf8')})});
 });
}
async function transform(spec={}){
 const source=Buffer.from(String(spec.base64||''),'base64');
 if(!source.length||source.length>10*1024*1024)throw new Error('Image input must be 1 byte to 10 MB.');
 const width=Math.max(0,Math.min(Number(spec.width||0),4096));
 const height=Math.max(0,Math.min(Number(spec.height||0),4096));
 const quality=Math.max(1,Math.min(Number(spec.quality||82),100));
 const format=['png','jpg','jpeg','webp','avif'].includes(String(spec.format||'').toLowerCase())?String(spec.format).toLowerCase():'webp';
 const fit=['cover','contain','scale-down'].includes(spec.fit)?spec.fit:'contain';
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-media-'));
 const input=path.join(dir,'input');
 const output=path.join(dir,'output.'+(format==='jpeg'?'jpg':format));
 try{
  await fs.writeFile(input,source);
  const args=[input,'-auto-orient'];
  if(width||height){
   const geometry=String(width||'')+'x'+String(height||'')+(fit==='cover'?'^':fit==='scale-down'?'>':'');
   args.push('-resize',geometry);
   if(fit==='cover'&&width&&height)args.push('-gravity','center','-extent',String(width)+'x'+String(height));
  }
  args.push('-strip','-quality',String(quality),output);
  const r=await run(args,spec.timeout_ms);
  if(r.code!==0)throw new Error('Image transform failed: '+r.stderr.slice(-1200));
  const value=await fs.readFile(output);
  return{ok:true,format:format==='jpg'?'jpeg':format,content_type:'image/'+(format==='jpg'?'jpeg':format),base64:value.toString('base64'),bytes:value.length,width:width||null,height:height||null,quality,fit};
 }finally{await fs.rm(dir,{recursive:true,force:true})}
}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/health')return json(res,200,{ok:true,identity:'Magnanimous Media Transform',engine:'ImageMagick'});
  if(!authorized(req))return json(res,401,{detail:'Magnanimous internal service token required.'});
  if(req.method==='POST'&&req.url==='/transform')return json(res,200,await transform(await body(req)));
  return json(res,404,{detail:'Magnanimous media route not found.'});
 }catch(error){return json(res,400,{detail:String(error?.message||error),code:'MAGNANIMOUS_MEDIA_ERROR'})}
});
server.listen(port,host,()=>console.log('Magnanimous Media Transform listening on '+host+':'+port));

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import dns from 'node:dns/promises';

const host=process.env.HOST||'0.0.0.0';
const port=Number(process.env.PORT||8794);
const token=String(process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN||'');

function blockedIp(ip=''){
 const s=String(ip).toLowerCase();
 if(s==='::1'||s==='::'||s.startsWith('fc')||s.startsWith('fd')||s.startsWith('fe80:'))return true;
 if(/^127\./.test(s)||/^10\./.test(s)||/^169\.254\./.test(s)||/^192\.168\./.test(s)||/^0\./.test(s))return true;
 const m=s.match(/^172\.(\d+)\./);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return true;
 if(/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(s))return true;
 if(/^192\.0\.0\./.test(s)||/^198\.18\./.test(s)||/^198\.19\./.test(s))return true;
 if(/^192\.0\.2\./.test(s)||/^198\.51\.100\./.test(s)||/^203\.0\.113\./.test(s))return true;
 if(/^22[4-9]\./.test(s)||/^23\d\./.test(s)||/^24\d\./.test(s)||/^25[0-5]\./.test(s))return true;
 return false;
}
async function publicAddress(hostname){
 const name=String(hostname||'').replace(/^\[|\]$/g,'').toLowerCase();
 if(!name||name==='localhost'||name.endsWith('.local')||name.endsWith('.internal'))throw new Error('Private browser destination blocked.');
 if(net.isIP(name)){
  if(blockedIp(name))throw new Error('Private browser destination blocked.');
  return{name,address:name,family:net.isIP(name)};
 }
 const rows=await dns.lookup(name,{all:true,verbatim:true});
 if(!rows.length||rows.some(r=>blockedIp(r.address)))throw new Error('Private browser destination blocked.');
 const selected=rows.find(r=>Number(r.family)===4)||rows[0];
 return{name,address:selected.address,family:selected.family};
}
function authorized(req){return token&&String(req.headers['x-magnanimous-service-token']||'')===token}
function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))}
function deny(socketOrRes,status=403,message='Magnanimous browser egress blocked this destination.'){
 if(typeof socketOrRes.writeHead==='function'){socketOrRes.writeHead(status,{'content-type':'text/plain; charset=utf-8','connection':'close'});socketOrRes.end(message);return}
 try{socketOrRes.write('HTTP/1.1 '+status+' Forbidden\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n'+message)}catch{}
 try{socketOrRes.destroy()}catch{}
}
async function readJson(req,limit=256*1024){
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Request body too large.');chunks.push(chunk)}
 return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{};
}
async function fetchPublic(value,{redirects=0,maxBytes=5*1024*1024}={}){
 if(redirects>5)throw new Error('Too many public-page redirects.');
 const target=new URL(String(value||''));
 if(!['http:','https:'].includes(target.protocol))throw new Error('Only public HTTP(S) fetch targets are allowed.');
 const resolved=await publicAddress(target.hostname);
 const transport=target.protocol==='https:'?https:http;
 return await new Promise((resolve,reject)=>{
  const request=transport.request({
   protocol:target.protocol,
   hostname:resolved.address,
   port:target.port||undefined,
   method:'GET',
   path:target.pathname+target.search,
   headers:{host:target.host,'user-agent':'MagnanimousBrowser/1.0',accept:'text/html,application/xhtml+xml,text/plain,image/*,*/*;q=0.5','accept-encoding':'identity',connection:'close'},
   servername:target.hostname,
   timeout:45000
  },response=>{
   const status=Number(response.statusCode||0);
   const location=response.headers.location;
   if([301,302,303,307,308].includes(status)&&location){
    response.resume();
    const next=new URL(String(location),target).toString();
    fetchPublic(next,{redirects:redirects+1,maxBytes}).then(resolve,reject);
    return;
   }
   const chunks=[];let size=0;let settled=false;
   response.on('data',chunk=>{
    if(settled)return;
    size+=chunk.length;
    if(size>maxBytes){settled=true;request.destroy();reject(new Error('Fetched page exceeds Magnanimous browser snapshot limit.'));return}
    chunks.push(Buffer.from(chunk));
   });
   response.on('end',()=>{
    if(settled)return;
    const body=Buffer.concat(chunks);
    resolve({url:target.toString(),status,content_type:String(response.headers['content-type']||'application/octet-stream').split(';')[0].trim().toLowerCase(),base64:body.toString('base64'),bytes:body.length});
   });
  });
  request.on('timeout',()=>request.destroy(new Error('Public page fetch timed out.')));
  request.on('error',reject);
  request.end();
 });
}

const server=http.createServer(async(req,res)=>{
 try{
  const requestUrl=new URL(req.url||'/','http://egress.local');
  if(req.method==='GET'&&requestUrl.pathname==='/health')return json(res,200,{ok:true,identity:'Magnanimous Browser Egress',private_network_blocking:true,redirect_revalidation:true});
  if(req.method==='POST'&&requestUrl.pathname==='/fetch'){
   if(!authorized(req))return json(res,401,{detail:'Magnanimous internal service token required.'});
   const spec=await readJson(req);
   return json(res,200,await fetchPublic(spec.url,{maxBytes:Math.max(1024,Math.min(Number(spec.max_bytes||5*1024*1024),10*1024*1024))}));
  }

  const target=new URL(String(req.url||''));
  if(!['http:','https:'].includes(target.protocol))return deny(res,400,'Only HTTP(S) proxy targets are allowed.');
  const resolved=await publicAddress(target.hostname);
  const transport=target.protocol==='https:'?https:http;
  const upstream=transport.request({
   protocol:target.protocol,hostname:resolved.address,port:target.port||undefined,method:req.method,
   path:target.pathname+target.search,headers:{...req.headers,host:target.host},servername:target.hostname,timeout:60000
  },upstreamRes=>{res.writeHead(upstreamRes.statusCode||502,upstreamRes.headers);upstreamRes.pipe(res)});
  upstream.on('timeout',()=>upstream.destroy(new Error('Upstream timeout')));
  upstream.on('error',error=>{if(!res.headersSent)deny(res,502,String(error.message||error));else res.destroy(error)});
  req.pipe(upstream);
 }catch(error){deny(res,403,String(error?.message||error))}
});

server.on('connect',async(req,client,head)=>{
 try{
  const raw=String(req.url||'');
  const idx=raw.lastIndexOf(':');
  const hostname=(idx>0?raw.slice(0,idx):raw).replace(/^\[|\]$/g,'');
  const targetPort=idx>0?Number(raw.slice(idx+1)):443;
  if(!Number.isInteger(targetPort)||targetPort<1||targetPort>65535)throw new Error('Invalid CONNECT port.');
  const resolved=await publicAddress(hostname);
  const upstream=net.connect({host:resolved.address,port:targetPort});
  upstream.setTimeout(60000,()=>upstream.destroy());
  upstream.on('connect',()=>{client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: Magnanimous-Egress\r\n\r\n');if(head?.length)upstream.write(head);upstream.pipe(client);client.pipe(upstream)});
  upstream.on('error',()=>deny(client,502,'Magnanimous browser egress could not reach destination.'));
 }catch(error){deny(client,403,String(error?.message||error))}
});

server.listen(port,host,()=>console.log('Magnanimous Browser Egress listening on '+host+':'+port));

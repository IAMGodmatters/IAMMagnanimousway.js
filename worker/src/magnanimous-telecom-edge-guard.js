const TELECOM_READ_PROXY_TIMEOUT_MS=12000;

function isTelecomRead(request){
  const path=new URL(request.url).pathname;
  return (path==='/api/telecom'||path.startsWith('/api/telecom/'))
    &&(request.method==='GET'||request.method==='HEAD');
}

export function unauthenticatedTelecomRead(request){
  if(!isTelecomRead(request))return false;
  const authorization=String(request.headers.get('authorization')||'').trim();
  // The platform's browser and API sessions use Bearer tokens, including opaque ms1_ sessions.
  return !/^Bearer\s+\S+/i.test(authorization);
}

export function telecomReadProxyTimeoutMs(request){
  // Only bound read-only Telecom requests. Never impose this timeout on payment,
  // provider actions, webhook writes or AI executions that could have side effects.
  return isTelecomRead(request)?TELECOM_READ_PROXY_TIMEOUT_MS:0;
}

// Telecom read responses must finish before the proxy returns: fetch's abort
// signal also bounds body reads. Cap buffered bytes to protect the edge runtime.
export async function readTelecomProxyBody(response,maxBytes=2*1024*1024){
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;
   if(size>maxBytes)throw new Error('Telecom proxy response exceeds safe buffer limit');
   chunks.push(value);
  }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
 }catch(error){void reader.cancel().catch(()=>{});throw error;}
 finally{reader.releaseLock();}
}

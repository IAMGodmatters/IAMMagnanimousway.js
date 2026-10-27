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

const REQUEST_IDS=new WeakMap();

const PRIVATE_PAGE_PREFIXES=[
  '/owner-','/agency-','/agent-desk','/agent-video','/agents','/activity',
  '/ai-chat','/ai-connectors','/ai-receptionist','/ai-video','/assistant-actions','/auto-dialer',
  '/billing','/connections','/contact-center','/crm','/customer-service','/email','/finance-people',
  '/grants','/integrations','/knowledge','/leads','/login','/magnanimous','/bible-study','/marketing',
  '/mux','/phone','/qa-','/research','/signup','/social-media','/space','/support','/telecom',
  '/tool-foundry','/travel','/video-studio','/virtual-assistant'
];

function acceptableIncomingId(value){
  const id=String(value||'').trim();
  return /^[A-Za-z0-9._:-]{8,128}$/.test(id)?id:'';
}

export function requestCorrelationId(request){
  if(!request)return crypto.randomUUID();
  const remembered=REQUEST_IDS.get(request);
  if(remembered)return remembered;
  const incoming=acceptableIncomingId(request.headers?.get?.('x-request-id'));
  const id=incoming||crypto.randomUUID();
  REQUEST_IDS.set(request,id);
  return id;
}

function privatePrefixMatches(pathname,prefix){
  if(prefix.endsWith('-'))return pathname.startsWith(prefix);
  return pathname===prefix||pathname.startsWith(`${prefix}/`);
}

function isPrivatePage(pathname){
  if(!pathname||pathname.startsWith('/api/')||pathname==='/health')return false;
  return PRIVATE_PAGE_PREFIXES.some(prefix=>privatePrefixMatches(pathname,prefix));
}

export function applyPlatformResponseHeaders(request,response){
  if(!response)return response;
  const headers=new Headers(response.headers);
  headers.set('x-request-id',requestCorrelationId(request));
  const url=new URL(request.url);
  if(isPrivatePage(url.pathname)){
    headers.set('x-robots-tag','noindex, nofollow, noarchive, nosnippet');
    if(String(headers.get('content-type')||'').toLowerCase().includes('text/html'))headers.set('cache-control','private, no-store');
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function d1DailyLimit(error){
  const message=`${String(error?.message||'')} ${String(error?.cause?.message||'')}`.toLowerCase();
  if(message.includes("exceeded d1's free tier daily row write limit"))return'write';
  if(message.includes("exceeded d1's free tier daily row read limit"))return'read';
  return'';
}
function nextUtcReset(){
  const d=new Date();return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1,0,0,0)).toISOString();
}

export function unhandledRequestFailure(request,error){
  const id=requestCorrelationId(request);
  const url=new URL(request.url);
  const message=String(error?.message||error||'unknown error').slice(0,500);
  console.error('unhandled platform request failure',{
    request_id:id,
    method:String(request.method||'GET'),
    path:url.pathname,
    error:message
  });
  const d1Limit=d1DailyLimit(error);
  if(url.pathname.startsWith('/api/')&&d1Limit){
    return Response.json({
      detail:'Database capacity is temporarily unavailable because the Cloudflare D1 Free daily row '+d1Limit+' limit has been reached.',
      code:d1Limit==='write'?'D1_DAILY_ROW_WRITE_LIMIT':'D1_DAILY_ROW_READ_LIMIT',
      request_id:id,
      resets_at_utc:nextUtcReset()
    },{status:503,headers:{'cache-control':'no-store','retry-after':'3600'}});
  }
  if(url.pathname.startsWith('/api/')){
    return Response.json({detail:'An unexpected server error occurred.',code:'INTERNAL_ERROR',request_id:id},{status:500,headers:{'cache-control':'no-store'}});
  }
  return new Response('The service could not complete this request.',{status:500,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
}

const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
let schemaReady=false;

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

async function hmacHex(secret,value){
  const key=await crypto.subtle.importKey('raw',encoder.encode(String(secret||'')),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const out=await crypto.subtle.sign('HMAC',key,encoder.encode(String(value||'')));
  return [...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function sha256(value){
  const out=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));
  return [...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function safeEqual(left,right){
  const a=String(left||''),b=String(right||'');
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i+=1)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
function cleanSignature(value){
  const raw=String(value||'').trim();
  const match=raw.match(/^(?:sha256|v1)=([0-9a-f]{64})$/i);
  if(match)return match[1].toLowerCase();
  return /^[0-9a-f]{64}$/i.test(raw)?raw.toLowerCase():'';
}
async function ensureSchema(env){
  if(schemaReady||!env?.DB)return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS carrier_webhook_events (
    event_id TEXT PRIMARY KEY,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    received_at INTEGER NOT NULL,
    processed_at INTEGER
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_carrier_webhook_events_received ON carrier_webhook_events(received_at)').run();
  schemaReady=true;
}
async function cleanup(env,t=now()){
  try{await env.DB.prepare('DELETE FROM carrier_webhook_events WHERE received_at<?').bind(t-604800).run()}catch(_){}
}
function rebuildRequest(request,raw,secret,requestId=''){
  const headers=new Headers(request.headers);
  headers.set('content-type','application/json');
  headers.set('x-iam-webhook-secret',secret);
  if(requestId)headers.set('x-request-id',requestId);
  return new Request(request.url,{method:'POST',headers,body:raw});
}
function eventIdFrom(headers,body){
  return String(headers.get('x-iam-webhook-id')||body?.event_id||body?.provider_event_id||body?.webhook_id||'').trim().slice(0,200);
}

export async function prepareCarrierWebhook(request,env,requestId=''){
  const url=new URL(request.url);
  if(url.pathname!=='/api/phone/webhook'||request.method!=='POST')return{request,active:false};
  const secret=String(env?.VOIP_WEBHOOK_SECRET||'').trim();
  if(!secret)return{request,active:true,response:json({detail:'Carrier webhooks are not configured.'},503)};

  const raw=await request.text();
  let body;try{body=JSON.parse(raw)}catch{return{request,active:true,response:json({detail:'Invalid webhook payload.'},400)}}
  const timestamp=String(request.headers.get('x-iam-webhook-timestamp')||'').trim();
  const signature=cleanSignature(request.headers.get('x-iam-webhook-signature'));
  const signed=Boolean(timestamp||signature);

  if(signed){
    const stamp=Number(timestamp);
    if(!timestamp||!signature||!Number.isFinite(stamp)||Math.abs(now()-stamp)>300){
      return{request,active:true,response:json({detail:'Expired or incomplete carrier webhook signature.',code:'WEBHOOK_SIGNATURE_INVALID'},401)};
    }
    const expected=await hmacHex(secret,`${timestamp}.${raw}`);
    if(!safeEqual(signature,expected))return{request,active:true,response:json({detail:'Invalid carrier webhook signature.',code:'WEBHOOK_SIGNATURE_INVALID'},401)};
    const eventId=eventIdFrom(request.headers,body);
    if(!eventId)return{request,active:true,response:json({detail:'Signed carrier webhooks require a stable event id.',code:'WEBHOOK_EVENT_ID_REQUIRED'},400)};
    if(!env?.DB)return{request,active:true,response:json({detail:'Carrier webhook replay protection is unavailable.',code:'WEBHOOK_REPLAY_GUARD_REQUIRED'},503)};
    await ensureSchema(env);
    const payloadHash=await sha256(raw),t=now();
    const inserted=await env.DB.prepare("INSERT OR IGNORE INTO carrier_webhook_events(event_id,payload_hash,status,received_at,processed_at) VALUES(?,?,'processing',?,NULL)")
      .bind(eventId,payloadHash,t).run();
    if(Number(inserted?.meta?.changes||0)===0){
      return{request,active:true,response:json({ok:true,duplicate:true,event_id:eventId})};
    }
    await cleanup(env,t);
    return{request:rebuildRequest(request,raw,secret,requestId),active:true,mode:'signed-v1',eventId,payloadHash};
  }

  const supplied=String(request.headers.get('x-iam-webhook-secret')||'');
  if(!safeEqual(supplied,secret))return{request,active:true,response:json({detail:'Invalid carrier webhook signature.',code:'WEBHOOK_SIGNATURE_INVALID'},401)};
  if(String(env?.VOIP_WEBHOOK_LEGACY_COMPAT||'true').toLowerCase()==='false'){
    return{request,active:true,response:json({detail:'Legacy carrier webhook authentication is disabled. Use signed webhook v1.',code:'WEBHOOK_SIGNATURE_UPGRADE_REQUIRED'},426)};
  }
  return{request:rebuildRequest(request,raw,secret,requestId),active:true,mode:'legacy-compat'};
}

export async function completeCarrierWebhook(context,response,env){
  if(!context?.active||!response)return response;
  const headers=new Headers(response.headers);
  headers.set('x-magnanimous-webhook-security',context.mode||'guarded');
  if(context.mode==='legacy-compat')headers.set('deprecation','true');
  if(context.mode==='signed-v1'&&context.eventId&&env?.DB){
    if(response.ok){
      await env.DB.prepare("UPDATE carrier_webhook_events SET status='processed',processed_at=? WHERE event_id=?")
        .bind(now(),context.eventId).run();
    }else{
      await env.DB.prepare("DELETE FROM carrier_webhook_events WHERE event_id=? AND status='processing'")
        .bind(context.eventId).run();
    }
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const xml=(body,status=200)=>new Response(body,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});
const enc=new TextEncoder();

export function plivoReady(env){return Boolean(env.PLIVO_AUTH_ID&&env.PLIVO_AUTH_TOKEN&&env.PLIVO_PHONE_NUMBER)}

function basicAuth(env){return `Basic ${btoa(`${String(env.PLIVO_AUTH_ID)}:${String(env.PLIVO_AUTH_TOKEN)}`)}`}
function e164(value){const v=String(value||'').trim();return /^\+[1-9]\d{6,14}$/.test(v)?v:''}
function esc(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function safeEqual(a,b){const x=String(a||''),y=String(b||'');if(x.length!==y.length)return false;let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);return diff===0}
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
async function hmacSha256Base64(secret,message){const key=await crypto.subtle.importKey('raw',enc.encode(String(secret)),{name:'HMAC',hash:'SHA-256'},false,['sign']);const out=await crypto.subtle.sign('HMAC',key,enc.encode(String(message)));return b64(new Uint8Array(out))}
async function postParams(request){
 if(request.method!=='POST')return{};
 const type=String(request.headers.get('content-type')||'').toLowerCase();
 try{
  if(type.includes('application/x-www-form-urlencoded')||type.includes('multipart/form-data')){
   const form=await request.clone().formData(),out={};for(const [k,v] of form.entries())out[String(k)]=String(v);return out;
  }
  if(type.includes('application/json')){
   const body=await request.clone().json();if(body&&typeof body==='object'&&!Array.isArray(body)){const out={};for(const [k,v] of Object.entries(body))out[String(k)]=String(v??'');return out;}
  }
 }catch(_){ }
 return{};
}
async function validPlivoV3(request,env){
 if(!env?.PLIVO_AUTH_TOKEN)return false;
 const signature=String(request.headers.get('X-Plivo-Signature-V3')||'').trim();
 const nonce=String(request.headers.get('X-Plivo-Signature-V3-Nonce')||'').trim();
 if(!signature||!nonce)return false;
 const url=request.url,params=await postParams(request),keys=Object.keys(params).sort((a,b)=>a<b?-1:a>b?1:0);
 let assembled=url;
 if(request.method==='POST'&&keys.length)assembled+=`.${keys.map(k=>`${k}${params[k]}`).join('')}`;
 assembled+=`.${nonce}`;
 const expected=await hmacSha256Base64(env.PLIVO_AUTH_TOKEN,assembled);
 return signature.split(',').map(x=>x.trim()).some(x=>safeEqual(x,expected));
}

export async function handlePlivoCarrier(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/phone/plivo/answer'&&(request.method==='GET'||request.method==='POST')){
  if(!plivoReady(env))return xml('<?xml version="1.0" encoding="UTF-8"?><Response><Speak>Magnanimous calling is not configured.</Speak></Response>',503);
  const valid=await validPlivoV3(request,env).catch(()=>false);
  if(!valid)return xml('<?xml version="1.0" encoding="UTF-8"?><Response><Speak>Unauthorized call request.</Speak></Response>',403);
  let message=url.searchParams.get('message')||'Hello. You are connected to Magnanimous AI.';
  if(request.method==='POST'){
   try{const form=await request.clone().formData();message=String(form.get('message')||message)}catch(_){ }
  }
  message=esc(String(message).slice(0,450));
  return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Speak>${message}</Speak></Response>`);
 }
 if(!plivoReady(env))return null;
 if(path==='/api/phone/config'&&request.method==='GET')return json({browserCalling:true,pstnConfigured:true,inboundConfigured:false,provider:'Plivo Voice',carrierMode:'plivo',aiCarrier:true,callerId:String(env.PLIVO_PHONE_NUMBER||''),accessGranted:true,message:'Plivo is connected as the Magnanimous PSTN carrier. Free browser calling remains available.'});
 if(path==='/api/phone/calls/outbound'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  if(body.consent_confirmed!==true||body.ai_disclosure_accepted!==true)return json({detail:'Confirm contact permission and AI disclosure before placing an automated carrier call.',code:'CALL_CONSENT_REQUIRED'},400);
  const to=e164(body.to),from=e164(env.PLIVO_PHONE_NUMBER);
  if(!to)return json({detail:'Destination must be a valid E.164 phone number.',code:'INVALID_DESTINATION'},400);
  if(!from)return json({detail:'PLIVO_PHONE_NUMBER must be configured in E.164 format.',code:'PLIVO_CALLER_ID_INVALID'},503);
  const greeting=String(body.opening_message||'Hello. This is Magnanimous AI calling. This is an automated AI-assisted call.');
  const answer=new URL('/api/phone/plivo/answer',url.origin);answer.searchParams.set('message',greeting.slice(0,450));
  const endpoint=`https://api.plivo.com/v1/Account/${encodeURIComponent(String(env.PLIVO_AUTH_ID))}/Call/`;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  let upstream;
  try{upstream=await fetch(endpoint,{method:'POST',headers:{authorization:basicAuth(env),'content-type':'application/json'},body:JSON.stringify({from,to,answer_url:answer.toString(),answer_method:'GET'}),signal:controller.signal})}
  catch(e){clearTimeout(timer);return json({detail:e?.name==='AbortError'?'Plivo call request timed out.':'Plivo call request failed.',provider:'plivo',code:'PLIVO_UPSTREAM_FAILED'},502)}
  clearTimeout(timer);
  const data=await upstream.json().catch(()=>({}));
  if(!upstream.ok)return json({detail:data?.error||data?.message||'Plivo could not place the call.',provider:'plivo',provider_status:upstream.status},upstream.status>=400&&upstream.status<500?400:502);
  const callId=String(data.request_uuid||data.call_uuid||data.api_id||crypto.randomUUID());
  return json({id:callId,call_id:callId,provider_call_id:callId,status:'queued',provider:'plivo',agent:'Magnanimous AI'},201);
 }
 return null;
}

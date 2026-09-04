const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const xml=(body,status=200)=>new Response(body,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});

export function plivoReady(env){return Boolean(env.PLIVO_AUTH_ID&&env.PLIVO_AUTH_TOKEN&&env.PLIVO_PHONE_NUMBER)}

function basicAuth(env){return `Basic ${btoa(`${String(env.PLIVO_AUTH_ID)}:${String(env.PLIVO_AUTH_TOKEN)}`)}`}
function e164(value){const v=String(value||'').trim();return /^\+[1-9]\d{6,14}$/.test(v)?v:''}
function esc(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}

export async function handlePlivoCarrier(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/phone/plivo/answer'&&(request.method==='GET'||request.method==='POST')){
  const message=esc(url.searchParams.get('message')||'Hello. You are connected to Magnanimous AI.');
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
  const upstream=await fetch(endpoint,{method:'POST',headers:{authorization:basicAuth(env),'content-type':'application/json'},body:JSON.stringify({from,to,answer_url:answer.toString(),answer_method:'GET'})});
  const data=await upstream.json().catch(()=>({}));
  if(!upstream.ok)return json({detail:data?.error||data?.message||'Plivo could not place the call.',provider:'plivo',provider_status:upstream.status},upstream.status>=400&&upstream.status<500?400:502);
  const callId=String(data.request_uuid||data.call_uuid||data.api_id||crypto.randomUUID());
  return json({id:callId,call_id:callId,provider_call_id:callId,status:'queued',provider:'plivo',agent:'Magnanimous AI'},201);
 }
 return null;
}

const now=()=>Math.floor(Date.now()/1000);
const clean=v=>String(v||'').trim();
const phone=v=>clean(v).replace(/[\s().-]/g,'');
const esc=v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const xml=(body,status=200)=>new Response(body,{status,headers:{'content-type':'text/xml; charset=utf-8','cache-control':'no-store'}});
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function hmacSha1(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(secret)),{name:'HMAC',hash:'SHA-1'},false,['sign']);const out=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));let s='';for(const b of out)s+=String.fromCharCode(b);return btoa(s)}
async function validTwilio(request,env){if(!env.TWILIO_AUTH_TOKEN)return false;const supplied=request.headers.get('x-twilio-signature')||'';if(!supplied)return false;let form;try{form=await request.clone().formData()}catch{return false}const grouped=new Map();for(const[k,raw]of form.entries()){const v=typeof raw==='string'?raw:'';if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(v)}let payload=request.url;for(const k of[...grouped.keys()].sort())for(const v of grouped.get(k).slice().sort())payload+=`${k}${v}`;return safeEqual(supplied,await hmacSha1(String(env.TWILIO_AUTH_TOKEN),payload))}
function gather(action,text){return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="dtmf speech" numDigits="1" timeout="6" speechTimeout="auto" action="${esc(action)}" method="POST"><Say>${esc(text)}</Say></Gather><Redirect method="POST">${esc(action)}</Redirect></Response>`}
function hangup(text){return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(text)}</Say><Hangup/></Response>`}
function safeJson(value,fallback={}){try{return JSON.parse(value||'')}catch{return fallback}}

export async function handleProfessionalIvrStep(request,env){
 const url=new URL(request.url);if(url.pathname!=='/api/contact-center/ivr/step')return null;if(request.method!=='POST')return xml(hangup('Unsupported call operation.'),405);if(!await validTwilio(request,env))return xml(hangup('This call could not be authenticated.'),403);
 const tenant=clean(url.searchParams.get('tenant_id')),flowId=clean(url.searchParams.get('flow_id')),callId=Number(url.searchParams.get('call_id')||0),flow=await env.DB.prepare('SELECT * FROM cc_ivr_flows WHERE id=? AND tenant_id=?').bind(flowId,tenant).first();if(!flow)return xml(hangup('The call menu is unavailable.'),404);
 const form=await request.formData(),digits=clean(form.get('Digits')),speech=clean(form.get('SpeechResult')).toLowerCase(),choice=digits||(/\bone\b/.test(speech)?'1':/\btwo\b/.test(speech)?'2':/\bthree\b/.test(speech)?'3':/\bfour\b/.test(speech)?'4':'');const nodes=safeJson(flow.nodes_json,{}),node=nodes[choice];
 if(!node){const retry=new URL(request.url);return xml(gather(retry.toString(),flow.invalid_message||'That selection was not recognized. Please try again.'))}
 const call=callId?await env.DB.prepare('SELECT * FROM phone_calls WHERE id=? AND tenant_id=?').bind(callId,tenant).first():null,from=phone(call?.caller||form.get('From'));
 if(node.type==='ai')return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${esc(new URL('/api/voice-agent/twilio/incoming',request.url).toString())}</Redirect></Response>`);
 if(node.type==='forward'&&/^\+[1-9]\d{7,14}$/.test(phone(node.number)))return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(node.message||'Please hold while I connect you.')}</Say><Dial answerOnBridge="true">${esc(phone(node.number))}</Dial></Response>`);
 if(node.type==='queue'){
  const target=new URL('/api/contact-center/softphone/queue',request.url);target.searchParams.set('tenant_id',tenant);target.searchParams.set('queue_id',clean(node.queue_id||flow.default_queue_id));target.searchParams.set('call_id',String(callId||0));return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${esc(target.toString())}</Redirect></Response>`);
 }
 if(node.type==='callback'){
  const ts=now();if(from)await env.DB.prepare('INSERT INTO cc_callbacks(id,tenant_id,queue_id,phone,display_name,status,requested_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,node.queue_id||flow.default_queue_id||null,from,'','pending',ts,ts,ts).run();return xml(hangup(node.message||'Your callback request has been saved. We will contact you as soon as possible.'));
 }
 if(node.type==='voicemail'){
  const action=new URL('/api/contact-center/voicemail/recording',request.url);action.searchParams.set('tenant_id',tenant);action.searchParams.set('call_id',String(callId||0));action.searchParams.set('queue_id',clean(node.queue_id||flow.default_queue_id));return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(node.message||'Please leave your message after the tone. Press pound when finished.')}</Say><Record action="${esc(action.toString())}" method="POST" finishOnKey="#" maxLength="180" playBeep="true"/><Say>No recording was received. Goodbye.</Say></Response>`);
 }
 return xml(hangup(node.message||'Thank you for calling. Goodbye.'));
}

// Streaming telephone voice adapter for Magnanimous Call Center.
// Deepgram handles speech transport/recognition; Magnanimous AI remains the reasoning endpoint.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const now=()=>Math.floor(Date.now()/1000);
const TERMINAL=new Set(["completed","busy","failed","no-answer","canceled"]);
const flag=value=>["1","true","yes","on"].includes(String(value||"").trim().toLowerCase());
function safeEqual(a,b){a=String(a||"");b=String(b||"");if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function hmacHex(secret,value){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signed=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));return [...new Uint8Array(signed)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function signingSecret(env){const configured=String(env.SESSION_SECRET||"").trim();if(configured)return configured;try{const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||"");}catch{return "";}}
function b64url(value){const bytes=new TextEncoder().encode(value);let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function decodeB64url(value){const base=String(value||"").replace(/-/g,"+").replace(/_/g,"/");return atob(base+"=".repeat((4-(base.length%4))%4));}
async function signToken(env,claims){const secret=await signingSecret(env);if(!secret)throw new Error("VOICE_SESSION_SIGNING_SECRET_UNAVAILABLE");const payload=b64url(JSON.stringify(claims));return payload+"."+await hmacHex(secret,payload);}
async function verifyToken(env,token,scope){const parts=String(token||"").split(".");if(parts.length!==2)return null;const secret=await signingSecret(env);if(!secret||!safeEqual(parts[1],await hmacHex(secret,parts[0])))return null;try{const c=JSON.parse(decodeB64url(parts[0]));if(c.scope!==scope||Number(c.exp)<=now()||!Number.isInteger(Number(c.call_id))||!c.tenant_id||!c.agent_id)return null;return c;}catch{return null;}}
function escapeXml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
function e164(value){return /^\+[1-9]\d{7,14}$/.test(String(value||"").trim());}

export function deepgramVoiceReadiness(env={}){
 const language=String(env.DEEPGRAM_VOICE_LANGUAGE||"multi").trim().toLowerCase();
 const tts=String(env.DEEPGRAM_TTS_PROVIDER||(language==="en"?"deepgram":"cartesia")).trim().toLowerCase();
 const missing=[];
 if(!flag(env.DEEPGRAM_VOICE_AGENT_ENABLED))missing.push("DEEPGRAM_VOICE_AGENT_ENABLED=true");
 if(!String(env.DEEPGRAM_API_KEY||"").trim())missing.push("DEEPGRAM_API_KEY secret");
 if(!env.AI||typeof env.AI.run!=="function")missing.push("Magnanimous Workers AI binding");
 if(tts==="cartesia"&&!String(env.DEEPGRAM_CARTESIA_VOICE_ID||"").trim())missing.push("DEEPGRAM_CARTESIA_VOICE_ID configuration");
 else if(tts==="deepgram"&&language!=="en")missing.push("Cartesia TTS for Filipino/Tagalog or multilingual speech");
 else if(!["deepgram","cartesia"].includes(tts))missing.push("supported TTS provider (deepgram or cartesia)");
 return {enabled:flag(env.DEEPGRAM_VOICE_AGENT_ENABLED),ready:missing.length===0,provider:"Deepgram Voice Agent + Magnanimous AI",tts_provider:tts,language,missing};
}
export function deepgramVoiceEnabled(env={}){return deepgramVoiceReadiness(env).ready;}
export async function createDeepgramVoiceStreamToken(env,call,agent){
 if(!call?.id||!call?.tenant_id||!agent?.id)throw new Error("VOICE_CALL_SCOPE_REQUIRED");
 return signToken(env,{scope:"stream",call_id:Number(call.id),tenant_id:String(call.tenant_id),agent_id:String(agent.id),exp:now()+600,nonce:crypto.randomUUID()});
}
export function buildDeepgramConsentTwiml(actionUrl){
 const prompt="This call uses an AI assistant and automated speech processing to understand and respond. A text transcript may be created to support this conversation. Press 1 to agree and continue. Otherwise, hang up.";
 return '<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="dtmf" numDigits="1" timeout="8" actionOnEmptyResult="true" action="'+escapeXml(actionUrl)+'" method="POST"><Say>'+escapeXml(prompt)+'</Say></Gather><Say>No consent was received. Goodbye.</Say><Hangup/></Response>';
}
export function buildDeepgramStreamTwiml(streamUrl,token){
 const stream='<Connect><Stream url="'+escapeXml(streamUrl)+'"><Parameter name="voice_token" value="'+escapeXml(token)+'"/></Stream></Connect>';
 return '<?xml version="1.0" encoding="UTF-8"?><Response>'+stream+'<Say>The AI voice session has ended. Goodbye.</Say><Hangup/></Response>';
}
export function buildDeepgramSettings({env={},agent={},origin="https://iammagnanimousway.com",thinkToken=""}={}){
 const language=String(env.DEEPGRAM_VOICE_LANGUAGE||"multi").trim().toLowerCase();
 const tts=String(env.DEEPGRAM_TTS_PROVIDER||(language==="en"?"deepgram":"cartesia")).trim().toLowerCase();
 let speak;
 if(tts==="cartesia"){
  speak={provider:{type:"cartesia",model_id:String(env.DEEPGRAM_CARTESIA_MODEL||"sonic-3.5"),voice:{mode:"id",id:String(env.DEEPGRAM_CARTESIA_VOICE_ID||"a167e0f3-df7e-4d52-a9c3-f949145efdab")},language:"multi"}};
 }else speak={provider:{type:"deepgram",model:"aura-2-thalia-en"}};
 const prompt=[
  "You are Magnanimous AI, the voice assistant for I AM MAGNANIMOUS WAY. Magnanimous AI is the reasoning and decision-making authority; speech services are only audio infrastructure.",
  String(agent.instructions||"Welcome callers, answer questions, collect only necessary details, and escalate when appropriate."),
  "Speak naturally in short, clear sentences suitable for a telephone call. Do not use markdown, emojis, lists, or stage directions.",
  "Understand English and Filipino/Tagalog, including natural code-switching. Reply in the language the caller is using; ask politely if you cannot understand.",
  "Be honest about uncertainty. Never invent prices, availability, appointments, account access, policies, or completed actions.",
  "Do not request payment-card numbers, bank passwords, authentication secrets, or government ID numbers.",
  "Respect stop-contact requests. If the caller asks not to be contacted, acknowledge it and end the call.",
  e164(agent.handoff_phone)?"A live representative handoff is configured for this agent. If the caller asks for a person, tell them to press zero; do not claim transfer until call control completes it.":"A live representative handoff is not configured for this agent. Never claim you can transfer the caller. Offer to take a message or explain that a representative is not currently connected.",
  "Never claim to have performed an external action. Ask permission before collecting optional contact details."
 ].filter(Boolean).join("\n");
 return {
  type:"Settings",mip_opt_out:true,
  audio:{input:{encoding:"mulaw",sample_rate:8000},output:{encoding:"mulaw",sample_rate:8000,container:"none"}},
  agent:{
   listen:{provider:{type:"deepgram",version:"v1",model:"nova-3",language:language==="en"?"en":"multi",smart_format:true}},
   think:{provider:{type:"open_ai",model:"magnanimous-voice-v1",temperature:0.2},endpoint:{url:origin.replace(/\/$/,"")+"/api/voice-agent/think",headers:{authorization:"Bearer "+thinkToken}},prompt},
   speak,greeting:String(agent.opening_message||"Hello. I am Magnanimous AI, your automated assistant. How may I help you today?").slice(0,1000)
  }
 };
}
async function ensureUsageSchema(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS voice_provider_sessions (call_id INTEGER PRIMARY KEY,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,started_at INTEGER NOT NULL,ended_at INTEGER,billed_seconds INTEGER NOT NULL DEFAULT 0)").run();
 await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_voice_provider_sessions_day ON voice_provider_sessions(provider,started_at,ended_at)").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS voice_stream_handshake_limits (ip_hash TEXT NOT NULL,window_start INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(ip_hash,window_start))").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS voice_think_request_limits (call_id INTEGER NOT NULL,window_start INTEGER NOT NULL,requests INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(call_id,window_start))").run();
}
async function rateLimitStreamHandshake(env,request){
 const secret=await signingSecret(env);if(!secret)return false;
 await ensureUsageSchema(env);
 const ip=String(request.headers.get("cf-connecting-ip")||"unknown").slice(0,80);
 const ipHash=await hmacHex(secret,"voice-stream:"+ip),windowStart=Math.floor(now()/60)*60;
 await env.DB.prepare("INSERT INTO voice_stream_handshake_limits(ip_hash,window_start,attempts) VALUES(?,?,1) ON CONFLICT(ip_hash,window_start) DO UPDATE SET attempts=attempts+1").bind(ipHash,windowStart).run();
 const row=await env.DB.prepare("SELECT attempts FROM voice_stream_handshake_limits WHERE ip_hash=? AND window_start=?").bind(ipHash,windowStart).first();
 await env.DB.prepare("DELETE FROM voice_stream_handshake_limits WHERE window_start<?").bind(windowStart-3600).run().catch(()=>{});
 return Number(row?.attempts||0)<=30;
}
async function rateLimitThink(env,callId){
 await ensureUsageSchema(env);
 const windowStart=Math.floor(now()/60)*60;
 await env.DB.prepare("INSERT INTO voice_think_request_limits(call_id,window_start,requests) VALUES(?,?,1) ON CONFLICT(call_id,window_start) DO UPDATE SET requests=requests+1").bind(Number(callId),windowStart).run();
 const row=await env.DB.prepare("SELECT requests FROM voice_think_request_limits WHERE call_id=? AND window_start=?").bind(Number(callId),windowStart).first();
 await env.DB.prepare("DELETE FROM voice_think_request_limits WHERE window_start<?").bind(windowStart-3600).run().catch(()=>{});
 return Number(row?.requests||0)<=30;
}
export async function deepgramVoiceRuntimeReadiness(env={}){
 const base=deepgramVoiceReadiness(env),secret=await signingSecret(env);
 const missing=[...base.missing];
 if(!secret)missing.push("SESSION_SECRET or auth_config.session_secret");
 return {...base,ready:missing.length===0,missing};
}
async function finishUsage(env,callId){
 try{const ts=now(),max=Math.min(1800,Math.max(60,Number(env.DEEPGRAM_VOICE_MAX_CALL_SECONDS||300)||300));await env.DB.prepare("UPDATE voice_provider_sessions SET ended_at=COALESCE(ended_at,?),billed_seconds=MAX(billed_seconds,MIN(?,MAX(0,?-started_at))) WHERE call_id=? AND provider='deepgram'").bind(ts,max,ts,Number(callId)).run();}catch{}
}
async function reserveUsage(env,call){
 await ensureUsageSchema(env);
 const callId=Number(call.id),ts=now();
 const configuredMax=Math.min(1800,Math.max(60,Number(env.DEEPGRAM_VOICE_MAX_CALL_SECONDS||300)||300));
 const staleBefore=ts-configuredMax-120;
 await env.DB.prepare("UPDATE voice_provider_sessions SET ended_at=COALESCE(ended_at,?),billed_seconds=MAX(billed_seconds,MIN(?,MAX(0,?-started_at))) WHERE provider='deepgram' AND ended_at IS NULL AND started_at<?")
  .bind(ts,configuredMax,ts,staleBefore).run();
 const existing=await env.DB.prepare("SELECT * FROM voice_provider_sessions WHERE call_id=? AND provider='deepgram'").bind(callId).first();
 if(existing)return{ok:false,reason:"call_session_already_reserved"};
 const dayStart=Math.floor(ts/86400)*86400,monthDate=new Date(ts*1000),monthStart=Math.floor(Date.UTC(monthDate.getUTCFullYear(),monthDate.getUTCMonth(),1)/1000);
 await env.DB.prepare("INSERT INTO voice_provider_sessions(call_id,tenant_id,provider,started_at,ended_at,billed_seconds) VALUES(?,?,'deepgram',?,NULL,0)").bind(callId,String(call.tenant_id),ts).run();
 const maxConcurrent=Math.min(4,Math.max(1,Number(env.DEEPGRAM_VOICE_MAX_CONCURRENT_CALLS||1)||1));
 const active=await env.DB.prepare("SELECT COUNT(*) AS n FROM voice_provider_sessions WHERE provider='deepgram' AND ended_at IS NULL").first();
 if(Number(active?.n||0)>maxConcurrent){await finishUsage(env,callId);return{ok:false,reason:"concurrency_limit"};}
 const usageSql="SELECT COALESCE(SUM(CASE WHEN ended_at IS NULL THEN MAX(0,?-started_at) ELSE billed_seconds END),0) AS seconds FROM voice_provider_sessions WHERE provider='deepgram' AND started_at>=?";
 const dailyCap=Math.min(240,Math.max(1,Number(env.DEEPGRAM_VOICE_DAILY_MINUTES_CAP||5)||5));
 const monthlyCap=Math.min(1440,Math.max(1,Number(env.DEEPGRAM_VOICE_MONTHLY_MINUTES_CAP||20)||20));
 const daily=await env.DB.prepare(usageSql).bind(ts,dayStart).first();
 const monthly=await env.DB.prepare(usageSql).bind(ts,monthStart).first();
 const dailyRemaining=dailyCap*60-Number(daily?.seconds||0),monthlyRemaining=monthlyCap*60-Number(monthly?.seconds||0);
 const remaining=Math.min(dailyRemaining,monthlyRemaining);
 if(remaining<30){await finishUsage(env,callId);return{ok:false,reason:dailyRemaining<30?"daily_usage_limit":"monthly_usage_limit"};}
 return{ok:true,max_call_seconds:Math.min(configuredMax,remaining)};
}
async function connectDeepgram(env){
 const apiKey=String(env.DEEPGRAM_API_KEY||"").trim();
 if(!apiKey)throw new Error("DEEPGRAM_API_KEY_NOT_CONFIGURED");
 const response=await fetch("https://agent.deepgram.com/v1/agent/converse",{headers:{upgrade:"websocket","sec-websocket-protocol":"token, "+apiKey}});
 if(response.status!==101||!response.webSocket)throw new Error("DEEPGRAM_WEBSOCKET_HANDSHAKE_FAILED");
 response.webSocket.accept();return response.webSocket;
}
function decodeBase64(value){const binary=atob(String(value||""));const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function encodeBase64(value){const bytes=value instanceof Uint8Array?value:new Uint8Array(value);let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);}
function safeClose(socket,code=1000,reason="Call session closed"){try{if(socket&&socket.readyState<2)socket.close(code,reason.slice(0,120));}catch{}}
function parseJson(value){try{return JSON.parse(value);}catch{return null;}}
export function openAIStreamFromWorkersAI(upstream,callId,model){
 const reader=upstream.getReader(),decoder=new TextDecoder(),encoder=new TextEncoder();
 const id="magnanimous-voice-"+String(callId),created=now();
 const body=new ReadableStream({
  async start(controller){
   let buffer="";
   let roleSent=false;
   const emit=(content,finishReason=null)=>{
    if(!roleSent){const roleChunk={id,object:"chat.completion.chunk",created,model,choices:[{index:0,delta:{role:"assistant"},finish_reason:null}]};controller.enqueue(encoder.encode("data: "+JSON.stringify(roleChunk)+"\n\n"));roleSent=true;}
    const chunk={id,object:"chat.completion.chunk",created,model,choices:[{index:0,delta:content?{content}:{},finish_reason:finishReason}]};
    controller.enqueue(encoder.encode("data: "+JSON.stringify(chunk)+"\n\n"));
   };
   const consume=line=>{
    const trimmed=String(line||"").trim();
    if(!trimmed.startsWith("data:"))return;
    const data=trimmed.slice(5).trim();
    if(!data||data==="[DONE]")return;
    const payload=parseJson(data);if(!payload)return;
    const content=payload.response??payload.choices?.[0]?.delta?.content??payload.choices?.[0]?.message?.content??payload.result?.response??"";
    if(typeof content==="string"&&content)emit(content);
   };
   try{
    while(true){
     const item=await reader.read();if(item.done)break;
     buffer+=decoder.decode(item.value,{stream:true});
     const lines=buffer.split(/\r?\n/);buffer=lines.pop()||"";
     for(const line of lines)consume(line);
    }
    buffer+=decoder.decode();if(buffer)consume(buffer);
    emit("", "stop");
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
   }catch(error){controller.error(error);}
  },
  cancel(reason){return reader.cancel(reason);}
 });
 return new Response(body,{status:200,headers:{"content-type":"text/event-stream; charset=utf-8","cache-control":"no-cache, no-store","connection":"keep-alive","x-accel-buffering":"no"}});
}
async function updateTwilioCall(env,callSid,twiml){
 const sid=String(callSid||"");
 if(!sid||!env.TWILIO_ACCOUNT_SID||!env.TWILIO_AUTH_TOKEN)return false;
 const auth=btoa(String(env.TWILIO_ACCOUNT_SID)+":"+String(env.TWILIO_AUTH_TOKEN));
 const form=new URLSearchParams({Twiml:twiml});
 try{
  const response=await fetch("https://api.twilio.com/2010-04-01/Accounts/"+encodeURIComponent(String(env.TWILIO_ACCOUNT_SID))+"/Calls/"+encodeURIComponent(sid)+".json",{
   method:"POST",headers:{authorization:"Basic "+auth,"content-type":"application/x-www-form-urlencoded"},body:form.toString()
  });
  return response.ok;
 }catch{return false;}
}
function hangupTwiml(){return '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>';}
function humanHandoffTwiml(number){
 return '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Connecting you to a human representative.</Say><Dial timeout="25"><Number>'+escapeXml(number)+'</Number></Dial><Say>No representative is available right now. Goodbye.</Say><Hangup/></Response>';
}

async function handleThink(request,env){
 if(request.method!=="POST")return json({error:{message:"Method not allowed."}},405);
 const authorization=request.headers.get("authorization")||"";
 if(!authorization.startsWith("Bearer "))return json({error:{message:"Unauthorized."}},401);
 const claims=await verifyToken(env,authorization.slice(7),"think");
 if(!claims)return json({error:{message:"Invalid or expired call token."}},401);
 const call=await env.DB.prepare("SELECT * FROM phone_calls WHERE id=? AND tenant_id=?").bind(Number(claims.call_id),String(claims.tenant_id)).first();
 if(!call||TERMINAL.has(String(call.status||"").toLowerCase()))return json({error:{message:"Call session is no longer active."}},410);
 let metadata={};try{metadata=JSON.parse(call.metadata_json||"{}");}catch{}
 if(metadata.ai_voice_consent!==true||String(metadata.voice_agent_id||"")!==String(claims.agent_id))return json({error:{message:"Call consent or agent scope is invalid."}},403);
 const agent=await env.DB.prepare("SELECT * FROM voice_agents WHERE id=? AND tenant_id=? AND active=1").bind(String(claims.agent_id),String(claims.tenant_id)).first();
 if(!agent)return json({error:{message:"Voice agent is unavailable."}},404);
 if(!await rateLimitThink(env,call.id))return json({error:{message:"Voice turn rate limit reached for this call."}},429);
 if(!env.AI||typeof env.AI.run!=="function")return json({error:{message:"Magnanimous AI is temporarily unavailable."}},503);
 const body=await request.json().catch(()=>({})),supplied=Array.isArray(body.messages)?body.messages:[];
 const messages=supplied.slice(-14).map(item=>{const role=["user","assistant"].includes(String(item?.role))?String(item.role):null;const content=typeof item?.content==="string"?item.content.slice(0,4000):"";return role&&content?{role,content}:null;}).filter(Boolean);
 if(!messages.length)return json({error:{message:"No caller speech was supplied."}},400);
 const providerSystem=supplied.filter(item=>String(item?.role)==="system").slice(0,2).map(item=>String(item?.content||"").slice(0,5000)).filter(Boolean).join("\n");
 const system=["You are Magnanimous AI. This is a live telephone conversation.",providerSystem||String(agent.instructions||""),"Keep answers concise, natural, truthful, and easy to understand aloud. Aim for one or two short sentences and under 70 words.","Mirror the caller's language, including English and Filipino/Tagalog code-switching.","Do not invent business facts, availability, prices, account access, or completed actions.","Do not claim that you transferred a caller or completed an external action unless call control confirms it.","Never request payment card numbers, bank passwords, authentication secrets, or government identification numbers.","If there is an emergency or immediate danger, tell the caller to contact local emergency services.","If uncertain, ask a short clarifying question or say a human representative must confirm."].filter(Boolean).join("\n");
 const promptMessages=[{role:"system",content:system},...messages];
 const models=[...new Set([String(env.CLOUDFLARE_AI_MODEL||"").trim(),"@cf/meta/llama-3.1-8b-instruct-fast","@cf/meta/llama-3.2-1b-instruct"].filter(Boolean))];
 if(body.stream===true){
  for(const model of models){
   try{
    const upstream=await env.AI.run(model,{messages:promptMessages,max_tokens:180,stream:true});
    const stream=upstream?.body?.getReader?upstream.body:upstream;
    if(stream&&typeof stream.getReader==="function")return openAIStreamFromWorkersAI(stream,call.id,model);
    const streamedAnswer=String(upstream?.response||upstream?.result?.response||upstream?.result||"").trim();
    if(streamedAnswer)return json({id:"magnanimous-voice-"+String(call.id),object:"chat.completion",created:now(),model:"magnanimous-voice-v1",choices:[{index:0,message:{role:"assistant",content:streamedAnswer.slice(0,1200)},finish_reason:"stop"}]});
   }catch{}
  }
  return json({error:{message:"Magnanimous AI streaming is temporarily unavailable."}},503);
 }
 let answer="";
 for(const model of models){try{const result=await env.AI.run(model,{messages:promptMessages,max_tokens:180});answer=String(result?.response||result?.result?.response||result?.result||"").trim();if(answer)break;}catch{}}
 if(!answer)return json({error:{message:"Magnanimous AI could not produce a response."}},503);
 answer=answer.replace(/[*#]/g,"").slice(0,1200);
 return json({id:"magnanimous-voice-"+String(call.id),object:"chat.completion",created:now(),model:"magnanimous-voice-v1",choices:[{index:0,message:{role:"assistant",content:answer},finish_reason:"stop"}]});
}
async function reserveCallContext(env,streamToken,callSid){
 const claims=await verifyToken(env,streamToken,"stream");if(!claims)throw new Error("INVALID_VOICE_STREAM_TOKEN");
 const call=await env.DB.prepare("SELECT * FROM phone_calls WHERE id=? AND tenant_id=?").bind(Number(claims.call_id),String(claims.tenant_id)).first();
 if(!call||TERMINAL.has(String(call.status||"").toLowerCase()))throw new Error("VOICE_CALL_NOT_ACTIVE");
 let metadata={};try{metadata=JSON.parse(call.metadata_json||"{}");}catch{}
 if(metadata.ai_voice_consent!==true||String(metadata.voice_agent_id||"")!==String(claims.agent_id))throw new Error("VOICE_CALL_CONSENT_REQUIRED");
 const sid=String(callSid||"");if(!sid)throw new Error("TWILIO_CALL_SID_REQUIRED");
 if(call.provider_call_id&&String(call.provider_call_id)!==sid)throw new Error("TWILIO_CALL_SCOPE_MISMATCH");
 if(!call.provider_call_id)await env.DB.prepare("UPDATE phone_calls SET provider_call_id=?,updated_at=? WHERE id=? AND tenant_id=? AND (provider_call_id IS NULL OR provider_call_id='')").bind(sid,now(),call.id,call.tenant_id).run();
 const agent=await env.DB.prepare("SELECT * FROM voice_agents WHERE id=? AND tenant_id=? AND active=1").bind(String(claims.agent_id),String(claims.tenant_id)).first();
 if(!agent)throw new Error("VOICE_AGENT_NOT_AVAILABLE");
 const usage=await reserveUsage(env,call);if(!usage.ok)throw new Error("VOICE_PROVIDER_"+usage.reason.toUpperCase());
 return{claims,call,agent:{...agent,opening_message:String(metadata.voice_opening_message||agent.opening_message||"")},usage};
}

export async function handleDeepgramVoiceAgentRoutes(request,env,url=new URL(request.url)){
 if(url.pathname==="/api/voice-agent/think")return handleThink(request,env);
 if(url.pathname!=="/api/voice-agent/twilio/stream")return null;
 if(request.method!=="GET"||String(request.headers.get("upgrade")||"").toLowerCase()!=="websocket")return json({detail:"A secure WebSocket upgrade is required."},426);
 if(!deepgramVoiceEnabled(env))return json({detail:"Realtime voice service is not configured.",readiness:deepgramVoiceReadiness(env)},503);
 if(!await signingSecret(env))return json({detail:"The voice-session signing secret is not configured."},503);
 if(!await rateLimitStreamHandshake(env,request))return json({detail:"Voice stream connection limit reached."},429);
 if(typeof WebSocketPair!=="function")return json({detail:"This runtime does not support WebSocket media streams."},501);
 const pair=new WebSocketPair(),client=pair[0],server=pair[1];server.accept();
 const state={twilio:server,deepgram:null,call:null,agent:null,streamSid:"",ready:false,pendingAudio:[],audioChunks:[],audioBytes:0,audioFlushTimer:null,closed:false,sessionReserved:false,endAfterAudio:false,waitingEndMark:false,pendingEndMessage:"",endFallbackTimer:null,maxCallTimer:null,startTimer:null,welcomeTimer:null,keepAliveTimer:null};
 const cleanup=async(reason="Call session closed",closeTwilio=true)=>{
  if(state.closed)return;state.closed=true;
  for(const timer of [state.maxCallTimer,state.startTimer,state.welcomeTimer,state.keepAliveTimer,state.audioFlushTimer,state.endFallbackTimer])if(timer)clearTimeout(timer);
  safeClose(state.deepgram,1000,reason);if(closeTwilio)safeClose(state.twilio,1000,reason);
  if(state.sessionReserved&&state.call?.id)await finishUsage(env,state.call.id);
 };
 const twilioSend=payload=>{if(state.twilio?.readyState===1)state.twilio.send(JSON.stringify(payload));};
 const fail=reason=>cleanup(reason||"Voice service unavailable");
 const flushAudioBuffer=()=>{
  if(!state.ready||!state.deepgram||state.deepgram.readyState!==1||!state.audioChunks.length)return;
  if(state.audioFlushTimer){clearTimeout(state.audioFlushTimer);state.audioFlushTimer=null;}
  const merged=new Uint8Array(state.audioBytes);let offset=0;
  for(const chunk of state.audioChunks){merged.set(chunk,offset);offset+=chunk.length;}
  state.audioChunks=[];state.audioBytes=0;
  try{state.deepgram.send(merged);}catch{void fail("Caller audio could not be forwarded");}
 };
 const queueAudio=payload=>{
  const bytes=decodeBase64(payload);state.audioChunks.push(bytes);state.audioBytes+=bytes.length;
  if(state.audioBytes>=1600){flushAudioBuffer();return;}
  if(!state.audioFlushTimer)state.audioFlushTimer=setTimeout(flushAudioBuffer,200);
 };
 const flushAudio=()=>{
  if(!state.ready||!state.deepgram||state.deepgram.readyState!==1)return;
  for(const frame of state.pendingAudio.splice(0)){try{queueAudio(frame);}catch{void fail("Buffered caller audio could not be decoded");return;}}
  flushAudioBuffer();
 };
 server.addEventListener("close",()=>{void cleanup("Caller disconnected",false);});
 server.addEventListener("error",()=>{void cleanup("Caller media connection failed",false);});
 server.addEventListener("message",event=>{
  void (async()=>{
   if(state.closed)return;
   const message=parseJson(typeof event.data==="string"?event.data:"");if(!message||typeof message.event!=="string")return;
   if(message.event==="start"){
    if(state.call)return;clearTimeout(state.startTimer);
    try{
     const start=message.start||{},custom=start.customParameters||{};
     const context=await reserveCallContext(env,custom.voice_token,start.callSid);
     state.call=context.call;state.agent=context.agent;state.streamSid=String(message.streamSid||start.streamSid||"");state.sessionReserved=true;
     if(!state.streamSid)throw new Error("TWILIO_STREAM_ID_REQUIRED");
     const thinkToken=await signToken(env,{scope:"think",call_id:Number(context.call.id),tenant_id:String(context.call.tenant_id),agent_id:String(context.agent.id),exp:now()+600,nonce:crypto.randomUUID()});
     const settings=buildDeepgramSettings({env,agent:context.agent,origin:new URL(request.url).origin,thinkToken});
     state.deepgram=await connectDeepgram(env);
     state.deepgram.addEventListener("message",dgEvent=>{
      void (async()=>{
       if(state.closed)return;
       if(typeof dgEvent.data!=="string"){
        let audio;if(dgEvent.data instanceof ArrayBuffer)audio=new Uint8Array(dgEvent.data);else if(ArrayBuffer.isView(dgEvent.data))audio=new Uint8Array(dgEvent.data.buffer,dgEvent.data.byteOffset,dgEvent.data.byteLength);else if(dgEvent.data&&typeof dgEvent.data.arrayBuffer==="function")audio=new Uint8Array(await dgEvent.data.arrayBuffer());
        if(audio?.length)twilioSend({event:"media",streamSid:state.streamSid,media:{payload:encodeBase64(audio)}});return;
       }
       const eventMessage=parseJson(dgEvent.data);if(!eventMessage)return;
       if(eventMessage.type==="Welcome"){state.deepgram.send(JSON.stringify(settings));state.welcomeTimer=setTimeout(()=>{void fail("Voice provider setup timed out");},10000);}
       else if(eventMessage.type==="SettingsApplied"){
        clearTimeout(state.welcomeTimer);state.ready=true;flushAudio();
        const keepAlive=()=>{if(state.closed||state.deepgram?.readyState!==1)return;try{state.deepgram.send(JSON.stringify({type:"KeepAlive"}));}catch{void fail("Voice provider keepalive failed");return;}state.keepAliveTimer=setTimeout(keepAlive,10000);};
        state.keepAliveTimer=setTimeout(keepAlive,10000);
       }else if(eventMessage.type==="UserStartedSpeaking")twilioSend({event:"clear",streamSid:state.streamSid});
       else if(eventMessage.type==="ConversationText"){
        const speaker=eventMessage.role==="assistant"?"assistant":"caller",transcript=String(eventMessage.content||"").trim().slice(0,3000);
        if(transcript&&state.call?.id)await env.DB.prepare("INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at,expires_at) VALUES(?,?,?,?,?,?,?)").bind(state.call.tenant_id,state.call.id,String(state.call.provider_call_id||""),speaker,transcript,now(),now()+30*86400).run().catch(()=>null);
        if(speaker==="assistant"&&state.pendingEndMessage&&transcript.toLowerCase().includes(state.pendingEndMessage.toLowerCase())){
         state.endAfterAudio=true;
         state.pendingEndMessage="";
        }
        if(speaker==="caller"&&transcript){
         const lower=transcript.toLowerCase();
         if(/\b(stop calling|stop contacting|never call|do not call|don't call|do not contact|don't contact|remove me|opt out|unsubscribe|take me off)\b/.test(lower)){
          const phone=String(state.call.direction==="outbound"?state.call.callee:state.call.caller||"").replace(/[\s().-]/g,"");
          if(e164(phone))await env.DB.prepare("INSERT OR REPLACE INTO voice_do_not_call(tenant_id,phone,reason,created_at) VALUES(?,?,?,?)").bind(state.call.tenant_id,phone,"caller opt-out",now()).run().catch(()=>null);
          state.pendingEndMessage="I have recorded your request not to be contacted again";
          if(state.endFallbackTimer)clearTimeout(state.endFallbackTimer);
          state.endFallbackTimer=setTimeout(async()=>{if(!state.closed){await updateTwilioCall(env,state.call?.provider_call_id,hangupTwiml());await cleanup("Caller opt-out confirmed and call ended");}},8000);
          if(state.deepgram?.readyState===1)state.deepgram.send(JSON.stringify({type:"InjectAgentMessage",message:"Understood. I have recorded your request not to be contacted again. I will end the call now.",behavior:"interrupt"}));
         }else if(/\b(goodbye|bye|hang up|end call)\b/.test(lower)){
          state.pendingEndMessage="Thank you for speaking with me";
          if(state.endFallbackTimer)clearTimeout(state.endFallbackTimer);
          state.endFallbackTimer=setTimeout(async()=>{if(!state.closed){await updateTwilioCall(env,state.call?.provider_call_id,hangupTwiml());await cleanup("Caller ended the conversation");}},8000);
          if(state.deepgram?.readyState===1)state.deepgram.send(JSON.stringify({type:"InjectAgentMessage",message:"Thank you for speaking with me. Goodbye.",behavior:"interrupt"}));
         }
        }
       }else if(eventMessage.type==="AgentAudioDone"&&state.endAfterAudio&&!state.waitingEndMark){
        state.waitingEndMark=true;
        twilioSend({event:"mark",streamSid:state.streamSid,mark:{name:"magnanimous-end-call"}});
       }else if(eventMessage.type==="InjectionRefused"&&state.pendingEndMessage){
        await updateTwilioCall(env,state.call?.provider_call_id,hangupTwiml());
        await cleanup("Caller requested the call to end after injection was refused");
       }else if(eventMessage.type==="Error")await fail("Voice provider returned an error");
      })().catch(()=>{void fail("Deepgram event processing failed");});
     });
     state.deepgram.addEventListener("close",()=>{void cleanup("Voice provider disconnected");});
     state.deepgram.addEventListener("error",()=>{void fail("Voice provider connection failed");});
     state.maxCallTimer=setTimeout(()=>{void cleanup("Call duration limit reached");},context.usage.max_call_seconds*1000);
    }catch(error){if(state.sessionReserved&&state.call?.id)await finishUsage(env,state.call.id);await fail(String(error?.message||"Voice session could not be started"));}
    return;
   }
   if(message.event==="media"&&message.media?.payload){
    if(!state.call|| (message.media.track&&message.media.track!=="inbound"))return;
    if(state.ready&&state.deepgram?.readyState===1){try{queueAudio(message.media.payload);}catch{await fail("Caller audio could not be forwarded");}}
    else{if(state.pendingAudio.length>=60){await fail("Voice setup could not keep up with caller audio");return;}state.pendingAudio.push(String(message.media.payload));}
   }else if(message.event==="dtmf"&&String(message.dtmf?.digit||"")==="0"){
    const handoff=String(state.agent?.handoff_phone||"").replace(/[\s().-]/g,"");
    if(e164(handoff)&&state.call?.provider_call_id){
     const moved=await updateTwilioCall(env,state.call.provider_call_id,humanHandoffTwiml(handoff));
     if(moved){twilioSend({event:"clear",streamSid:state.streamSid});await cleanup("Caller transferred to human representative");}
     else if(state.deepgram?.readyState===1){twilioSend({event:"clear",streamSid:state.streamSid});state.deepgram.send(JSON.stringify({type:"InjectAgentMessage",message:"I could not connect the live representative right now. I can take a message instead.",behavior:"interrupt"}));}
    }else if(state.deepgram?.readyState===1){twilioSend({event:"clear",streamSid:state.streamSid});state.deepgram.send(JSON.stringify({type:"InjectAgentMessage",message:"A live representative is not configured for this assistant. I can take a message or explain how to contact the team.",behavior:"interrupt"}));}
   }else if(message.event==="mark"&&message.mark?.name==="magnanimous-end-call"&&state.endAfterAudio){
    await updateTwilioCall(env,state.call?.provider_call_id,hangupTwiml());
    await cleanup("Caller requested the call to end");
   }else if(message.event==="stop")await cleanup("Twilio ended the call",false);
  })().catch(()=>{void fail("Voice media processing failed");});
 });
 state.startTimer=setTimeout(()=>{void fail("Twilio media stream did not start");},10000);
 return new Response(null,{status:101,webSocket:client});
}

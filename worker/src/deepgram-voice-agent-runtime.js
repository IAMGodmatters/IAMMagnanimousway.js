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
 if(tts==="cartesia"){
  if(!String(env.DEEPGRAM_CARTESIA_API_KEY||"").trim())missing.push("DEEPGRAM_CARTESIA_API_KEY secret");
  if(!String(env.DEEPGRAM_CARTESIA_VOICE_ID||"").trim())missing.push("DEEPGRAM_CARTESIA_VOICE_ID secret");
 }else if(tts==="deepgram"&&language!=="en")missing.push("Cartesia TTS for Filipino/Tagalog or multilingual speech");
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
export function buildDeepgramStreamTwiml(streamUrl,token,fallbackNumber=""){
 const stream='<Connect><Stream url="'+escapeXml(streamUrl)+'"><Parameter name="voice_token" value="'+escapeXml(token)+'"/></Stream></Connect>';
 const fallback=e164(fallbackNumber)
  ?'<Say>The automated assistant is unavailable or this call needs a person. Please hold while I connect you.</Say><Dial timeout="25"><Number>'+escapeXml(fallbackNumber)+'</Number></Dial><Say>No representative is available. Goodbye.</Say><Hangup/>'
  :'<Say>The automated assistant is unavailable. Please call again later. Goodbye.</Say><Hangup/>';
 return '<?xml version="1.0" encoding="UTF-8"?><Response>'+stream+fallback+'</Response>';
}
export function buildDeepgramSettings({env={},agent={},origin="https://iammagnanimousway.com",thinkToken=""}={}){
 const language=String(env.DEEPGRAM_VOICE_LANGUAGE||"multi").trim().toLowerCase();
 const tts=String(env.DEEPGRAM_TTS_PROVIDER||(language==="en"?"deepgram":"cartesia")).trim().toLowerCase();
 let speak;
 if(tts==="cartesia"){
  speak={provider:{type:"cartesia",model_id:String(env.DEEPGRAM_CARTESIA_MODEL||"sonic-3.6"),voice:{mode:"id",id:String(env.DEEPGRAM_CARTESIA_VOICE_ID||"")}},endpoint:{url:"https://api.cartesia.ai/tts/bytes",headers:{"x-api-key":String(env.DEEPGRAM_CARTESIA_API_KEY||"")}}};
 }else speak={provider:{type:"deepgram",model:"aura-2-thalia-en"}};
 const prompt=[
  "You are Magnanimous AI, the voice assistant for I AM MAGNANIMOUS WAY. Magnanimous AI is the reasoning and decision-making authority; speech services are only audio infrastructure.",
  String(agent.instructions||"Welcome callers, answer questions, collect only necessary details, and escalate when appropriate."),
  "Speak naturally in short, clear sentences suitable for a telephone call. Do not use markdown, emojis, lists, or stage directions.",
  "Understand English and Filipino/Tagalog, including natural code-switching. Reply in the language the caller is using; ask politely if you cannot understand.",
  "Be honest about uncertainty. Never invent prices, availability, appointments, account access, policies, or completed actions.",
  "Do not request payment-card numbers, bank passwords, authentication secrets, or government ID numbers.",
  "Respect stop-contact requests. If the caller asks not to be contacted, acknowledge it and end the call.",
  e164(env.TWILIO_HUMAN_FALLBACK_NUMBER)?"A live representative handoff is configured. If the caller asks for a person, tell them to press zero; do not claim transfer until call control completes it.":"A live representative handoff is not configured for this line. Never claim you can transfer the caller. Offer to take a message or explain that a representative is not currently connected.",
  "Never claim to have performed an external action. Ask permission before collecting optional contact details."
 ].filter(Boolean).join("\n");
 return {
  type:"Settings",mip_opt_out:true,
  audio:{input:{encoding:"mulaw",sample_rate:8000},output:{encoding:"mulaw",sample_rate:8000,container:"none"}},
  agent:{
   language:language==="tl"?"tl":"en",
   listen:{provider:{type:"deepgram",version:"v1",model:"nova-3",language:language==="en"?"en":"multi",smart_format:true}},
   think:{provider:{type:"open_ai",model:"magnanimous-voice-v1",temperature:0.2},endpoint:{url:origin.replace(/\/$/,"")+"/api/voice-agent/think",headers:{authorization:"Bearer "+thinkToken}},prompt},
   speak,greeting:String(agent.opening_message||"Hello. I am Magnanimous AI, your automated assistant. How may I help you today?").slice(0,1000)
  }
 };
}
async function ensureUsageSchema(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS voice_provider_sessions (call_id INTEGER PRIMARY KEY,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,started_at INTEGER NOT NULL,ended_at INTEGER,billed_seconds INTEGER NOT NULL DEFAULT 0)").run();
 await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_voice_provider_sessions_day ON voice_provider_sessions(provider,started_at,ended_at)").run();
}
async function finishUsage(env,callId){
 try{const ts=now();await env.DB.prepare("UPDATE voice_provider_sessions SET ended_at=COALESCE(ended_at,?),billed_seconds=MAX(billed_seconds,MAX(0,?-started_at)) WHERE call_id=? AND provider='deepgram'").bind(ts,ts,Number(callId)).run();}catch{}
}
async function reserveUsage(env,call){
 await ensureUsageSchema(env);
 const callId=Number(call.id);
 const existing=await env.DB.prepare("SELECT * FROM voice_provider_sessions WHERE call_id=? AND provider='deepgram'").bind(callId).first();
 if(existing)return{ok:false,reason:"call_session_already_reserved"};
 const ts=now(),dayStart=Math.floor(ts/86400)*86400;
 await env.DB.prepare("INSERT INTO voice_provider_sessions(call_id,tenant_id,provider,started_at,ended_at,billed_seconds) VALUES(?,?,'deepgram',?,NULL,0)").bind(callId,String(call.tenant_id),ts).run();
 const maxConcurrent=Math.min(4,Math.max(1,Number(env.DEEPGRAM_VOICE_MAX_CONCURRENT_CALLS||1)||1));
 const active=await env.DB.prepare("SELECT COUNT(*) AS n FROM voice_provider_sessions WHERE provider='deepgram' AND ended_at IS NULL").first();
 if(Number(active?.n||0)>maxConcurrent){await finishUsage(env,callId);return{ok:false,reason:"concurrency_limit"};}
 const dailyCap=Math.min(240,Math.max(1,Number(env.DEEPGRAM_VOICE_DAILY_MINUTES_CAP||30)||30));
 const usage=await env.DB.prepare("SELECT COALESCE(SUM(CASE WHEN ended_at IS NULL THEN MAX(0,?-started_at) ELSE billed_seconds END),0) AS seconds FROM voice_provider_sessions WHERE provider='deepgram' AND started_at>=?").bind(ts,dayStart).first();
 if(Number(usage?.seconds||0)>dailyCap*60){await finishUsage(env,callId);return{ok:false,reason:"daily_usage_limit"};}
 return{ok:true,max_call_seconds:Math.min(1800,Math.max(60,Number(env.DEEPGRAM_VOICE_MAX_CALL_SECONDS||900)||900))};
}
async function connectDeepgram(env){
 const response=await fetch("https://agent.deepgram.com/v1/agent/converse",{headers:{authorization:"Token "+String(env.DEEPGRAM_API_KEY||""),upgrade:"websocket"}});
 if(response.status!==101||!response.webSocket)throw new Error("DEEPGRAM_WEBSOCKET_HANDSHAKE_FAILED");
 response.webSocket.accept();return response.webSocket;
}
function decodeBase64(value){const binary=atob(String(value||""));const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function encodeBase64(value){const bytes=value instanceof Uint8Array?value:new Uint8Array(value);let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);}
function safeClose(socket,code=1000,reason="Call session closed"){try{if(socket&&socket.readyState<2)socket.close(code,reason.slice(0,120));}catch{}}
function parseJson(value){try{return JSON.parse(value);}catch{return null;}}

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
 if(!env.AI||typeof env.AI.run!=="function")return json({error:{message:"Magnanimous AI is temporarily unavailable."}},503);
 const body=await request.json().catch(()=>({})),supplied=Array.isArray(body.messages)?body.messages:[];
 const messages=supplied.slice(-14).map(item=>{const role=["user","assistant"].includes(String(item?.role))?String(item.role):null;const content=typeof item?.content==="string"?item.content.slice(0,4000):"";return role&&content?{role,content}:null;}).filter(Boolean);
 if(!messages.length)return json({error:{message:"No caller speech was supplied."}},400);
 const system=["You are Magnanimous AI. This is a live telephone conversation.",String(agent.instructions||""),"Keep answers concise, natural, truthful, and easy to understand aloud.","Mirror the caller's language, including English and Filipino/Tagalog code-switching.","Do not invent business facts, availability, prices, account access, or completed actions.","Do not claim that you transferred a caller or completed an external action unless call control confirms it.","Never request payment card numbers, bank passwords, authentication secrets, or government identification numbers.","If uncertain, ask a short clarifying question or say a human representative must confirm."].filter(Boolean).join("\n");
 const promptMessages=[{role:"system",content:system},...messages];
 const models=[...new Set([String(env.CLOUDFLARE_AI_MODEL||"").trim(),"@cf/meta/llama-3.1-8b-instruct-fast","@cf/meta/llama-3.2-1b-instruct"].filter(Boolean))];
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
 return{claims,call,agent,usage};
}

export async function handleDeepgramVoiceAgentRoutes(request,env,url=new URL(request.url)){
 if(url.pathname==="/api/voice-agent/think")return handleThink(request,env);
 if(url.pathname!=="/api/voice-agent/twilio/stream")return null;
 if(request.method!=="GET"||String(request.headers.get("upgrade")||"").toLowerCase()!=="websocket")return json({detail:"A secure WebSocket upgrade is required."},426);
 if(!deepgramVoiceEnabled(env))return json({detail:"Realtime voice service is not configured.",readiness:deepgramVoiceReadiness(env)},503);
 if(typeof WebSocketPair!=="function")return json({detail:"This runtime does not support WebSocket media streams."},501);
 const pair=new WebSocketPair(),client=pair[0],server=pair[1];server.accept();
 const state={twilio:server,deepgram:null,call:null,agent:null,streamSid:"",ready:false,pendingAudio:[],closed:false,sessionReserved:false,maxCallTimer:null,startTimer:null,welcomeTimer:null,keepAliveTimer:null};
 const cleanup=async(reason="Call session closed",closeTwilio=true)=>{
  if(state.closed)return;state.closed=true;
  for(const timer of [state.maxCallTimer,state.startTimer,state.welcomeTimer,state.keepAliveTimer])if(timer)clearTimeout(timer);
  safeClose(state.deepgram,1000,reason);if(closeTwilio)safeClose(state.twilio,1000,reason);
  if(state.sessionReserved&&state.call?.id)await finishUsage(env,state.call.id);
 };
 const twilioSend=payload=>{if(state.twilio?.readyState===1)state.twilio.send(JSON.stringify(payload));};
 const flushAudio=()=>{if(!state.ready||!state.deepgram||state.deepgram.readyState!==1)return;for(const frame of state.pendingAudio.splice(0)){try{state.deepgram.send(decodeBase64(frame));}catch{void cleanup("Audio stream failed");return;}}};
 const fail=reason=>cleanup(reason||"Voice service unavailable");
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
     const thinkToken=await signToken(env,{scope:"think",call_id:Number(context.call.id),tenant_id:String(context.call.tenant_id),agent_id:String(context.agent.id),exp:now()+3600,nonce:crypto.randomUUID()});
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
        if(transcript&&state.call?.id)await env.DB.prepare("INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at) VALUES(?,?,?,?,?,?)").bind(state.call.tenant_id,state.call.id,String(state.call.provider_call_id||""),speaker,transcript,now()).run().catch(()=>null);
       }else if(eventMessage.type==="Error")await fail("Voice provider returned an error");
      })();
     });
     state.deepgram.addEventListener("close",()=>{void cleanup("Voice provider disconnected");});
     state.deepgram.addEventListener("error",()=>{void fail("Voice provider connection failed");});
     state.maxCallTimer=setTimeout(()=>{void cleanup("Call duration limit reached");},context.usage.max_call_seconds*1000);
    }catch(error){if(state.sessionReserved&&state.call?.id)await finishUsage(env,state.call.id);await fail(String(error?.message||"Voice session could not be started"));}
    return;
   }
   if(message.event==="media"&&message.media?.payload){
    if(!state.call)return;
    if(state.ready&&state.deepgram?.readyState===1){try{state.deepgram.send(decodeBase64(message.media.payload));}catch{await fail("Caller audio could not be forwarded");}}
    else{if(state.pendingAudio.length>=60){await fail("Voice setup could not keep up with caller audio");return;}state.pendingAudio.push(String(message.media.payload));}
   }else if(message.event==="dtmf"&&String(message.dtmf?.digit||"")==="0"){
    if(e164(env.TWILIO_HUMAN_FALLBACK_NUMBER)){twilioSend({event:"clear",streamSid:state.streamSid});await cleanup("Caller requested a human representative");}
    else if(state.deepgram?.readyState===1)state.deepgram.send(JSON.stringify({type:"InjectAgentMessage",message:"A live representative is not connected to this line. I can take a message or explain how to contact the team."}));
   }else if(message.event==="stop")await cleanup("Twilio ended the call",false);
  })().catch(()=>{void fail("Voice media processing failed");});
 });
 state.startTimer=setTimeout(()=>{void fail("Twilio media stream did not start");},10000);
 return new Response(null,{status:101,webSocket:client});
}

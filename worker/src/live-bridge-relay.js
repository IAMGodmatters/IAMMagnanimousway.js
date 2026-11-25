const CANONICAL_ORIGIN='https://iammagnanimousway.com';
const TOKEN_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_MESSAGE_BYTES = 16 * 1024;
const PROVIDERS = new Set(['manual','tiktok','facebook','youtube','twitch','zoom','obs','game','browser']);
const LOCAL_COMPANION_PROVIDERS = ['manual','obs','game','browser'];
const EVENT_TYPES = new Set(['chat.message','chat.deleted','audience.follow','audience.subscription','audience.gift','audience.poll_vote','game.event','obs.scene_changed','system.notice']);
const EVENT_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SENSITIVE = /(token|secret|password|cookie|authorization|credential)/i;

function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}});}
function randomToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function hash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function sameHex(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function clean(value,max){if(typeof value!=='string')return undefined;const out=value.replace(CONTROL,'').trim().slice(0,max);return out||undefined;}

export function normalizeRelayEvent(input,now=Date.now()){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 if(input.protocolVersion!==1||typeof input.eventId!=='string'||!EVENT_ID.test(input.eventId)||!PROVIDERS.has(input.provider)||!EVENT_TYPES.has(input.type))return null;
 const parsed=typeof input.occurredAt==='string'?Date.parse(input.occurredAt):NaN;
 if(Number.isFinite(parsed)&&(parsed>now+5*60_000||parsed<now-7*86400_000))return null;
 const event={protocolVersion:1,eventId:input.eventId,provider:input.provider,type:input.type,occurredAt:Number.isFinite(parsed)?new Date(parsed).toISOString():new Date(now).toISOString(),receivedAt:new Date(now).toISOString()};
 for(const [key,max] of [['roomId',120],['actorId',120],['actorName',80],['text',500]]){const value=clean(input[key],max);if(value)event[key]=value;}
 if(typeof input.amount==='number'&&Number.isFinite(input.amount)&&input.amount>=0&&input.amount<=1_000_000)event.amount=input.amount;
 if(typeof input.currency==='string'&&/^[A-Z]{3}$/.test(input.currency))event.currency=input.currency;
 if(input.tags&&typeof input.tags==='object'&&!Array.isArray(input.tags)){const tags={};for(const [key,value] of Object.entries(input.tags).slice(0,8)){if(!/^[a-zA-Z][a-zA-Z0-9_.-]{0,39}$/.test(key)||SENSITIVE.test(key))continue;if(typeof value==='string')tags[key]=value.replace(CONTROL,'').slice(0,120);else if(typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value)))tags[key]=value;}if(Object.keys(tags).length)event.tags=tags;}
 if(event.type==='chat.message'&&!event.text)return null;
 return event;
}
export function isRelayProviderAllowed(provider,allowedProviders=[]){return Array.isArray(allowedProviders)&&allowedProviders.includes(provider);}
export function normalizeRelayCommand(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||typeof input.commandId!=='string'||!EVENT_ID.test(input.commandId))return null;
 if(input.action==='scene.set'){const sceneName=clean(input.sceneName,80);return sceneName?{commandId:input.commandId,action:'scene.set',sceneName}:null;}
 if(input.action==='overlay.show'||input.action==='overlay.hide'){const overlayId=clean(input.overlayId,80);return overlayId?{commandId:input.commandId,action:input.action,overlayId}:null;}
 if(input.action==='audio.cue'){const cueId=clean(input.cueId,80);return cueId?{commandId:input.commandId,action:'audio.cue',cueId}:null;}
 if(input.action==='host.speak'){const text=clean(input.text,500);return text?{commandId:input.commandId,action:'host.speak',text}:null;}
 return null;
}

/**
 * One room coordinates exactly one authenticated browser and one local companion.
 * Hibernatable WebSockets keep idle rooms inexpensive; durable room metadata survives eviction.
 */
export class MagnanimousLiveBridgeRoom {
 constructor(state,env){this.state=state;this.env=env;}
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/internal/create'&&request.method==='POST'){
   const body=await request.json().catch(()=>null);
   if(!body||typeof body.pairId!=='string'||typeof body.tenantId!=='string'||typeof body.userId!=='string'||typeof body.browserHash!=='string'||typeof body.companionHash!=='string'||!Number.isFinite(body.pairExpiresAt)||!Array.isArray(body.allowedProviders))return json({detail:'Invalid bridge room initialization.'},400);
   const existing=await this.state.storage.get('pair');
   if(existing)return json({detail:'This bridge room already exists.'},409);
   await this.state.storage.put('pair',{pairId:body.pairId,tenantId:body.tenantId,userId:body.userId,browserHash:body.browserHash,companionHash:body.companionHash,expectedOrigin:body.expectedOrigin||CANONICAL_ORIGIN,allowedProviders:body.allowedProviders.filter(provider=>LOCAL_COMPANION_PROVIDERS.includes(provider)),pairExpiresAt:body.pairExpiresAt,sessionExpiresAt:0,createdAt:Date.now()});
   await this.state.storage.setAlarm(body.pairExpiresAt);
   return json({ok:true});
  }
  const socketMatch=url.pathname.match(/^\/api\/live-bridge\/ws\/([0-9a-f-]{36})$/i);
  if(socketMatch&&request.method==='GET'){
   if(socketMatch[1].toLowerCase()!==String((await this.state.storage.get('pair'))?.pairId||'').toLowerCase())return json({detail:'Bridge room not found.'},404);
   if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({detail:'WebSocket upgrade required.'},426);
   const pair=await this.state.storage.get('pair');
   if(!pair||(Date.now()>pair.pairExpiresAt&&!pair.sessionExpiresAt)||(pair.sessionExpiresAt&&Date.now()>pair.sessionExpiresAt))return json({detail:'The pairing code or bridge session expired. Create a new bridge pair.'},410);
   if(this.state.getWebSockets().length>=4)return json({detail:'This bridge room has reached its connection safety limit.'},429);
   const origin=request.headers.get('Origin');
   if(origin&&(origin!==url.origin||origin!==pair.expectedOrigin))return json({detail:'Cross-origin bridge connections are not allowed.'},403);
   const pairSocket=new WebSocketPair();
   const [client,server]=Object.values(pairSocket);
   this.state.acceptWebSocket(server);
   server.serializeAttachment({pairId:pair.pairId,tenantId:pair.tenantId,expectedOrigin:url.origin,origin:origin||null,role:null,authenticated:false,seen:[],sessionExpiresAt:0});
   return new Response(null,{status:101,webSocket:client});
  }
  return json({detail:'Bridge room route not found.'},404);
 }
 async webSocketMessage(ws,message){
  const attachment=ws.deserializeAttachment()||{};
  const raw=typeof message==='string'?message:new TextDecoder().decode(message);
  if(new TextEncoder().encode(raw).byteLength>MAX_MESSAGE_BYTES){ws.close(1009,'Message too large');return;}
  let envelope;try{envelope=JSON.parse(raw);}catch{ws.close(1007,'Invalid JSON');return;}
  if(!attachment.authenticated){
   if(envelope?.kind!=='auth'||envelope.protocolVersion!==1||typeof envelope.token!=='string'||envelope.token.length<32||envelope.token.length>256){ws.close(4001,'Authentication required');return;}
   const pair=await this.state.storage.get('pair');
   if(!pair||(Date.now()>pair.pairExpiresAt&&!pair.sessionExpiresAt)||(pair.sessionExpiresAt&&Date.now()>pair.sessionExpiresAt)){ws.send(JSON.stringify({kind:'error',code:'PAIRING_REVOKED',message:'The pairing code or bridge session expired. Create a new pair.'}));ws.close(4001,'Pairing expired');return;}
   const supplied=await hash(envelope.token);
   const role=sameHex(supplied,pair.browserHash)?'browser':sameHex(supplied,pair.companionHash)?'companion':null;
   if(!role){ws.send(JSON.stringify({kind:'error',code:'AUTH_FAILED',message:'The companion pairing token is invalid.'}));ws.close(4001,'Invalid pairing token');return;}
   if((role==='browser'&&attachment.origin!==attachment.expectedOrigin)||(role==='companion'&&attachment.origin!==null)){ws.send(JSON.stringify({kind:'error',code:'ORIGIN_ROLE_MISMATCH',message:'This pairing token was used from the wrong connection role.'}));ws.close(4003,'Pairing role mismatch');return;}
   if((role==='browser'&&attachment.origin!==attachment.expectedOrigin)||(role==='companion'&&attachment.origin!==null)){ws.send(JSON.stringify({kind:'error',code:'ORIGIN_ROLE_MISMATCH',message:'This pairing token can only be used by its assigned browser or local companion.'}));ws.close(4003,'Pairing origin mismatch');return;}
   const sessionExpiresAt=pair.sessionExpiresAt||Date.now()+SESSION_TTL_MS;
   if(Date.now()>sessionExpiresAt){ws.send(JSON.stringify({kind:'error',code:'PAIRING_REVOKED',message:'The bridge session expired. Create a new pair.'}));ws.close(4001,'Bridge session expired');return;}
   if(!pair.sessionExpiresAt){pair.sessionExpiresAt=sessionExpiresAt;await this.state.storage.put('pair',pair);await this.state.storage.setAlarm(sessionExpiresAt);}
   ws.serializeAttachment({...attachment,role,authenticated:true,allowedProviders:pair.allowedProviders||[],seen:[],sessionExpiresAt,windowStartedAt:Date.now(),windowCount:0});
   const existing=this.findRole(role,ws);
   if(existing){try{existing.close(4001,'Replaced by a newer connection');}catch{}}
   const browser=this.findRole('browser'),companion=this.findRole('companion');
   if(browser&&companion){browser.send(JSON.stringify({kind:'ready',protocolVersion:1}));companion.send(JSON.stringify({kind:'ready',protocolVersion:1}));}
   else ws.send(JSON.stringify({kind:'waiting',protocolVersion:1,detail:'Waiting for the other approved device.'}));
   return;
  }
  if(Date.now()>attachment.sessionExpiresAt){ws.close(4001,'Bridge session expired');return;}
  const now=Date.now(),windowStartedAt=Number(attachment.windowStartedAt)||now;
  const windowCount=now-windowStartedAt>=60_000?0:Number(attachment.windowCount)||0;
  const limit=attachment.role==='browser'?10:30;
  if(windowCount>=limit){ws.close(4429,'Bridge message rate limit reached');return;}
  ws.serializeAttachment({...attachment,windowStartedAt:windowCount===0?now:windowStartedAt,windowCount:windowCount+1});
  if(envelope?.kind==='ping'){ws.send(JSON.stringify({kind:'pong'}));return;}
  if(attachment.role==='companion'&&envelope?.kind==='event'&&envelope.protocolVersion===1){
   const event=normalizeRelayEvent(envelope.event);
   if(!event){ws.send(JSON.stringify({kind:'error',code:'INVALID_EVENT',message:'The event did not pass validation.'}));return;}
   if(!isRelayProviderAllowed(event.provider,attachment.allowedProviders)){ws.send(JSON.stringify({kind:'error',code:'PROVIDER_NOT_AUTHORIZED',message:'This provider has no approved adapter for this bridge pair.'}));return;}
   const seen=Array.isArray(attachment.seen)?attachment.seen:[];
   const key=event.provider+':'+event.eventId;
   if(seen.includes(key))return;
   seen.push(key);if(seen.length>512)seen.splice(0,seen.length-512);
   ws.serializeAttachment({...attachment,seen});
   this.sendToRole('browser',{kind:'event',event});
   return;
  }
  if(attachment.role==='companion'&&envelope?.kind==='error'){
   const code=['LOCAL_STORAGE_BLOCKED','LOCAL_EVENT_REJECTED'].includes(envelope.code)?envelope.code:'LOCAL_EVENT_REJECTED';
   const message=clean(envelope.message,240)||'The local companion could not safely accept an event.';
   this.sendToRole('browser',{kind:'error',code,message});
   return;
  }
  if(attachment.role==='browser'&&envelope?.kind==='command'&&envelope.protocolVersion===1){
   const command=normalizeRelayCommand(envelope.command);
   if(!command){ws.send(JSON.stringify({kind:'error',code:'INVALID_COMMAND',message:'The command is not supported.'}));return;}
   this.sendToRole('companion',{kind:'command',protocolVersion:1,command});
   return;
  }
  ws.send(JSON.stringify({kind:'error',code:'MESSAGE_NOT_ALLOWED',message:'This message is not allowed for this connection role.'}));
 }
 findRole(role,exclude=null){
  for(const socket of this.state.getWebSockets()){
   if(socket===exclude)continue;
   const attachment=socket.deserializeAttachment();
   if(attachment?.authenticated&&attachment.role===role)return socket;
  }
  return null;
 }
 sendToRole(role,envelope){
  const socket=this.findRole(role);
  if(!socket)return false;
  try{socket.send(JSON.stringify(envelope));return true;}catch{return false;}
 }
 async webSocketClose(ws,code,reason){
  if(code>=1000&&code<5000&&![1004,1005,1006,1015].includes(code)){try{ws.close(code,reason);}catch{}}
 }
 async webSocketError(ws){try{ws.close(1011,'Bridge connection error');}catch{}}
 async alarm(){
  for(const socket of this.state.getWebSockets()){try{socket.close(4001,'Bridge session expired');}catch{}}
  await this.state.storage.deleteAll();
 }
}

export async function handleLiveBridgeRelay(request,env,user=null){
 const url=new URL(request.url);
 if(url.pathname==='/api/live-bridge/pair'&&request.method==='POST'){
  if(request.headers.get('Origin')!==CANONICAL_ORIGIN)return json({detail:'A same-origin browser request is required to create a bridge pair.'},403);
  const fetchSite=request.headers.get('Sec-Fetch-Site');
  if(fetchSite&&fetchSite!=='same-origin')return json({detail:'Cross-site pairing requests are not allowed.'},403);
  if(!user?.id||!user?.tenant_id)return json({detail:'Sign in to create a live bridge.'},401);
  const origin=request.headers.get('Origin');
  if(origin!==url.origin||url.origin!=='https://iammagnanimousway.com'||(request.headers.get('Sec-Fetch-Site')&&request.headers.get('Sec-Fetch-Site')!=='same-origin'))return json({detail:'Bridge pairing must be initiated from the signed-in Magnanimous website.'},403);
  if(!env.LIVE_BRIDGE_ROOMS||!env.LIVE_BRIDGE_PAIR_LIMITER?.limit)return json({detail:'The online bridge service is not configured on this deployment.'},503);
  const rate=await env.LIVE_BRIDGE_PAIR_LIMITER.limit({key:String(user.tenant_id)+':'+String(user.id)});
  if(!rate?.success)return json({detail:'Too many pairing requests. Wait one minute before creating another pair.'},429);
  const pairId=crypto.randomUUID();
  const browserToken=randomToken(),companionToken=randomToken();
  const pairExpiresAt=Date.now()+TOKEN_TTL_MS;
  const id=env.LIVE_BRIDGE_ROOMS.idFromName(pairId);
  const stub=env.LIVE_BRIDGE_ROOMS.get(id);
  const created=await stub.fetch('https://bridge.internal/internal/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pairId,tenantId:String(user.tenant_id),userId:String(user.id),browserHash:await hash(browserToken),companionHash:await hash(companionToken),expectedOrigin:CANONICAL_ORIGIN,allowedProviders:LOCAL_COMPANION_PROVIDERS,pairExpiresAt})});
  if(!created.ok)return json({detail:'The secure bridge room could not be created.'},502);
  return json({ok:true,pairId,endpoint:url.origin.replace(/^https:/,'wss:')+'/api/live-bridge/ws/'+pairId,browserToken,companionToken,expiresAt:new Date(pairExpiresAt).toISOString(),sessionHours:12},201);
 }
 const match=url.pathname.match(/^\/api\/live-bridge\/ws\/([0-9a-f-]{36})$/i);
 if(match&&request.method==='GET'){
  if(url.protocol!=='https:')return json({detail:'Secure HTTPS/WSS is required.'},400);
  if(!env.LIVE_BRIDGE_ROOMS)return json({detail:'The online bridge service is not configured on this deployment.'},503);
  const id=env.LIVE_BRIDGE_ROOMS.idFromName(match[1]);
  return env.LIVE_BRIDGE_ROOMS.get(id).fetch(request);
 }
 return null;
}

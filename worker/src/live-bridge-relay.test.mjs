import test from 'node:test';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {handleLiveBridgeRelay,isRelayProviderAllowed,MagnanimousLiveBridgeRoom,normalizeRelayCommand,normalizeRelayCommandReceipt,normalizeRelayEvent} from './live-bridge-relay.js';

const NOW=Date.parse('2026-11-25T00:00:00.000Z');

test('normalizes approved platform events and strips unsafe fields',()=>{
 const event=normalizeRelayEvent({protocolVersion:1,eventId:'yt-1',provider:'youtube',type:'chat.message',occurredAt:new Date(NOW).toISOString(),actorName:'Viewer\u0000 One',text:' Hello\u0007 world ',tags:{source:'chat',accessToken:'never-copy',safe:true}},NOW);
 assert.equal(event.provider,'youtube');
 assert.equal(event.actorName,'Viewer One');
 assert.equal(event.text,'Hello world');
 assert.deepEqual(event.tags,{source:'chat',safe:true});
});

test('recognizes platform event schemas but denies platform authority until an adapter is authorized',()=>{
 assert.equal(isRelayProviderAllowed('manual',['manual','obs','game','browser']),true);
 for(const provider of ['facebook','tiktok','youtube','twitch','zoom']){
  const event=normalizeRelayEvent({protocolVersion:1,eventId:provider+'-1',provider,type:'audience.follow',occurredAt:new Date(NOW).toISOString()},NOW);
  assert.equal(event?.provider,provider);
  assert.equal(isRelayProviderAllowed(provider,['manual','obs','game','browser']),false);
 }
});

test('rejects spoofed providers, malformed IDs, stale events and invalid chat',()=>{
 const base={protocolVersion:1,eventId:'event-1',provider:'youtube',type:'chat.message',occurredAt:new Date(NOW).toISOString(),text:'hello'};
 assert.equal(normalizeRelayEvent({...base,provider:'fake'},NOW),null);
 assert.equal(normalizeRelayEvent({...base,eventId:'bad id'},NOW),null);
 assert.equal(normalizeRelayEvent({...base,occurredAt:new Date(NOW-8*86400000).toISOString()},NOW),null);
 assert.equal(normalizeRelayEvent({...base,text:'\u0000\u0007'},NOW),null);
});

test('only approved production commands pass the relay contract',()=>{
 assert.deepEqual(normalizeRelayCommand({commandId:'c-1',action:'scene.set',sceneName:'Welcome'}),{commandId:'c-1',action:'scene.set',sceneName:'Welcome'});
 assert.equal(normalizeRelayCommand({commandId:'c-2',action:'broadcast.start'}),null);
 assert.equal(normalizeRelayCommand({commandId:'c-3',action:'shell.exec',command:'whoami'}),null);
 assert.equal(normalizeRelayCommand({commandId:'c-4',action:'host.speak',text:'hello\u0000 world'}).text,'hello world');
 assert.equal(normalizeRelayCommand({commandId:'c-5',action:'overlay.show',overlayId:'banner'}),null);
 assert.equal(normalizeRelayCommand({commandId:'c-6',action:'overlay.hide',overlayId:'banner'}),null);
 assert.equal(normalizeRelayCommand({commandId:'c-7',action:'audio.cue',cueId:'applause'}),null);
});

test('pair endpoint requires an authenticated tenant and returns two distinct short-lived role tokens',async()=>{
 let initialized,rateKey;
 const env={LIVE_BRIDGE_PAIR_LIMITER:{limit:async({key})=>{rateKey=key;return{success:true};}},LIVE_BRIDGE_ROOMS:{
  idFromName:id=>id,
  get:id=>({fetch:async(_url,init)=>{initialized=JSON.parse(init.body);return Response.json({ok:true});}})
 }};
 const request=new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST',headers:{'content-type':'application/json','Origin':'https://iammagnanimousway.com','Sec-Fetch-Site':'same-origin'}});
 const denied=await handleLiveBridgeRelay(request,env,null);
 assert.equal(denied.status,401);
 const response=await handleLiveBridgeRelay(request,env,{id:'user-1',tenant_id:'tenant-1'});
 assert.equal(response.status,201);
 const data=await response.json();
 assert.equal(data.ok,true);
 assert.match(data.endpoint,/^wss:\/\/iammagnanimousway\.com\/api\/live-bridge\/ws\//);
 assert.equal(data.browserToken.length,43);
 assert.equal(data.companionToken.length,43);
 assert.notEqual(data.browserToken,data.companionToken);
 assert.ok(data.expiresAt);
 assert.equal(initialized.tenantId,'tenant-1');
 assert.equal(initialized.expectedOrigin,'https://iammagnanimousway.com');
 assert.equal(rateKey,'tenant-1:user-1');
 assert.equal(initialized.userId,'user-1');
 assert.deepEqual(initialized.allowedProviders,['manual','obs','game','browser']);
 assert.notEqual(initialized.browserHash,data.browserToken);
 assert.notEqual(initialized.companionHash,data.companionToken);
});




test('pair endpoint rejects cross-site and originless requests before allocating a room',async()=>{
 let allocations=0;
 const env={LIVE_BRIDGE_PAIR_LIMITER:{limit:async()=>({success:true})},LIVE_BRIDGE_ROOMS:{idFromName:id=>{allocations++;return id;},get:()=>({fetch:async()=>Response.json({ok:true})})}};
 for(const headers of [{},{Origin:'https://attacker.example','Sec-Fetch-Site':'cross-site'}]){
  const response=await handleLiveBridgeRelay(new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST',headers}),env,{id:'user-1',tenant_id:'tenant-1'});
  assert.equal(response.status,403);
 }
 assert.equal(allocations,0);
});


test('pair endpoint rejects missing or cross-site browser origins',async()=>{
 const env={LIVE_BRIDGE_PAIR_LIMITER:{limit:async()=>({success:true})},LIVE_BRIDGE_ROOMS:{idFromName:id=>id,get:()=>({fetch:async()=>Response.json({ok:true})})}};
 const missing=await handleLiveBridgeRelay(new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST'}),env,{id:'u',tenant_id:'t'});
 assert.equal(missing.status,403);
 const cross=await handleLiveBridgeRelay(new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST',headers:{Origin:'https://attacker.example','Sec-Fetch-Site':'cross-site'}}),env,{id:'u',tenant_id:'t'});
 assert.equal(cross.status,403);
});

test('pair endpoint enforces the per-user pairing rate limit',async()=>{
 const env={LIVE_BRIDGE_PAIR_LIMITER:{limit:async()=>({success:false})},LIVE_BRIDGE_ROOMS:{idFromName:id=>id,get:()=>({fetch:async()=>Response.json({ok:true})})}};
 const request=new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST',headers:{Origin:'https://iammagnanimousway.com','Sec-Fetch-Site':'same-origin'}});
 const response=await handleLiveBridgeRelay(request,env,{id:'user-1',tenant_id:'tenant-1'});
 assert.equal(response.status,429);
});

test('Durable Object room stores only token hashes and rejects duplicate initialization',async()=>{
 const values=new Map();
 const alarms=[];
 const state={storage:{
  get:async key=>values.get(key),
  put:async(key,value)=>values.set(key,value),
  setAlarm:async at=>alarms.push(at),
  deleteAll:async()=>values.clear()
 },acceptWebSocket(){},getWebSockets(){return[];}};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 const body={pairId:'room-1',tenantId:'tenant-1',userId:'user-1',browserHash:'a'.repeat(64),companionHash:'b'.repeat(64),allowedProviders:['manual','obs','game','browser'],pairExpiresAt:NOW+600000};
 const first=await room.fetch(new Request('https://bridge.internal/internal/create',{method:'POST',headers:{'content-type':'application/json','Origin':'https://iammagnanimousway.com','Sec-Fetch-Site':'same-origin'},body:JSON.stringify(body)}));
 assert.equal(first.status,200);
 const stored=values.get('pair');
 assert.equal(stored.tenantId,'tenant-1');
 assert.equal(stored.browserHash,body.browserHash);
 assert.equal(stored.companionHash,body.companionHash);
 assert.deepEqual(stored.allowedProviders,body.allowedProviders);
 assert.equal(stored.browserToken,undefined);
 assert.deepEqual(alarms,[body.pairExpiresAt]);
 const duplicate=await room.fetch(new Request('https://bridge.internal/internal/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
 assert.equal(duplicate.status,409);
});



function makeSocket(initial){
 let attachment={...initial};const messages=[];let closed=null;
 return {messages,get closed(){return closed;},get attachment(){return attachment;},deserializeAttachment:()=>attachment,serializeAttachment:value=>{attachment=value;},send:value=>messages.push(JSON.parse(value)),close:(code,reason)=>{closed={code,reason};}};
}
function tokenHash(token){return createHash('sha256').update(token).digest('hex');}
function makeRoomForAuth(role,origin){
 const browserToken='B'.repeat(43),companionToken='C'.repeat(43);
 const pair={pairId:'room-1',tenantId:'tenant-1',userId:'user-1',browserHash:tokenHash(browserToken),companionHash:tokenHash(companionToken),allowedProviders:['manual','obs','game','browser'],pairExpiresAt:Date.now()+600000,sessionExpiresAt:0};
 const socket=makeSocket({pairId:'room-1',tenantId:'tenant-1',expectedOrigin:'https://iammagnanimousway.com',origin,role:null,authenticated:false,seen:[],sessionExpiresAt:0});
 const state={storage:{get:async()=>pair,put:async(_key,value)=>{Object.assign(pair,value);},setAlarm:async()=>{}},getWebSockets:()=>[socket]};
 return {room:new MagnanimousLiveBridgeRoom(state,{}),socket,token:role==='browser'?browserToken:companionToken};
}

test('browser pairing token cannot authenticate without the official browser origin',async()=>{
 const {room,socket,token}=makeRoomForAuth('browser',null);
 await room.webSocketMessage(socket,JSON.stringify({kind:'auth',protocolVersion:1,token}));
 assert.equal(socket.closed?.code,4003);
 assert.equal(socket.messages.at(-1)?.code,'ORIGIN_ROLE_MISMATCH');
 assert.equal(socket.attachment.authenticated,false);
});

test('companion pairing token cannot authenticate from a browser origin',async()=>{
 const {room,socket,token}=makeRoomForAuth('companion','https://iammagnanimousway.com');
 await room.webSocketMessage(socket,JSON.stringify({kind:'auth',protocolVersion:1,token}));
 assert.equal(socket.closed?.code,4003);
 assert.equal(socket.messages.at(-1)?.code,'ORIGIN_ROLE_MISMATCH');
 assert.equal(socket.attachment.authenticated,false);
});

test('official browser and originless local companion tokens authenticate only their assigned roles',async()=>{
 const browser=makeRoomForAuth('browser','https://iammagnanimousway.com');
 await browser.room.webSocketMessage(browser.socket,JSON.stringify({kind:'auth',protocolVersion:1,token:browser.token}));
 assert.equal(browser.socket.attachment.authenticated,true);
 assert.equal(browser.socket.attachment.role,'browser');
 const companion=makeRoomForAuth('companion',null);
 await companion.room.webSocketMessage(companion.socket,JSON.stringify({kind:'auth',protocolVersion:1,token:companion.token}));
 assert.equal(companion.socket.attachment.authenticated,true);
 assert.equal(companion.socket.attachment.role,'companion');
});

test('pairing tokens expire after ten minutes while an already authenticated session may continue',async()=>{
 const originalNow=Date.now,startedAt=originalNow();
 const {room,socket,token}=makeRoomForAuth('browser','https://iammagnanimousway.com');
 const auth=JSON.stringify({kind:'auth',protocolVersion:1,token});
 try{
  await room.webSocketMessage(socket,auth);
  assert.equal(socket.attachment.authenticated,true);
  assert.ok(socket.attachment.sessionExpiresAt>startedAt+10*60_000);
  Date.now=()=>startedAt+10*60_000+1;
  await room.webSocketMessage(socket,JSON.stringify({kind:'ping'}));
  assert.equal(socket.messages.at(-1)?.kind,'pong','An already authenticated connection may continue within its session window.');
  socket.serializeAttachment({...socket.attachment,authenticated:false,role:null});
  await room.webSocketMessage(socket,auth);
  assert.equal(socket.closed?.code,4001,'The original pairing token must not establish a new connection after ten minutes.');
  assert.equal(socket.messages.at(-1)?.code,'PAIRING_REVOKED');
 }finally{Date.now=originalNow;}
});

test('authenticated companion cannot spoof a platform event without adapter authorization',async()=>{
 const socket=makeSocket({authenticated:true,role:'companion',allowedProviders:['manual','obs','game','browser'],seen:[],sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const state={getWebSockets:()=>[socket]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(socket,JSON.stringify({kind:'event',protocolVersion:1,event:{protocolVersion:1,eventId:'spoof-1',provider:'youtube',type:'audience.follow',occurredAt:new Date().toISOString()}}));
 assert.equal(socket.messages.at(-1)?.code,'PROVIDER_NOT_AUTHORIZED');
});





test('owner revoke endpoint is same-origin, tenant-scoped and invalidates the selected pair',async()=>{
 let forwarded;
 const env={
  LIVE_BRIDGE_PAIR_LIMITER:{limit:async()=>({success:true})},
  LIVE_BRIDGE_ROOMS:{
   idFromName:id=>id,
   get:id=>({fetch:async request=>{forwarded={id,body:await request.json()};return Response.json({ok:true,revoked:true});}})
  }
 };
 const headers={Origin:'https://iammagnanimousway.com','Sec-Fetch-Site':'same-origin','content-type':'application/json'};
 const response=await handleLiveBridgeRelay(new Request('https://iammagnanimousway.com/api/live-bridge/revoke',{method:'POST',headers,body:JSON.stringify({pairId:'12345678-1234-1234-1234-123456789abc'})}),env,{id:'user-1',tenant_id:'tenant-1'});
 assert.equal(response.status,200);
 assert.equal((await response.json()).revoked,true);
 assert.equal(forwarded.id,'12345678-1234-1234-1234-123456789abc');
 assert.deepEqual(forwarded.body,{tenantId:'tenant-1',userId:'user-1'});
 const denied=await handleLiveBridgeRelay(new Request('https://iammagnanimousway.com/api/live-bridge/revoke',{method:'POST',headers:{...headers,Origin:'https://attacker.example'},body:JSON.stringify({pairId:'12345678-1234-1234-1234-123456789abc'})}),env,{id:'user-1',tenant_id:'tenant-1'});
 assert.equal(denied.status,403);
});

test('revokes only the owner tenant pair and closes both sockets',async()=>{
 const pair={pairId:'room-1',tenantId:'tenant-1',userId:'user-1'};
 const values=new Map([['pair',pair]]);
 const messages=[],closed=[];
 const browser={deserializeAttachment:()=>({authenticated:true,role:'browser'}),send:value=>messages.push(JSON.parse(value)),close:(code,reason)=>closed.push({code,reason})};
 const companion={deserializeAttachment:()=>({authenticated:true,role:'companion'}),send:value=>messages.push(JSON.parse(value)),close:(code,reason)=>closed.push({code,reason})};
 const state={storage:{get:async key=>values.get(key),delete:async key=>values.delete(key)},getWebSockets:()=>[browser,companion]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 const denied=await room.fetch(new Request('https://bridge.internal/internal/revoke',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tenantId:'other',userId:'user-1'})}));
 assert.equal(denied.status,403);
 assert.ok(values.has('pair'));
 const response=await room.fetch(new Request('https://bridge.internal/internal/revoke',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tenantId:'tenant-1',userId:'user-1'})}));
 assert.equal(response.status,200);
 assert.equal((await response.json()).revoked,true);
 assert.equal(values.has('pair'),false);
 assert.equal(closed.length,2);
 assert.ok(messages.every(message=>message.code==='PAIRING_REVOKED'));
});

test('binds browser and companion pairing tokens to their distinct WebSocket origins',async()=>{
 const browserToken='b'.repeat(43),companionToken='c'.repeat(43);
 const pair={pairId:'room-1',tenantId:'tenant-1',userId:'user-1',browserHash:crypto.createHash('sha256').update(browserToken).digest('hex'),companionHash:crypto.createHash('sha256').update(companionToken).digest('hex'),expectedOrigin:'https://iammagnanimousway.com',allowedProviders:['manual','obs','game','browser'],pairExpiresAt:Date.now()+600000,sessionExpiresAt:0};
 const makeRoom=origin=>{
  const values=new Map([['pair',pair]]);
  let attachment={pairId:'room-1',tenantId:'tenant-1',origin,expectedOrigin:pair.expectedOrigin,authenticated:false};
  let closed=0;const messages=[];
  const socket={deserializeAttachment:()=>attachment,serializeAttachment:value=>{attachment=value;},send:value=>messages.push(JSON.parse(value)),close:code=>{closed=code;}};
  const state={storage:{get:async key=>values.get(key),put:async(key,value)=>values.set(key,value),setAlarm:async()=>{}},getWebSockets:()=>[socket]};
  return{room:new MagnanimousLiveBridgeRoom(state,{}),socket,get attachment(){return attachment;},get closed(){return closed;},messages};
 };
 const wrongBrowser=makeRoom('https://attacker.example');
 await wrongBrowser.room.webSocketMessage(wrongBrowser.socket,JSON.stringify({kind:'auth',protocolVersion:1,token:browserToken}));
 assert.equal(wrongBrowser.closed,4003);
 assert.equal(wrongBrowser.messages[0].code,'ORIGIN_ROLE_MISMATCH');
 const wrongCompanion=makeRoom('https://iammagnanimousway.com');
 await wrongCompanion.room.webSocketMessage(wrongCompanion.socket,JSON.stringify({kind:'auth',protocolVersion:1,token:companionToken}));
 assert.equal(wrongCompanion.closed,4003);
 const localCompanion=makeRoom(null);
 await localCompanion.room.webSocketMessage(localCompanion.socket,JSON.stringify({kind:'auth',protocolVersion:1,token:companionToken}));
 assert.equal(localCompanion.attachment.role,'companion');
 assert.equal(localCompanion.closed,0);
});

test('forwards sanitized local storage failures to the browser operator',async()=>{
 const browserMessages=[];
 const browser={deserializeAttachment:()=>({authenticated:true,role:'browser'}),send:value=>browserMessages.push(JSON.parse(value))};
 const companion={deserializeAttachment:()=>({authenticated:true,role:'companion'}),send(){},serializeAttachment(){}};
 const state={storage:{get:async()=>null},getWebSockets:()=>[browser,companion]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(companion,JSON.stringify({kind:'error',code:'LOCAL_STORAGE_BLOCKED',message:'The encrypted event journal is full.'}));
 assert.deepEqual(browserMessages,[{kind:'error',code:'LOCAL_STORAGE_BLOCKED',message:'The encrypted event journal is full.'}]);
});

test('limits authenticated browser message rate',async()=>{
 const now=Date.now();
 let attachment={authenticated:true,role:'browser',sessionExpiresAt:now+60_000,windowStartedAt:now,windowCount:0};
 let closed=0;
 const socket={deserializeAttachment:()=>attachment,serializeAttachment:value=>{attachment=value;},send(){},close:code=>{closed=code;}};
 const state={storage:{get:async()=>null},getWebSockets:()=>[socket]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 for(let i=0;i<11;i++)await room.webSocketMessage(socket,JSON.stringify({kind:'ping'}));
 assert.equal(closed,4429);
});

test('normalizes only bounded, explicit command receipts',()=>{
 assert.deepEqual(normalizeRelayCommandReceipt({commandId:'command-1',status:'received'}),{commandId:'command-1',status:'received'});
 for(const status of ['sent','executing','done','broadcast.started','approved;delete']){
  assert.equal(normalizeRelayCommandReceipt({commandId:'command-1',status}),null);
 }
 assert.equal(normalizeRelayCommandReceipt({commandId:'bad id',status:'completed'}),null);
});

test('relays command receipts only for commands issued by the browser and enforces approval order',async()=>{
 const browser=makeSocket({authenticated:true,role:'browser',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const companion=makeSocket({authenticated:true,role:'companion',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const values=new Map([['commands',[{commandId:'command-42',action:'scene.set',status:'sent',createdAt:Date.now(),expiresAt:Date.now()+300000}]]]);
 const state={storage:{get:async key=>values.get(key),put:async(key,value)=>values.set(key,value)},getWebSockets:()=>[browser,companion]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(companion,JSON.stringify({kind:'command.receipt',protocolVersion:1,receipt:{commandId:'command-42',status:'received'}}));
 assert.deepEqual(browser.messages.at(-1),{kind:'command.receipt',protocolVersion:1,receipt:{commandId:'command-42',status:'received'}});
 assert.equal(values.get('commands')[0].status,'received');
 await room.webSocketMessage(companion,JSON.stringify({kind:'command.receipt',protocolVersion:1,receipt:{commandId:'command-42',status:'completed'}}));
 assert.equal(companion.messages.at(-1)?.code,'INVALID_COMMAND_TRANSITION');
 assert.equal(values.get('commands')[0].status,'received');
 await room.webSocketMessage(companion,JSON.stringify({kind:'command.receipt',protocolVersion:1,receipt:{commandId:'command-42',status:'approved'}}));
 assert.equal(browser.messages.at(-1)?.receipt.status,'approved');
 await room.webSocketMessage(companion,JSON.stringify({kind:'command.receipt',protocolVersion:1,receipt:{commandId:'command-42',status:'completed'}}));
 assert.equal(browser.messages.at(-1)?.receipt.status,'completed');
 assert.equal(values.get('commands')[0].status,'completed');
 await room.webSocketMessage(browser,JSON.stringify({kind:'command.receipt',protocolVersion:1,receipt:{commandId:'command-42',status:'failed'}}));
 assert.equal(browser.messages.at(-1)?.code,'MESSAGE_NOT_ALLOWED');
});

test('browser reconnect receives the latest non-expired local command receipt',async()=>{
 const browserToken='B'.repeat(43),companionToken='C'.repeat(43),expectedOrigin='https://iammagnanimousway.com';
 const pair={pairId:'room-reconnect',tenantId:'tenant-1',userId:'user-1',browserHash:tokenHash(browserToken),companionHash:tokenHash(companionToken),expectedOrigin,allowedProviders:['manual','obs','game','browser'],pairExpiresAt:Date.now()+600000,sessionExpiresAt:Date.now()+600000};
 const browser=makeSocket({pairId:pair.pairId,tenantId:pair.tenantId,expectedOrigin,origin:expectedOrigin,authenticated:false,seen:[],sessionExpiresAt:0});
 const companion=makeSocket({pairId:pair.pairId,tenantId:pair.tenantId,expectedOrigin,origin:null,authenticated:false,seen:[],sessionExpiresAt:0});
 const values=new Map([['pair',pair],['commands',[{commandId:'reconnect-command-1',action:'host.speak',status:'approved',createdAt:Date.now(),expiresAt:Date.now()+300000}]]]);
 const state={storage:{get:async key=>values.get(key),put:async(key,value)=>values.set(key,value),setAlarm:async()=>{}},getWebSockets:()=>[browser,companion]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(browser,JSON.stringify({kind:'auth',protocolVersion:1,token:browserToken}));
 assert.equal(browser.attachment.authenticated,true);
 await room.webSocketMessage(companion,JSON.stringify({kind:'auth',protocolVersion:1,token:companionToken}));
 assert.ok(browser.messages.some(message=>message.kind==='command.receipt'&&message.receipt.commandId==='reconnect-command-1'&&message.receipt.status==='approved'));
 assert.ok(browser.messages.some(message=>message.kind==='ready'));
 assert.ok(companion.messages.some(message=>message.kind==='ready'));
});

test('browser command is recorded before delivery and can receive a local queue receipt',async()=>{
 const browser=makeSocket({authenticated:true,role:'browser',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const companion=makeSocket({authenticated:true,role:'companion',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const values=new Map();
 const state={storage:{get:async key=>values.get(key),put:async(key,value)=>values.set(key,value)},getWebSockets:()=>[browser,companion]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(browser,JSON.stringify({kind:'command',protocolVersion:1,command:{commandId:'new-command-1',action:'host.speak',text:'Hello viewers'}}));
 assert.equal(companion.messages.at(-1)?.command.commandId,'new-command-1');
 assert.equal(values.get('commands')[0].status,'sent');
 await room.webSocketMessage(companion,JSON.stringify({kind:'command.receipt',protocolVersion:1,receipt:{commandId:'new-command-1',status:'received'}}));
 assert.equal(browser.messages.at(-1)?.receipt.status,'received');
 await room.webSocketMessage(browser,JSON.stringify({kind:'command',protocolVersion:1,command:{commandId:'new-command-1',action:'host.speak',text:'Duplicate'}}));
 assert.equal(browser.messages.at(-1)?.code,'DUPLICATE_COMMAND');
});

test('browser command reports when the local companion is offline instead of silently dropping it',async()=>{
 const browser=makeSocket({authenticated:true,role:'browser',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const values=new Map();
 const state={storage:{get:async key=>values.get(key),put:async(key,value)=>values.set(key,value)},getWebSockets:()=>[browser]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(browser,JSON.stringify({kind:'command',protocolVersion:1,command:{commandId:'offline-1',action:'host.speak',text:'Welcome viewers'}}));
 assert.equal(browser.messages.at(-1)?.kind,'error');
 assert.equal(browser.messages.at(-1)?.code,'COMMAND_NOT_DELIVERED');
 assert.match(browser.messages.at(-1)?.message||/./,/not delivered/i);
});

test('browser command reports a failed companion socket send',async()=>{
 const browser=makeSocket({authenticated:true,role:'browser',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 const companion=makeSocket({authenticated:true,role:'companion',sessionExpiresAt:Date.now()+60000,windowStartedAt:Date.now(),windowCount:0});
 companion.send=()=>{throw new Error('socket closed');};
 const values=new Map();
 const state={storage:{get:async key=>values.get(key),put:async(key,value)=>values.set(key,value)},getWebSockets:()=>[browser,companion]};
 const room=new MagnanimousLiveBridgeRoom(state,{});
 await room.webSocketMessage(browser,JSON.stringify({kind:'command',protocolVersion:1,command:{commandId:'failed-send-1',action:'scene.set',sceneName:'Welcome'}}));
 assert.equal(browser.messages.at(-1)?.code,'COMMAND_NOT_DELIVERED');
 assert.match(browser.messages.at(-1)?.message||/./,/not delivered/i);
});

test('pair endpoint fails closed when the online bridge namespace is absent',async()=>{
 const request=new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST',headers:{Origin:'https://iammagnanimousway.com'}});
 const response=await handleLiveBridgeRelay(request,{}, {id:'user-1',tenant_id:'tenant-1'});
 assert.equal(response.status,503);
});

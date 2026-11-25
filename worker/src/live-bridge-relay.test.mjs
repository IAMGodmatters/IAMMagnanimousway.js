import test from 'node:test';
import assert from 'node:assert/strict';
import {handleLiveBridgeRelay,MagnanimousLiveBridgeRoom,normalizeRelayCommand,normalizeRelayEvent} from './live-bridge-relay.js';

const NOW=Date.parse('2026-11-25T00:00:00.000Z');

test('normalizes approved platform events and strips unsafe fields',()=>{
 const event=normalizeRelayEvent({protocolVersion:1,eventId:'yt-1',provider:'youtube',type:'chat.message',occurredAt:new Date(NOW).toISOString(),actorName:'Viewer\u0000 One',text:' Hello\u0007 world ',tags:{source:'chat',accessToken:'never-copy',safe:true}},NOW);
 assert.equal(event.provider,'youtube');
 assert.equal(event.actorName,'Viewer One');
 assert.equal(event.text,'Hello world');
 assert.deepEqual(event.tags,{source:'chat',safe:true});
});

test('accepts Facebook and TikTok event envelopes without granting provider authority',()=>{
 for(const provider of ['facebook','tiktok','youtube','twitch']){
  const event=normalizeRelayEvent({protocolVersion:1,eventId:provider+'-1',provider,type:'audience.follow',occurredAt:new Date(NOW).toISOString()},NOW);
  assert.equal(event?.provider,provider);
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
});

test('pair endpoint requires an authenticated tenant and returns two distinct short-lived role tokens',async()=>{
 let initialized;
 const env={LIVE_BRIDGE_ROOMS:{
  idFromName:id=>id,
  get:id=>({fetch:async(_url,init)=>{initialized=JSON.parse(init.body);return Response.json({ok:true});}})
 }};
 const request=new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST',headers:{'content-type':'application/json'}});
 const denied=await handleLiveBridgeRelay(request,env,null);
 assert.equal(denied.status,401);
 const response=await handleLiveBridgeRelay(request,env,{id:'user-1',tenant_id:'tenant-1'});
 assert.equal(response.status,201);
 const data=await response.json();
 assert.equal(data.ok,true);
 assert.match(data.endpoint,/^https:\/\/iammagnanimousway\.com\/api\/live-bridge\/ws\//);
 assert.equal(data.browserToken.length,43);
 assert.equal(data.companionToken.length,43);
 assert.notEqual(data.browserToken,data.companionToken);
 assert.ok(data.expiresAt);
 assert.equal(initialized.tenantId,'tenant-1');
 assert.equal(initialized.userId,'user-1');
 assert.notEqual(initialized.browserHash,data.browserToken);
 assert.notEqual(initialized.companionHash,data.companionToken);
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
 const body={pairId:'room-1',tenantId:'tenant-1',userId:'user-1',browserHash:'a'.repeat(64),companionHash:'b'.repeat(64),pairExpiresAt:NOW+600000};
 const first=await room.fetch(new Request('https://bridge.internal/internal/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
 assert.equal(first.status,200);
 const stored=values.get('pair');
 assert.equal(stored.tenantId,'tenant-1');
 assert.equal(stored.browserHash,body.browserHash);
 assert.equal(stored.companionHash,body.companionHash);
 assert.equal(stored.browserToken,undefined);
 assert.deepEqual(alarms,[body.pairExpiresAt]);
 const duplicate=await room.fetch(new Request('https://bridge.internal/internal/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
 assert.equal(duplicate.status,409);
});

test('pair endpoint fails closed when the online bridge namespace is absent',async()=>{
 const request=new Request('https://iammagnanimousway.com/api/live-bridge/pair',{method:'POST'});
 const response=await handleLiveBridgeRelay(request,{}, {id:'user-1',tenant_id:'tenant-1'});
 assert.equal(response.status,503);
});

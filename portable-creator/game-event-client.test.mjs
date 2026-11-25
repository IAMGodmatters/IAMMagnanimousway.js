import test from 'node:test';
import assert from 'node:assert/strict';
import { sendLocalGameEvent, LOCAL_GAME_EVENT_ENDPOINT } from './game-event-client.mjs';

const token='A'.repeat(43);

test('sends a bounded game event only to the fixed loopback Creator endpoint',async()=>{
 let request;
 const result=await sendLocalGameEvent({token,gameName:'Puzzle Quest',actorName:'Player One',text:'Level completed'},{fetchImpl:async(url,init)=>{request={url,init};return Response.json({ok:true,status:'accepted'});}});
 assert.equal(request.url,LOCAL_GAME_EVENT_ENDPOINT);
 assert.equal(request.init.method,'POST');
 assert.equal(request.init.headers.authorization,'Bearer '+token);
 const envelope=JSON.parse(request.init.body);
 const body=envelope.event;
 assert.deepEqual(Object.keys(envelope),['event']);
 assert.equal(body.protocolVersion,1);
 assert.equal(body.gameName,'Puzzle Quest');
 assert.equal(body.text,'Level completed');
 assert.equal(body.actorName,'Player One');
 assert.match(body.eventId,/^[0-9a-f-]{36}$/);
 assert.deepEqual(result,{ok:true,status:'accepted'});
});

test('does not allow a caller-supplied URL or invalid bearer token',async()=>{
 let called=false;
 await assert.rejects(sendLocalGameEvent({token:'bad',text:'event'},{fetchImpl:async()=>{called=true;return Response.json({});}}),/token/);
 assert.equal(called,false);
 assert.equal(LOCAL_GAME_EVENT_ENDPOINT,'http://127.0.0.1:3219/api/integrations/game/event');
});

test('rejects empty text, invalid event IDs and stale timestamps before network access',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return Response.json({ok:true});};
 await assert.rejects(sendLocalGameEvent({token,text:'  '},{fetchImpl}),/description/);
 await assert.rejects(sendLocalGameEvent({token,text:'event',eventId:'not safe!'},{fetchImpl}),/event ID/);
 await assert.rejects(sendLocalGameEvent({token,text:'event',occurredAt:'2000-01-01T00:00:00.000Z'},{fetchImpl}),/timestamp/);
 assert.equal(calls,0);
});

test('sanitizes and bounds game metadata and rejects failed local responses',async()=>{
 let sent;
 await sendLocalGameEvent({token,gameName:'<Game>\u0000'.repeat(30),actorName:'<Player>\u0000',text:'A\u0000 moment'},{fetchImpl:async(_url,init)=>{sent=JSON.parse(init.body).event;return Response.json({ok:true});}});
 const event=sent;
 assert.ok(event.gameName.length<=80);
 assert.ok(!/[<>\u0000-\u001f]/.test(event.gameName+event.actorName+event.text));
 await assert.rejects(sendLocalGameEvent({token,text:'event'},{fetchImpl:async()=>Response.json({detail:'Workspace locked.'},{status:423})}),/Workspace locked/);
});

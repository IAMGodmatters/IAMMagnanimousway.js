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
 const event=envelope.event;
 assert.deepEqual(Object.keys(envelope),['event']);
 assert.equal(event.protocolVersion,1);
 assert.equal(event.gameName,'Puzzle Quest');
 assert.equal(event.text,'Level completed');
 assert.equal(event.actorName,'Player One');
 assert.match(event.eventId,/^[0-9a-f-]{36}$/);
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
 let requestBody='';
 await sendLocalGameEvent({token,gameName:('<Game>'+String.fromCharCode(0)).repeat(30),actorName:'<Player>'+String.fromCharCode(0),text:'A'+String.fromCharCode(0)+' moment'},{fetchImpl:async(_url,init)=>{requestBody=init.body;return Response.json({ok:true});}});
 const payload=JSON.parse(requestBody);
 const event=payload.event;
 assert.ok(event&&typeof event==='object','The game client must send a wrapped event payload.');
 assert.ok(event.gameName.length<=80);
 assert.ok(![...event.gameName+event.actorName+event.text].some(char=>{const code=char.charCodeAt(0);return code===60||code===62||code<=31||code===127;}));
 await assert.rejects(sendLocalGameEvent({token,text:'event'},{fetchImpl:async()=>Response.json({detail:'Workspace locked.'},{status:423})}),/Workspace locked/);
});

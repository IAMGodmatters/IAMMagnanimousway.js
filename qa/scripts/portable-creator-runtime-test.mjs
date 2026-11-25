import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import crypto from 'node:crypto';
import { LiveEventJournal } from '../../portable-creator/live-event-journal.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const SOURCE=path.join(ROOT,'portable-creator');
const eventTests=spawnSync(process.execPath,['--test',path.join(SOURCE,'live-event-runtime.test.mjs'),path.join(SOURCE,'live-event-journal.test.mjs'),path.join(SOURCE,'game-event-integration.test.mjs'),path.join(SOURCE,'game-event-client.test.mjs')],{encoding:'utf8'});
if(eventTests.status!==0){console.error(eventTests.stdout||'');console.error(eventTests.stderr||'');throw new Error('Portable live-event runtime unit tests failed.');}
console.log(eventTests.stdout.trim());

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'magnanimous-portable-'));
const target=path.join(temp,'portable');
fs.mkdirSync(path.join(target,'app'),{recursive:true});
fs.copyFileSync(path.join(SOURCE,'host.mjs'),path.join(target,'host.mjs'));
fs.copyFileSync(path.join(SOURCE,'obs-client.mjs'),path.join(target,'obs-client.mjs'));
fs.copyFileSync(path.join(SOURCE,'live-event-runtime.mjs'),path.join(target,'live-event-runtime.mjs'));
fs.copyFileSync(path.join(SOURCE,'live-event-journal.mjs'),path.join(target,'live-event-journal.mjs'));
fs.copyFileSync(path.join(SOURCE,'live-show-director.mjs'),path.join(target,'live-show-director.mjs'));
fs.copyFileSync(path.join(SOURCE,'game-event-integration.mjs'),path.join(target,'game-event-integration.mjs'));
for(const file of ['index.html','app.js','styles.css','avatar.html','avatar.js','avatar.css'])fs.copyFileSync(path.join(SOURCE,'app',file),path.join(target,'app',file));
const appSyntax=spawnSync(process.execPath,['--check',path.join(target,'app','app.js')],{encoding:'utf8'});
if(appSyntax.status!==0){console.error(appSyntax.stderr||'');throw new Error('Portable creator browser script syntax check failed.');}
const avatarSyntax=spawnSync(process.execPath,['--check',path.join(target,'app','avatar.js')],{encoding:'utf8'});
if(avatarSyntax.status!==0){console.error(avatarSyntax.stderr||'');throw new Error('Portable OBS avatar script syntax check failed.');}


function freePort(){
 return new Promise((resolve,reject)=>{
  const s=net.createServer();
  s.once('error',reject);
  s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});
 });
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(url,child){
 const deadline=Date.now()+10000;
 while(Date.now()<deadline){
  if(child.exitCode!==null)throw new Error('Portable host exited early with code '+child.exitCode);
  try{const r=await fetch(url+'/api/health');if(r.ok)return;}catch{}
  await wait(100);
 }
 throw new Error('Portable host did not become healthy within 10 seconds.');
}
async function post(url,origin,body){
 return fetch(url,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
}
function makeSseReader(reader){
 const decoder=new TextDecoder();let pending='';
 return{
  async next(){
   while(!pending.includes('\n\n')){
    const {value,done}=await reader.read();
    if(done)throw new Error('Avatar event stream closed unexpectedly.');
    pending+=decoder.decode(value,{stream:true});
   }
   const index=pending.indexOf('\n\n'),frame=pending.slice(0,index);
   pending=pending.slice(index+2);return frame;
  },
  cancel(){return reader.cancel();}
 };
}
const port=await freePort();
const origin='http://127.0.0.1:'+port;
const child=spawn(process.execPath,[path.join(target,'host.mjs'),'--root',target,'--port',String(port)],{cwd:target,env:{...process.env,MAGNANIMOUS_LOCAL_MODEL_ENABLED:'false'},stdio:['ignore','pipe','pipe']});
let stderr='';
let avatarReader=null;
child.stderr.on('data',chunk=>{stderr+=chunk.toString();});
try{
 await waitFor(origin,child);
 const avatarPage=await fetch(origin+'/avatar.html');
 assert.equal(avatarPage.status,200,'OBS avatar page should load from the local host.');
 assert.ok((await avatarPage.text()).includes('avatar.js'),'OBS avatar page should load its local script.');
 const avatarScript=await fetch(origin+'/avatar.js');
 assert.equal(avatarScript.status,200,'OBS avatar script should load from the local host.');
 assert.ok((await avatarScript.text()).includes("new EventSource('/api/avatar/events')"),'OBS avatar must use the local event stream, not browser-profile messaging.');
 const avatarStream=await fetch(origin+'/api/avatar/events');
 assert.equal(avatarStream.status,200,'Local avatar event stream should connect.');
 assert.match(avatarStream.headers.get('content-type')||'',/text\/event-stream/);
 avatarReader=makeSseReader(avatarStream.body.getReader());
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'locked'},'Avatar stream must start in the locked state.');
 const home=await fetch(origin+'/');
 assert.equal(home.status,200,'Local creator homepage should load.');
 assert.match(home.headers.get('content-security-policy')||'',/default-src 'self'/,'Homepage must enforce a local-only CSP.');
 assert.ok((await home.text()).includes('<title>Magnanimous Portable Creator</title>'),'Homepage title should identify the portable app.');
 const homepage=await (await fetch(origin+'/')).text();
 assert.ok(homepage.includes('id="livePullButton"'),'Audience/game event review control should be present.');
 assert.ok(homepage.includes('id="liveEventList"'),'Audience/game event list should be present.');
 assert.ok(homepage.includes('id="bridgeConnectButton"'),'Secure online companion control should be present.');
 assert.ok(homepage.includes('id="bridgeCommandList"'),'Local remote-command approval queue should be present.');

 const css=await fetch(origin+'/styles.css');
 assert.equal(css.status,200,'Local stylesheet should load.');
 const health=await (await fetch(origin+'/api/health')).json();
 assert.equal(health.mode,'offline-portable');
 assert.equal(health.model.ready,false,'Local generation must remain disabled when no runtime is installed.');
 assert.equal((await post(origin+'/api/avatar/state',origin,{type:'line',text:'blocked'})).status,423,'Avatar speech state must remain locked before workspace unlock.');
 assert.equal((await post(origin+'/api/avatar/state','https://attacker.example',{type:'line',text:'blocked'})).status,403,'Cross-origin avatar state must be rejected.');
 const bridgeStatus=await (await fetch(origin+'/api/bridge/status')).json();
 assert.equal(bridgeStatus.status,'disconnected','Online bridge must start disconnected.');
 assert.equal((await post(origin+'/api/bridge/connect',origin,{endpoint:'https://attacker.example/socket',token:'A'.repeat(43)})).status,423,'A locked workspace must reject all online bridge attempts before validation or connection.');
 assert.equal((await post(origin+'/api/bridge/connect',origin,{endpoint:'wss://iammagnanimousway.com/api/live-bridge/ws/12345678-1234-1234-1234-123456789abc',token:'A'.repeat(43)})).status,423,'A valid bridge endpoint still requires the encrypted workspace to be unlocked.');
 assert.equal((await post(origin+'/api/bridge/command/review',origin,{commandId:'unknown',approved:true})).status,404,'Unknown remote commands must not execute.');
 const eventStatus=await (await fetch(origin+'/api/live/events/status')).json();
 assert.equal(eventStatus.queued,0,'Live event queue should start empty.');
 assert.equal((await post(origin+'/api/live/events/ingest',origin,{event:{protocolVersion:1,eventId:'locked',provider:'manual',type:'chat.message',occurredAt:new Date().toISOString(),text:'locked'}})).status,423,'Durable event intake must require the encrypted workspace to be unlocked.');
 assert.equal((await post(origin+'/api/bridge/connect',origin,{endpoint:'wss://iammagnanimousway.com/api/live-bridge/ws/00000000-0000-4000-8000-000000000000',token:'A'.repeat(43)})).status,423,'Online pairing must require the encrypted workspace to be unlocked.');
 assert.equal((await post(origin+'/api/bridge/command/review',origin,{commandId:'unknown',approved:true})).status,404,'Unknown remote commands must not execute.');
 const obsStatus=await (await fetch(origin+'/api/obs/status')).json();
 assert.equal(obsStatus.connected,false,'OBS must remain disconnected until the operator pairs it.');
 assert.equal((await fetch(origin+'/api/obs/scenes')).status,409,'OBS scene reads must fail closed before local pairing.');
 assert.equal((await fetch(origin+'/api/projects')).status,423,'Project data must remain locked before passphrase entry.');
 const wrongOrigin=await post(origin+'/api/vault/unlock','https://attacker.example',{passphrase:'this-is-a-long-test-passphrase'});
 assert.equal(wrongOrigin.status,403,'Cross-origin state changes must be rejected.');
 const noOrigin=await fetch(origin+'/api/vault/unlock',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({passphrase:'this-is-a-long-test-passphrase'})});
 assert.equal(noOrigin.status,403,'Origin-less browser mutations must be rejected.');
 const invalid=await post(origin+'/api/vault/unlock',origin,{passphrase:'short'});
 assert.equal(invalid.status,401,'Short passphrases must be rejected.');
 const passphrase='magnanimous-test-passphrase-2026';
 const created=await post(origin+'/api/vault/unlock',origin,{passphrase});
 assert.equal(created.status,200,'A new encrypted workspace should be created.');
 const createdData=await created.json();
 assert.equal(createdData.created,true);
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'ready'},'Unlocking the workspace must activate the local avatar stream.');
 const avatarLine=await post(origin+'/api/avatar/state',origin,{type:'line',text:'Hello'+String.fromCharCode(0)+' avatar'});
 assert.equal(avatarLine.status,200,'Unlocked host should publish a reviewed avatar line.');
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'line',text:'Hello avatar'},'Avatar stream must sanitize host text before broadcasting.');
 assert.equal((await post(origin+'/api/avatar/state',origin,{type:'speaking'})).status,200);
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'speaking'});
 const reconnectStream=await fetch(origin+'/api/avatar/events');
 assert.equal(reconnectStream.status,200,'A restarted OBS browser source should reconnect.');
 const reconnectReader=makeSseReader(reconnectStream.body.getReader());
 assert.deepEqual(JSON.parse((await reconnectReader.next()).slice(6)),{type:'line',text:'Hello avatar'},'A reconnecting avatar must recover the current caption.');
 assert.deepEqual(JSON.parse((await reconnectReader.next()).slice(6)),{type:'speaking'},'A reconnecting avatar must recover the current speaking state.');
 await reconnectReader.cancel();
 assert.equal((await post(origin+'/api/avatar/state',origin,{type:'stopped'})).status,200);
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'stopped'});
 const tokenReveal=await post(origin+'/api/integrations/game/token',origin,{});
 assert.equal(tokenReveal.status,200,'Same-origin workspace owner should be able to reveal a temporary local game token.');
 const gameTokenData=await tokenReveal.json();
 assert.match(gameTokenData.token,/^[A-Za-z0-9_-]{43}$/,'Game token must be 256-bit base64url.');
 assert.equal(gameTokenData.storage,'memory-only','Game token must never be persisted to disk.');
 const gameEvent={protocolVersion:1,eventId:'local-game-'+Date.now(),occurredAt:new Date().toISOString(),gameName:'QA Game',actorName:'QA Game Event',text:'A level was completed'};
 const localGamePost=(token,event)=>fetch(origin+'/api/integrations/game/event',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({event})});
 assert.equal((await localGamePost('A'.repeat(43),gameEvent)).status,401,'Invalid local integration token must be rejected.');
 assert.equal((await post(origin+'/api/integrations/game/event','https://attacker.example',{event:gameEvent})).status,403,'Cross-origin local game integration requests must be rejected.');
 const acceptedGameEvent=await localGamePost(gameTokenData.token,gameEvent);
 assert.equal(acceptedGameEvent.status,202,'A valid local authenticated game event should enter the encrypted event queue.');
 const gameBatch=await (await post(origin+'/api/live/events/consume',origin,{limit:1})).json();
 assert.equal(gameBatch.events[0].provider,'game','Local game integration must be normalized to the game provider.');
 assert.equal(gameBatch.events[0].type,'game.event','Local game integration must accept only game event types.');
 assert.equal(gameBatch.events[0].tags.gameName,'QA Game','Game name should be retained as a bounded safe tag.');
 assert.ok(gameBatch.deliveryId,'Game event batch must have a delivery lease.');
 assert.equal((await post(origin+'/api/live/events/ack',origin,{deliveryId:gameBatch.deliveryId,eventKeys:gameBatch.eventKeys})).status,200,'Game event batch must be acknowledged after review.');

 const invalidBridge=await post(origin+'/api/bridge/connect',origin,{endpoint:'https://attacker.example/socket',token:'A'.repeat(43)});
 assert.equal(invalidBridge.status,400,'Companion must reject non-WSS and non-Magnanimous endpoints.');
 const liveEvent={protocolVersion:1,eventId:'runtime-'+Date.now(),provider:'manual',type:'chat.message',occurredAt:new Date().toISOString(),actorName:'QA viewer',text:'Hello Magnanimous'};
 const spoofedEvent=await post(origin+'/api/live/events/ingest',origin,{event:{...liveEvent,eventId:'spoof-'+Date.now(),provider:'tiktok'}});
 assert.equal(spoofedEvent.status,403,'Browser intake must reject provider-labelled events without authenticated companion adapters.');
 const acceptedEvent=await post(origin+'/api/live/events/ingest',origin,{event:liveEvent});
 assert.equal(acceptedEvent.status,202,'Valid local live event should be accepted.');
 const duplicateEvent=await post(origin+'/api/live/events/ingest',origin,{event:liveEvent});
 assert.equal(duplicateEvent.status,200,'Repeated provider event should be deduplicated.');
 const spoofedProvider=await post(origin+'/api/live/events/ingest',origin,{event:{...liveEvent,eventId:liveEvent.eventId+'-spoof',provider:'tiktok'}});
 assert.equal(spoofedProvider.status,403,'Browser intake must not impersonate a platform adapter.');
 const consumedEvents=await post(origin+'/api/live/events/consume',origin,{limit:1});
 const consumedData=await consumedEvents.json();
 assert.equal(consumedData.events.length,1,'Operator consumer should receive one bounded event.');
 assert.equal(consumedData.events[0].text,'Hello Magnanimous');
 assert.equal(consumedData.reviewCues.length,1,'Director should return one review cue for the event.');
 assert.equal(consumedData.reviewCues[0].requiresOperatorApproval,true,'Director cue must require operator approval.');
 assert.equal(consumedData.reviewCues[0].action,'review-only','Director cue must never execute an action.');
 assert.ok(consumedData.deliveryId,'Claimed event batch must include a delivery ID.');
 assert.deepEqual(consumedData.eventKeys,['manual:'+liveEvent.eventId],'Claimed batch must use provider-scoped event keys.');
 const duplicateClaim=await post(origin+'/api/live/events/consume',origin,{limit:1});
 assert.equal((await duplicateClaim.json()).events.length,0,'An unexpired delivery lease must prevent duplicate concurrent delivery.');
 const ack=await post(origin+'/api/live/events/ack',origin,{deliveryId:consumedData.deliveryId,eventKeys:consumedData.eventKeys});
 assert.equal(ack.status,200,'Events should be acknowledged after the local UI renders them.');
 const duplicateAck=await post(origin+'/api/live/events/ack',origin,{deliveryId:consumedData.deliveryId,eventKeys:consumedData.eventKeys});
 assert.equal(duplicateAck.status,200,'Repeated event acknowledgements must be idempotent.');
 assert.equal((await (await fetch(origin+'/api/live/events/status')).json()).queued,0,'Acknowledged events should leave the durable queue.');
 const journalPath=path.join(target,'data','live-events.jsonl');
 assert.ok(fs.existsSync(journalPath),'Accepted events must be persisted in the USB recovery journal.');
 const rawJournal=fs.readFileSync(journalPath,'utf8');
 assert.equal(rawJournal.includes('Hello Magnanimous'),false,'Viewer messages must never be written to the journal as plaintext.');
 const vaultEnvelope=JSON.parse(fs.readFileSync(path.join(target,'data','vault.enc'),'utf8'));
 const vaultKey=crypto.scryptSync(passphrase,Buffer.from(vaultEnvelope.salt,'hex'),32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 const journal=new LiveEventJournal(journalPath,{keyProvider:()=>crypto.createHmac('sha256',vaultKey).update('magnanimous-live-event-journal-v1').digest()});
 const journalRecords=journal.load();
 assert.ok(journalRecords.some(record=>record.kind==='event'),'Encrypted journal should contain the accepted event.');
 assert.ok(journalRecords.some(record=>record.kind==='ack'),'Encrypted journal should contain the durable acknowledgement.');
 vaultKey.fill(0);

 const saved=await post(origin+'/api/projects',origin,{title:'Portable rehearsal',type:'live-show',content:'Private project body that must be encrypted at rest.'});
 assert.equal(saved.status,201,'Project should be saved into encrypted storage.');
 const vaultPath=path.join(target,'data','vault.enc');
 const encrypted=fs.readFileSync(vaultPath,'utf8');
 assert.ok(encrypted.length>100,'Encrypted vault envelope should be written to USB data path.');
 assert.ok(!encrypted.includes('Private project body that must be encrypted at rest.'),'Project body must not appear as plaintext in the vault.');
 assert.ok(!encrypted.includes('magnanimous-test-passphrase-2026'),'Passphrase must not be written into the vault.');
 const projects=await (await fetch(origin+'/api/projects')).json();
 assert.equal(projects.projects.length,1);
 assert.equal(projects.projects[0].title,'Portable rehearsal');
 assert.equal(projects.projects[0].content,'Private project body that must be encrypted at rest.');
 assert.equal((await post(origin+'/api/vault/lock',origin,{})).status,200);
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'locked'},'Locking the workspace must stop and clear the OBS avatar stream.');
 assert.equal((await localGamePost(gameTokenData.token,gameEvent)).status,423,'Workspace lock must revoke game integration access.');
 assert.equal((await fetch(origin+'/api/projects')).status,423,'Locked vault must not expose saved projects.');
 const wrong=await post(origin+'/api/vault/unlock',origin,{passphrase:'a-different-long-passphrase'});
 assert.equal(wrong.status,401,'Wrong passphrase must fail authenticated decryption.');
 const relocked=await (await fetch(origin+'/api/vault/status')).json();
 assert.equal(relocked.unlocked,false,'Failed unlock must leave the vault locked.');
 assert.equal((await fetch(origin+'/api/projects')).status,423,'Wrong passphrase must not restore access.');
 const unlocked=await post(origin+'/api/vault/unlock',origin,{passphrase});
 assert.equal(unlocked.status,200,'Correct passphrase should unlock saved workspace.');
 assert.deepEqual(JSON.parse((await avatarReader.next()).slice(6)),{type:'ready'},'A later unlock should restore the avatar stream.');
 assert.equal((await localGamePost(gameTokenData.token,gameEvent)).status,401,'Old local game token must remain revoked after a later unlock.');
 const nextGameToken=await (await post(origin+'/api/integrations/game/token',origin,{})).json();
 assert.notEqual(nextGameToken.token,gameTokenData.token,'A fresh workspace unlock must issue a new game integration token.');
 const afterUnlock=await (await fetch(origin+'/api/projects')).json();
 assert.equal(afterUnlock.projects[0].title,'Portable rehearsal','Saved project should survive lock and unlock.');
 const noModel=await post(origin+'/api/chat',origin,{prompt:'Write a short livestream welcome.'});
 assert.equal(noModel.status,503,'No cloud fallback is allowed when local model is absent.');
 const oversized=await fetch(origin+'/api/vault/unlock',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({passphrase:'x'.repeat(1100000)})});
 assert.equal(oversized.status,413,'Request bodies above the local limit should be rejected.');
 const wrongHost=await new Promise((resolve,reject)=>{
  const request=http.request({hostname:'127.0.0.1',port,path:'/api/health',method:'GET',headers:{host:'localhost:'+port}},response=>{
   let body='';response.setEncoding('utf8');response.on('data',chunk=>body+=chunk);response.on('end',()=>resolve({status:response.statusCode,body}));
  });
  request.on('error',reject);request.end();
 });
 assert.equal(wrongHost.status,403,'Host-header rebinding should be rejected.');
 console.log('PASS portable local host and UI');
 console.log('PASS local-only model fail-closed behavior');
 console.log('PASS loopback and same-origin request boundaries');
 console.log('PASS encrypted vault create/save/lock/wrong-key/reopen');
 console.log('PASS plaintext project and passphrase absent from vault');
 console.log('PASS bounded request and no cloud fallback');
 console.log('Magnanimous Portable Creator runtime tests passed.');
}catch(error){
 console.error(error);
 if(stderr.trim())console.error(stderr.slice(-4000));
 process.exitCode=1;
}finally{
 if(avatarReader)await avatarReader.cancel().catch(()=>{});
 child.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>child.once('exit',resolve)),wait(1500)]);
 fs.rmSync(temp,{recursive:true,force:true});
}

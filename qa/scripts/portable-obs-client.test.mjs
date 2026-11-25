import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ObsWebSocketClient } from '../../portable-creator/obs-client.mjs';

const sha=value=>createHash('sha256').update(value).digest();
const expectedAuth=password=>{
 const secret=sha(password+'salt-value').toString('base64');
 return sha(secret+'challenge-value').toString('base64');
};
class FakeWebSocket {
 static last=null;
 constructor(url){
  this.url=url;this.readyState=0;this.listeners={};this.sent=[];FakeWebSocket.last=this;
  queueMicrotask(()=>{this.readyState=1;this.emit('open',{});this.emit('message',{data:JSON.stringify({op:0,d:{rpcVersion:1,authentication:{salt:'salt-value',challenge:'challenge-value'}}})});});
 }
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 emit(name,event){for(const fn of this.listeners[name]||[])fn(event);}
 send(raw){
  const packet=JSON.parse(raw);this.sent.push(packet);
  if(packet.op===1){
   queueMicrotask(()=>this.emit('message',{data:JSON.stringify({op:2,d:{negotiatedRpcVersion:1}})}));
   return;
  }
  if(packet.op===6){
   const {requestId,requestType}=packet.d;
   let responseData={};
   if(requestType==='GetSceneList')responseData={scenes:[{sceneName:'Starting Soon'},{sceneName:'Main Show'}],currentProgramSceneName:'Starting Soon'};
   if(requestType==='GetInputList')responseData={inputs:[]};
   if(requestType==='CreateInput')responseData={inputUuid:'avatar-source-1'};
   if(requestType==='GetRecordStatus')responseData={outputActive:true,outputPaused:false};
   if(requestType==='StopRecord')responseData={outputPath:'F:/Creator/recording.mkv'};
   queueMicrotask(()=>this.emit('message',{data:JSON.stringify({op:7,d:{requestId,requestStatus:{result:true},responseData}})}));
  }
 }
 close(){if(this.readyState>=2)return;this.readyState=3;queueMicrotask(()=>this.emit('close',{}));}
}
const client=new ObsWebSocketClient({WebSocketImpl:FakeWebSocket,timeoutMs:100});
const connected=await client.connect('test-password');
assert.equal(connected.connected,true);
assert.equal(FakeWebSocket.last.url,'ws://127.0.0.1:4455');
const identify=FakeWebSocket.last.sent.find(packet=>packet.op===1);
assert.equal(identify.d.authentication,expectedAuth('test-password'));
assert.equal(identify.d.eventSubscriptions,0,'The adapter must not subscribe to unneeded OBS events.');
const scenes=await client.getScenes();
assert.deepEqual(scenes.scenes.map(scene=>scene.sceneName),['Starting Soon','Main Show']);
assert.equal(scenes.currentProgramSceneName,'Starting Soon');
await client.setProgramScene('Main Show');
await assert.rejects(()=>client.setProgramScene('Unknown Scene'),/not in the current OBS scene list/);
const avatar=await client.createHostAvatarSource({sceneName:'Main Show',url:'http://127.0.0.1:3219/avatar.html',width:1080,height:1920});
assert.equal(avatar.created,true);
assert.equal(avatar.sourceName,'Magnanimous AI Host Avatar');
const avatarRequest=FakeWebSocket.last.sent.find(packet=>packet.op===6&&packet.d.requestType==='CreateInput');
assert.equal(avatarRequest.d.requestData.inputKind,'browser_source');
assert.equal(avatarRequest.d.requestData.inputSettings.url,'http://127.0.0.1:3219/avatar.html');
assert.equal(avatarRequest.d.requestData.sceneName,'Main Show');
await assert.rejects(()=>client.createHostAvatarSource({sceneName:'Main Show',url:'https://attacker.example/avatar.html'}),/Only the local 127.0.0.1/);

await client.startRecording();
const status=await client.getRecordStatus();
assert.equal(status.outputActive,true);
const stopped=await client.stopRecording();
assert.equal(stopped.outputPath,'F:/Creator/recording.mkv');
client.disconnect();
assert.equal(client.connected,false);
console.log('PASS OBS WebSocket authentication challenge');
console.log('PASS loopback-only endpoint and scene discovery');
console.log('PASS allowlisted scene switch and invalid-scene rejection');
console.log('PASS local-only OBS avatar browser source and remote URL rejection');
console.log('PASS recording start/status/stop requests');
console.log('PASS explicit disconnect clears connection state');

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
   if(requestType==='GetRecordStatus')responseData={outputActive:true,outputPaused:false};
   if(requestType==='StopRecord')responseData={outputPath:'F:/Creator/recording.mkv'};
   queueMicrotask(()=>this.emit('message',{data:JSON.stringify({op:7,d:{requestId,requestStatus:{result:true},responseData}})}));
  }
 }
 close(){if(this.readyState>=2)return;this.readyState=3;queueMicrotask(()=>this.emit('close',{}));}
}
const receivedEvents=[];\nconst client=new ObsWebSocketClient({WebSocketImpl:FakeWebSocket,timeoutMs:100,onEvent:(type,data)=>receivedEvents.push({type,data})});
const connected=await client.connect('test-password');
assert.equal(connected.connected,true);
assert.equal(FakeWebSocket.last.url,'ws://127.0.0.1:4455');
const identify=FakeWebSocket.last.sent.find(packet=>packet.op===1);
assert.equal(identify.d.authentication,expectedAuth('test-password'));
assert.equal(identify.d.eventSubscriptions,68,'The adapter subscribes only to OBS scene and output state events.');\nFakeWebSocket.last.emit('message',{data:JSON.stringify({op:5,d:{eventType:'CurrentProgramSceneChanged',eventData:{sceneName:'Main Show'}}})});\nassert.deepEqual(receivedEvents,[{type:'CurrentProgramSceneChanged',data:{sceneName:'Main Show'}}]);
const scenes=await client.getScenes();
assert.deepEqual(scenes.scenes.map(scene=>scene.sceneName),['Starting Soon','Main Show']);
assert.equal(scenes.currentProgramSceneName,'Starting Soon');
await client.setProgramScene('Main Show');
await assert.rejects(()=>client.setProgramScene('Unknown Scene'),/not in the current OBS scene list/);
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
console.log('PASS recording start/status/stop requests');
console.log('PASS bounded OBS scene/output event subscription and delivery');\nconsole.log('PASS explicit disconnect clears connection state');

import { createHash } from 'node:crypto';

const LOOPBACK_HOST='127.0.0.1';
const DEFAULT_PORT=4455;
const OPEN=1;

function sha256(value){return createHash('sha256').update(value).digest();}
function authentication(password,salt,challenge){
 const secret=sha256(password+salt).toString('base64');
 return sha256(secret+challenge).toString('base64');
}
function messageData(event){
 const value=event?.data;
 if(typeof value==='string')return value;
 if(value instanceof ArrayBuffer)return Buffer.from(value).toString('utf8');
 if(ArrayBuffer.isView(value))return Buffer.from(value.buffer,value.byteOffset,value.byteLength).toString('utf8');
 return String(value??'');
}

export class ObsWebSocketClient {
 constructor({WebSocketImpl=globalThis.WebSocket,port=DEFAULT_PORT,timeoutMs=5000}={}){
  if(typeof WebSocketImpl!=='function')throw new Error('This Node runtime does not provide a WebSocket client.');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('OBS WebSocket port is invalid.');
  this.WebSocketImpl=WebSocketImpl;
  this.port=port;
  this.timeoutMs=timeoutMs;
  this.socket=null;
  this.connected=false;
  this.rpcVersion=null;
  this.pending=new Map();
  this.sequence=0;
  this.connectTimer=null;
 }
 async connect(password=''){
  if(this.connected)return {connected:true,rpcVersion:this.rpcVersion};
  if(typeof password!=='string'||password.length>512)throw new Error('OBS password is invalid.');
  let secret=password;
  const socket=new this.WebSocketImpl('ws://'+LOOPBACK_HOST+':'+this.port);
  this.socket=socket;
  return await new Promise((resolve,reject)=>{
   let settled=false;
   const finish=(error,value)=>{
    if(settled)return;
    settled=true;
    clearTimeout(this.connectTimer);
    if(error){this.connected=false;try{socket.close();}catch{};reject(error);}
    else resolve(value);
   };
   this.connectTimer=setTimeout(()=>finish(new Error('OBS did not complete its WebSocket handshake in time.')),this.timeoutMs);
   socket.addEventListener('open',()=>{}, {once:true});
   socket.addEventListener('error',()=>finish(new Error('Could not connect to OBS. Check that OBS is open and WebSocket Server is enabled.')));
   socket.addEventListener('close',()=>{this.connected=false;for(const [id,p] of this.pending){clearTimeout(p.timer);p.reject(new Error('OBS WebSocket disconnected.'));this.pending.delete(id);}if(!settled)finish(new Error('OBS closed the WebSocket connection before pairing completed.'));});
   socket.addEventListener('message',event=>{
    let packet;
    try{packet=JSON.parse(messageData(event));}catch{finish(new Error('OBS sent an invalid WebSocket message.'));return;}
    if(packet.op===0){
     const hello=packet.d||{};
     const identify={rpcVersion:1,eventSubscriptions:0};
     if(hello.authentication){
      if(!secret){finish(new Error('OBS requires its WebSocket password.'));return;}
      identify.authentication=authentication(secret,String(hello.authentication.salt||''),String(hello.authentication.challenge||''));
     }
     secret='';
     try{socket.send(JSON.stringify({op:1,d:identify}));}
     catch{finish(new Error('Could not identify with OBS.')); }
     return;
    }
    if(packet.op===2){
     this.connected=true;this.rpcVersion=packet.d?.negotiatedRpcVersion||1;
     finish(null,{connected:true,rpcVersion:this.rpcVersion});return;
    }
    if(packet.op===7){
     const pending=this.pending.get(packet.d?.requestId);
     if(!pending)return;
     this.pending.delete(packet.d.requestId);clearTimeout(pending.timer);
     if(packet.d?.requestStatus?.result===false)pending.reject(new Error(String(packet.d.requestStatus.comment||'OBS rejected the request.')));
     else pending.resolve(packet.d?.responseData||{});
    }
   });
  });
 }
 request(requestType,requestData={}){
  if(!this.connected||!this.socket||this.socket.readyState!==OPEN)return Promise.reject(new Error('Connect to OBS first.'));
  const requestId='magnanimous-'+(++this.sequence);
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(requestId);reject(new Error('OBS request timed out: '+requestType));},this.timeoutMs);
   this.pending.set(requestId,{resolve,reject,timer});
   try{this.socket.send(JSON.stringify({op:6,d:{requestType,requestId,requestData}}));}
   catch(error){clearTimeout(timer);this.pending.delete(requestId);reject(new Error('Could not send the OBS request.'));}
  });
 }
 async getScenes(){
  const data=await this.request('GetSceneList');
  return {scenes:(data.scenes||[]).map(scene=>({sceneName:String(scene.sceneName||'').slice(0,128)})).filter(scene=>scene.sceneName),currentProgramSceneName:String(data.currentProgramSceneName||'')};
 }
 async setProgramScene(sceneName){
  if(typeof sceneName!=='string'||!sceneName.trim()||sceneName.length>128)throw new Error('Choose a valid OBS scene.');
  const {scenes}=await this.getScenes();
  if(!scenes.some(scene=>scene.sceneName===sceneName))throw new Error('That scene is not in the current OBS scene list.');
  await this.request('SetCurrentProgramScene',{sceneName});
  return {sceneName};
 }
 startRecording(){return this.request('StartRecord');}
 stopRecording(){return this.request('StopRecord');}
 async getRecordStatus(){return await this.request('GetRecordStatus');}
 disconnect(){
  this.connected=false;
  for(const [id,p] of this.pending){clearTimeout(p.timer);p.reject(new Error('OBS connection closed.'));this.pending.delete(id);}
  const socket=this.socket;this.socket=null;
  if(socket&&socket.readyState<2){try{socket.close();}catch{}}
 }
}

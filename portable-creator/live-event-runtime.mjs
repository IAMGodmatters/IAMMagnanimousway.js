const PROVIDERS=new Set(['manual','tiktok','facebook','youtube','twitch','zoom','obs','game','browser']);
const TYPES=new Set(['chat.message','chat.deleted','audience.follow','audience.subscription','audience.gift','audience.poll_vote','game.event','obs.scene_changed','system.notice']);
const EVENT_ID=/^[A-Za-z0-9._:-]{1,160}$/;
const SAFE_TAG=/^[a-zA-Z][a-zA-Z0-9_.-]{0,39}$/;
const CONTROL=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SENSITIVE=/(token|secret|password|cookie|authorization|credential)/i;
function clean(value,max){if(typeof value!=='string')return undefined;const result=value.replace(CONTROL,'').trim().slice(0,max);return result||undefined;}
function normalize(input,now){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const v=input;
 if(v.protocolVersion!==1||typeof v.eventId!=='string'||!EVENT_ID.test(v.eventId)||!PROVIDERS.has(v.provider)||!TYPES.has(v.type))return null;
 const stamp=typeof v.occurredAt==='string'?Date.parse(v.occurredAt):NaN;
 if(Number.isFinite(stamp)&&(stamp>now+5*60_000||stamp<now-7*86400_000))return null;
 const event={protocolVersion:1,eventId:v.eventId,provider:v.provider,type:v.type,occurredAt:Number.isFinite(stamp)?new Date(stamp).toISOString():new Date(now).toISOString(),receivedAt:new Date(now).toISOString()};
 for(const [field,max] of [['roomId',120],['actorId',120],['actorName',80],['text',500]]){const value=clean(v[field],max);if(value)event[field]=value;}
 if(typeof v.amount==='number'&&Number.isFinite(v.amount)&&v.amount>=0&&v.amount<=1_000_000)event.amount=v.amount;
 if(typeof v.currency==='string'&&/^[A-Z]{3}$/.test(v.currency))event.currency=v.currency;
 if(v.tags&&typeof v.tags==='object'&&!Array.isArray(v.tags)){const tags={};for(const [key,value] of Object.entries(v.tags).slice(0,8)){if(!SAFE_TAG.test(key)||SENSITIVE.test(key))continue;if(typeof value==='string')tags[key]=value.replace(CONTROL,'').slice(0,120);else if(typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value)))tags[key]=value;}if(Object.keys(tags).length)event.tags=tags;}
 if(event.type==='chat.message'&&!event.text)return null;
 return event;
}
export class LiveEventRuntime{
 constructor({maxQueue=200,maxSeen=5000,rateLimitPerMinute=120,now=Date.now,onAccept=()=>{},onConsume=()=>{}}={}){
  this.maxQueue=Math.max(1,Math.min(2000,maxQueue));this.maxSeen=Math.max(100,Math.min(20000,maxSeen));this.rateLimitPerMinute=Math.max(1,Math.min(1000,rateLimitPerMinute));this.now=now;this.onAccept=onAccept;this.onConsume=onConsume;this.queue=[];this.seen=new Map();this.windows=new Map();
 }
 ingest(input,{persist=true,bypassRateLimit=false}={}){
  const now=this.now(),event=normalize(input,now);if(!event)return{status:'invalid',detail:'Event failed protocol, timestamp or content validation.'};
  const key=event.provider+':'+event.eventId;
  if(this.seen.has(key))return{status:'duplicate',eventId:event.eventId};
  const window=this.windows.get(event.provider);
  if(!bypassRateLimit&&window&&now-window.startedAt<60_000&&window.count>=this.rateLimitPerMinute)return{status:'rate_limited',detail:'Provider event rate limit reached.'};
  if(this.queue.length>=this.maxQueue)return{status:'queue_full',detail:'Event queue is full; backpressure applied without dropping queued events.'};
  if(persist){try{this.onAccept(event);}catch{return{status:'persistence_error',detail:'The event could not be safely written to the recovery journal.'};}}
  if(!window||now-window.startedAt>=60_000)this.windows.set(event.provider,{startedAt:now,count:1});else window.count++;
  this.seen.set(key,now);
  while(this.seen.size>this.maxSeen)this.seen.delete(this.seen.keys().next().value);
  this.queue.push(event);
  return{status:'accepted',eventId:event.eventId,queued:this.queue.length};
 }
 consume(limit=10){
  const count=Math.max(1,Math.min(50,Number.isInteger(limit)?limit:10));
  const batch=this.queue.slice(0,count);
  if(batch.length)this.onConsume(batch);
  return this.queue.splice(0,batch.length);
 }
 restore(records){
  if(!Array.isArray(records))return{restored:0,acknowledged:0};
  let restored=0,acknowledged=0;
  for(const record of records){
   if(record?.kind==='event'&&record.event){const result=this.ingest(record.event,{persist:false,bypassRateLimit:true});if(result.status==='accepted')restored++;}
   else if(record?.kind==='ack'&&Array.isArray(record.keys)){const keys=new Set(record.keys);for(let i=this.queue.length-1;i>=0;i--){const event=this.queue[i];if(keys.has(event.provider+':'+event.eventId)){this.queue.splice(i,1);acknowledged++;}}}
   else if(record?.kind==='seen'&&Array.isArray(record.keys)){for(const key of record.keys){if(typeof key==='string'&&key.length<=250){this.seen.set(key,this.now());if(this.seen.size>this.maxSeen)this.seen.delete(this.seen.keys().next().value);}}}
  }
  return{restored,acknowledged};
 }
 snapshotSeen(){return[...this.seen.keys()];}
 status(){return{queued:this.queue.length,capacity:this.maxQueue,deduplicationEntries:this.seen.size,providers:[...this.windows.keys()]};}
 clear(){this.queue.length=0;this.seen.clear();this.windows.clear();}
}

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_RECORD_BYTES=32*1024;
const DEFAULT_MAX_BYTES=8*1024*1024;

export class LiveEventJournal{
 constructor(filePath,{maxBytes=DEFAULT_MAX_BYTES,keyProvider=()=>null}={}){
  this.filePath=path.resolve(filePath);
  this.maxBytes=Math.max(64*1024,Math.min(64*1024*1024,maxBytes));
  this.keyProvider=keyProvider;
  fs.mkdirSync(path.dirname(this.filePath),{recursive:true});
 }
 getKey(){
  const key=this.keyProvider();
  if(!Buffer.isBuffer(key)||key.length!==32)throw new Error('Unlock the encrypted workspace before using durable live-event recovery.');
  const copy=Buffer.from(key);key.fill(0);return copy;
 }
 encode(record){
  const key=this.getKey(),iv=crypto.randomBytes(12);
  try{
   const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
   const plain=Buffer.from(JSON.stringify({version:1,...record}),'utf8');
   try{
    const ciphertext=Buffer.concat([cipher.update(plain),cipher.final()]);
    return JSON.stringify({version:1,cipher:'aes-256-gcm',iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('base64')});
   }finally{plain.fill(0);}
  }finally{key.fill(0);}
 }
 decode(envelope){
  if(envelope?.version!==1)return null;
  if(envelope?.cipher!=='aes-256-gcm'||typeof envelope.iv!=='string'||typeof envelope.tag!=='string'||typeof envelope.ciphertext!=='string')throw new Error('The live-event journal uses an unsupported or incomplete encryption format.');
  const iv=Buffer.from(envelope.iv,'hex'),tag=Buffer.from(envelope.tag,'hex'),ciphertext=Buffer.from(envelope.ciphertext,'base64');
  if(iv.length!==12||tag.length!==16||ciphertext.length>MAX_RECORD_BYTES)throw new Error('The encrypted live-event journal contains an invalid record.');
  const key=this.getKey();
  try{
   const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
   decipher.setAuthTag(tag);
   const plain=Buffer.concat([decipher.update(ciphertext),decipher.final()]);
   try{
    const record=JSON.parse(plain.toString('utf8'));
    if(record?.version!==1)return null;
    if(record.kind==='event'&&record.event&&typeof record.event==='object')return record;
    if(record.kind==='ack'&&Array.isArray(record.keys))return record;
    if(record.kind==='seen'&&Array.isArray(record.keys))return record;
    return null;
   }finally{plain.fill(0);}
  }catch{
   throw new Error('The encrypted live-event journal could not be unlocked or verified with this workspace key.');
  }finally{key.fill(0);}
 }
 load(){
  if(!fs.existsSync(this.filePath))return[];
  const source=fs.readFileSync(this.filePath,'utf8'),records=[];
  let legacyDetected=false;
  for(const line of source.split(/\r?\n/)){
   if(!line||Buffer.byteLength(line,'utf8')>MAX_RECORD_BYTES)continue;
   let envelope;try{envelope=JSON.parse(line);}catch{continue;}
   if(envelope?.version===1&&!envelope.cipher&&(envelope.kind==='event'||envelope.kind==='ack')){
    legacyDetected=true;
    if(envelope.kind==='event'&&envelope.event&&typeof envelope.event==='object')records.push({version:1,kind:'event',event:envelope.event});
    else if(envelope.kind==='ack'&&Array.isArray(envelope.keys))records.push({version:1,kind:'ack',keys:envelope.keys});
    continue;
   }
   const record=this.decode(envelope);
   if(record)records.push(record);
  }
  if(legacyDetected)this.rewriteEncrypted(records);
  return records;
 }
 rewriteEncrypted(records){
  const lines=records.map(record=>this.encode(record));
  const payload=lines.join('\n')+(lines.length?'\n':'');
  if(Buffer.byteLength(payload,'utf8')>this.maxBytes)throw new Error('Legacy live-event journal is larger than the encrypted recovery limit. Export it before continuing.');
  const temporary=this.filePath+'.migrate-'+crypto.randomBytes(6).toString('hex');
  const fd=fs.openSync(temporary,'wx');
  try{fs.writeSync(fd,payload,null,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(temporary,this.filePath);}catch(error){try{fs.unlinkSync(temporary);}catch{}throw error;}
 }
 sizeBytes(){return fs.existsSync(this.filePath)?fs.statSync(this.filePath).size:0;}
 needsCompaction(){return this.sizeBytes()>Math.floor(this.maxBytes*0.5);}
 compact(events,seenKeys=[]){
  if(!Array.isArray(events)||!Array.isArray(seenKeys))throw new TypeError('Compaction requires the remaining event queue and deduplication keys.');
  const records=events.map(event=>({kind:'event',event}));
  for(let i=0;i<seenKeys.length;i+=100)records.push({kind:'seen',keys:seenKeys.slice(i,i+100)});
  const lines=records.map(record=>this.encode(record));
  const payload=lines.join('\n')+(lines.length?'\n':'');
  if(Buffer.byteLength(payload,'utf8')>this.maxBytes)throw new Error('The remaining event queue is larger than the recovery journal limit.');
  const temporary=this.filePath+'.compact-'+crypto.randomBytes(6).toString('hex');
  const fd=fs.openSync(temporary,'wx');
  try{fs.writeSync(fd,payload,null,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(temporary,this.filePath);}catch(error){try{fs.unlinkSync(temporary);}catch{}throw error;}
 }
 append(records){
  if(!Array.isArray(records)||records.length===0)return;
  const lines=records.map(record=>this.encode(record));
  if(lines.some(line=>Buffer.byteLength(line,'utf8')>MAX_RECORD_BYTES))throw new Error('An event is too large for the recovery journal.');
  const payload=lines.join('\n')+'\n';
  const currentSize=fs.existsSync(this.filePath)?fs.statSync(this.filePath).size:0;
  if(currentSize+Buffer.byteLength(payload,'utf8')>this.maxBytes)throw new Error('The event recovery journal reached its safety limit. Export or archive the workspace before continuing.');
  const fd=fs.openSync(this.filePath,'a');
  try{fs.writeSync(fd,payload,null,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 appendEvent(event){this.append([{kind:'event',event}]);}
 appendAcks(events){
  const keys=events.map(event=>String(event.provider)+':'+String(event.eventId)),records=[];
  for(let i=0;i<keys.length;i+=100)records.push({kind:'ack',keys:keys.slice(i,i+100)});
  this.append(records);
 }
}

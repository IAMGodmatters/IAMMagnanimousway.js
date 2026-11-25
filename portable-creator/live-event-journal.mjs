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
  const size=fs.statSync(this.filePath).size;
  if(size>this.maxBytes)throw new Error('The encrypted live-event journal exceeds its configured recovery size. Existing data was preserved.');
  const source=fs.readFileSync(this.filePath,'utf8'),records=[];
  const completeEnd=source.lastIndexOf('\n'),truncatedTail=completeEnd!==source.length-1;
  const lines=source.slice(0,completeEnd+1).split(/\r?\n/);
  let legacyDetected=false;
  for(const line of lines){
   if(!line)continue;
   if(Buffer.byteLength(line,'utf8')>MAX_RECORD_BYTES)throw new Error('The live-event journal contains an oversized record. Existing data was preserved.');
   let envelope;try{envelope=JSON.parse(line);}catch{throw new Error('The live-event journal contains a malformed complete record. Existing data was preserved.');}
   if(envelope?.version===1&&!envelope.cipher&&(envelope.kind==='event'||envelope.kind==='ack')){
    legacyDetected=true;
    if(envelope.kind==='event'&&envelope.event&&typeof envelope.event==='object')records.push({version:1,kind:'event',event:envelope.event});
    else if(envelope.kind==='ack'&&Array.isArray(envelope.keys))records.push({version:1,kind:'ack',keys:envelope.keys});
    else throw new Error('The legacy live-event journal contains an invalid record. Existing data was preserved.');
    continue;
   }
   const record=this.decode(envelope);
   if(!record)throw new Error('The live-event journal contains an unsupported record. Existing data was preserved.');
   records.push(record);
  }
  if(legacyDetected||truncatedTail)this.rewriteEncrypted(records);
  return records;
 }
 rewriteEncrypted(records){
  const lines=records.map(record=>this.encode(record));
  const payload=lines.join('\n')+(lines.length?'\n':'');
  if(Buffer.byteLength(payload,'utf8')>this.maxBytes)throw new Error('Legacy live-event journal is larger than the encrypted recovery limit. Export it before continuing.');
  const temporary=this.filePath+'.migrate-'+crypto.randomBytes(6).toString('hex');
  const fd=fs.openSync(temporary,'wx',0o600);
  try{const bytes=Buffer.from(payload,'utf8');let offset=0;while(offset<bytes.length){const written=fs.writeSync(fd,bytes,offset,bytes.length-offset);if(written<=0)throw new Error('Journal migration write did not make progress.');offset+=written;}fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(temporary,this.filePath);this.syncDirectory();}catch(error){try{fs.unlinkSync(temporary);}catch{}throw error;}
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
  const fd=fs.openSync(temporary,'wx',0o600);
  try{const bytes=Buffer.from(payload,'utf8');let offset=0;while(offset<bytes.length){const written=fs.writeSync(fd,bytes,offset,bytes.length-offset);if(written<=0)throw new Error('Journal compaction write did not make progress.');offset+=written;}fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(temporary,this.filePath);this.syncDirectory();}catch(error){try{fs.unlinkSync(temporary);}catch{}throw error;}
 }
 syncDirectory(){try{const fd=fs.openSync(path.dirname(this.filePath),'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}catch{/* Some filesystems, including Windows, do not expose directory fsync. */}}
 repairTrailingPartial(){
  if(!fs.existsSync(this.filePath))return;
  const data=fs.readFileSync(this.filePath);
  if(!data.length||data[data.length-1]===10)return;
  const lastNewline=data.lastIndexOf(10),fd=fs.openSync(this.filePath,'r+');
  try{fs.ftruncateSync(fd,lastNewline+1);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 append(records){
  if(!Array.isArray(records)||records.length===0)return;
  this.repairTrailingPartial();
  const lines=records.map(record=>this.encode(record));
  if(lines.some(line=>Buffer.byteLength(line,'utf8')>MAX_RECORD_BYTES))throw new Error('An event is too large for the recovery journal.');
  const payload=lines.join('\n')+'\n';
  const currentSize=fs.existsSync(this.filePath)?fs.statSync(this.filePath).size:0;
  if(currentSize+Buffer.byteLength(payload,'utf8')>this.maxBytes)throw new Error('The event recovery journal reached its safety limit. Export or archive the workspace before continuing.');
  const existed=fs.existsSync(this.filePath),fd=fs.openSync(this.filePath,'a',0o600);
  try{const bytes=Buffer.from(payload,'utf8');let offset=0;while(offset<bytes.length){const written=fs.writeSync(fd,bytes,offset,bytes.length-offset);if(written<=0)throw new Error('Journal append write did not make progress.');offset+=written;}fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(!existed)this.syncDirectory();
 }
 appendEvent(event){this.append([{kind:'event',event}]);}
 appendAcks(events){
  const keys=events.map(event=>String(event.provider)+':'+String(event.eventId)),records=[];
  for(let i=0;i<keys.length;i+=100)records.push({kind:'ack',keys:keys.slice(i,i+100)});
  this.append(records);
 }
}

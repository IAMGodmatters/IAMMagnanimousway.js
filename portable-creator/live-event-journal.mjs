import fs from 'node:fs';
import path from 'node:path';

const MAX_RECORD_BYTES=16*1024;
const DEFAULT_MAX_BYTES=8*1024*1024;

export class LiveEventJournal{
 constructor(filePath,{maxBytes=DEFAULT_MAX_BYTES}={}){
  this.filePath=path.resolve(filePath);
  this.maxBytes=Math.max(64*1024,Math.min(64*1024*1024,maxBytes));
  fs.mkdirSync(path.dirname(this.filePath),{recursive:true});
 }
 load(){
  if(!fs.existsSync(this.filePath))return[];
  const source=fs.readFileSync(this.filePath,'utf8'),records=[];
  for(const line of source.split(/\r?\n/)){
   if(!line||Buffer.byteLength(line,'utf8')>MAX_RECORD_BYTES)continue;
   try{
    const record=JSON.parse(line);
    if(record?.version!==1)continue;
    if(record.kind==='event'&&record.event&&typeof record.event==='object')records.push(record);
    else if(record.kind==='ack'&&Array.isArray(record.keys))records.push(record);
   }catch{
    // Ignore a torn or malformed line; preserve every earlier valid record.
   }
  }
  return records;
 }
 append(records){
  if(!Array.isArray(records)||records.length===0)return;
  const lines=records.map(record=>JSON.stringify({version:1,...record}));
  if(lines.some(line=>Buffer.byteLength(line,'utf8')>MAX_RECORD_BYTES))throw new Error('An event is too large for the recovery journal.');
  const payload=lines.join('\n')+'\n';
  const currentSize=fs.existsSync(this.filePath)?fs.statSync(this.filePath).size:0;
  if(currentSize+Buffer.byteLength(payload,'utf8')>this.maxBytes)throw new Error('The event recovery journal reached its safety limit. Export or archive the workspace before continuing.');
  const fd=fs.openSync(this.filePath,'a');
  try{fs.writeSync(fd,payload,null,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 appendEvent(event){this.append([{kind:'event',event}]);}
 appendAcks(events){this.append([{kind:'ack',keys:events.map(event=>String(event.provider)+':'+String(event.eventId))}]);}
}

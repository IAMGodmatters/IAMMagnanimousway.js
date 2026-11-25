import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {LiveEventJournal} from './live-event-journal.mjs';
import {LiveEventRuntime} from './live-event-runtime.mjs';

const NOW=1_800_000_000_000;
const KEY=Buffer.alloc(32,7);
const journalFor=(file,options={})=>new LiveEventJournal(file,{...options,keyProvider:()=>Buffer.from(KEY)});
const event=(eventId,extra={})=>({protocolVersion:1,eventId,provider:'manual',type:'chat.message',occurredAt:new Date(NOW).toISOString(),text:'hello',...extra});
function temporary(){return fs.mkdtempSync(path.join(os.tmpdir(),'magnanimous-journal-'));}

test('recovers unacknowledged events and excludes acknowledged events after restart',()=>{
 const dir=temporary(),journal=journalFor(path.join(dir,'events.jsonl'));
 const runtime=new LiveEventRuntime({now:()=>NOW,onAccept:e=>journal.appendEvent(e),onConsume:events=>journal.appendAcks(events)});
 runtime.ingest(event('keep'));runtime.ingest(event('ack'));
 runtime.consume(1);
 const recovered=new LiveEventRuntime({now:()=>NOW});
 const result=recovered.restore(journal.load());
 assert.deepEqual(result,{restored:2,acknowledged:1});
 assert.equal(recovered.consume()[0].eventId,'ack');
 fs.rmSync(dir,{recursive:true,force:true});
});

test('replay recovery does not append duplicate event records',()=>{
 const dir=temporary(),file=path.join(dir,'events.jsonl'),journal=journalFor(file);
 journal.appendEvent(event('replay'));
 const before=fs.statSync(file).size;
 const runtime=new LiveEventRuntime({now:()=>NOW,onAccept:e=>journal.appendEvent(e)});
 runtime.restore(journal.load());
 assert.equal(fs.statSync(file).size,before);
 fs.rmSync(dir,{recursive:true,force:true});
});


test('restores a persisted backlog without applying live ingress rate limits',()=>{
 const dir=temporary(),journal=journalFor(path.join(dir,'events.jsonl'));
 journal.append(Array.from({length:150},(_,i)=>({kind:'event',event:event('backlog-'+i)})));
 const runtime=new LiveEventRuntime({now:()=>NOW,rateLimitPerMinute:120});
 const result=runtime.restore(journal.load());
 assert.equal(result.restored,150);
 assert.equal(runtime.status().queued,150);
 fs.rmSync(dir,{recursive:true,force:true});
});

test('a failed durable acknowledgement leaves the event queued',()=>{
 const runtime=new LiveEventRuntime({now:()=>NOW,onConsume:()=>{throw new Error('disk full');}});
 runtime.ingest(event('keep'));
 assert.throws(()=>runtime.consume(1),/disk full/);
 assert.equal(runtime.status().queued,1);
});

test('journal rejects an oversized append without changing existing data',()=>{
 const dir=temporary(),file=path.join(dir,'events.jsonl'),journal=journalFor(file,{maxBytes:64*1024});
 const base={protocolVersion:1,provider:'manual',type:'chat.message',occurredAt:new Date(NOW).toISOString(),text:'x'.repeat(500)};
 journal.append(Array.from({length:40},(_,i)=>({kind:'event',event:{...base,eventId:'e-'+i}})));
 const before=fs.statSync(file).size;
 assert.throws(()=>journal.append(Array.from({length:40},(_,i)=>({kind:'event',event:{...base,eventId:'overflow-'+i}}))),/safety limit/);
 assert.equal(fs.statSync(file).size,before);
 fs.rmSync(dir,{recursive:true,force:true});
});



test('migrates the earlier plaintext JSONL journal to encrypted records without losing events',()=>{
 const dir=temporary(),file=path.join(dir,'events.jsonl');
 const legacy=[{version:1,kind:'event',event:event('legacy-event')},{version:1,kind:'ack',keys:['manual:older-event']}];
 fs.writeFileSync(file,legacy.map(record=>JSON.stringify(record)).join('\n')+'\n');
 const journal=journalFor(file);
 const records=journal.load();
 assert.equal(records.length,2);
 assert.equal(records[0].event.eventId,'legacy-event');
 assert.equal(records[1].kind,'ack');
 const encrypted=fs.readFileSync(file,'utf8');
 assert.equal(encrypted.includes('legacy-event'),false);
 assert.equal(JSON.parse(encrypted.trim().split('\n')[0]).cipher,'aes-256-gcm');
 fs.rmSync(dir,{recursive:true,force:true});
});

test('journal ciphertext does not expose viewer text and requires the workspace key',()=>{
 const dir=temporary(),file=path.join(dir,'events.jsonl'),journal=journalFor(file);
 journal.appendEvent(event('private-viewer',{text:'private viewer message'}));
 const raw=fs.readFileSync(file,'utf8');
 assert.equal(raw.includes('private viewer message'),false);
 const locked=new LiveEventJournal(file);
 assert.throws(()=>locked.load(),/Unlock the encrypted workspace/);
 const wrong=new LiveEventJournal(file,{keyProvider:()=>Buffer.alloc(32,8)});
 assert.throws(()=>wrong.load(),/could not be unlocked or verified/);
 assert.equal(journal.load()[0].event.text,'private viewer message');
 fs.rmSync(dir,{recursive:true,force:true});
});

test('ignores a malformed trailing line while preserving earlier records',()=>{
 const dir=temporary(),file=path.join(dir,'events.jsonl'),journal=journalFor(file);
 journal.appendEvent(event('valid'));
 fs.appendFileSync(file,'{"broken":');
 const records=journal.load();
 assert.equal(records.length,1);
 assert.equal(records[0].event.eventId,'valid');
 fs.rmSync(dir,{recursive:true,force:true});
});

import fs from 'node:fs';

const watch=fs.readFileSync('worker/src/magnanimous-native-attention-watch.js','utf8');
const ops=fs.readFileSync('worker/src/operations-entrypoint.js','utf8');
const fail=[];
const must=(src,text,label)=>{if(!src.includes(text))fail.push(label)};
const forbid=(src,text,label)=>{if(src.includes(text))fail.push(label)};

must(watch,"provider='google'",'native Gmail integration read missing');
must(watch,'gmail.googleapis.com','direct Gmail read path missing');
must(watch,'unified_inbox_threads','Unified Inbox SMS/iMessage scan missing');
must(watch,'phone_calls','native call history scan missing');
must(watch,'cc_voicemails','native voicemail/transcript scan missing');
must(watch,'magnanimous_work_items','native A2A Work Engine scan missing');
must(watch,'consent_control','consent/control suppression missing');
must(watch,'magnanimous_attention_watch_events','durable dedupe missing');
must(watch,"source='native-attention-watch'",'native attention alerts missing');
must(watch,'native_only:true','native-only truth flag missing');
must(watch,'inkbox_used:false','Inkbox independence flag missing');
forbid(watch,'inkbox.ai','native attention watch must not call Inkbox');
forbid(watch,'INKBOX_API_KEY','native attention watch must not require Inkbox credentials');
must(ops,"./magnanimous-native-attention-watch.js",'operations runtime import missing');
must(ops,"/api/magnanimous/attention-watch/status",'owner status endpoint missing');
must(ops,"/api/magnanimous/attention-watch/run",'owner run endpoint missing');
must(ops,'scheduledMagnanimousAttentionWatch(env)','scheduled native attention execution missing');

if(fail.length){console.error('Native attention watch lock failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('PASS: Magnanimous native attention watch is wired without an Inkbox dependency.');

import fs from'node:fs';import assert from'node:assert/strict';
const source=fs.readFileSync(new URL('../../frontend/app/magnanimous/page.tsx',import.meta.url),'utf8');
for(const s of [
 "const[lastFailed,setLastFailed]",
 "async function send(e?:FormEvent,retry?:{text:string;mode:string})",
 "const requestMode=MODES.find",
 "if(!retry)setInput('')",
 "setLastFailed({text,mode:requestMode.id})",
 "Your request is preserved. Use Retry",
 "silentVoice:true",
 "onClick={()=>send(undefined,lastFailed)}",
 "Retry ↻",
 "setLastFailed(null);"
])assert.ok(source.includes(s),'Magnanimous retry recovery missing '+s);
assert.ok(source.indexOf("setLastFailed(null);setBusy(true)")<source.indexOf("postMagnanimousChat('/api/chat'"),'retry state must clear before rerun');
console.log('Magnanimous chat retry recovery lock passed.');

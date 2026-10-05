import fs from 'node:fs';
const single=fs.readFileSync(new URL('../../worker/src/magnanimous-single-brain-contract.js',import.meta.url),'utf8');
const provider=fs.readFileSync(new URL('../../worker/src/provider-entrypoint.js',import.meta.url),'utf8');
const fail=m=>{throw new Error('Magnanimous unified brain fabric lock: '+m)};
for(const t of ['shared_core_rule','memory_architecture','live_multisource_research:true','clickable_source_links:true','memory_consolidation:true'])if(!single.includes(t))fail('missing '+t);
for(const t of ['fresh multi-source research automatically','Main chat, standalone chat and specialist departments share this core research/memory/link contract','official website','apply online'])if(!provider.includes(t))fail('missing '+t);
console.log('Magnanimous unified brain memory/search/link fabric lock PASS');

import fs from 'node:fs';
const page=fs.readFileSync(new URL('../../frontend/app/magnanimous/page.tsx',import.meta.url),'utf8');
const knowledge=fs.readFileSync(new URL('../../worker/src/knowledge-runtime.js',import.meta.url),'utf8');
const fail=(m)=>{throw new Error('Magnanimous multi-source/link lock: '+m)};
for(const token of ['function linkedAnswer','target="_blank"','rel="noopener noreferrer"',"m.role==='assistant'?linkedAnswer(m.content):m.content"])if(!page.includes(token))fail('missing clickable answer contract: '+token);
for(const token of ["jobs.push(cl0qSearch","jobs.push(wikipediaSearch","braveSearch(env,q,'web'","seen=new Set()","Magnanimous multi-source"])if(!knowledge.includes(token))fail('missing multi-source search contract: '+token);
if(!knowledge.includes('googleNewsSearch'))fail('news search fallback missing');
if(!knowledge.includes('const sources=['))fail('research sources are not returned to chat');
console.log('Magnanimous multi-source search + clickable-link lock PASS');

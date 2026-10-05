import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const cases=[
 ['frontend/app/magnanimous/page.tsx',["if(!retry)setInput('')"]],
 ['frontend/app/agents/page.tsx',['setInput("");']],
 ['frontend/app/agent-video/page.tsx',["setInput('')"]],
 ['frontend/app/business/page.tsx',['const submitted = input.trim();','setInput("");','Business/context: ${submitted}.']],
 ['frontend/app/professional/page.tsx',["const submitted=input.trim();setInput('')",'input:submitted']],
 ['frontend/app/telecom/page.tsx',["setQuestion('')"]]
];
for(const [path,tokens] of cases){const c=read(path);for(const t of tokens)if(!c.includes(t))throw new Error('Composer clear contract missing '+path+' :: '+t)}
console.log('Platform submit-clears-composer lock PASS: '+cases.length+' conversational surfaces');

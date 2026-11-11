import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const files=['worker/src/magnanimous-single-brain-contract.js','frontend/app/page.tsx'];
const markers=['â„¢','â€™','â€œ','â€','Ã©','Ã¡','Ã±','Â©','ï¿½','�'];
for(const relative of files){
 const source=fs.readFileSync(path.join(root,relative),'utf8');
 for(const marker of markers)assert.equal(source.includes(marker),false,relative+' contains mojibake marker '+marker);
}
const brain=fs.readFileSync(path.join(root,'worker/src/magnanimous-single-brain-contract.js'),'utf8');
assert.match(brain,/platform:'I AM MAGNANIMOUS WAY\\u2122'/,'The single-brain contract must preserve the exact trademarked platform name through a Unicode escape.');
console.log('Magnanimous platform brand encoding lock passed.');

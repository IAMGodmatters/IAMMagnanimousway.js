import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const outRoot=path.join(root,'frontend','out');
const files=[];
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full);
  // Audit customer-visible static text, not minified runtime/library chunks where
  // byte/Unicode tables can legitimately contain characters that resemble mojibake.
  else if(/\.(?:html|txt|xml)$/i.test(entry.name))files.push(full);
 }
}
if(!fs.existsSync(outRoot))throw new Error('frontend/out is missing; build before copy-integrity audit.');
walk(outRoot);

const forbidden=[
 ['unicode replacement character','�'],
 ['common UTF-8 trademark mojibake','â„¢'],
 ['common UTF-8 em-dash mojibake','â€”'],
 ['common UTF-8 ellipsis mojibake','â€¦'],
 ['common stray UTF-8 lead byte','Â'],
 ['corrupted Magnanimous trademark','I AM MAGNANIMOUS WAY?'],
 ['corrupted loading copy','Opening?']
];
const failures=[];
for(const file of files){
 const text=fs.readFileSync(file,'utf8');
 for(const [label,needle] of forbidden){
  if(text.includes(needle))failures.push({file:path.relative(root,file).split(path.sep).join('/'),label,needle});
 }
}
if(failures.length){
 console.error('Customer-facing copy integrity failures:');
 for(const row of failures.slice(0,100))console.error('-',JSON.stringify(row));
 process.exit(1);
}
console.log(`Customer copy integrity PASS across ${files.length} rendered/static text assets.`);

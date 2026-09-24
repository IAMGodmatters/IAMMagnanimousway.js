import fs from 'node:fs';

const path='docs/ACTIVE-DEVELOPMENT-CHECKPOINT.md';
if(!fs.existsSync(path)){
  console.error('FAIL: durable active-development checkpoint is missing.');
  process.exit(1);
}
const src=fs.readFileSync(path,'utf8');
const required=[
  '# Active Development Checkpoint',
  '## Original task',
  '## Permanent architecture decisions',
  '## Active work',
  '## Production verification',
  '## Unfinished work / exact resume point',
  '## Recovery rule',
  'do not create a new Railway project/service',
  'Git commits/branches/PRs/CI/deployment IDs are the authoritative development record'
];
const missing=required.filter(x=>!src.includes(x));
for(const item of required)console.log((src.includes(item)?'PASS':'FAIL')+': checkpoint contains '+item);
if(missing.length){
  console.error('\n'+missing.length+' checkpoint contract(s) failed.');
  process.exit(1);
}
console.log('\nDurable development checkpoint lock passed.');

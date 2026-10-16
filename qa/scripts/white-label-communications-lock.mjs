import fs from 'node:fs';
const r=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const page=r('frontend/app/white-label/communications/page.tsx');
const layout=r('frontend/app/white-label/layout.tsx');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

must(!layout.includes('/white-label/communications'),'Legacy communications launcher must stay removed from White Label');
must(page.includes("redirect('/white-label')"),'Legacy communications route must redirect to White Label');
must(!page.toLowerCase().includes('mirrorfly'),'Legacy communications route must not expose MirrorFly branding or integration');
console.log('white-label communications removal lock passed');

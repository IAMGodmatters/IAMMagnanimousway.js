import fs from 'node:fs';
const root=p=>new URL('../../'+p,import.meta.url);
const read=p=>fs.readFileSync(root(p),'utf8');
const exists=p=>fs.existsSync(root(p));
const wl=read('frontend/app/white-label/page.tsx');
const shell=read('frontend/app/white-label/app/page.tsx');
const os=read('frontend/app/white-label-os/page.tsx');
const studioApi=read('worker/src/white-label-os-runtime.js');
const liveVideo=read('frontend/app/agent-video/page.tsx');
const mesh=read('frontend/app/agents/page.tsx');

const keys=[...wl.matchAll(/\{key:'([^']+)'/g)].map(x=>x[1]);
for(const k of keys){
 if(!shell.includes(k+':')&&!shell.includes("'"+k+"':"))throw new Error('White Label app missing shell mapping: '+k);
}
const routes=[...shell.matchAll(/src:'(\/[^']+)'/g),...os.matchAll(/:\s*'(\/[^']+)'/g)].map(x=>x[1].split('?')[0]);
for(const route of new Set(routes)){
 if(route==='/')continue;
 const page='frontend/app'+route+'/page.tsx';
 if(!exists(page))throw new Error('White Label route has no page: '+route);
}
if(/mobile:'\/white-label-os'/.test(os))throw new Error('Mobile-ready Portal still self-loops to White Label OS');
if(!studioApi.includes("b.name||b.title||b.partner_name"))throw new Error('Affiliate referral validation does not accept partner_name');
for(const src of [liveVideo,mesh]){
 if(src.includes('<div className="hair"/>')||src.includes('<div className="face"><em/>')||src.includes('<div className="head">'))throw new Error('Cartoon avatar markup remains');
}
if(!liveVideo.includes('/mode-images/virtual-assistant.webp')||!mesh.includes('/mode-images/virtual-assistant.webp'))throw new Error('Professional assistant artwork is not wired to both agent surfaces');
if(!exists('frontend/public/mode-images/virtual-assistant.webp'))throw new Error('Professional assistant artwork asset is missing');
console.log('White Label full-scale route/tool/video-agent audit passed.');

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const layout=fs.readFileSync(path.join(root,'frontend/app/layout.tsx'),'utf8');
const runtime=fs.readFileSync(path.join(root,'frontend/app/platform-runtime-script.tsx'),'utf8');
const template=fs.readFileSync(path.join(root,'frontend/app/template.tsx'),'utf8');
const robots=fs.readFileSync(path.join(root,'frontend/public/robots.txt'),'utf8');
const sitemap=fs.readFileSync(path.join(root,'frontend/public/sitemap.xml'),'utf8');
const failures=[];

function must(condition,message){if(!condition)failures.push(message);}
function escaped(route){return route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

must(layout.includes("import PlatformRuntimeScript from './platform-runtime-script'"),'root layout must import the hardened public/protected route runtime');
must(layout.includes('<PlatformRuntimeScript/>'),'root layout must mount the hardened public/protected route runtime');

const runtimeMatch=runtime.match(/var publicPaths=\[([^;]+)\];/);
const templateMatch=template.match(/const publicPaths=new Set\(\[([^;]+)\]\);/);
must(Boolean(runtimeMatch),'runtime public allowlist must remain machine-verifiable');
must(Boolean(templateMatch),'template public allowlist must remain machine-verifiable');
const runtimeAllowlist=runtimeMatch?.[1]||'';
const templateAllowlist=templateMatch?.[1]||'';
const publicRoutes=['/','/teach','/shop','/login','/signup','/owner-login','/solutions','/guide','/launchplan','/business-plan','/security','/free-tools','/ai-apps','/pricing','/reviews','/privacy','/terms','/advertise','/white-label'];
const protectedRoutes=['/magnanimous','/bible-study','/ai-chat','/crm','/connections','/assistant-actions','/owner-center','/owner-billing','/phone','/telecom','/space','/mux','/knowledge','/virtual-assistant','/video-studio','/agents'];

for(const route of publicRoutes){
 const re=new RegExp(`["']${escaped(route)}["']`);
 must(re.test(runtimeAllowlist),`${route} must remain in the public discovery runtime allowlist`);
 must(re.test(templateAllowlist),`${route} must remain in the public discovery template allowlist`);
}
for(const route of protectedRoutes){
 const re=new RegExp(`["']${escaped(route)}["']`);
 must(!re.test(runtimeAllowlist),`${route} must remain behind sign-in in the runtime contract`);
 must(!re.test(templateAllowlist),`${route} must remain behind sign-in in the template contract`);
}

must(runtime.includes("path.indexOf('/teach/')===0"),'nested Teach routes must remain public');
must(runtime.includes("path.indexOf('/shop/')===0"),'nested Shop routes must remain public');
must(runtime.includes("path.indexOf('/reviews/')===0"),'nested Review routes must remain public');
must(template.includes("path.startsWith('/teach/')"),'template must preserve nested Teach access');
must(template.includes("path.startsWith('/shop/')"),'template must preserve nested Shop access');
must(template.includes("path.startsWith('/reviews/')"),'template must preserve nested Review access');
must(runtime.includes('if(isPublicPath(currentPath)||standalone)return;'),'route guard must bypass login only for explicit discovery routes or the intentionally isolated standalone shell');
must(runtime.includes("location.replace('/login?returnTo='+encodeURIComponent(returnTo))"),'protected routes must still redirect unauthenticated users to login');
must(runtime.includes("currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0"),'standalone Magnanimous isolation must remain explicit rather than entering the generic public allowlist');
must(!runtimeAllowlist.includes("'/magnanimous'"),'standalone Magnanimous must not be silently classified as a generic public route');

for(const route of ['/ai-chat/','/crm/','/connections/','/assistant-actions/','/owner-center/','/phone/','/telecom/','/space/','/mux/']){
 must(robots.includes(`Disallow: ${route}`),`robots must keep protected operational surface out of crawling: ${route}`);
}
for(const route of ['/solutions/','/guide/','/business-plan/','/security/','/free-tools/','/ai-apps/','/pricing/','/reviews/','/privacy/','/terms/']){
 must(sitemap.includes(`<loc>https://iammagnanimousway.com${route}</loc>`),`sitemap must keep public discovery route indexed: ${route}`);
}

if(failures.length){
 console.error(`PUBLIC SURFACE LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Public surface lock: PASS — discovery/marketing/teaching/marketplace pages stay public while operational, owner, AI workspace, telecom and connected-account surfaces remain protected.');

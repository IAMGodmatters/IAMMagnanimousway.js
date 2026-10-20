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
const billing=fs.readFileSync(path.join(root,'worker/src/billing-tiers-runtime.js'),'utf8');
const businessPlan=fs.readFileSync(path.join(root,'worker/src/business-plan-subscription-runtime.js'),'utf8');
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
const publicRoutes=['/','/teach','/shop','/login','/signup','/owner-login','/solutions','/guide','/launchplan','/business-plan','/funding','/security','/free-tools','/samsung-tools','/ai-apps','/pricing','/reviews','/privacy','/terms','/advertise','/white-label','/movie','/reels','/plugin-support','/plugin-demo'];
const protectedRoutes=['/magnanimous','/bible-study','/ai-chat','/crm','/connections','/assistant-actions','/owner-center','/owner-billing','/phone','/telecom','/space','/mux','/knowledge','/virtual-assistant','/video-studio','/movie-maker','/agents'];

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
for(const route of ['/solutions/','/guide/','/business-plan/','/funding/','/security/','/free-tools/','/samsung-tools/','/ai-apps/','/reels/','/pricing/','/reviews/','/privacy/','/terms/','/plugin-support/','/plugin-demo/']){
 must(sitemap.includes(`<loc>https://iammagnanimousway.com${route}</loc>`),`sitemap must keep public discovery route indexed: ${route}`);
}

const samsungPublic=read('frontend/app/samsung-tools/page.tsx');
const samsungLayout=read('frontend/app/samsung-tools/layout.tsx');
const freeToolsPage=read('frontend/app/free-tools/page.tsx');
const bridgeRuntime=read('worker/src/magnanimous-local-bridge-runtime.js');
must(samsungPublic.includes('Benjamin-Dobell/Heimdall'), 'Public Samsung page must attribute upstream source.');
must(samsungPublic.includes('MIT license'), 'Public Samsung page must state MIT licensing.');
must(samsungPublic.includes('not remote phone repair offered to the public'), 'Public Samsung page must disclose hardware limitations.');
must(samsungPublic.includes('/local-bridge'), 'Public Samsung page must link to existing owner access gate.');
must(!samsungPublic.includes('/api/magnanimous/local-bridge'), 'Public informational page must never call the private task API.');
must(samsungLayout.includes("canonical:'/samsung-tools/'"), 'Public route must declare an accurate canonical URL.');
must(freeToolsPage.includes('href="/samsung-tools"'), 'Free Tools must link to public Samsung discovery.');
must(bridgeRuntime.includes("heimdall_detect:{risk:'medium',auto:false,confirmation:true"), 'USB detection must keep exact-task confirmation.');
must(!bridgeRuntime.includes('heimdall_flash:{'), 'Unreviewed firmware write operations must not be exposed.');

const billingTruth=[
 ['Magnanimous Unlimited Fair-Use','19.99','MONTH'],
 ['Magnanimous CRM Pro','79','MONTH'],
 ['Magnanimous Studio','79','MONTH'],
 ['Magnanimous Business','309','MONTH'],
 ['Magnanimous Business Annual','3708','YEAR']
];
for(const [name,price,unit] of billingTruth){
 must(billing.includes(`name: '${name}', price_usd: ${price}`),`billing runtime must keep ${name} at USD ${price}`);
 must(layout.includes(`recurring('${name}','${price}','${unit}')`),`public structured data must match ${name} billing truth at USD ${price}/${unit.toLowerCase()}`);
}
must(businessPlan.includes('const PLAN_MONTHLY_PRICE_USD=79;'),'professional business-plan runtime must keep its current USD 79 monthly price');
must(layout.includes("recurring('Professional Business Plan','79','MONTH')"),'public structured data must match the USD 79/month Professional Business Plan');
for(const stale of ["monthly('Magnanimous Plus','19')","monthly('Full Business','49')","monthly('Magnanimous Pro','99')","monthly('Magnanimous Scale','199')"]){
 must(!layout.includes(stale),`stale structured pricing must not return: ${stale}`);
}

if(failures.length){
 console.error(`PUBLIC SURFACE LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Public surface lock: PASS — discovery/marketing/teaching/marketplace pages and structured pricing stay truthful while operational, owner, AI workspace, telecom and connected-account surfaces remain protected.');

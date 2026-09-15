import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const layout=fs.readFileSync(path.join(root,'frontend/app/layout.tsx'),'utf8');
const template=fs.readFileSync(path.join(root,'frontend/app/template.tsx'),'utf8');
const failures=[];

function must(condition,message){if(!condition)failures.push(message);}

const allowlist=layout.match(/var publicPaths=\[[^;]+;/)?.[0]||'';
const expected="var publicPaths=['/teach','/shop','/login','/signup','/owner-login'];";
must(layout.includes(expected),'layout public allowlist must contain only Teach, Shop, and authentication entry pages');
must(template.includes("const publicPaths=new Set(['/teach','/shop','/login','/signup','/owner-login']);"),'template public allowlist must match the strict boundary');
must(layout.includes("function isPublicPath(path){return publicPaths.indexOf(path)!==-1||path.indexOf('/teach/')===0||path.indexOf('/shop/')===0;}"),'nested Teach and Shop routes must remain public');
must(template.includes("const isPublic=publicPaths.has(path)||path.startsWith('/teach/')||path.startsWith('/shop/');"),'template must preserve nested Teach and Shop access');
must(layout.includes("if(p==='/'){if(!valid)location.replace('/login?returnTo=%2F');return;}"),'root must require an active signed-in session');
must(layout.includes('if(isPublicPath(p))return;'),'route guard must bypass authentication only for the strict public surface');
must(!layout.includes('if(standalone||publicPaths.indexOf(p)!==-1)return;'),'Magnanimous standalone mode must not bypass authentication');
must(!layout.includes('data-iam-route-recovery="true"'),'generic recovery markup must not bypass authentication');

for(const route of ['/solutions','/business-plan','/guide','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps','/advertise','/security','/white-label','/magnanimous','/bible-study']){
 must(!allowlist.includes(`'${route}'`),`${route} must remain behind sign-in`);
}

if(failures.length){
 console.error(`PUBLIC SURFACE LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Public surface lock: PASS — Teach + Shop are public, auth entry pages are reachable, and every other workspace route remains behind sign-in.');

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const appDir=path.join(root,'app');
const failures=[];
let files=0,buttons=0,anchors=0,roleButtons=0,navigationTargets=0,iframes=0,forms=0;

function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(dir,entry.name);
  return entry.isDirectory()?walk(full):[full];
 });
}
function routeForPage(file){
 const rel=path.relative(appDir,path.dirname(file)).split(path.sep).filter(Boolean);
 return rel.length?`/${rel.join('/')}`:'/';
}
function normalizeRoute(target){
 return String(target||'').split(/[?#]/)[0].replace(/\/+$/,'')||'/';
}
function hasRoute(routes,target){
 const base=normalizeRoute(target);
 if(routes.has(base))return true;
 for(const route of routes){
  if(!route.includes('['))continue;
  const pattern='^'+route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\[\.\.\.([^\]]+)\\\]/g,'.+').replace(/\\\[([^\]]+)\\\]/g,'[^/]+')+'$';
  if(new RegExp(pattern).test(base))return true;
 }
 return false;
}
function insideOpenForm(source,index){
 return source.lastIndexOf('<form',index)>source.lastIndexOf('</form>',index);
}
function actionableButton(attrs,source,index){
 if(/onClick\s*=|onPointer(?:Down|Up)?\s*=|onMouse(?:Down|Up)?\s*=|onKeyDown\s*=|formAction\s*=/.test(attrs))return true;
 if(/type\s*=\s*["'](?:submit|reset)["']/i.test(attrs))return true;
 if(/\.\.\./.test(attrs))return true;
 if(insideOpenForm(source,index)&&!/type\s*=\s*["']button["']/i.test(attrs))return true;
 return false;
}

const sourceFiles=walk(appDir).filter(f=>/\.(tsx|jsx|ts|js)$/.test(f));
const pageFiles=sourceFiles.filter(f=>/^page\.(tsx|jsx)$/.test(path.basename(f)));
const routes=new Set(pageFiles.map(routeForPage));

for(const file of sourceFiles){
 files++;
 const rel=path.relative(root,file);
 const source=fs.readFileSync(file,'utf8');
 let m;

 const buttonRe=/<button(?:\s|>)([^>]*)>/g;
 while((m=buttonRe.exec(source))){
  buttons++;
  const attrs=m[1]||'';
  if(!actionableButton(attrs,source,m.index))failures.push(`${rel}: button has no click/keyboard/form action near offset ${m.index}`);
  if(/disabled\s*=\s*["']disabled["']|\bdisabled\b(?!\s*=\s*\{)/i.test(attrs)&&!/(onClick|type\s*=\s*["']submit["'])/.test(attrs))failures.push(`${rel}: permanently disabled button has no recoverable action near offset ${m.index}`);
 }

 // Require actual JSX/HTML tag syntax. This deliberately avoids treating expressions like b<a as an anchor.
 const anchorRe=/<a(?:\s|>)([^>]*)>/g;
 while((m=anchorRe.exec(source))){
  anchors++;
  const attrs=m[1]||'';
  const hasHref=/href\s*=/.test(attrs);
  const hasHandler=/onClick\s*=|onKeyDown\s*=|\.\.\./.test(attrs);
  if(!hasHref&&!hasHandler)failures.push(`${rel}: anchor has neither href nor interaction handler near offset ${m.index}`);
 }

 const roleButtonRe=/<([A-Za-z][\w.-]*)(?:\s|>)([^>]*)role\s*=\s*["']button["']([^>]*)>/g;
 while((m=roleButtonRe.exec(source))){
  roleButtons++;
  const attrs=`${m[2]||''} ${m[3]||''}`;
  if(!/onClick\s*=|onKeyDown\s*=|href\s*=|\.\.\./.test(attrs))failures.push(`${rel}: role=button element has no interaction handler near offset ${m.index}`);
 }

 const formRe=/<form(?:\s|>)([^>]*)>/g;
 while((m=formRe.exec(source))){
  forms++;
  const attrs=m[1]||'';
  if(!/onSubmit\s*=|action\s*=|\.\.\./.test(attrs)){
   const close=source.indexOf('</form>',m.index);
   const body=close>=0?source.slice(m.index,close):'';
   if(!/<button(?:\s|>)[^>]*type\s*=\s*["']submit["']/i.test(body))failures.push(`${rel}: form has no onSubmit/action/explicit submit control near offset ${m.index}`);
  }
 }

 const navPatterns=[
  /(?:router|location|window\.location)\.(?:push|replace|assign)\(\s*["'](\/[^"']*)["']/g,
  /(?:window\.)?location\.href\s*=\s*["'](\/[^"']*)["']/g
 ];
 for(const re of navPatterns){
  while((m=re.exec(source))){
   navigationTargets++;
   const target=m[1];
   if(!target.startsWith('/api/')&&!hasRoute(routes,target))failures.push(`${rel}: literal navigation target has no application route: ${target}`);
  }
 }

 const iframeRe=/<iframe(?:\s|>)([^>]*)>/g;
 while((m=iframeRe.exec(source))){
  iframes++;
  const attrs=m[1]||'';
  const src=attrs.match(/src\s*=\s*["'](\/[^"']*)["']/)?.[1];
  if(src&&!src.startsWith('/api/')&&!hasRoute(routes,src))failures.push(`${rel}: iframe target has no application route: ${src}`);
 }
}

const standalone=path.join(appDir,'magnanimous','page.tsx');
if(fs.existsSync(standalone)){
 const s=fs.readFileSync(standalone,'utf8');
 if(!/textarea/.test(s))failures.push('app/magnanimous/page.tsx: standalone composer textarea is missing');
 if(!/(onSubmit|type=["']submit["'])/.test(s))failures.push('app/magnanimous/page.tsx: standalone composer has no submit path');
 if(!s.includes("fetch('/api/chat'"))failures.push('app/magnanimous/page.tsx: standalone chat request path is missing');
}

const whiteLabel=path.join(appDir,'white-label','page.tsx');
if(fs.existsSync(whiteLabel)){
 const s=fs.readFileSync(whiteLabel,'utf8');
 if(!s.includes('/white-label/app?tool='))failures.push('app/white-label/page.tsx: paid White Label apps must enter through the Magnanimous brain shell');
 if(!routes.has('/white-label/app'))failures.push('app/white-label/app/page.tsx: White Label brain-connected app shell route is missing');
 if(!routes.has('/white-label/funnel'))failures.push('app/white-label/funnel/page.tsx: dedicated White Label funnel builder route is missing');
}

console.log(`Deep interaction lock scanned ${files} source files, ${routes.size} routes, ${buttons} buttons, ${anchors} anchors, ${roleButtons} role-buttons, ${forms} forms, ${navigationTargets} literal navigation targets, and ${iframes} iframes.`);
if(failures.length){
 console.error('\nDEEP INTERACTION LOCK FAILED:');
 for(const f of failures)console.error(`- ${f}`);
 process.exit(1);
}
console.log('Deep interaction lock passed: controls expose actionable behavior, literal internal navigation resolves, forms have submit paths, and standalone/White Label critical interaction contracts remain wired.');

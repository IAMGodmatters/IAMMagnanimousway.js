import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const appDir=path.join(root,'app');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const full=path.join(dir,entry.name);return entry.isDirectory()?walk(full):[full]})}
const sourceFiles=walk(appDir).filter(f=>/\.(tsx|ts|jsx|js)$/.test(f));
const pages=sourceFiles.filter(f=>path.basename(f)==='page.tsx'||path.basename(f)==='page.jsx');
const routes=new Set(pages.map(file=>{const rel=path.relative(appDir,path.dirname(file)).split(path.sep).filter(Boolean);return rel.length?`/${rel.join('/')}`:'/'}));
const failures=[];let literalLinks=0,buttons=0;
for(const file of sourceFiles){
 const source=fs.readFileSync(file,'utf8'),rel=path.relative(root,file);
 const hrefRe=/href\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/g;let m;
 while((m=hrefRe.exec(source))){
  literalLinks++;const href=m[1]??m[2]??m[3]??'';
  if(!href||href==='#'||/^javascript:/i.test(href)){failures.push(`${rel}: dead href ${JSON.stringify(href)}`);continue}
  if(href.startsWith('/')&&!href.startsWith('/api/')){
   const base=(href.split(/[?#]/)[0].replace(/\/+$/,'')||'/');
   if(!routes.has(base)&&!base.startsWith('/_next/'))failures.push(`${rel}: internal href has no app route: ${href}`);
  }
 }
 const buttonRe=/<button\b([^>]*)>/g;
 while((m=buttonRe.exec(source))){buttons++;const attrs=m[1]||'';
  if(/type\s*=\s*["']button["']/i.test(attrs)&&!/onClick\s*=|onPointer|onMouse|onKeyDown\s*=|formAction\s*=/i.test(attrs))failures.push(`${rel}: type="button" has no visible handler near offset ${m.index}`);
 }
}
const layout=fs.readFileSync(path.join(appDir,'layout.tsx'),'utf8');
if(!layout.includes('InteractionClarity'))failures.push('app/layout.tsx: global InteractionClarity layer is not mounted');
const requiredRoutes=new Map([
 ['/guide','app/guide/page.tsx: platform guide route is missing'],
 ['/bible-study','app/bible-study/page.tsx: required Bible Study route is missing'],
 ['/magnanimous','app/magnanimous/page.tsx: standalone Magnanimous AI route is missing']
]);
for(const [route,message] of requiredRoutes)if(!routes.has(route))failures.push(message);

const shopPath=path.join(appDir,'shop','page.tsx');
if(!fs.existsSync(shopPath)){
 failures.push('app/shop/page.tsx: marketplace route containing the Bible Study link is missing');
}else{
 const shopPage=fs.readFileSync(shopPath,'utf8');
 if(!/href\s*=\s*(?:["']\/bible-study["']|\{\s*["']\/bible-study["']\s*\})/.test(shopPage))failures.push('app/shop/page.tsx: Bible Study marketplace link is missing');
}

const bibleStudyPath=path.join(appDir,'bible-study','page.tsx');
if(fs.existsSync(bibleStudyPath)){
 const bibleStudyPage=fs.readFileSync(bibleStudyPath,'utf8');
 if(!/title\s*:\s*["']Bible Study["']/.test(bibleStudyPage))failures.push('app/bible-study/page.tsx: Bible Study metadata title is missing');
 if(!/href\s*=\s*(?:["']\/ai-chat["']|\{\s*["']\/ai-chat["']\s*\})/.test(bibleStudyPage))failures.push('app/bible-study/page.tsx: Magnanimous AI handoff link is missing');
}

// Bible Study must continue through the authenticated workspace guard.
// Adding it to publicPaths would silently bypass the customer sign-in boundary.
const publicPathsMatch=layout.match(/(?:var|let|const)\s+publicPaths\s*=\s*\[([\s\S]*?)\]/);
if(!publicPathsMatch)failures.push('app/layout.tsx: public route contract could not be verified');
else if(/["']\/bible-study["']/.test(publicPathsMatch[1]))failures.push('app/layout.tsx: /bible-study must remain behind the customer sign-in boundary');

const magnanimousLayoutPath=path.join(appDir,'magnanimous','layout.tsx');
const magnanimousPagePath=path.join(appDir,'magnanimous','page.tsx');
if(!fs.existsSync(magnanimousLayoutPath)){
 failures.push('app/magnanimous/layout.tsx: standalone metadata contract is missing');
}else{
 const magnanimousLayout=fs.readFileSync(magnanimousLayoutPath,'utf8');
 if(!/title\s*:\s*["']Magnanimous AI™ — Standalone["']/.test(magnanimousLayout))failures.push('app/magnanimous/layout.tsx: standalone page title is missing');
 if(!/canonical\s*:\s*["']\/magnanimous["']/.test(magnanimousLayout))failures.push('app/magnanimous/layout.tsx: canonical standalone URL is missing');
}
if(fs.existsSync(magnanimousPagePath)){
 const magnanimousPage=fs.readFileSync(magnanimousPagePath,'utf8');
 if(!/className\s*=\s*["']mag-standalone["']/.test(magnanimousPage))failures.push('app/magnanimous/page.tsx: standalone interface shell is missing');
 if(!magnanimousPage.includes("fetch('/api/magnanimous/health'"))failures.push('app/magnanimous/page.tsx: Magnanimous health check is missing');
 if(!magnanimousPage.includes("fetch('/api/chat'"))failures.push('app/magnanimous/page.tsx: Magnanimous chat endpoint is missing');
 if(!magnanimousPage.includes('/login?returnTo=%2Fmagnanimous'))failures.push('app/magnanimous/page.tsx: persistent-memory sign-in return path is missing');
 if(!magnanimousPage.includes('Guest session'))failures.push('app/magnanimous/page.tsx: public guest-session boundary is missing');
}
if(publicPathsMatch&&!/["']\/magnanimous["']/.test(publicPathsMatch[1]))failures.push('app/layout.tsx: /magnanimous must remain publicly accessible');
if(!layout.includes("var standalone=currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0"))failures.push('app/layout.tsx: standalone route detection is missing');
if(!layout.includes("if(standalone)document.documentElement.setAttribute('data-iam-standalone','true')"))failures.push('app/layout.tsx: standalone document mode is missing');
if(!layout.includes('html[data-iam-standalone="true"] .iam-shop-link')||!layout.includes('html[data-iam-standalone="true"] .iam-global-tools'))failures.push('app/layout.tsx: standalone interface isolation rules are missing');
if(!layout.includes('if(!standalone)loadAds()'))failures.push('app/layout.tsx: standalone advertising isolation is missing');
console.log(`Interaction audit: ${sourceFiles.length} source files, ${routes.size} routes, ${literalLinks} literal links, ${buttons} buttons.`);
if(failures.length){console.error('\nInteraction integrity failures:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log('Bible Study contract passed: route, marketplace link, metadata, Magnanimous AI handoff, and customer sign-in boundary are intact.');
console.log('Standalone Magnanimous AI contract passed: public route, metadata, guest boundary, chat runtime, isolated interface, and no-ad shell are intact.');
console.log('Interaction audit passed: no empty/#/javascript links, literal internal links resolve to an app route, explicit type=button controls have handlers, and the global clarity layer is mounted.');

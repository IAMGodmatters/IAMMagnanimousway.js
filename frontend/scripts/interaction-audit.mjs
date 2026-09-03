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
if(!routes.has('/guide'))failures.push('app/guide/page.tsx: platform guide route is missing');
console.log(`Interaction audit: ${sourceFiles.length} source files, ${routes.size} routes, ${literalLinks} literal links, ${buttons} buttons.`);
if(failures.length){console.error('\nInteraction integrity failures:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log('Interaction audit passed: no empty/#/javascript links, literal internal links resolve to an app route, explicit type=button controls have handlers, and the global clarity layer is mounted.');

import fs from 'node:fs';

function read(file){return fs.readFileSync(file,'utf8')}
function write(file,text){fs.writeFileSync(file,text)}
function replaceOne(file,from,to,label){
  const source=read(file);
  const count=source.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly one match in ${file}, found ${count}`);
  write(file,source.replace(from,to));
}
function replaceAllExact(file,from,to,label,min=1){
  const source=read(file);
  const count=source.split(from).length-1;
  if(count<min)throw new Error(`${label}: expected at least ${min} matches in ${file}, found ${count}`);
  write(file,source.split(from).join(to));
}

const provider='worker/src/provider-entrypoint.js';
replaceOne(provider,
`Use fresh research when facts are current, stale, uncertain or source-dependent.`,
`Use fresh research when facts are current, stale, uncertain or source-dependent. Give direct, accurate URLs whenever a user asks for a link, website, form, office, source, or official page. Never claim Magnanimous cannot provide links; when the exact URL is uncertain, research it and prefer the official primary-source URL. For government benefits, laws, regulations, applications, medical or financial administration, deadlines, eligibility, forms, addresses, phone numbers, and similar changing facts, proactively ground the answer in fresh primary or official sources. Everyday free-plan users should receive a complete useful answer: do not artificially withhold normal explanation, official links, research, writing, coding, planning, or general assistance to force an upgrade. Paid-plan gates should be reserved for genuinely funded or variable-cost execution.`,
'commander quality contract');
replaceOne(provider,
`return /\\b(latest|current|today|recent|now|this week|this month|news|price|availability|status|updated|update|verify|source|citation|research|competitor|market)\\b/i.test(String(message || ''));`,
`return /\\b(latest|current|today|recent|now|this week|this month|news|price|availability|status|updated|update|verify|source|citation|research|competitor|market|link|url|website|official|government|benefit|benefits|ssdi|ssi|social security|medicare|medicaid|disability|application|apply|eligibility|deadline|form|forms|office|address|phone|contact|law|regulation|rules?|policy|tax|visa|immigration)\\b/i.test(String(message || ''));`,
'fresh research trigger');
replaceOne(provider,'max_tokens: 1400','max_tokens: 3200','free-first output depth');

replaceOne('magnanimous-runtime/src/ai-binding.mjs','      2200\n    );','      3200\n    );','standalone AI token default');
replaceOne('magnanimous-runtime/.env.example','MAGNANIMOUS_AI_MAX_TOKENS=2200','MAGNANIMOUS_AI_MAX_TOKENS=3200','standalone env token default');

const standalone='frontend/app/magnanimous/page.tsx';
replaceOne(standalone,
`function extractSources(value:unknown):Array<{title?:string;url?:string}>{\n if(!Array.isArray(value))return[];\n return value.slice(0,8).map((x:any)=>({title:String(x?.title||x?.name||'Source'),url:typeof x?.url==='string'?x.url:undefined}));\n}\n`,
`function extractSources(value:unknown):Array<{title?:string;url?:string}>{\n if(!Array.isArray(value))return[];\n return value.slice(0,8).map((x:any)=>({title:String(x?.title||x?.name||'Source'),url:typeof x?.url==='string'?x.url:undefined}));\n}\nfunction linkedAnswer(text:string){\n const parts=String(text||'').split(/(https?:\\/\\/[^\\s<]+)/gi);\n return parts.map((part,i)=>{\n  if(!/^https?:\\/\\//i.test(part))return <span key={i}>{part}</span>;\n  const clean=part.replace(/[),.;!?]+$/g,'');\n  const suffix=part.slice(clean.length);\n  return <span key={i}><a className=\"mag-inline-link\" href={clean} target=\"_blank\" rel=\"noopener noreferrer\">{clean}</a>{suffix}</span>;\n });\n}\n`,
'clickable answer URLs');
replaceOne(standalone,'<p>{m.content}</p>','<p>{linkedAnswer(m.content)}</p>','render clickable answer URLs');
replaceOne(standalone,
`<div className=\"mag-memory\"><b>{signedIn?'Persistent learning on':'Guest session'}</b>`,
`<a className=\"mag-storage-link\" href=\"/storage\">Storage & device vault →</a>\n    <div className=\"mag-memory\"><b>{signedIn?'Persistent learning on':'Guest session'}</b>`,
'storage workspace link');
replaceOne(standalone,
`.mag-bubble p{`,
`.mag-inline-link{color:#7fd8ff;text-decoration:underline;text-underline-offset:2px;overflow-wrap:anywhere}.mag-storage-link{display:block;margin:10px 0;padding:10px 12px;border:1px solid #27445f;border-radius:10px;color:#a9ddff;text-decoration:none;background:#081521}.mag-bubble p{`,
'inline link styles');

replaceAllExact('frontend/package.json','16.3.5','16.3.8','Next.js security upgrade',1);
replaceAllExact('frontend/package-lock.json','16.3.5','16.3.8','Next.js lock security upgrade',10);
replaceOne('qa/scripts/next-security-baseline-lock.mjs',
`if(!gte(versionParts(declared),[16,3,3]))fail('Next.js must remain at or above the August 2026 critical security baseline 16.3.3.');`,
`if(!gte(versionParts(declared),[16,3,8]))fail('Next.js must remain at or above the September 30, 2026 security baseline 16.3.8.');`,
'Next.js minimum security baseline');
replaceOne('qa/scripts/next-security-baseline-lock.mjs',
`if(lock.packages?.['node_modules/@swc/helpers']?.version!=='0.5.23')fail('@swc/helpers must match the Next.js 16.3.5 runtime dependency.');`,
`if(lock.packages?.['node_modules/@swc/helpers']?.version!=='0.5.23')fail('@swc/helpers must match the validated Next.js runtime dependency.');`,
'Next.js helper message');

const server='magnanimous-runtime/src/server.mjs';
replaceOne(server,
`async function staticAssetProof() {`,
`async function staticNotFoundResponse(){\n  for(const rel of ['404.html','_not-found.html',path.join('_not-found','index.html')]){\n    const candidate=path.resolve(assetsRoot,rel);\n    if(!candidate.startsWith(assetsRoot+path.sep)&&candidate!==assetsRoot)continue;\n    try{\n      const body=await fs.readFile(candidate);\n      return new Response(body,{status:404,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60'}});\n    }catch{}\n  }\n  return new Response('<!doctype html><html><head><title>404 — I AM MAGNANIMOUS WAY™</title></head><body><main><h1>Page not found</h1><p>The address does not match a page on I AM MAGNANIMOUS WAY™.</p><p><a href=\"/\">Return home</a></p></main></body></html>',{status:404,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60'}});\n}\n\nasync function staticAssetProof() {`,
'static 404 response');
replaceOne(server,
`          mail: mailer.status(),\n          first_party_capabilities: {`,
`          mail: mailer.status(),\n          storage: await objectStore.stats(),\n          first_party_capabilities: {`,
'health storage stats');
replaceOne(server,
`    if (!workerFirst(pathname)) {\n      const asset = await staticResponse(pathname);\n      if (asset) {\n        await send(res, asset);\n        metrics.observe(asset.status, Date.now() - startedAt);\n        return;\n      }\n    }`,
`    if (!workerFirst(pathname)) {\n      const asset = await staticResponse(pathname);\n      if (asset) {\n        await send(res, asset);\n        metrics.observe(asset.status, Date.now() - startedAt);\n        return;\n      }\n      const notFound=await staticNotFoundResponse();\n      await send(res,notFound);\n      metrics.observe(404,Date.now()-startedAt);\n      return;\n    }`,
'404 instead of auth fallback');

const pkg='frontend/package.json';
const pkgSource=read(pkg);
const marker='node ../qa/scripts/magnanimous-videoexpress-capability-lock.mjs && node ../qa/scripts/recent-conversation-gaps-lock.mjs';
if(!pkgSource.includes(marker))throw new Error('platform audit insertion marker missing');
write(pkg,pkgSource.replace(marker,'node ../qa/scripts/magnanimous-videoexpress-capability-lock.mjs && node ../qa/scripts/magnanimous-free-plan-depth-lock.mjs && node ../qa/scripts/recent-conversation-gaps-lock.mjs'));

console.log('Full platform reliability transformation applied successfully.');

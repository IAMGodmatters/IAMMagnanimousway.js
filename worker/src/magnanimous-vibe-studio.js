import {currentUser} from './integrations.js';
import {requirePlatformOwner} from './platform-owner-guard.js';
import {tenantPlan} from './usage-guard.js';

// Magnanimous Vibe Studio never executes generated code on the Worker.
// It stores owner-authored single-file prototypes behind tenant-scoped D1 access.
// Preview scripts run only in an explicitly activated opaque-origin iframe.
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const clean=(v,n=2000)=>String(v??'').trim().slice(0,n);
const now=()=>Math.floor(Date.now()/1000);
const escape=(v)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const kinds=new Set(['landing','dashboard','tasks','calculator','form','portfolio']);
const MAX_HTML=65536;
const MAX_PROJECTS=25;
const MAX_VIBE_FILES=19; // index.html is the twentieth, virtual, project file.
const MAX_VIBE_FILE_BYTES=65536;
const MAX_VIBE_PROJECT_BYTES=262144;
const VIBE_FILE_EXTENSIONS=new Set(['.css','.js','.json','.md']);
const MIN_REVISION=1;

export const MAGNANIMOUS_VIBE_STUDIO_POLICY=Object.freeze({
 identity:'Magnanimous AI',native_first:true,owner_only:true,
 project_storage:'authenticated-tenant-scoped-d1',history:'immutable-checkpoints',
 runtime:'isolated-client-side-preview',third_party_code_required:false,
 features:['natural-language-scaffolding','guided-ai-iteration','code-editing','sandbox-preview','project-history','export-html','review-before-apply','developer-agent-handoff'],
 production_publish:false,repository_write:false,arbitrary_server_shell:false,paid_provider_required:false
});

export function pickVibeTemplate(brief,requested){
 if(kinds.has(requested))return requested;
 const s=String(brief||'').toLowerCase();
 if(/\b(todo|to-do|tasks?|checklist|organize|planner)\b/.test(s))return 'tasks';
 if(/\b(calc|calculate|calculator|calculation|tip|budget|math|converter)\b/.test(s))return 'calculator';
 if(/\b(dashboard|analytics|metrics|reports?|stats|kpi)\b/.test(s))return 'dashboard';
 if(/\b(form|survey|register|contact|rsvp|signup|booking)\b/.test(s))return 'form';
 if(/\b(portfolio|resume|personal site|projects showcase)\b/.test(s))return 'portfolio';
 return 'landing';
}

function templateBody(kind,title,brief){
 const subtitle=escape(brief||'Built with Magnanimous AI.');
 const name=escape(title);
 if(kind==='tasks')return [
  '<section class="hero"><p class="eyebrow">PRODUCTIVITY · LIVE DEMO</p><h1>'+name+'</h1><p>'+subtitle+'</p></section>',
  '<section class="surface"><h2>Make progress today</h2><div class="inline"><input id="task" placeholder="Add your next task" maxlength="140" aria-label="New task"><button id="add" type="button">Add task</button></div><ul id="tasks" class="items"><li><label><input type="checkbox"> Plan the next milestone</label></li><li><label><input type="checkbox"> Test the working demo</label></li></ul><small>Tasks stay inside this preview. No server data is sent.</small></section>',
  '<script>const input=document.getElementById("task");document.getElementById("add").onclick=()=>{const text=input.value.trim();if(!text)return;const li=document.createElement("li"),label=document.createElement("label"),box=document.createElement("input");box.type="checkbox";label.append(box,document.createTextNode(" "+text));li.append(label);document.getElementById("tasks").append(li);input.value="";input.focus()};input.addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("add").click()})</script>'
 ].join('\n');
 if(kind==='calculator')return [
  '<section class="hero"><p class="eyebrow">UTILITY · LIVE DEMO</p><h1>'+name+'</h1><p>'+subtitle+'</p></section>',
  '<section class="surface"><h2>Try your calculator</h2><div class="fields"><label>First number<input id="first" type="number" step="any" value="24"></label><label>Second number<input id="second" type="number" step="any" value="12"></label><label>Operation<select id="op"><option value="add">Add</option><option value="minus">Subtract</option><option value="times">Multiply</option><option value="divide">Divide</option></select></label></div><button id="calc" type="button">Calculate</button><output id="result" class="result" aria-live="polite">36</output></section>',
  '<script>document.getElementById("calc").onclick=()=>{const a=Number(document.getElementById("first").value),b=Number(document.getElementById("second").value),op=document.getElementById("op").value;let n=op==="add"?a+b:op==="minus"?a-b:op==="times"?a*b:b===0?"Cannot divide by zero":a/b;document.getElementById("result").textContent=String(n)}</script>'
 ].join('\n');
 if(kind==='dashboard')return [
  '<section class="hero"><p class="eyebrow">BUSINESS INTELLIGENCE · DEMO DATA</p><h1>'+name+'</h1><p>'+subtitle+'</p></section>',
  '<div class="metrics"><article><span>Active projects</span><b>12</b><small>+3 this month</small></article><article><span>Completion</span><b>84%</b><small>On track</small></article><article><span>Recent activity</span><b>147</b><small>Sample events</small></article></div>',
  '<section class="surface"><h2>Performance overview</h2><p class="muted">Sample metrics, not connected to real accounts.</p><div class="bars" aria-label="Illustrative bar chart"><div style="height:37%"></div><div style="height:58%"></div><div style="height:43%"></div><div style="height:79%"></div><div style="height:68%"></div><div style="height:93%"></div></div><button id="refresh" type="button">Refresh demo activity</button><p id="activity" aria-live="polite">Showing sample activity</p></section>',
  '<script>let t=0;document.getElementById("refresh").onclick=()=>{t++;document.getElementById("activity").textContent="Demo refreshed "+t+" time"+(t===1?"":"s")+"; no network request was made."}</script>'
 ].join('\n');
 if(kind==='form')return [
  '<section class="hero"><p class="eyebrow">CUSTOMER EXPERIENCE · DEMO</p><h1>'+name+'</h1><p>'+subtitle+'</p></section>',
  '<section class="surface"><h2>Get in touch</h2><form id="demo"><div class="fields"><label>Your name<input name="name" required placeholder="Full name" maxlength="100"></label><label>Your email<input name="email" type="email" required placeholder="you@example.com" maxlength="180"></label></div><label>Message<textarea name="message" rows="5" required maxlength="1000" placeholder="How can we help?"></textarea></label><button type="submit">Submit demo</button><p class="muted" id="reply" aria-live="polite">This form is a prototype; nothing is sent or stored.</p></form></section>',
  '<script>document.getElementById("demo").addEventListener("submit",e=>{e.preventDefault();document.getElementById("reply").textContent="Form validation passed. Demo only — no message was delivered."})</script>'
 ].join('\n');
 if(kind==='portfolio')return [
  '<section class="hero"><p class="eyebrow">CREATIVE PORTFOLIO</p><h1>'+name+'</h1><p>'+subtitle+'</p><a class="button" href="#work">Explore work</a></section>',
  '<section class="surface" id="work"><h2>Selected projects</h2><div class="grid"><article><b>01 / Discovery</b><p>Translate ideas into thoughtful experiences.</p></article><article><b>02 / Design</b><p>Create beautiful, usable interfaces.</p></article><article><b>03 / Delivery</b><p>Test and share prototypes with confidence.</p></article></div></section>'
 ].join('\n');
 return [
  '<section class="hero"><p class="eyebrow">IDEA → LIVE PREVIEW</p><h1>'+name+'</h1><p>'+subtitle+'</p><div class="inline"><a class="button" href="#features">Explore features</a><a class="quiet" href="#about">Learn more →</a></div></section>',
  '<section class="surface" id="features"><h2>Everything you need to begin</h2><div class="grid"><article><b>01 · Clarity</b><p>Simple, approachable by design.</p></article><article><b>02 · Momentum</b><p>Iterate quickly with a real preview.</p></article><article><b>03 · Ownership</b><p>Review the source and keep your code.</p></article></div></section>',
  '<section class="surface" id="about"><h2>Made for your idea</h2><p class="muted">This is a self-contained prototype. Personalize the text, colors and interactions in the source editor.</p></section>'
 ].join('\n');
}

export function buildVibeScaffold({title,brief,template}={}){
 const name=clean(title,80)||'My New App';
 const goal=clean(brief,1000)||'A beautiful and useful web application.';
 const kind=pickVibeTemplate(goal,template);
 const css=[
  ':root{color-scheme:dark;--bg:#071626;--panel:#0e2540;--edge:#24446a;--gold:#f4cf7b;--text:#f6f9ff;--muted:#b0c3d7}',
  '*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 85% 10%,#183f6b 0%,transparent 32%),linear-gradient(145deg,#061322,#0a203a);color:var(--text);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}',
  '.shell{width:min(1080px,calc(100% - 40px));margin:auto}.nav{padding:25px 0;display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid var(--edge)}.nav strong{letter-spacing:.09em;color:var(--gold)}.nav span{font-size:12px;color:var(--muted)}',
  '.hero{padding:80px 0 65px;max-width:850px}.eyebrow{font-size:12px;letter-spacing:.18em;font-weight:800;color:var(--gold)}h1{font-size:clamp(38px,6vw,78px);line-height:1.04;letter-spacing:-.045em;margin:15px 0}h2{font-size:clamp(23px,3vw,32px);margin:0 0 20px}.hero p:not(.eyebrow){color:var(--muted);font-size:18px;max-width:660px}',
  '.surface,.metrics article{background:#0e2540d9;border:1px solid var(--edge);border-radius:22px;padding:28px;margin:0 0 24px;box-shadow:0 12px 35px #0004}.grid,.metrics,.fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.grid article{border:1px solid var(--edge);border-radius:16px;padding:22px;background:#0a1c31}.grid b{color:var(--gold)}.grid p,.muted,small{color:var(--muted)}.metrics article{margin:0}.metrics{margin-bottom:24px}.metrics b{font-size:44px;display:block;color:var(--gold)}',
  'button,.button{display:inline-flex;justify-content:center;align-items:center;background:linear-gradient(110deg,#f4d58a,#c89849);color:#112237;border:0;border-radius:12px;padding:13px 21px;font-weight:800;cursor:pointer;text-decoration:none}.quiet{color:var(--gold);text-decoration:none}.inline{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.inline input{flex:1;min-width:170px}',
  'input,textarea,select{display:block;width:100%;margin:6px 0 18px;border:1px solid #456387;background:#08182c;color:white;border-radius:10px;padding:12px;font:inherit}label{display:block;color:var(--text)}.fields{grid-template-columns:repeat(2,minmax(0,1fr))}.items{list-style:none;padding:0}.items li{padding:10px 4px;border-bottom:1px solid var(--edge)}.items label{display:flex;align-items:center;gap:10px}.items input{width:19px;height:19px;margin:0;accent-color:#caa45d}.result{display:block;font-size:36px;color:var(--gold);padding:14px}.bars{height:170px;display:flex;align-items:end;gap:14px;padding:20px 0}.bars div{flex:1;background:linear-gradient(#f7d890,#376fbd);border-radius:8px 8px 0 0}',
  'footer{padding:35px 0;text-align:center;font-size:12px;color:var(--muted)}@media(max-width:650px){.hero{padding:55px 0 43px}.grid,.metrics,.fields{grid-template-columns:1fr}.surface{padding:20px}.shell{width:min(100% - 26px,1080px)}}'
 ].join('\n');
 return {
  title:name,template:kind,brief:goal,
  html:'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+
   escape(name)+'</title><style>'+css+'</style></head><body><div class="shell"><header class="nav"><strong>'+
   escape(name)+'</strong><span>Magnanimous prototype</span></header><main>'+
   templateBody(kind,name,goal)+'</main><footer>Built with Magnanimous AI · Demo prototype</footer></div></body></html>'
 };
}

function validHtml(value){
 if(typeof value!=='string'||value.length<40||value.length>MAX_HTML)return 'HTML must be between 40 and 65,536 characters.';
 if(!/<html\b/i.test(value)||!/<body\b/i.test(value)||!/<\/html\s*>/i.test(value))return 'Provide a complete HTML document with html, body and closing html tags.';
 if(/<\s*(?:iframe|object|embed|base)\b/i.test(value)||/<meta[^>]+http-equiv\s*=\s*["']?refresh/i.test(value))return 'Embedded frames, plugin objects, base redirects and refresh redirects are not supported in Vibe Studio.';
 if(/<script[^>]+\bsrc\s*=/i.test(value))return 'External script tags are not permitted in local Vibe Studio prototypes.';
 return '';
}
export function reviewVibeSource(html){
 const error=validHtml(html);return{valid:!error,error,preview_policy:'sandboxed-opaque-origin-CSP',production_ready:false,
  diagnostics:[
   {level:error?'error':'info',message:error||'Document structure accepted; live browser execution and accessibility still require review.'},
   {level:'notice',message:'No remote API, production database, paid service or live deployment is provided by this preview.'},
   {level:'notice',message:'Do not paste credentials, tokens, or private records into app source or AI refinement prompts.'}
  ]};
}


export function normalizeVibeFilePath(value){
 const path=String(value??'').trim();
 if(!path||path.length>160||path.startsWith('/')||path.endsWith('/')||path.includes('\\')||path.includes('\0')||path.includes('?')||path.includes('#'))return '';
 const segments=path.split('/');
 if(segments.some(part=>!part||part==='.'||part==='..'||part.startsWith('.')||! /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(part)))return '';
 const filename=segments[segments.length-1].toLowerCase();
 if(filename==='index.html'||filename==='package.json'||filename==='package-lock.json')return '';
 const ext=path.slice(path.lastIndexOf('.')).toLowerCase();
 return VIBE_FILE_EXTENSIONS.has(ext)?path:'';
}

export function validateVibeFileContent(path,content){
 if(!normalizeVibeFilePath(path))return 'Use a safe relative CSS, JavaScript, JSON or Markdown path. index.html is managed by the main editor.';
 if(typeof content!=='string')return 'File content must be text.';
 const bytes=new TextEncoder().encode(content).length;
 if(bytes>MAX_VIBE_FILE_BYTES)return 'Each additional file is limited to 65,536 UTF-8 bytes.';
 if(content.includes('\0'))return 'Null bytes are not supported.';
 const ext=path.slice(path.lastIndexOf('.')).toLowerCase();
 if(ext==='.json'){try{JSON.parse(content)}catch{return 'JSON fixture files must contain valid JSON.'}}
 if(ext==='.css'&&(/<\/style\s*>/i.test(content)||/@import\b/i.test(content)))return 'CSS files cannot break out of preview styles or import external stylesheets.';
 if(ext==='.js'&&/<\/script\s*>/i.test(content))return 'JavaScript files cannot contain a closing script tag that could break preview isolation.';
 if(ext==='.js'&&(/^\s*(?:import\s+|export\s+)/m.test(content)||/\bimport\s*\(/.test(content)||/\brequire\s*\(/.test(content)))return 'ES module imports and Node require are not supported in this static preview phase.';
 return '';
}

const projectPublic=row=>row&&({
 id:row.id,title:row.title,brief:row.brief,template:row.template,revision:Number(row.revision),
 created_at:Number(row.created_at),updated_at:Number(row.updated_at)
});
async function scopedProject(env,user,id){
 return env.DB.prepare('SELECT * FROM magnanimous_vibe_projects WHERE id=? AND tenant_id=? AND user_id=? LIMIT 1')
 .bind(id,String(user.tenant_id),String(user.id)).first();
}
const methodNotAllowed=()=>json({detail:'Unsupported Vibe Studio action.'},405);

export async function handleMagnanimousVibeStudio(request,env){
 const u=new URL(request.url),rawPath=u.pathname;
 const ownerPrefix='/api/magnanimous/vibe-studio',customerPrefix='/api/customer/code-studio';
 const customer=rawPath===customerPrefix||rawPath.startsWith(customerPrefix+'/');
 if(!customer&&rawPath!==ownerPrefix&&!rawPath.startsWith(ownerPrefix+'/'))return null;
 const p=customer?ownerPrefix+rawPath.slice(customerPrefix.length):rawPath;
 if(!env?.DB)return json({detail:'Magnanimous project database unavailable.'},503);
 if(!customer){const denied=await requirePlatformOwner(request,env);if(denied)return denied;}
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use your private coding workspace.'},401);
 if(customer){
  // Only Stripe-confirmed active paid subscriptions grant customer code storage.
  // This route exposes no GitHub App, shell runner, platform keys, deployment or owner API.
  const subscription=await tenantPlan(env,user.tenant_id);
  if(subscription.status!=='active'||Number(subscription.limits?.rank||0)<1){
   return json({detail:'An active paid Magnanimous plan is required for Customer Code Studio.',code:'PAID_PLAN_REQUIRED',upgrade_path:'/pricing'},402);
  }
 }
 try{
  if(p==='/api/magnanimous/vibe-studio'&&request.method==='GET')return json({policy:{...MAGNANIMOUS_VIBE_STUDIO_POLICY,owner_only:!customer,customer_workspace:customer,platform_repository_access:false,paid_active_subscription_required:customer},templates:[...kinds],limits:{max_projects:MAX_PROJECTS,max_html_bytes:MAX_HTML}});
  if(p==='/api/magnanimous/vibe-studio/review'&&request.method==='POST'){
   const b=await request.json().catch(()=>({}));return json(reviewVibeSource(b?.html));
  }
  if(p==='/api/magnanimous/vibe-studio/projects'){
   if(request.method==='GET'){
    const data=await env.DB.prepare('SELECT id,title,brief,template,revision,created_at,updated_at FROM magnanimous_vibe_projects WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT 25')
      .bind(String(user.tenant_id),String(user.id)).all();
    return json({projects:(data.results||[]).map(projectPublic)});
   }
   if(request.method==='POST'){
    const b=await request.json().catch(()=>({}));const title=clean(b.title,80),brief=clean(b.brief,1000);
    if(!title||!brief)return json({detail:'A title and natural-language app idea are required.'},400);
    const count=await env.DB.prepare('SELECT COUNT(*) as n FROM magnanimous_vibe_projects WHERE tenant_id=? AND user_id=?').bind(String(user.tenant_id),String(user.id)).first();
    if(Number(count?.n||0)>=MAX_PROJECTS)return json({detail:'The private prototype limit is 25. Export and archive a project before creating more.'},409);
    const scaffold=buildVibeScaffold({title,brief,template:b.template}),id=crypto.randomUUID(),timestamp=now();
    await env.DB.batch([
     env.DB.prepare('INSERT INTO magnanimous_vibe_projects(id,tenant_id,user_id,title,brief,template,html,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind(id,String(user.tenant_id),String(user.id),scaffold.title,scaffold.brief,scaffold.template,scaffold.html,1,timestamp,timestamp),
     env.DB.prepare('INSERT INTO magnanimous_vibe_versions(project_id,tenant_id,user_id,revision,html,note,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind(id,String(user.tenant_id),String(user.id),1,scaffold.html,'Original Magnanimous scaffold',timestamp)
    ]);
    return json({project:{id,revision:1,...scaffold,created_at:timestamp,updated_at:timestamp},saved:true,production_published:false},201);
   }
   return methodNotAllowed();
  }

  // Multi-file static project support. index.html remains in the legacy project row
  // so existing single-file projects and checkpoints stay backward compatible.
  const fileVersionMatch=p.match(/^\/api\/magnanimous\/vibe-studio\/projects\/([a-f0-9-]{36})\/files\/(.+)\/versions\/(\d+)$/);
  if(fileVersionMatch){
   if(request.method!=='GET')return methodNotAllowed();
   let filePath='';try{filePath=normalizeVibeFilePath(decodeURIComponent(fileVersionMatch[2]))}catch{return json({detail:'Invalid file path.'},400)}
   if(!filePath)return json({detail:'Invalid file path.'},400);
   const fileProject=await scopedProject(env,user,fileVersionMatch[1]);if(!fileProject)return json({detail:'Project not found.'},404);
   const row=await env.DB.prepare('SELECT path,revision,content,note,created_at FROM magnanimous_vibe_file_versions WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? AND revision=? LIMIT 1')
    .bind(fileProject.id,String(user.tenant_id),String(user.id),filePath,Number(fileVersionMatch[3])).first();
   return row?json({version:row}):json({detail:'File checkpoint not found.'},404);
  }
  const fileVersionsMatch=p.match(/^\/api\/magnanimous\/vibe-studio\/projects\/([a-f0-9-]{36})\/files\/(.+)\/versions$/);
  if(fileVersionsMatch){
   if(request.method!=='GET')return methodNotAllowed();
   let filePath='';try{filePath=normalizeVibeFilePath(decodeURIComponent(fileVersionsMatch[2]))}catch{return json({detail:'Invalid file path.'},400)}
   if(!filePath)return json({detail:'Invalid file path.'},400);
   const fileProject=await scopedProject(env,user,fileVersionsMatch[1]);if(!fileProject)return json({detail:'Project not found.'},404);
   const rows=await env.DB.prepare('SELECT path,revision,note,created_at FROM magnanimous_vibe_file_versions WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? ORDER BY revision DESC LIMIT 30')
    .bind(fileProject.id,String(user.tenant_id),String(user.id),filePath).all();
   return json({versions:rows.results||[]});
  }
  const filesCollectionMatch=p.match(/^\/api\/magnanimous\/vibe-studio\/projects\/([a-f0-9-]{36})\/files$/);
  if(filesCollectionMatch){
   const fileProject=await scopedProject(env,user,filesCollectionMatch[1]);if(!fileProject)return json({detail:'Project not found.'},404);
   if(request.method==='GET'){
    const rows=await env.DB.prepare('SELECT path,content,revision,created_at,updated_at,length(CAST(content AS BLOB)) AS bytes FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=? ORDER BY path LIMIT ?')
     .bind(fileProject.id,String(user.tenant_id),String(user.id),MAX_VIBE_FILES).all();
    const extraBytes=(rows.results||[]).reduce((sum,row)=>sum+Number(row.bytes||0),0);
    const baseBytes=new TextEncoder().encode(String(fileProject.html||'')).length;
    return json({files:rows.results||[],limits:{max_files:MAX_VIBE_FILES+1,max_file_bytes:MAX_VIBE_FILE_BYTES,max_project_bytes:MAX_VIBE_PROJECT_BYTES,used_bytes:baseBytes+extraBytes}});
   }
   if(request.method==='POST'){
    const b=await request.json().catch(()=>({})),path=normalizeVibeFilePath(b.path),source=String(b.content??''),error=validateVibeFileContent(path,source);
    if(error)return json({detail:error,code:'VIBE_FILE_INVALID'},400);
    const stamp=now(),tenant=String(user.tenant_id),owner=String(user.id);
    const results=await env.DB.batch([
     env.DB.prepare('INSERT INTO magnanimous_vibe_files(project_id,tenant_id,user_id,path,content,revision,created_at,updated_at) SELECT ?,?,?,?, ?,1,?,? WHERE EXISTS (SELECT 1 FROM magnanimous_vibe_projects p WHERE p.id=? AND p.tenant_id=? AND p.user_id=? AND (SELECT COUNT(*) FROM magnanimous_vibe_files f WHERE f.project_id=p.id AND f.tenant_id=p.tenant_id AND f.user_id=p.user_id)<? AND length(CAST(p.html AS BLOB))+COALESCE((SELECT SUM(length(CAST(f.content AS BLOB))) FROM magnanimous_vibe_files f WHERE f.project_id=p.id AND f.tenant_id=p.tenant_id AND f.user_id=p.user_id),0)+length(CAST(? AS BLOB))<=? AND NOT EXISTS (SELECT 1 FROM magnanimous_vibe_files f WHERE f.project_id=p.id AND f.tenant_id=p.tenant_id AND f.user_id=p.user_id AND f.path=?))')
      .bind(fileProject.id,tenant,owner,path,source,stamp,stamp,fileProject.id,tenant,owner,MAX_VIBE_FILES,source,MAX_VIBE_PROJECT_BYTES,path),
     env.DB.prepare('INSERT INTO magnanimous_vibe_file_versions(project_id,tenant_id,user_id,path,revision,content,note,created_at) SELECT project_id,tenant_id,user_id,path,revision,content,?,? FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? AND revision=1 AND NOT EXISTS (SELECT 1 FROM magnanimous_vibe_file_versions v WHERE v.project_id=? AND v.path=? AND v.revision=1)')
      .bind('Created file',stamp,fileProject.id,tenant,owner,path,fileProject.id,path),
     env.DB.prepare('UPDATE magnanimous_vibe_projects SET updated_at=? WHERE id=? AND tenant_id=? AND user_id=? AND EXISTS (SELECT 1 FROM magnanimous_vibe_files f WHERE f.project_id=? AND f.tenant_id=? AND f.user_id=? AND f.path=?)')
      .bind(stamp,fileProject.id,tenant,owner,fileProject.id,tenant,owner,path)
    ]);
    if(Number(results?.[0]?.meta?.changes||0)!==1){
     const existing=await env.DB.prepare('SELECT 1 AS found FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? LIMIT 1').bind(fileProject.id,tenant,owner,path).first();
     if(existing)return json({detail:'That file already exists. Open it and edit the existing file instead.',code:'VIBE_FILE_EXISTS'},409);
     const usage=await env.DB.prepare('SELECT (SELECT COUNT(*) FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=?) AS file_count,length(CAST(? AS BLOB))+COALESCE((SELECT SUM(length(CAST(content AS BLOB))) FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=?),0)+length(CAST(? AS BLOB)) AS projected_bytes')
      .bind(fileProject.id,tenant,owner,fileProject.html,fileProject.id,tenant,owner,source).first();
     if(Number(usage?.file_count||0)>=MAX_VIBE_FILES)return json({detail:'This project has reached its 20-file limit, including index.html.',code:'VIBE_FILE_LIMIT'},409);
     if(Number(usage?.projected_bytes||0)>MAX_VIBE_PROJECT_BYTES)return json({detail:'This project has reached its 256 KiB total source limit.',code:'VIBE_PROJECT_SIZE_LIMIT'},413);
     return json({detail:'The file could not be created. Reload the project and retry.',code:'VIBE_FILE_CREATE_CONFLICT'},409);
    }
    return json({file:{path,content:source,revision:1,created_at:stamp,updated_at:stamp},saved:true,production_published:false},201);
   }
   return methodNotAllowed();
  }
  const fileRouteMatch=p.match(/^\/api\/magnanimous\/vibe-studio\/projects\/([a-f0-9-]{36})\/files\/(.+)$/);
  if(fileRouteMatch){
   if(request.method!=='PUT')return methodNotAllowed();
   let filePath='';try{filePath=normalizeVibeFilePath(decodeURIComponent(fileRouteMatch[2]))}catch{return json({detail:'Invalid file path.'},400)}
   if(!filePath)return json({detail:'Invalid file path.'},400);
   const fileProject=await scopedProject(env,user,fileRouteMatch[1]);if(!fileProject)return json({detail:'Project not found.'},404);
   const b=await request.json().catch(()=>({})),source=String(b.content??''),error=validateVibeFileContent(filePath,source);
   if(error)return json({detail:error,code:'VIBE_FILE_INVALID'},400);
   const current=await env.DB.prepare('SELECT path,content,revision,created_at,updated_at FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? LIMIT 1')
    .bind(fileProject.id,String(user.tenant_id),String(user.id),filePath).first();
   if(!current)return json({detail:'File not found. Create it before editing.',code:'VIBE_FILE_NOT_FOUND'},404);
   const expected=Number(b.expected_revision);
   if(!Number.isSafeInteger(expected)||expected<1)return json({detail:'Expected file revision is required.'},400);
   if(expected!==Number(current.revision))return json({detail:'A newer file checkpoint exists. Reload before saving.',code:'VIBE_FILE_REVISION_CONFLICT',current_revision:current.revision},409);
   const usage=await env.DB.prepare('SELECT length(CAST(? AS BLOB))+COALESCE((SELECT SUM(length(CAST(content AS BLOB))) FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=?),0) AS total_bytes')
    .bind(fileProject.html,fileProject.id,String(user.tenant_id),String(user.id)).first();
   const projected=Number(usage?.total_bytes||0)-new TextEncoder().encode(String(current.content||'')).length+new TextEncoder().encode(source).length;
   if(projected>MAX_VIBE_PROJECT_BYTES)return json({detail:'This project has reached its 256 KiB total source limit.',code:'VIBE_PROJECT_SIZE_LIMIT'},413);
   if(source===current.content)return json({file:current,saved:false,unchanged:true});
   const stamp=now(),tenant=String(user.tenant_id),owner=String(user.id),next=expected+1;
   const results=await env.DB.batch([
    env.DB.prepare('UPDATE magnanimous_vibe_files SET content=?,revision=revision+1,updated_at=? WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? AND revision=? AND length(CAST((SELECT p.html FROM magnanimous_vibe_projects p WHERE p.id=? AND p.tenant_id=? AND p.user_id=?) AS BLOB))+COALESCE((SELECT SUM(length(CAST(f.content AS BLOB))) FROM magnanimous_vibe_files f WHERE f.project_id=? AND f.tenant_id=? AND f.user_id=?),0)-length(CAST(content AS BLOB))+length(CAST(? AS BLOB))<=?')
     .bind(source,stamp,fileProject.id,tenant,owner,filePath,expected,fileProject.id,tenant,owner,fileProject.id,tenant,owner,source,MAX_VIBE_PROJECT_BYTES),
    env.DB.prepare('INSERT INTO magnanimous_vibe_file_versions(project_id,tenant_id,user_id,path,revision,content,note,created_at) SELECT project_id,tenant_id,user_id,path,revision,content,?,? FROM magnanimous_vibe_files WHERE project_id=? AND tenant_id=? AND user_id=? AND path=? AND revision=? AND NOT EXISTS (SELECT 1 FROM magnanimous_vibe_file_versions v WHERE v.project_id=? AND v.path=? AND v.revision=?)')
     .bind(clean(b.note,200)||'Edited file',stamp,fileProject.id,tenant,owner,filePath,next,fileProject.id,filePath,next),
    env.DB.prepare('UPDATE magnanimous_vibe_projects SET updated_at=? WHERE id=? AND tenant_id=? AND user_id=? AND EXISTS (SELECT 1 FROM magnanimous_vibe_files f WHERE f.project_id=? AND f.tenant_id=? AND f.user_id=? AND f.path=? AND f.revision=?)')
     .bind(stamp,fileProject.id,tenant,owner,fileProject.id,tenant,owner,filePath,next)
   ]);
   if(Number(results?.[0]?.meta?.changes||0)!==1){
    const latestUsage=await env.DB.prepare('SELECT length(CAST(p.html AS BLOB))+COALESCE((SELECT SUM(length(CAST(f.content AS BLOB))) FROM magnanimous_vibe_files f WHERE f.project_id=p.id AND f.tenant_id=p.tenant_id AND f.user_id=p.user_id),0) AS total_bytes FROM magnanimous_vibe_projects p WHERE p.id=? AND p.tenant_id=? AND p.user_id=?')
     .bind(fileProject.id,tenant,owner).first();
    const latestProjected=Number(latestUsage?.total_bytes||0)-new TextEncoder().encode(String(current.content||'')).length+new TextEncoder().encode(source).length;
    if(latestProjected>MAX_VIBE_PROJECT_BYTES)return json({detail:'This project has reached its 256 KiB total source limit.',code:'VIBE_PROJECT_SIZE_LIMIT'},413);
    return json({detail:'Concurrent file edit detected. Reload and compare before saving.',code:'VIBE_FILE_REVISION_CONFLICT'},409);
   }
   return json({file:{path:filePath,content:source,revision:next,created_at:Number(current.created_at),updated_at:stamp},saved:true,production_published:false});
  }

  const version=p.match(/^\/api\/magnanimous\/vibe-studio\/projects\/([a-f0-9-]{36})\/versions\/(\d+)$/);
  if(version){
   if(request.method!=='GET')return methodNotAllowed();
   const project=await scopedProject(env,user,version[1]);if(!project)return json({detail:'Project not found.'},404);
   const row=await env.DB.prepare('SELECT html,revision,note,created_at FROM magnanimous_vibe_versions WHERE project_id=? AND tenant_id=? AND user_id=? AND revision=? LIMIT 1')
    .bind(project.id,String(user.tenant_id),String(user.id),Number(version[2])).first();
   return row?json({version:row}):json({detail:'Checkpoint not found.'},404);
  }
  const route=p.match(/^\/api\/magnanimous\/vibe-studio\/projects\/([a-f0-9-]{36})$/);
  if(!route)return json({detail:'Unknown Vibe Studio route.'},404);
  const project=await scopedProject(env,user,route[1]);if(!project)return json({detail:'Project not found.'},404);
  if(request.method==='GET'){
   const results=await env.DB.prepare('SELECT revision,note,created_at FROM magnanimous_vibe_versions WHERE project_id=? AND tenant_id=? AND user_id=? ORDER BY revision DESC LIMIT 30')
    .bind(project.id,String(user.tenant_id),String(user.id)).all();
   return json({project:{...projectPublic(project),html:project.html},versions:results.results||[]});
  }
  if(request.method!=='PUT')return methodNotAllowed();
  const b=await request.json().catch(()=>({}));
  const source=String(b.html??''),error=validHtml(source);
  if(error)return json({detail:error,code:'VIBE_SOURCE_INVALID'},400);
  const expected=Number(b.expected_revision),note=clean(b.note,200)||'Manual source edit';
  if(!Number.isSafeInteger(expected)||expected<MIN_REVISION)return json({detail:'Expected revision is required.'},400);
  if(expected!==Number(project.revision))return json({detail:'A newer version exists. Reload before saving to avoid overwriting another device.',code:'VIBE_REVISION_CONFLICT',current_revision:project.revision},409);
  if(source===project.html)return json({project:{...projectPublic(project),html:project.html},saved:false,unchanged:true});
  const stamp=now();
  const steps=await env.DB.batch([
   env.DB.prepare('UPDATE magnanimous_vibe_projects SET html=?,revision=revision+1,updated_at=? WHERE id=? AND tenant_id=? AND user_id=? AND revision=?')
    .bind(source,stamp,project.id,String(user.tenant_id),String(user.id),expected),
   env.DB.prepare('INSERT INTO magnanimous_vibe_versions(project_id,tenant_id,user_id,revision,html,note,created_at) SELECT p.id,p.tenant_id,p.user_id,p.revision,p.html,?,? FROM magnanimous_vibe_projects p WHERE p.id=? AND p.tenant_id=? AND p.user_id=? AND p.revision=? AND NOT EXISTS (SELECT 1 FROM magnanimous_vibe_versions v WHERE v.project_id=p.id AND v.revision=p.revision)')
    .bind(note,stamp,project.id,String(user.tenant_id),String(user.id),expected+1)
  ]);
  if(Number(steps?.[0]?.meta?.changes||0)!==1)return json({detail:'Concurrent edit detected; reload and compare before saving.',code:'VIBE_REVISION_CONFLICT'},409);
  return json({project:{...projectPublic(project),html:source,revision:expected+1,updated_at:stamp},saved:true,production_published:false});
 }catch(error){
  console.error('Magnanimous private Vibe Studio operation failed',String(error?.message||error).slice(0,240));
  return json({detail:'Vibe Studio could not complete this request. Check that migration 0109 is applied and retry.',code:'VIBE_STUDIO_UNAVAILABLE'},503);
 }
}

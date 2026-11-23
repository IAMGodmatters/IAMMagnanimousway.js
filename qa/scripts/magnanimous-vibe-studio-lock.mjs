import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildVibeScaffold,pickVibeTemplate,reviewVibeSource,normalizeVibeFilePath,validateVibeFileContent,readBoundedVibeJson,MAGNANIMOUS_VIBE_STUDIO_POLICY} from '../../worker/src/magnanimous-vibe-studio.js';

const read=path=>readFileSync(path,'utf8');
assert.equal(MAGNANIMOUS_VIBE_STUDIO_POLICY.identity,'Magnanimous AI');
assert.equal(MAGNANIMOUS_VIBE_STUDIO_POLICY.native_first,true);
assert.equal(MAGNANIMOUS_VIBE_STUDIO_POLICY.owner_only,true);
assert.equal(MAGNANIMOUS_VIBE_STUDIO_POLICY.production_publish,false);
assert.equal(MAGNANIMOUS_VIBE_STUDIO_POLICY.repository_write,false);
assert.equal(MAGNANIMOUS_VIBE_STUDIO_POLICY.paid_provider_required,false);

for(const [goal,expected] of [
 ['Build a task checklist for my volunteers','tasks'],
 ['Make a dashboard showing monthly metrics','dashboard'],
 ['A contact form to collect inquiries','form'],
 ['A calculator with addition and subtraction','calculator'],
 ['Personal portfolio showcase','portfolio'],
 ['A landing page for our ministry','landing']
 ])assert.equal(pickVibeTemplate(goal),expected,goal);

for(const kind of ['landing','dashboard','tasks','calculator','form','portfolio']){
 const project=buildVibeScaffold({title:'My <script>alert(1)</script> app',brief:'Create an app with <img src=x onerror=alert(1)>',template:kind});
 assert.equal(project.template,kind);
 assert.ok(project.html.startsWith('<!doctype html>'),kind);
 assert.ok(project.html.includes('</html>'),kind);
 assert.ok(project.html.includes('@media(max-width:650px)'),kind+' must be responsive');
 assert.ok(!project.html.includes('<script>alert(1)</script>'),kind+' must escape user title');
 assert.ok(project.html.includes('&lt;script&gt;'),kind+' must escape user input');
 assert.equal(reviewVibeSource(project.html).valid,true,kind+' scaffold must pass validation');
}
const task=buildVibeScaffold({title:'Tasks',brief:'to-do organizer'});
assert.ok(task.html.includes('document.createElement("li")'),'Tasks scaffold must actually add items.');
assert.ok(task.html.includes('addEventListener("keydown"'),'Task scaffold must support keyboard use.');
const calc=buildVibeScaffold({title:'Calculator',brief:'calculator'});
assert.ok(calc.html.includes('Cannot divide by zero'),'Calculator must handle zero divisor.');
const form=buildVibeScaffold({title:'Contact',brief:'form'});
assert.ok(form.html.includes('Demo only'),'Form must not imply a live network submission.');
const negative=[
 'not html',
 '<!doctype html><html><body><iframe src="https://example.com"></iframe></body></html>',
 '<html><body><script src="https://example.com/x.js"></script></body></html>',
 '<html><body><meta http-equiv="refresh" content="0;url=https://example.com"></body></html>',
 'x'.repeat(65537)
];
for(const source of negative)assert.equal(reviewVibeSource(source).valid,false,'Reject structurally invalid/unsafe source.');
assert.equal(reviewVibeSource('<html><body>Hello world! This is a full preview document.</body></html>').valid,true);
assert.equal(reviewVibeSource('<html><body>Hello world! This is a full preview document.</body></html>').production_ready,false);

const migration=read('worker/migrations/0109_magnanimous_vibe_studio.sql');
for(const word of ['magnanimous_vibe_projects','magnanimous_vibe_versions','tenant_id','user_id','PRIMARY KEY (project_id,revision)'])
 assert.ok(migration.includes(word),'D1 migration missing '+word);
const multiMigration=read('worker/migrations/0113_magnanimous_vibe_multifile.sql');
for(const word of ['magnanimous_vibe_files','magnanimous_vibe_file_versions','PRIMARY KEY (project_id, path)','PRIMARY KEY (project_id, path, revision)','tenant_id','user_id','ON DELETE CASCADE'])
 assert.ok(multiMigration.includes(word),'Multi-file Vibe Studio migration missing '+word);
assert.equal(normalizeVibeFilePath('styles.css'),'styles.css');
assert.equal(normalizeVibeFilePath('src/app.js'),'src/app.js');
assert.equal(normalizeVibeFilePath('fixtures/demo.json'),'fixtures/demo.json');
for(const path of ['/src/app.js','../secret.js','src/../secret.js','src\\\\app.js','index.html','.env','package.json','src/.secret.js','src/app.exe'])
 assert.equal(normalizeVibeFilePath(path),'','Unsafe or unsupported project file path must be rejected: '+path);
assert.equal(validateVibeFileContent('fixtures/demo.json','{"ok":true}'),'');
assert.ok(validateVibeFileContent('fixtures/demo.json','{'),'Invalid JSON fixtures must be rejected.');
assert.ok(validateVibeFileContent('styles.css','@import url(https://example.com/a.css);'),'External CSS imports must be rejected.');
assert.ok(validateVibeFileContent('styles.css','</style><script>alert(1)</script>'),'CSS breakout must be rejected.');
assert.ok(validateVibeFileContent('app.js','</script><script>alert(1)</script>'),'Script breakout must be rejected.');
assert.ok(validateVibeFileContent('app.js','import React from \'react\';'),'Static JavaScript must not imply module or package installation support.');
assert.ok(validateVibeFileContent('app.js','const fs = require(\'node:fs\');'),'Node require must not be advertised as a browser preview capability.');
assert.ok(validateVibeFileContent('app.js','é'.repeat(32769)),'UTF-8 file byte limits must be enforced.');
assert.equal(validateVibeFileContent('notes.md','# Private notes'),'');
assert.equal(normalizeVibeFilePath(42),'','File paths must be supplied as strings.');
assert.ok(validateVibeFileContent('app.js',42),'Non-string file content must be rejected.');
assert.ok(validateVibeFileContent('styles.css','</style data-breakout="yes">'),'Malformed HTML style end tags must be rejected.');
assert.ok(validateVibeFileContent('app.js','</script data-breakout="yes">'),'Malformed HTML script end tags must be rejected.');
assert.ok(validateVibeFileContent('app.js','const value = "\u0001";'),'Unsupported control characters must be rejected.');

const boundedRequest=await readBoundedVibeJson(new Request('https://example.test/files',{method:'POST',body:JSON.stringify({path:'app.js',content:'console.log("ok")'})}));
assert.equal(boundedRequest.ok,true,'Bounded JSON reader must accept a valid small request.');
assert.equal(boundedRequest.value.content,'console.log("ok")');
const oversizedRequest=await readBoundedVibeJson(new Request('https://example.test/files',{method:'POST',body:'{"content":"123456789"}'}),8);
assert.equal(oversizedRequest.ok,false,'Bounded JSON reader must stop oversized streaming bodies.');
assert.equal(oversizedRequest.code,'VIBE_REQUEST_TOO_LARGE');
const invalidJsonRequest=await readBoundedVibeJson(new Request('https://example.test/files',{method:'POST',body:'{'}));
assert.equal(invalidJsonRequest.ok,false,'Bounded JSON reader must reject malformed JSON.');


const runtime=read('worker/src/magnanimous-vibe-studio.js');
for(const word of ['requirePlatformOwner(request,env)','currentUser(request,env)','env.DB.batch([','tenant_id=? AND user_id=?','expected_revision','VIBE_REVISION_CONFLICT','NOT EXISTS (SELECT 1 FROM magnanimous_vibe_versions','MAX_HTML=65536','MAX_PROJECTS=25'])
 assert.ok(runtime.includes(word),'Vibe Studio runtime safety contract missing '+word);
assert.ok(!runtime.includes('eval('),'Server must never eval prototype source.');
assert.ok(!runtime.includes('new Function('),'Server must never compile prototype source.');
assert.ok(!runtime.includes('execSync('),'Server must never run arbitrary code.');
const operations=read('worker/src/operations-entrypoint.js');
assert.ok(operations.includes('handleMagnanimousVibeStudio(request,env)'),'Vibe Studio API must be live-routed behind the security entrypoint.');
const frontend=read('frontend/app/vibe-studio/VibeStudioClient.tsx');
assert.ok(read('frontend/app/vibe-studio/page.tsx').includes('<MagnanimousVibeStudio />'),'Owner route must render the secured client.');
for(const word of ['getPlatformAuthToken','sandbox="allow-scripts"','referrerPolicy="no-referrer"','Content-Security-Policy','connect-src &#39;none&#39;','form-action &#39;none&#39;','/api/magnanimous/compute-accelerator','Request AI Draft','Review before applying','Save Checkpoint','Export HTML','expected_revision','/versions/'])
 assert.ok(frontend.includes(word),'Vibe Studio UI safety feature missing '+word);
assert.ok(!frontend.includes('dangerouslySetInnerHTML'),'Never inject prototype source into the parent app.');
assert.ok(!frontend.includes('allow-same-origin'),'Preview must use an opaque origin.');
assert.ok(!frontend.includes('allow-top-navigation'),'Preview must not navigate top app.');
assert.ok(!frontend.includes('allow-popups'),'Preview must not open additional browser windows.');
assert.ok(read('frontend/public/robots.txt').includes('Disallow: /vibe-studio/'),'Owner Vibe Studio must not be indexed.');
assert.ok(read('frontend/app/owner-center/page.tsx').includes('href="/vibe-studio"'),'Owner center link required.');
assert.ok(read('frontend/app/god-coding/page.tsx').includes('href="/vibe-studio"'),'God Coding handoff link required.');
assert.ok(read('worker/src/magnanimous-agent-skills.js').includes("name:'vibe-coding-studio'"),'Native vibe Agent Skill required.');
assert.ok(read('worker/src/magnanimous-dev-agent.js').includes("id:'vibe-safe-release'"),'Dev Agent safe release skill required.');

for(const word of ['MAX_VIBE_FILES=19','MAX_VIBE_FILE_BYTES=65536','MAX_VIBE_PROJECT_BYTES=262144','normalizeVibeFilePath','validateVibeFileContent','magnanimous_vibe_files','magnanimous_vibe_file_versions','tenant_id=? AND user_id=?','VIBE_FILE_REVISION_CONFLICT','VIBE_PROJECT_SIZE_LIMIT'])
 assert.ok(runtime.includes(word),'Multi-file Vibe Studio runtime contract missing '+word);
assert.ok(!runtime.includes('DELETE FROM magnanimous_vibe_files'),'File history must not be silently deleted.');
assert.ok(runtime.includes('v.tenant_id=? AND v.user_id=?'),'File version existence checks must remain tenant/user scoped.');
assert.ok(runtime.includes('UPDATE magnanimous_vibe_projects SET html=?,revision=revision+1,updated_at=? WHERE id=? AND tenant_id=? AND user_id=? AND revision=? AND length(CAST(? AS BLOB))'),'Legacy index.html saves must enforce the combined project byte limit inside the database update.');
assert.ok(runtime.includes('Check that the required Vibe Studio migrations are applied'),'Migration failure diagnostics must mention the required schema.');
const filesClient=read('frontend/app/vibe-studio/files/VibeStudioFilesClient.tsx');
assert.ok(filesClient.includes('function inlineScriptJson(value:unknown)'),'Preview must use a dedicated safe inline-JSON serializer.');
assert.ok(filesClient.includes('http-equiv\\s*=\\s*'),'CSP meta-tag filtering must recognize normal HTML whitespace.');
assert.ok(filesClient.includes("output=output.replace(/<head\\b[^>]*>/i"),'The restrictive CSP must be inserted into the actual document head.');
assert.ok(filesClient.includes("output=output.replace(/<html\\b[^>]*>/i,match=>match+'<head></head>')"),'Documents without a head must receive a head without nesting a second html document.');
assert.ok(filesClient.includes(".replace(/</g,'\\\\u003c')"),'Inline JSON must use one JavaScript Unicode escape so fixture values round-trip exactly.');
assert.ok(filesClient.includes('style.textContent=file.content'),'CSS source must be inserted through DOM textContent, not HTML markup concatenation.');
assert.ok(filesClient.includes('script.textContent=file.content'),'JavaScript source must be inserted through DOM textContent, not HTML markup concatenation.');
assert.ok(filesClient.includes('inlineScriptJson(fixtures)'),'JSON fixtures must be safely serialized into the isolated preview.');
assert.ok(filesClient.includes('aria-keyshortcuts="Control+S Meta+S Control+Enter Meta+Enter"'),'The editor must advertise accessible save and preview shortcuts.');
assert.ok(filesClient.includes("e.key.toLowerCase()==='s'"),'Control/Command+S must save a new checkpoint.');
assert.ok(filesClient.includes("e.key==='Enter'"),'Control/Command+Enter must refresh the isolated preview.');
assert.ok(filesClient.includes("aria-current={selectedPath===file.path?'page':undefined}"),'The active file must be exposed to assistive technology.');
const fixturePayload=JSON.stringify({fixture:'</script>'}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
assert.ok(!fixturePayload.includes('</script>'),'Serialized fixture data must not contain a parser-visible script end tag.');
assert.deepEqual(JSON.parse(fixturePayload),{fixture:'</script>'},'Serialized fixture data must round-trip without changing values.');

for(const word of ['getPlatformAuthToken','sandbox="allow-scripts"','connect-src &#39;none&#39;','MAGNANIMOUS_FIXTURES','zipStore','crc32','/files/','/versions','Save file','Export ZIP'])
 assert.ok(filesClient.includes(word),'Multi-file Vibe Studio UI feature missing '+word);
assert.ok(!filesClient.includes('dangerouslySetInnerHTML'),'Multi-file source must never be injected into the parent app.');
assert.ok(read('frontend/app/vibe-studio/files/page.tsx').includes('<VibeStudioFilesClient />'),'Multi-file workspace route must render its authenticated client.');
assert.ok(read('frontend/app/vibe-studio/page.tsx').includes('href="/vibe-studio/files"'),'Single-file Vibe Studio must link to the multi-file workspace.');
assert.ok(read('frontend/app/vibe-studio/files/vibe-files.css').includes('@media(max-width:520px)'),'Multi-file workspace must have a mobile layout.');

console.log('Magnanimous Vibe Studio: PASS — single-file prototypes, tenant-scoped multi-file source, per-file checkpoints, ZIP export, opaque-origin preview and no-spend release boundary.');

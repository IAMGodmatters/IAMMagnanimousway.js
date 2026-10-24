import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildVibeScaffold,pickVibeTemplate,reviewVibeSource,MAGNANIMOUS_VIBE_STUDIO_POLICY} from '../../worker/src/magnanimous-vibe-studio.js';

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
const runtime=read('worker/src/magnanimous-vibe-studio.js');
for(const word of ['requirePlatformOwner(request,env)','currentUser(request,env)','env.DB.batch([','tenant_id=? AND user_id=?','expected_revision','VIBE_REVISION_CONFLICT','MAX_HTML=65536','MAX_PROJECTS=25'])
 assert.ok(runtime.includes(word),'Vibe Studio runtime safety contract missing '+word);
assert.ok(!runtime.includes('eval('),'Server must never eval prototype source.');
assert.ok(!runtime.includes('new Function('),'Server must never compile prototype source.');
assert.ok(!runtime.includes('execSync('),'Server must never run arbitrary code.');
const operations=read('worker/src/operations-entrypoint.js');
assert.ok(operations.includes('handleMagnanimousVibeStudio(request,env)'),'Vibe Studio API must be live-routed behind the security entrypoint.');
const frontend=read('frontend/app/vibe-studio/page.tsx');
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
console.log('Magnanimous Vibe Studio: PASS — original runnable scaffolds, opaque-origin preview, owner D1 projects, checkpoint review and no-spend release boundary.');

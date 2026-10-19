import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('frontend/app/orca-workbench/page.tsx','utf8');
const controls=fs.readFileSync('frontend/app/orca-workbench/live-operations.tsx','utf8');
const gateway=fs.readFileSync('worker/src/magnanimous-tool-gateway.js','utf8');
const dev=fs.readFileSync('worker/src/magnanimous-dev-agent.js','utf8');
const review=fs.readFileSync('qa/scripts/magnanimous-mcp-manifest-guard-lock.mjs','utf8');
assert.ok(ui.includes("import OrcaLiveOperations from './live-operations'"));
assert.ok(ui.includes('<OrcaLiveOperations plan={planResult?.tasks?planResult:null}/>'));
assert.ok(controls.startsWith("'use client'"));
for(const route of [
 '/api/magnanimous/dev-agent/actions',
 '/api/magnanimous/tools/register',
 '/api/magnanimous/tools/manifest-reviews',
 '/api/magnanimous/tools/discover',
 '/api/magnanimous/tools/call'
])assert.ok(controls.includes(route),'Missing live owner action '+route);
for(const action of ["'create_branch'","'upsert_file'","'create_pr'"]){
 assert.ok(controls.includes(action),'Missing live GitHub developer action '+action);
 assert.ok(dev.includes("action==="+action),'Action must be delegated to existing secured Dev Agent.');
}
assert.ok(controls.includes("response.status==='completed'"),'UI cannot claim work completed before provider confirmation.');
assert.ok(controls.includes('needs_confirmation')||controls.includes('Stage GitHub branch creation'),'Writes must be staged, not directly committed.');
assert.ok(controls.includes('/confirm'),'Separate user approval must be required.');
assert.ok(controls.includes('setStaged(null)'),'User can decline staged mutation.');
assert.ok(controls.includes('replacementVerified'),'Replacing source requires explicit user review.');
assert.ok(controls.includes('task.files.includes(path)'),'File changes must match the selected task scope.');
assert.ok(controls.includes('confirmedManifest'),'Registering unknown MCP servers needs user consent.');
assert.ok(controls.includes('callApproved'),'Live MCP call needs explicit argument and cost review.');
assert.ok(controls.includes('server_id:selectedTool.server_id'),'Live call is scoped to a specifically selected enabled tool.');
assert.ok(controls.includes("type=\"password\""),'Provider tokens must not be rendered in visible text.');
assert.ok(!controls.includes('localStorage.setItem'),'Do not persist provider secrets in browser storage.');
assert.ok(gateway.includes('// Never implicitly activate unreviewed tools'),'MCP must start disabled.');
assert.ok(gateway.includes("h.includes(':')")&&gateway.includes("h.endsWith('.internal')"),'Blocked IP literals/private hostnames must not be used for credentialed MCP.');
assert.ok(gateway.includes('Credentialed MCP redirect across origins is blocked.'),'Bearer authorization must not follow cross-origin redirects.');
assert.ok(gateway.includes('if(same){')&&gateway.includes('Preserve pending review during refresh'),'Pending manager approval must survive rediscovery.');

assert.ok(!gateway.includes('if(!row&&known.size===0)'),'First catalog must be quarantined.');
assert.ok(gateway.includes("'manifest-review-required'")&&gateway.includes('enabled=0'),'Every new or modified tool must be queued for review.');
assert.ok(gateway.includes("if(!isManager(user))"),'Tool approvals require owner/admin.');
assert.ok(review.includes('fresh MCP server catalog must never auto-enable tools'),'Manifest QA must cover first registration.');
assert.ok(controls.includes('@media(max-width:760px)'),'Live controls must be usable on narrow phones.');
assert.ok(controls.includes('aria-live="polite"')&&controls.includes('focus-visible'),'Action status must be accessible.');
console.log('Magnanimous Orca live owner controls and first-catalog quarantine: PASS');

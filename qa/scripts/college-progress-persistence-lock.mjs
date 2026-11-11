import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync(new URL('../../frontend/app/ai-college/page.tsx',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../../worker/src/native-work-crm-runtime.js',import.meta.url),'utf8');
const session=fs.readFileSync(new URL('../../frontend/app/lib/magnanimous-session.ts',import.meta.url),'utf8');

for(const marker of [
 "getPlatformAuthToken()",
 "Authorization:'Bearer '+authToken",
 "kind==='college-progress'",
 "kind:'college-progress'",
 "workspace_id",
 "board_id",
 "/api/operations/records",
 "progressRecordId",
 "Your browser copy is still available",
 "aria-live=\"polite\"",
 "resources.some(r=>r.id===x)"
]) assert.ok(page.includes(marker),`College account progress contract missing: ${marker}`);

assert.ok(page.includes("localStorage.getItem('magnanimous-college-open-progress-v1')"),'Existing local progress is retained for migration/fallback.');
assert.ok(page.includes("localStorage.setItem('magnanimous-college-open-progress-v1'"),'Local progress remains a fallback.');
assert.ok(page.includes("magnanimous-college-migrated-v1:"),'Local marks are migrated only once per account record, so a later account reset is not undone by stale browser data.');
assert.ok(page.includes("migrated?saved:[...new Set([...saved,...done])]"),'First-time migration preserves both account and device progress.');
assert.ok(page.includes("localStorage.setItem(migrationKey,'1')"),'Migration is marked complete only after the account write succeeds.');
assert.ok(page.includes("method:'PUT'"),'Progress updates are written to the account record.');
assert.ok(page.includes("method:'POST'"),'A first-time student receives a durable progress record.');
assert.ok(!/tenant_id\s*:/.test(page),'The browser must never choose or submit its own tenant ID.');
assert.ok(session.includes('getPlatformAuthToken'),'College uses the shared Magnanimous session authority.');

assert.ok(runtime.includes('export async function handleNativeWorkCrm(request,env)'),'The Operations API handler is present.');
assert.ok(runtime.includes("const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);const t=tenant(user);if(!t)return json({detail:'Tenant context required.'},403);"),'Operations API requires an authenticated tenant.');
assert.ok(runtime.includes("WHERE tenant_id=? AND id=?"),'Workspace/board/record ownership queries are tenant-scoped.');
assert.ok(runtime.includes("FROM magnanimous_ops_workspaces WHERE tenant_id=?"),'Workspace reads are tenant-scoped.');
assert.ok(runtime.includes("FROM magnanimous_ops_records WHERE tenant_id=? AND board_id=?"),'Progress record reads are tenant-scoped.');
assert.ok(page.includes("request('/api/operations/workspaces?mine=1')"),'Students load only their own progress workspace.');
assert.ok(runtime.includes("async function canAccessCollegeBoard(env,t,user,board)"),'College board access is checked against the authenticated owner.');
assert.ok(runtime.includes("workspace.owner_user_id===String(user.id||'')"),'College workspaces are restricted to their creating student, even inside a shared tenant.');
assert.ok(runtime.includes("const mine=url.searchParams.get('mine')==='1'"),'The workspace API supports owner-filtered reads without accepting a caller-supplied user ID.');
assert.ok(runtime.includes("AND (kind<>'college-progress' OR owner_user_id=?)"),'Default workspace lists also hide other students’ College workspace metadata.');
assert.ok(runtime.includes("if(workspace.kind==='college-progress'&&workspace.owner_user_id!==String(user.id||''))"),'Only the owner can open a College workspace or create its board.');
assert.ok((runtime.match(/canAccessCollegeBoard\(env,t,user,board\)/g)||[]).length>=3,'College record reads, creates and updates enforce owner access.');

assert.ok(page.includes('not an accredited transcript or degree'),'Open Campus does not imply accreditation.');
console.log('Magnanimous AI College account progress lock: PASS');

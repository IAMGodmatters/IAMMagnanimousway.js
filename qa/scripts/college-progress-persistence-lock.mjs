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
assert.ok(page.includes("setDone(saved)"),'A signed-in account restores its saved study marks.');
assert.ok(page.includes("method:'PUT'"),'Progress updates are written to the account record.');
assert.ok(page.includes("method:'POST'"),'A first-time student receives a durable progress record.');
assert.ok(!/tenant_id\s*:/.test(page),'The browser must never choose or submit its own tenant ID.');
assert.ok(session.includes('getPlatformAuthToken'),'College uses the shared Magnanimous session authority.');

assert.ok(runtime.includes('export async function handleNativeWorkCrm(request,env)'),'The Operations API handler is present.');
assert.ok(runtime.includes("const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);const t=tenant(user);if(!t)return json({detail:'Tenant context required.'},403);"),'Operations API requires an authenticated tenant.');
assert.ok(runtime.includes("WHERE tenant_id=? AND id=?"),'Workspace/board/record ownership queries are tenant-scoped.');
assert.ok(runtime.includes("FROM magnanimous_ops_workspaces WHERE tenant_id=?"),'Workspace reads are tenant-scoped.');
assert.ok(runtime.includes("FROM magnanimous_ops_records WHERE tenant_id=? AND board_id=?"),'Progress record reads are tenant-scoped.');
assert.ok(page.includes('not an accredited transcript or degree'),'Open Campus does not imply accreditation.');
console.log('Magnanimous AI College account progress lock: PASS');

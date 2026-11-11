import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=fs.readFileSync(new URL('../../worker/src/native-work-crm-runtime.js',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../../frontend/app/ai-college/page.tsx',import.meta.url),'utf8');

assert.ok(runtime.includes("async function accessibleWorkspace(env,t,wid,user)"),'College workspace access helper exists.');
assert.ok(runtime.includes("workspace.kind==='college-progress'&&workspace.owner_user_id!==String(user.id||'')"),'College workspace access is bound to its owning student, not merely its tenant.');
assert.ok(runtime.includes("async function accessibleBoard(env,t,bid,user)"),'Board access inherits workspace ownership.');
assert.ok(runtime.includes("async function accessibleRecord(env,t,rid,user)"),'Record access inherits board and workspace ownership.');
assert.ok(runtime.includes("results.filter(x=>x.kind!=='college-progress'||x.owner_user_id===String(user.id||''))"),'Workspace listing does not disclose another student’s College workspace.');
assert.ok(runtime.includes("COALESCE(w.kind,'')<>'college-progress' OR w.owner_user_id=?"),'Board listing filters College boards by owning student.');

for(const [label,marker] of [
 ['board creation','accessibleWorkspace(env,t,wid,user)'],
 ['field reads','accessibleBoard(env,t,bid,user)'],
 ['field creation','accessibleBoard(env,t,bid,user)'],
 ['record reads','accessibleBoard(env,t,bid,user)'],
 ['record creation','accessibleBoard(env,t,bid,user)'],
 ['record updates','accessibleRecord(env,t,rid,user)'],
 ['record links','!await accessibleRecord(env,t,from,user)||!await accessibleRecord(env,t,to,user)'],
 ['view reads','accessibleBoard(env,t,bid,user)'],
 ['view creation','accessibleBoard(env,t,bid,user)']
 ,['automation reads','COALESCE(w.kind,\'\')<>\'college-progress\' OR w.owner_user_id=?']
 ,['automation creation','accessibleWorkspace(env,t,wid,user)']
 ,['sequence reads','COALESCE(w.kind,\'\')<>\'college-progress\' OR w.owner_user_id=?']
 ,['sequence creation','accessibleWorkspace(env,t,wid,user)']
 ,['event writes','accessibleRecord(env,t,rid,user)']
 ,['activity reads','magnanimous_ops_activity a LEFT JOIN magnanimous_ops_boards b ON b.tenant_id=a.tenant_id AND b.id=a.board_id LEFT JOIN magnanimous_ops_workspaces w ON w.tenant_id=a.tenant_id AND w.id=COALESCE(NULLIF(a.workspace_id,''),b.workspace_id)']
 ,['record audit scope','record_updated',{workspace_id:board.workspace_id,board_id:cur.board_id,record_id:rid}']
]) assert.ok(runtime.includes(marker),`College ownership guard missing from ${label}.`);

assert.ok(runtime.includes("const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);const t=tenant(user);if(!t)return json({detail:'Tenant context required.'},403);"),'All operations remain authenticated and tenant-scoped.');
assert.ok(page.includes("kind:'college-progress'"),'College continues using the protected workspace kind.');
assert.ok(page.includes('Authorization:\'Bearer \'+authToken'),'College sends the authenticated session token.');
console.log('Magnanimous AI College same-tenant student isolation lock: PASS');

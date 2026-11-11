import assert from 'node:assert/strict';
import fs from 'node:fs';
const runtime=fs.readFileSync(new URL('../../worker/src/native-work-crm-runtime.js',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../../frontend/app/ai-college/page.tsx',import.meta.url),'utf8');
for(const marker of [
 "async function accessibleWorkspace(env,t,wid,user)",
 "async function accessibleBoard(env,t,bid,user)",
 "async function accessibleRecord(env,t,rid,user)",
 "workspace.kind==='college-progress'&&workspace.owner_user_id!==String(user.id||'')",
 "if(!bid||!await accessibleBoard(env,t,bid,user))",
 "if(!await accessibleRecord(env,t,from,user)||!await accessibleRecord(env,t,to,user))",
 "if(wid&&!await accessibleWorkspace(env,t,wid,user))",
 "if(rid&&!await accessibleRecord(env,t,rid,user))",
 "if(!bid||!await accessibleBoard(env,t,bid,user))return;",
 "COALESCE(w.kind,'')<>'college-progress' OR w.owner_user_id=?",
 "COALESCE(NULLIF(a.workspace_id,''),b.workspace_id,CASE WHEN json_valid(a.detail_json) THEN json_extract(a.detail_json,'$.workspace_id') END)",
 "record_updated',{workspace_id:board.workspace_id,board_id:cur.board_id,record_id:rid}"
]) assert.ok(runtime.includes(marker),'Missing College ownership guard: '+marker);
assert.ok(page.includes("kind:'college-progress'"),'College continues using the protected workspace kind.');
assert.ok(page.includes("Authorization:'Bearer '+authToken"),'College sends the authenticated session token.');
console.log('Magnanimous AI College same-tenant student isolation lock: PASS');

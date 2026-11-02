import fs from 'node:fs';
import assert from 'node:assert/strict';

const x=fs.readFileSync(new URL('../../worker/src/magnanimous-business-ai-suite.js',import.meta.url),'utf8');
assert.ok(x.includes('ensureWorkSchema'),'Business AI Work Engine schema integration must remain.');
assert.ok(x.includes('const businessAiSchemaReady = new WeakMap();'),'Business AI schema setup must be cached per D1 binding.');
assert.ok(x.includes('await ensureWorkSchema(env);'),'Work Engine schema must still be available.');
assert.ok(!x.slice(x.indexOf('async function ensure(env){'),x.indexOf('async function claimLegacyJobs')).includes('UPDATE magnanimous_business_ai_jobs'),'Schema initialization must not globally backfill legacy rows.');
assert.ok(x.includes("user_id=''"),'Legacy rows must remain eligible for ownership recovery.');
assert.ok(x.includes("json_extract(output_json,'$.work_id')"),'Legacy work linkage must remain intact.');
assert.ok(x.includes('SELECT id FROM magnanimous_work_items WHERE tenant_id=? AND user_id=?'),'Legacy ownership recovery must be tied to the real tenant and user.');
assert.ok(x.includes("if(u.pathname==='/api/business-ai/jobs'&&request.method==='GET'){await claimLegacyJobs(env,user);"),'Legacy jobs must be backfilled for the authenticated user when listing.');
assert.ok(x.includes("if(jobMatch&&request.method==='GET'){await claimLegacyJob(env,user,jobMatch[1]);"),'Direct legacy job reads must use an ID-scoped owner claim.');
assert.ok(x.includes("if(jobMatch&&jobMatch[2]==='execute'&&request.method==='POST'){await claimLegacyJob(env,user,jobMatch[1]);"),'Legacy direct execution links must be preserved with a single-row owner claim.');
assert.ok(x.includes("if(jobMatch&&jobMatch[2]==='verify'&&request.method==='POST'){await claimLegacyJob(env,user,jobMatch[1]);"),'Legacy verification links must be preserved with a single-row owner claim.');
console.log('Business AI legacy ownership recovery passed: cached schema and tenant/user-bound read or ID-scoped legacy claims remain.');

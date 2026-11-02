import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const business=read('worker/src/magnanimous-business-ai-suite.js');
const work=read('worker/src/work-engine-runtime.js');

assert.ok(business.includes('const BUSINESS_AI_SCHEMA_STATES=new WeakMap();'),'Business AI schema readiness must be scoped to the D1 binding.');
assert.ok(business.includes('BUSINESS_AI_SCHEMA_STATES.get(db)'),'Business AI must reuse its initialized schema for subsequent requests.');
assert.ok(business.includes('catch(alterError)'),'Business AI must tolerate concurrent legacy-column migration attempts.');
assert.ok(business.includes("await db.prepare('SELECT user_id FROM magnanimous_business_ai_jobs LIMIT 0').all();"),'Concurrent ALTER errors must be rechecked against the live schema before they are ignored.');
assert.ok(business.includes('magnanimous_business_ai_migrations'),'Business AI legacy user backfill must have a persistent migration marker.');
assert.ok(business.includes('await db.batch(['),'The one-time Business AI backfill and marker must commit as one D1 batch.');
assert.ok(business.includes('NOT EXISTS(SELECT 1 FROM magnanimous_business_ai_migrations'),'The legacy backfill must not repeat after its marker is committed.');
assert.ok(business.includes("json_valid(magnanimous_business_ai_jobs.output_json)"),'Legacy JSON extraction must be guarded against malformed historical job payloads.');
assert.ok(!business.includes('async function claimLegacyJobs'),'Per-request legacy job ownership updates must be removed.');
assert.ok(business.includes('await ensureWorkSchema(env);await ensure(env);'),'Work Engine schema must exist before the one-time Business AI backfill.');
assert.ok(business.includes("WHERE id=? AND tenant_id=? AND user_id=?"),'Business AI job reads and writes must remain tenant- and user-scoped.');
assert.ok(work.includes('const WORK_SCHEMA_STATES=new WeakMap();'),'Work Engine schema readiness must be scoped to the D1 binding.');
assert.ok(work.includes('WORK_SCHEMA_STATES.get(db)'),'Work Engine schema DDL must run once per D1 binding per isolate.');
assert.match(work,/export async function\\s+getWork\\(env,user,id\\)\\s*\\{\\s*await ensureWorkSchema\\(env\\);/,'Work Engine reads must retain schema initialization protection.');

console.log('Business AI / Work Engine D1 hot-path and tenant-scope contracts passed.');

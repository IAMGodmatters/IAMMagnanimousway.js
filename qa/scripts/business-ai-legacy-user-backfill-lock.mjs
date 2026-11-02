import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../../worker/src/magnanimous-business-ai-suite.js',import.meta.url),'utf8');
const required=[
 ['ensureWorkSchema','Work Engine schema must be initialized before the Business AI ownership backfill.'],
 ['await ensureWorkSchema(env);await ensure(env);','Business AI must initialize Work Engine storage before its one-time backfill.'],
 ['BUSINESS_AI_LEGACY_BACKFILL','Legacy ownership recovery must use a stable migration key.'],
 ['await db.batch([','Ownership backfill and its completion marker must commit in one transactional batch.'],
 ['UPDATE magnanimous_business_ai_jobs','Legacy Business AI jobs must be backfilled.'],
 ["WHERE user_id=''","Only unclaimed legacy rows may be backfilled."],
 ['SELECT w.user_id FROM magnanimous_work_items w','Ownership must be derived from the linked Work Engine item.'],
 ['w.tenant_id=magnanimous_business_ai_jobs.tenant_id','The ownership lookup must remain tenant-scoped.'],
 ['magnanimous_business_ai_migrations','The backfill must have a persistent completion marker.'],
 ['NOT EXISTS(SELECT 1 FROM magnanimous_business_ai_migrations WHERE migration_key=?)','The backfill must not repeat after it has been recorded.'],
 ['json_valid(magnanimous_business_ai_jobs.output_json)','Malformed historical JSON must not break the ownership lookup.']
];
for(const [needle,message] of required)assert.ok(source.includes(needle),message);
assert.ok(!source.includes('claimLegacyJobs'),'Legacy ownership recovery must not reintroduce per-request claim updates.');
console.log('Business AI legacy user ownership recovery: one-time tenant-scoped D1 backfill passed.');

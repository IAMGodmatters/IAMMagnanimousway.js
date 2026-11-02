import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../../worker/src/magnanimous-business-ai-suite.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('export async function handleBusinessAISuite'));
const preflight=handler.indexOf('const toolPreflight=');
const init=handler.indexOf('await ensureWorkSchema(env);await ensure(env);');
const jobs=handler.indexOf("if(u.pathname==='/api/business-ai/jobs'");
assert.ok(preflight>=0&&init>=0&&jobs>=0,'Business AI preflight/init/jobs contract is present.');
assert.ok(preflight<init&&init<jobs,'Tool preflight must stay before runtime schema initialization and job routes.');
const readOnlyPreflight=handler.slice(preflight,init);
assert.ok(!readOnlyPreflight.includes('ensureWorkSchema(env)'),'Preflight must not initialize Work Engine tables.');
assert.ok(!readOnlyPreflight.includes('CREATE TABLE'),'Preflight must not issue schema DDL.');
assert.ok(!readOnlyPreflight.includes('db.batch('),'Preflight must not run ownership backfills.');
assert.ok(!readOnlyPreflight.includes('magnanimous_business_ai_jobs'),'Preflight must not query or mutate job storage.');
console.log('Business AI preflight remains read-only and DB-light.');

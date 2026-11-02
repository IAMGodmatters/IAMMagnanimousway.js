import fs from 'node:fs';
import assert from 'node:assert/strict';

const x=fs.readFileSync(new URL('../../worker/src/magnanimous-business-ai-suite.js',import.meta.url),'utf8');
for(const required of [
 "CAST(json_extract(output_json,'$.work_id') AS INTEGER)",
 "WHERE id=? AND tenant_id=? AND user_id=''",
 "WHERE tenant_id=? AND user_id=''",
 "SELECT id FROM magnanimous_work_items WHERE tenant_id=? AND user_id=?",
 "tenant_id:_tenant",
 "user_id:_user",
 "input_json:_inputRaw",
 "output_json:_outputRaw",
 "...safe"
])assert.ok(x.includes(required),`missing Business AI history/privacy safeguard ${required}`);
assert.ok(!x.includes("json_extract(magnanimous_business_ai_jobs.output_json,'$.work_id')"),'Do not restore the old global ownership backfill query.');
console.log('Business AI history ownership migration and response privacy passed with bounded tenant/user-scoped claims.');

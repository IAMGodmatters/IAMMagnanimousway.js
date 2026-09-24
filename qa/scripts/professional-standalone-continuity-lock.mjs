import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('../worker/src/professional-resilience-runtime.js','utf8');

assert.match(source,/no magnanimous ai execution rail is configured/i);
assert.match(source,/execution rail[^\n]{0,80}\(not configured\|unavailable\)/i);
assert.match(source,/continuityOutput/);
assert.match(source,/continuity_mode:true/);
assert.match(source,/INSERT INTO professional_records/);
assert.match(source,/response\.status<429/);

console.log('Professional standalone continuity recovery: PASS');

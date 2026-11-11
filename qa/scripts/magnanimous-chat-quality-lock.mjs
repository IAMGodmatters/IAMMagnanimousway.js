import fs from 'node:fs';
import assert from 'node:assert/strict';
import {researchIntent} from '../../worker/src/magnanimous-research-intelligence.js';

const source=fs.readFileSync(new URL('../../worker/src/provider-entrypoint.js',import.meta.url),'utf8');
assert.match(source,/import \{ researchIntent \} from '\.\/magnanimous-research-intelligence\.js'/);
assert.match(source,/max_tokens:\s*3200/,'Free Workers AI chat must not remain capped at 1,400 tokens');
assert.match(source,/const intent=researchIntent\(text\)/,'Primary chat must use the shared Magnanimous research-intent classifier');
assert.match(source,/requirements\|eligibility\|deadline\|regulator\|compliance\|policy\|law\|tax\|financial\|security\|safety/);
assert.match(source,/needsFreshResearch\(m\)/,'Task routing must classify source-dependent requests as research');

for (const prompt of [
  'Is this medicine safe?',
  'What are the current legal requirements?',
  'Compare the latest provider options',
  'Verify this claim with sources'
]) assert.equal(researchIntent(prompt).needsResearch,true,prompt);

assert.equal(researchIntent('Explain the difference between addition and subtraction.').needsResearch,false);
console.log('Magnanimous chat quality lock passed.');

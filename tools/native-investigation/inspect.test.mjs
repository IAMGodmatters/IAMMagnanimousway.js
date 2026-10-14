import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEvidence } from './inspect.mjs';
test('rejects unauthorized inspection', () => assert.throws(() => inspectEvidence({content:'x'}), /authorization/));
test('rejects unsupported formats', () => assert.throws(() => inspectEvidence({content:'x',authorized:true,kind:'binary'}), /Unsupported/));
test('rejects oversized input', () => assert.throws(() => inspectEvidence({content:'x'.repeat(1048577),authorized:true}), /exceeds/));
test('records stable evidence without executing code', () => {
 const x=inspectEvidence({content:'export function hello() { fetch("/test"); }',kind:'javascript',authorized:true});
 assert.equal(x.sha256.length,64);assert.equal(x.executionPerformed,false);assert.equal(x.networkAccessPerformed,false);
 assert.ok(x.indicators.some(i=>i.type==='network-reference'));
});

import assert from 'node:assert/strict';
import { inspectNativeEvidence, nativeInvestigationManifest } from '../../worker/src/native-investigation-core.js';

const manifest=nativeInvestigationManifest();
assert.equal(manifest.status,'ready');
assert.equal(manifest.guarantees.executesTarget,false);
assert.equal(manifest.guarantees.fetchesTarget,false);
assert.equal(manifest.guarantees.uploadsToThirdParty,false);
assert.equal(manifest.providers.find(p=>p.id==='rea')?.enabled,false);

await assert.rejects(()=>inspectNativeEvidence({content:'export const x=1'}),/authorization/i);
await assert.rejects(()=>inspectNativeEvidence({content:'x',authorized:true,kind:'binary'}),/unsupported/i);
await assert.rejects(()=>inspectNativeEvidence({content:'x'.repeat(1024*1024+1),authorized:true}),/1 MiB/i);

const evidence=await inspectNativeEvidence({
 content:'export async function demo(){ return fetch("/api/demo"); }',
 kind:'javascript',source:'qa',authorized:true
});
assert.equal(evidence.sha256.length,64);
assert.equal(evidence.executionPerformed,false);
assert.equal(evidence.networkAccessPerformed,false);
assert.equal(evidence.evidenceClassification,'static-analysis');
assert.ok(evidence.indicators.some(item=>item.type==='export'));
assert.ok(evidence.indicators.some(item=>item.type==='network-reference'));
assert.ok(evidence.indicators.some(item=>item.type==='endpoint-reference'));

console.log('native investigation lock passed');

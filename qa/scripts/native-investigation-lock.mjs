import assert from 'node:assert/strict';
import fs from 'node:fs';
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

const wrangler=fs.readFileSync(new URL('../../worker/wrangler.jsonc',import.meta.url),'utf8');
assert.match(wrangler,/"main"\s*:\s*"src\/security-entrypoint\.js"/,'production must remain behind central security entrypoint');
assert.doesNotMatch(wrangler,/investigation-entrypoint/,'investigation must not bypass the central security entrypoint');

const page=fs.readFileSync(new URL('../../frontend/app/investigate/page.tsx',import.meta.url),'utf8');
assert.match(page,/crypto\.subtle\.digest\('SHA-256'/,'browser-local evidence must use Web Crypto SHA-256');
assert.match(page,/No target-content upload\./,'UI must state the no-upload boundary');
assert.match(page,/I own this target or have explicit authorization/,'UI must require target authorization acknowledgement');
assert.doesNotMatch(page,/fetch\(`/,'investigation page must not upload target contents through a hidden fetch');
assert.doesNotMatch(page,/\/api\/magnanimous\/investigation/,'local inspector must not depend on an unrouted API');

console.log('native investigation lock passed');

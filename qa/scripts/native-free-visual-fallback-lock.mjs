import assert from 'node:assert/strict';
import { generateProceduralScene, visualProviderSnapshot } from '../../worker/src/visual-runtime.js';

const env={MAGNANIMOUS_RUNTIME:'standalone-node',MAGNANIMOUS_IMAGE_GENERATOR:{configured:false}};
const snapshot=visualProviderSnapshot(env);
const byId=new Map(snapshot.providers.map(p=>[p.id,p]));
assert.equal(snapshot.free_first,true);
assert.ok(snapshot.free_configured_count>=2);
assert.equal(byId.get('iam-cinematic-free')?.configured,true);
assert.equal(byId.get('magnanimous-native-procedural-scene')?.configured,true);
assert.equal(byId.get('magnanimous-native-procedural-scene')?.free,true);
assert.equal(byId.get('cloudflare-flux-free')?.configured,false);
assert.equal(byId.get('cloudflare-flux-free')?.tier,'rollback-only');

const rendered=generateProceduralScene('Magnanimous native visual fallback QA');
assert.equal(rendered.provider,'magnanimous-native-procedural-scene');
assert.equal(rendered.model,'magnanimous-procedural-v1');
assert.equal(rendered.content_type,'image/svg+xml');
assert.equal(rendered.procedural,true);
const svg=Buffer.from(rendered.image,'base64').toString('utf8');
assert.match(svg,/^<svg /);
assert.match(svg,/width="1280"/);
assert.doesNotMatch(svg,/Magnanimous native visual fallback QA/);

console.log('Magnanimous native free visual fallback: PASS');

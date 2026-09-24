import assert from 'node:assert/strict';
import { generateProceduralScene, renderVisualScene, visualProviderSnapshot } from '../../worker/src/visual-runtime.js';

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

const failingProviderEnv={
 MAGNANIMOUS_RUNTIME:'standalone-node',
 MAGNANIMOUS_IMAGE_GENERATOR:{
  configured:true,
  async generate(){throw new Error('unusable')}
 }
};
const recovered=await renderVisualScene(failingProviderEnv,{title:'Provider fallback QA',text:'Keep White Label video creation available when an optional image provider fails.',director:'built-in'});
assert.equal(recovered.provider,'iam-cinematic-free');
assert.equal(recovered.image_provider,'magnanimous-native-procedural-scene');
assert.equal(recovered.image_model,'magnanimous-procedural-v1');
assert.match(recovered.image_data_uri,/^data:image\/svg\+xml;base64,/);

console.log('Magnanimous native free visual fallback: PASS');

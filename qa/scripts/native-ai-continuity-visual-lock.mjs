import assert from 'node:assert/strict';
import fs from 'node:fs';
import { visualProviderSnapshot } from '../../worker/src/visual-runtime.js';

const visual=visualProviderSnapshot({MAGNANIMOUS_RUNTIME:'standalone-node'});
const byId=new Map((visual.providers||[]).map(x=>[x.id,x]));
assert.equal(visual.free_first,true);
assert.equal(byId.get('iam-cinematic-free')?.configured,true);
assert.equal(byId.get('magnanimous-native-canvas')?.configured,true);
assert.equal(byId.get('magnanimous-native-canvas')?.enabled,true);
assert.equal(byId.get('magnanimous-native-canvas')?.free,true);
assert.equal(byId.get('magnanimous-native-canvas')?.type,'procedural-visual-generation');
assert.equal(byId.get('cloudflare-flux-free')?.configured,false);
assert.equal(byId.get('google-veo-3.1-lite')?.free,false);
assert.ok(Number(visual.free_configured_count||0)>=2);

const visualSource=fs.readFileSync('worker/src/visual-runtime.js','utf8');
assert.match(visualSource,/generateNativeCanvas\(prompt\)/);
assert.match(visualSource,/magnanimous-svg-canvas-v1/);
assert.match(visualSource,/if\(cloudflareReady\(env\)\)return generateFlux/);
assert.match(visualSource,/return generateNativeCanvas\(prompt\)/);

const resilience=fs.readFileSync('worker/src/professional-resilience-runtime.js','utf8');
assert.match(resilience,/no magnanimous ai execution rail is configured/i);
assert.match(resilience,/continuityOutput/);
assert.match(resilience,/continuity_mode:true/);

console.log('Native AI continuity + provider-free Visual lock: PASS');

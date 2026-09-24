import assert from 'node:assert/strict';
import { runtimeEnvOverlay } from '../../worker/src/platform-credentials.js';

const dynamic = { SESSION_SECRET:'railway-session-secret', MAGNANIMOUS_DEPLOY_REVISION:'abc123' };
const db = { marker:'db-binding' };
const base = new Proxy({ DB:db, MAGNANIMOUS_RUNTIME:'standalone-node' }, {
  get(target,key){ return key in target ? target[key] : dynamic[String(key)]; }
});

const provider = runtimeEnvOverlay(base,{ OPENAI_API_KEY:'provider-key' });
assert.equal(provider.DB,db);
assert.equal(provider.MAGNANIMOUS_RUNTIME,'standalone-node');
assert.equal(provider.SESSION_SECRET,'railway-session-secret');
assert.equal(provider.MAGNANIMOUS_DEPLOY_REVISION,'abc123');
assert.equal(provider.OPENAI_API_KEY,'provider-key');

const second = runtimeEnvOverlay(provider,{ STRIPE_SECRET_KEY:'stripe-key' });
assert.equal(second.SESSION_SECRET,'railway-session-secret');
assert.equal(second.OPENAI_API_KEY,'provider-key');
assert.equal(second.STRIPE_SECRET_KEY,'stripe-key');

const platform = await import('../../worker/src/platform-credentials.js');
const providerSource = await import('node:fs').then(({readFileSync})=>readFileSync(new URL('../../worker/src/provider-runtime-env.js',import.meta.url),'utf8'));
assert.match(String(platform.getIntegrationRuntimeEnv),/runtimeEnvOverlay\(env\)/);
assert.doesNotMatch(providerSource,/merged\s*=\s*\{\s*\.\.\.merged\s*\}/);
assert.match(providerSource,/runtimeEnvOverlay\(merged\)/);

console.log('Magnanimous provider runtime auth inheritance: PASS');

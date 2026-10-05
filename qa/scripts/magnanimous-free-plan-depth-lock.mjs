import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const provider=read('worker/src/provider-entrypoint.js');
const standalone=read('frontend/app/magnanimous/page.tsx');
const binding=read('magnanimous-runtime/src/ai-binding.mjs');
const server=read('magnanimous-runtime/src/server.mjs');
const objectStore=read('magnanimous-runtime/src/object-store.mjs');
const storagePage=read('frontend/app/storage/page.tsx');
const vault=read('frontend/lib/magnanimous-local-vault.ts');
const pkg=JSON.parse(read('frontend/package.json'));

assert.match(provider,/Never claim Magnanimous cannot provide links/,'Magnanimous must not refuse ordinary link requests.');
for(const term of ['ssdi','social security','government','link','eligibility','form'])assert.ok(provider.toLowerCase().includes(term),`fresh research contract missing ${term}`);
const tokenMatch=provider.match(/max_tokens:\s*(\d+)/);
assert.ok(Number(tokenMatch?.[1]||0)>=3000,'free-first Cloudflare answer depth regressed below 3000 tokens.');
assert.match(binding,/MAGNANIMOUS_AI_MAX_TOKENS[\s\S]*?3200/,'standalone AI default answer depth must be 3200 tokens.');
assert.match(standalone,/linkedAnswer\(m\.content\)/,'standalone answers must render direct URLs as clickable links.');
assert.match(standalone,/Storage & device vault/,'standalone Magnanimous must expose storage workspace.');
assert.match(server,/staticNotFoundResponse/,'standalone runtime must have a real static 404 response.');
assert.match(server,/metrics\.observe\(404/,'unknown static routes must be recorded as HTTP 404.');
assert.match(server,/storage:\s*await objectStore\.stats\(\)/,'runtime health must expose storage telemetry.');
assert.match(objectStore,/content-addressed-v1/,'server object store must use content-addressed deduplication.');
assert.match(objectStore,/fs\.link\(blob,data\)/,'duplicate server objects must use hard-link deduplication when supported.');
assert.match(storagePage,/Zero-cost device vault/,'storage workspace must explain the free device-vault path.');
assert.match(vault,/navigator\.storage/,'device vault must use browser storage quota APIs.');
assert.match(vault,/indexedDB/,'device vault must persist through IndexedDB.');
const next=String(pkg.dependencies?.next||'');
const parts=next.split('.').map(Number);
assert.ok(parts[0]>16||(parts[0]===16&&(parts[1]>3||(parts[1]===3&&parts[2]>=8))),`Next.js ${next} is below security baseline 16.3.8.`);

console.log('Magnanimous free-plan depth/storage/HTTP lock PASS.');

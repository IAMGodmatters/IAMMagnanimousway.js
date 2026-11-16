import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const exists = path => fs.existsSync(new URL('../../' + path, import.meta.url));

const retired = [
  'frontend/app/opportunity-vault/page.tsx',
  'frontend/public/magnanimous-opportunity-palace-v2.webp',
  'frontend/public/magnanimous-opportunity-palace-mobile-v2.webp',
  'docs/opportunity-vault/philippines-source-audit-2026-11-14.md',
  'qa/scripts/opportunity-vault-ph-roles-lock.mjs',
  'qa/scripts/opportunity-vault-ph-refresh-lock.mjs'
];
for (const path of retired) assert.ok(!exists(path), path + ' must not ship in the Magnanimous platform repository');

const activeSurfaces = [
  'frontend/app/page.tsx',
  'frontend/app/platform-chrome.tsx',
  'frontend/app/mobile-home-dashboard.tsx',
  'frontend/app/interaction-catalog.ts',
  'frontend/app/cinematic-experience.tsx',
  'frontend/app/cinematic-module-mark.tsx',
  'frontend/app/cinematic-design-system.tsx',
  'frontend/public/mobile-dashboard-fallback.svg',
  'worker/src/magnanimous-public-data-runtime.js',
  'worker/src/magnanimous-public-api-capability-registry.js',
  'worker/src/platform-credentials.js',
  'docs/MAGNANIMOUS-APIVAULT-PUBLIC-API-EXPANSION-2026-10-13.md',
  'docs/PLATFORM-DEEP-AUDIT-2026-11-11.md'
];
for (const path of activeSurfaces) {
  const source = read(path);
  assert.ok(!source.includes('/opportunity-vault'), path + ' must not link to or expose the standalone Vault route');
  assert.ok(!source.includes('Magnanimous Opportunity Vault'), path + ' must not identify the Vault as a platform capability');
}
assert.ok(!read('frontend/app/interaction-catalog.ts').includes("key:'opportunity'"),
  'Magnanimous AI interaction catalog must not expose the separate Opportunity Vault');
assert.ok(read('worker/src/magnanimous-public-data-runtime.js').includes('Magnanimous Professional Intelligence'),
  'Generic federal job research must retain its separate Professional Intelligence identity');
assert.ok(!read('worker/src/magnanimous-public-data-runtime.js').includes('Magnanimous Opportunity Vault'),
  'Worker public-data responses must never identify as Opportunity Vault');

console.log('Standalone Opportunity Vault separation lock PASS: no route, navigation, AI catalog, Worker identity, Vault artwork, or Vault listing data is shipped in Magnanimous.');

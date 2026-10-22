import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function must(condition,message){if(!condition)throw new Error(message)}

const js=read('frontend/next.config.js');
const ts=read('frontend/next.config.ts');
const license=read('LICENSE');
const provenance=read('frontend/public/.well-known/magnanimous-provenance.txt');
const staticHeaders=read('frontend/public/_headers');
const permanentGuard=read('.github/workflows/proprietary-security-invariants-lock.yml');

function explicitlyFalse(config,property){
  const pattern=new RegExp(`(?:^|[,{\\n\\r]\\s*)${property.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\s*:\\s*false\\b`,'m');
  return pattern.test(config);
}

for(const [name,config] of [['next.config.js',js],['next.config.ts',ts]]){
  must(explicitlyFalse(config,'productionBrowserSourceMaps'),`${name} must keep production browser source maps explicitly disabled.`);
  must(explicitlyFalse(config,'poweredByHeader'),`${name} must keep framework identification headers explicitly disabled.`);
}

must(/PROPRIETARY LICENSE/i.test(license),'Proprietary license heading is missing.');
must(/All rights reserved/i.test(license),'All-rights-reserved notice is missing.');
must(/No permission is granted to copy/i.test(license),'Explicit no-copy grant is missing.');
must(provenance.includes('https://iammagnanimousway.com'),'Canonical production origin is missing from provenance marker.');
must(provenance.includes('IAMW-PROVENANCE-2026-10-17-4AB60E4D'),'Clone-detection provenance marker changed or is missing.');

// Cloudflare's asset-first routing bypasses the Worker postflight. The static
// _headers file protects HTML without consuming paid Worker invocations.
for(const required of [
  '/*',
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'X-Frame-Options: SAMEORIGIN',
  "Content-Security-Policy: frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  'Strict-Transport-Security: max-age=86400',
])must(staticHeaders.includes(required),`Required static response security header missing: ${required}`);

must(permanentGuard.includes('Proprietary Security Invariants Lock'),'Permanent proprietary security workflow is missing or renamed.');
must(/pull_request:\s*\n\s*branches:\s*\[main\]/m.test(permanentGuard),'Permanent proprietary security lock must run on every pull request to main.');
must(/push:\s*\n\s*branches:\s*\[main\]/m.test(permanentGuard),'Permanent proprietary security lock must run on every push to main.');
must(!/^\s*paths(?:-ignore)?:/m.test(permanentGuard),'Permanent proprietary security lock must never be narrowed with path filters.');

console.log('Anti-clone hardening lock PASS');

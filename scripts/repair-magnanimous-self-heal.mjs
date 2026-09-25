import fs from 'node:fs';

let changed=false;
function update(path,fn){const before=fs.readFileSync(path,'utf8'),after=fn(before);if(after!==before){fs.writeFileSync(path,after);changed=true;console.log('REPAIRED '+path)}}

update('worker/wrangler.jsonc',s=>s.replace(/"ENABLE_METERED_PROVIDERS":\s*"true"/g,'"ENABLE_METERED_PROVIDERS": "false"').replace(/"TARGET_GROSS_MARGIN_PERCENT":\s*"[^"]+"/g,'"TARGET_GROSS_MARGIN_PERCENT": "20"'));
update('frontend/app/video-agents/page.tsx',s=>s
 .replace(/Cloudflare FLUX scenes \+ browser animation keep ordinary video creation from requiring a paid presenter provider\./g,'Free-first scene generation and browser animation keep ordinary video creation inside the Magnanimous experience.')
 .replace(/<small>HEYGEN<\/small>/g,'<small>MAGNANIMOUS PREMIUM PRESENTER</small>')
 .replace(/<small>TAVUS<\/small>/g,'<small>MAGNANIMOUS PREMIUM LIVE VIDEO</small>')
 .replace(/PROVIDER NEEDED/g,'OPTIONAL UPGRADE'));
update('worker/src/provider-entrypoint.js',s=>s.replace("WHERE active=1 AND placement=? ORDER BY id DESC","WHERE active=1 AND placement=? AND (owner_owned=1 OR revenue_approved=1) ORDER BY id DESC"));

console.log(changed?'Known Magnanimous drift repaired.':'No known repairable drift detected.');

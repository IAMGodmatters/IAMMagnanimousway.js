import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function must(condition,message){if(!condition)throw new Error(message)}

const js=read('frontend/next.config.js');
const ts=read('frontend/next.config.ts');
const license=read('LICENSE');
const provenance=read('frontend/public/.well-known/magnanimous-provenance.txt');

for(const [name,config] of [['next.config.js',js],['next.config.ts',ts]]){
  must(config.includes('productionBrowserSourceMaps')&&config.includes('false'),`${name} must keep production browser source maps disabled.`);
  must(config.includes('poweredByHeader')&&config.includes('false'),`${name} must keep framework identification headers disabled.`);
}

must(/PROPRIETARY LICENSE/i.test(license),'Proprietary license heading is missing.');
must(/All rights reserved/i.test(license),'All-rights-reserved notice is missing.');
must(/No permission is granted to copy/i.test(license),'Explicit no-copy grant is missing.');
must(provenance.includes('https://iammagnanimousway.com'),'Canonical production origin is missing from provenance marker.');
must(provenance.includes('IAMW-PROVENANCE-2026-10-17-4AB60E4D'),'Clone-detection provenance marker changed or is missing.');

console.log('Anti-clone hardening lock PASS');

import fs from 'node:fs';
const policy='telecom-core/satellite/policy.py';
const docs='telecom-core/satellite/README.md';
for (const p of [policy,docs,'telecom-core/tests/test_satellite_policy.py']) if(!fs.existsSync(p)) throw new Error(`Missing satellite contract: ${p}`);
const text=fs.readFileSync(docs,'utf8');
for(const phrase of ['replaceable WAN/backhaul rail','Do not claim a physical satellite link is active','independent from satellite Internet availability']) if(!text.includes(phrase)) throw new Error(`Satellite truth lock missing: ${phrase}`);
console.log('Magnanimous satellite ownership and activation truth locks verified.');

import fs from 'node:fs';

const required = [
  'docs/MAGNANIMOUS_COMMUNICATIONS.md',
  'telecom-core/communications/domain.py',
  'telecom-core/communications/ports.py',
  'telecom-core/communications/service.py',
  'telecom-core/communications/calls.py',
  'telecom-core/communications/SECURITY.md',
  'telecom-core/communications/CAPABILITY_MANIFEST.json',
  'telecom-core/tests/test_communications.py',
  'telecom-core/tests/test_communications_calls.py',
];
for (const path of required) {
  if (!fs.existsSync(path)) throw new Error(`Missing Magnanimous Communications contract: ${path}`);
}
const docs = fs.readFileSync('docs/MAGNANIMOUS_COMMUNICATIONS.md', 'utf8');
for (const phrase of ['Magnanimous identity', 'WebRTC', 'SIP/PSTN', 'does not copy Viber']) {
  if (!docs.includes(phrase)) throw new Error(`Communications ownership/capability lock missing: ${phrase}`);
}
const security = fs.readFileSync('telecom-core/communications/SECURITY.md', 'utf8');
if (!security.includes('E2EE product claims remain disabled')) throw new Error('E2EE truth lock missing');
const manifest = JSON.parse(fs.readFileSync('telecom-core/communications/CAPABILITY_MANIFEST.json', 'utf8'));
if (manifest.identity !== 'Magnanimous Communications' || manifest.native_first !== true) throw new Error('Native Magnanimous identity lock missing');
if (manifest.capabilities.end_to_end_encryption !== 'not_yet_claimable') throw new Error('E2EE capability must remain truth-gated');
console.log('Magnanimous Communications ownership and truth locks verified.');

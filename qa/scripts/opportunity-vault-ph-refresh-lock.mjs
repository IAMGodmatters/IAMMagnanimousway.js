import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../frontend/app/opportunity-vault/page.tsx', import.meta.url), 'utf8');
const ids = [...source.matchAll(/^\s*id\s*:\s*['"]([^'"]+)['"]/gm)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Opportunity Vault IDs must remain unique');

function record(id) {
  const matcher = new RegExp("id\\s*:\\s*['\"]" + id + "['\"]");
  const match = matcher.exec(source);
  assert.ok(match, 'Missing Opportunity Vault record: ' + id);
  const before = source.slice(0, match.index);
  const lines = before.split('\n');
  let startLine = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (/^\s{1,3}\{\s*$/.test(lines[i])) {
      startLine = i;
      break;
    }
  }
  assert.notEqual(startLine, -1, 'Could not find object start for ' + id);
  const startOffset = lines.slice(0, startLine).reduce((sum, line) => sum + line.length + 1, 0);
  const remainder = source.slice(match.index + match[0].length);
  const next = /^\s{1,3}\{\s*$/m.exec(remainder);
  const endOffset = next ? match.index + match[0].length + next.index : source.length;
  return source.slice(startOffset, endOffset);
}

assert.ok(source.includes('quaternary?:string;quaternaryLabel?:string'), 'Opportunity type must support a fourth source link');
assert.ok(source.includes('{o.quaternary&&<a href={o.quaternary}'), 'Opportunity cards must render the fourth source link');

const expectations = [
  {
    id: 'attapoll-ph-surveys',
    status: "status:'active-ph'",
    date: "verified:'2026-11-14'",
    values: [
      'https://apps.apple.com/ph/app/attapoll-surveys-earn-money/id1107631390',
      'https://play.google.com/store/apps/details?hl=fil&id=com.requapp.requ',
      'https://attapoll.com/en-sg/referral-program-countries/',
      'actual withdrawal methods and minimum are shown in-app'
    ]
  },
  {
    id: 'deepgram-ph-filipino-labeling-editor',
    status: "status:'active-ph'",
    date: "verified:'2026-11-14'",
    values: [
      'https://ph.linkedin.com/jobs/view/filipino-freelance-labeling-editor-at-deepgram-4487096695',
      'remote freelance',
      'steady weekly workload',
      'does not disclose a rate'
    ]
  },
  {
    id: 'telus-tagalog-filipino-ai-linguistic-expert',
    status: "status:'active-ph'",
    date: "verified:'2026-11-14'",
    values: [
      'https://ph.linkedin.com/jobs/view/tagalog-filipino-ai-linguistic-expert-at-telus-digital-ai-community-4490341902',
      'USD $5.50–$7.00/hour',
      'remote work from outside the listed location is not explicit and must be confirmed',
      'subject-specific qualification exam'
    ]
  },
  {
    id: 'innodata-senior-ai-domain-expert-ph',
    status: "status:'active-ph'",
    date: "verified:'2026-11-14'",
    values: [
      '4481426805',
      '4481430713',
      '4481438265',
      '4481432662',
      '4481437269',
      '4465525895',
      'at least 3 years'
    ]
  },
  {
    id: 'mytron-labs-ph-smartphone-data',
    status: "status:'location-check'",
    date: "verified:'2026-11-14'",
    values: [
      'https://www.mytronlabs.com/join-as-contributor',
      'seven countries',
      'Philippines',
      'recordings can include your face, voice, other people, private spaces',
      'confirm which method actually works in the Philippines'
    ]
  },
  {
    id: 'landbank-dost-lifting',
    status: "status:'location-check'",
    date: "verified:'2026-11-14'",
    values: [
      'https://www.dost.gov.ph/knowledge-resources/news/4379-dost-landbank-to-grow-local-msmes-thru-technology-upgrades-and-financing.html',
      'loan, not a grant',
      'LANDBANK performs its own credit evaluation'
    ]
  }
];

for (const item of expectations) {
  const block = record(item.id);
  assert.ok(block.includes(item.status), item.id + ' has the wrong eligibility status');
  assert.ok(block.includes(item.date), item.id + ' has the wrong verification date');
  for (const value of item.values) assert.ok(block.includes(value), item.id + ' is missing required detail: ' + value);
}

const closed = record('innodata-robotics-annotator-rater-remote-ph');
assert.ok(closed.includes('status:"closed"'), 'Closed Innodata robotics listing must not remain active');
assert.ok(closed.includes('no longer accepting applications'), 'Closed Innodata robotics listing must explain the reason');
assert.ok(closed.includes('verified:"2026-11-14"'), 'Closed Innodata robotics status must be freshly verified');

console.log('Opportunity Vault PH refresh lock passed: six new records, one closed employer listing, official sources, current dates, and unique IDs.');

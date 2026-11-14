import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../frontend/app/opportunity-vault/page.tsx', import.meta.url), 'utf8');
const ids = [...source.matchAll(/^\s{2}id:'([^']+)'/gm)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Opportunity Vault IDs must remain unique');

function record(id) {
  const marker = "\n {\n  id:'" + id + "'";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'Missing Opportunity Vault record: ' + id);
  const next = source.indexOf("\n {\n  id:'", start + marker.length);
  return source.slice(start, next < 0 ? source.length : next);
}

const restored = [
  {
    id: 'welo-artemis-dutch-ai-data-rater',
    url: 'https://jobs.lever.co/weloglobal/91247918-40a1-458c-a075-06a65e325023',
    checks: ['USD $2.25/hour', 'fully proficient in Dutch', 'confirm the actual Philippine payout method']
  },
  {
    id: 'agent-finance-ai-automation-specialist',
    url: 'https://jobs.ashbyhq.com/agent/f979b657-94b5-48a6-8042-e458fa76c42d',
    checks: ['USD $1,500–$2,000 per month', 'Philippines', '3+ years']
  },
  {
    id: 'welo-project-cursa-annotator-v2',
    url: 'https://jobs.lever.co/weloglobal/c5c69abd-d960-42d6-ba72-0cba79615418',
    checks: ['USD $3.50/hour', 'Philippines', 'three synchronized camera views']
  },
  {
    id: 'welo-project-cursa-qc-v2',
    url: 'https://jobs.lever.co/weloglobal/9bd19b88-42a1-4681-9625-120ea954f16c',
    checks: ['USD $4.03/hour', 'Philippines', 'unrelated sentence about expertise in the Legal field']
  },
  {
    id: 'welo-andromeda-adjudicator-english-us',
    url: 'https://jobs.lever.co/weloglobal/bfadf038-9d98-482e-b245-4def1c370253',
    checks: ['USD $7.00/hour', '15–20 hours per week', 'U.S. cultural expertise']
  },
  {
    id: 'welo-remote-data-annotator-dutch',
    url: 'https://jobs.lever.co/weloglobal/be3a92c6-de7f-42be-8c4a-a0c350c50443',
    checks: ['USD $2.25/hour', '20 hours per week', 'confirm whether the Philippines is paid by wire transfer or another method']
  }
];

for (const item of restored) {
  const block = record(item.id);
  assert.ok(block.includes("status:'active-ph'"), item.id + ' must remain explicitly Philippines-eligible');
  assert.ok(block.includes("verified:'2026-11-14'"), item.id + ' must carry the current verification date');
  assert.ok(block.includes("official:'" + item.url + "'"), item.id + ' must link to its official employer listing');
  for (const check of item.checks) assert.ok(block.includes(check), item.id + ' is missing required qualification/payment detail: ' + check);
}

const welo = record('welo');
assert.ok(welo.includes('Dutch-language roles require full Dutch proficiency'), 'Welo parent entry must surface the Dutch requirement and wire-transfer caution');
assert.ok(welo.includes('Andromeda Delta — Audio Transcription Reviewer'), 'Existing Andromeda Reviewer listing must remain');
assert.ok(welo.includes('Project Cursa V2 — Robot Manipulation Video Annotation QC'), 'Welo parent entry must summarize Cursa V2 QC');

for (const preserved of [
  'crowtado-phone-data-watch',
  'oneforma-kawaii-audio-labeling',
  'egovista-contributor-watch',
  'welo-andromeda-audio-reviewer',
  'welo-andromeda-audio-adjudicator',
  'dict-sgf-2026-watch',
  'div-fund-global-2026',
  'circulab-mindanao-cohort-2',
  'outlier-english-image-video-evaluator',
  'av-data-contributor-ph',
  'utest-global-ambassador'
]) assert.ok(ids.includes(preserved), 'Newer main-branch Opportunity Vault record was lost: ' + preserved);

console.log('Opportunity Vault PH restoration lock passed: six official roles, exact eligibility/payment cautions, 11 newer records preserved, and all IDs unique.');

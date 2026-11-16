import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workflows = [
  { path: '.github/workflows/universal-social-hub-lock.yml', dispatch: true },
  { path: '.github/workflows/duffel-no-spend-test-lock.yml', dispatch: true },
  { path: '.github/workflows/magnanimous-judgment-core-lock.yml', dispatch: true },
  { path: '.github/workflows/telecom-carrier-bridge-lock.yml', dispatch: true },
  { path: '.github/workflows/public-teaching-qa-observation-lock.yml', dispatch: false },
  { path: '.github/workflows/native-first-brain-lock.yml', dispatch: true },
  { path: '.github/workflows/full-platform-qa.yml', dispatch: true, schedule: true }
];

for (const workflow of workflows) {
  const source = readFileSync(resolve(process.cwd(), workflow.path), 'utf8');
  assert.match(source, /^  push:\r?\n    branches:\s*\[\s*main\s*\]\s*$/m,
    workflow.path + ' must run push events only on main');
  assert.match(source, /^  pull_request:\s*$/m,
    workflow.path + ' must retain pull_request validation');
  if (workflow.dispatch) {
    assert.match(source, /^  workflow_dispatch:\s*$/m,
      workflow.path + ' must retain manual dispatch');
  }
  if (workflow.schedule) {
    assert.match(source, /^  schedule:\s*$/m,
      workflow.path + ' must retain its scheduled QA run');
    assert.match(source, /cron:\s*'17 2 \* \* 0'/,
      workflow.path + ' must retain the existing weekly QA cadence');
  }
}

console.log('Workflow trigger deduplication lock: 7 workflows verified; PR, main-push, manual and scheduled triggers preserved where configured.');

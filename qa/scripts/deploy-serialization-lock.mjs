import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/deploy.yml','utf8');
const voiceSync=readFileSync('.github/workflows/sync-twilio-voice.yml','utf8');
const runtime=readFileSync('worker/src/runtime-control.js','utf8');

const serialization=/\nconcurrency:\s*\n\s+group:\s*magnanimous-main-production-deployment\s*\n\s+queue:\s*max\s*\n\s+cancel-in-progress:\s*false\b/;
assert.match(workflow,serialization,
  'Main production deployments must be serialized without cancelling in-flight cleanup.');
assert.match(voiceSync,serialization,
  'Voice secret sync must serialize with main Worker deployments.');
assert.match(voiceSync,/if:\s*github\.ref\s*==\s*'refs\/heads\/main'/,
  'A voice sync may only redeploy the Worker from main.');
assert.match(voiceSync,/wrangler deploy --var MAGNANIMOUS_DEPLOY_REVISION:\$GITHUB_SHA/,
  'Voice sync must stamp the Worker with its actual deployed revision.');
assert.match(workflow,/deployment_smoke_oidc\(\)\s*\{/,
  'Smoke OIDC identity acquisition helper must exist.');
assert.match(workflow,/oidc="\$\(deployment_smoke_oidc\)"/,
  'Smoke control must invoke the signed GitHub Actions identity helper.');
assert.ok(workflow.split('\n').some(line=>line.includes('--data')&&line.includes('workflow_sha')&&line.includes('$GITHUB_SHA')&&line.includes('runtime_sha')&&line.includes('$MAGNANIMOUS_SMOKE_RUNTIME_SHA')),
  'Smoke requests must bind workflow and runtime revisions to their selected SHA values.');
assert.match(runtime,/workflowSha\s*!==\s*sourceSha\s*\|\|\s*requestedRuntimeSha\s*!==\s*revision/,
  'Worker smoke authorization must reject mismatched workflow/runtime revisions.');

console.log('Production deployment serialization lock passed: all Worker deployment paths queue without dropping pending changes and retain strict revision-bound authorization.');

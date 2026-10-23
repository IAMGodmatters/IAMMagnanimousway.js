import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/deploy.yml','utf8');
const runtime=readFileSync('worker/src/runtime-control.js','utf8');

assert.match(workflow,/\nconcurrency:\s*\n\s+group:\s*magnanimous-main-production-deployment\s*\n\s+cancel-in-progress:\s*false\b/,
  'Main production deployments must be serialized without cancelling in-flight cleanup.');
assert.match(workflow,/function\s+deployment_smoke_oidc\(|deployment_smoke_oidc\(\)/,
  'The smoke job must retain signed GitHub Actions identity.');
assert.ok(workflow.split('\n').some(line=>line.includes('--data')&&line.includes('workflow_sha')&&line.includes('$GITHUB_SHA')&&line.includes('runtime_sha')),
  'The smoke request must carry workflow and runtime revisions.');
assert.match(runtime,/workflowSha\s*!==\s*sourceSha\s*\|\|\s*requestedRuntimeSha\s*!==\s*revision/,
  'Worker smoke authorization must reject mismatched workflow/runtime revisions.');

console.log('Production deployment serialization lock passed: queued deploys, safe cleanup, and strict revision-bound smoke authorization.');

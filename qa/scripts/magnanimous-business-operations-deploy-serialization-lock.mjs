import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const deployment=readFileSync('.github/workflows/deploy.yml','utf8');
const business=readFileSync('.github/workflows/business-operations-production-check.yml','utf8');
const key='group: magnanimous-main-production-deployment';
for(const [name,source] of [['deployment',deployment],['business operations',business]]) {
 assert(source.includes(key),`${name} must use the shared production database queue`);
 assert(source.includes('queue: max'),`${name} must preserve queued runs`);
 assert(source.includes('cancel-in-progress: false'),`${name} must not cancel running production changes or verification`);
}
assert(business.includes('workflow_run:')&&business.includes('Build and Deploy I AM')&&business.includes("conclusion == 'success'"),'Business operations verification must follow a successful deploy.');
assert(!business.includes('continue-on-error: true'),'Real production failures must remain visible.');
console.log('Production D1 import and business-operations smoke are serialized without masking failures.');

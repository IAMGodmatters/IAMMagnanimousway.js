import assert from 'node:assert/strict';
import { classifySocialPublishFailure } from '../../worker/src/social-publish-outcome.js';
assert.equal(classifySocialPublishFailure({preflight:true}),'failed');
assert.equal(classifySocialPublishFailure({providerRejected:true}),'failed');
assert.equal(classifySocialPublishFailure(new Error('socket closed')),'outcome_unknown');
assert.equal(classifySocialPublishFailure(null),'outcome_unknown');
console.log('Social publish outcome classification tests passed.');

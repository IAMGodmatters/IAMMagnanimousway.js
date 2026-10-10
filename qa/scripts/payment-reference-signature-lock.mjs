import assert from 'node:assert/strict';
import {encodeSignedPlanPaymentReference,encodeSignedTopupPaymentReference,verifySignedPaymentReference} from '../../worker/src/payment-reference.js';

const secret='magnanimous-payment-reference-test-secret-2026';
const tenant='123e4567-e89b-12d3-a456-426614174000';

const planRef=await encodeSignedPlanPaymentReference(secret,tenant,'crm');
const planParsed=await verifySignedPaymentReference(planRef,secret);
assert.deepEqual(planParsed,{tenantId:tenant,kind:'plan',plan:'crm',signed:true});
assert.equal((await verifySignedPaymentReference(planRef.replace(':crm:',':business:'),secret)).signed,false);
assert.equal((await verifySignedPaymentReference(planRef.replace(tenant,'223e4567-e89b-12d3-a456-426614174000'),secret)).signed,false);
assert.equal((await verifySignedPaymentReference(planRef.slice(0,-1)+(planRef.endsWith('0')?'1':'0'),secret)).signed,false);

const topupRef=await encodeSignedTopupPaymentReference(secret,tenant);
const topupParsed=await verifySignedPaymentReference(topupRef,secret);
assert.deepEqual(topupParsed,{tenantId:tenant,kind:'topup',plan:'',signed:true});
assert.equal((await verifySignedPaymentReference(topupRef.replace(tenant,'223e4567-e89b-12d3-a456-426614174000'),secret)).signed,false);
assert.equal((await verifySignedPaymentReference(topupRef,'wrong-secret')).signed,false);

console.log('Payment reference signature lock PASS');

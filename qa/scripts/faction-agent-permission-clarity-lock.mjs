import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describeAgentIntegrationPermission} from '../../worker/src/agent-mesh-runtime.js';

const connection={provider:'example-crm',display_name:'Example CRM',access_token:'SECRET_MUST_NOT_APPEAR'};
const legacy=describeAgentIntegrationPermission(connection,null);
assert.equal(legacy.provider,'example-crm');
assert.equal(legacy.permission_source,'legacy-default-needs-review');
assert.equal(legacy.can_read,true,'Preserve legacy read behavior until a deliberate policy migration.');
assert.equal(legacy.can_write,true,'Preserve backend compatibility; do not silently claim migration.');
assert.equal(legacy.require_confirmation,true);
assert.equal(legacy.consequential_actions_require_separate_approval,true);
assert(!JSON.stringify(legacy).includes(connection.access_token),'No connection credentials in an agent planning summary.');

const denied=describeAgentIntegrationPermission(connection,{can_read:0,can_write:0,require_confirmation:1});
assert.equal(denied.permission_source,'explicit-owner-policy');
assert.equal(denied.can_read,false);
assert.equal(denied.can_write,false);

const allowed=describeAgentIntegrationPermission(connection,{can_read:1,can_write:1,require_confirmation:1});
assert.equal(allowed.permission_source,'explicit-owner-policy');
assert.equal(allowed.consequential_actions_require_separate_approval,true);

const mesh=readFileSync(new URL('../../worker/src/agent-mesh-runtime.js',import.meta.url),'utf8');
const actionPolicy=readFileSync(new URL('../../worker/src/assistant-action-policy.js',import.meta.url),'utf8');
assert(mesh.includes('unique.push(describeAgentIntegrationPermission(row,p))'),'Agent prompt must use the evidence-tagged permission mapping.');
assert(mesh.includes('Connected accounts are an inventory, never an independent agent execution grant.'),'Prompt must not treat integrations as autonomous credentials.');
assert(mesh.includes("x.permission_source||'not-recorded'"),'Prompt must distinguish legacy defaults from explicit owner policy.');
assert(actionPolicy.includes("'needs_confirmation'"),'Consequential writes must stage separate approval.');
assert(actionPolicy.includes('CONFIRM_TTL_SECONDS=900'),'Approval must have a bounded lifetime.');
assert(actionPolicy.includes('isApprovedAssistantActionRequest(request)'),'Downstream writes must have an internal approval marker.');
console.log('Faction-inspired agent permission provenance PASS: legacy behavior is labeled, explicit denials remain, secrets withheld, and consequential approvals remain separate.');

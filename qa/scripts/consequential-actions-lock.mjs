import fs from 'node:fs';

const gate = fs.readFileSync('worker/src/consequential-action-gate.js', 'utf8');
const policy = fs.readFileSync('worker/src/assistant-action-policy.js', 'utf8');
const securityEntry = fs.readFileSync('worker/src/security-entrypoint.js', 'utf8');
const operations = fs.readFileSync('worker/src/operations-entrypoint.js', 'utf8');
const runtime = fs.readFileSync('worker/src/assistant-integrations-runtime.js', 'utf8');
const ui = fs.readFileSync('frontend/app/assistant-actions/page.tsx', 'utf8');

const writeActions=['publish_post','publish_media','send_message','send_mail','manage_product','create_campaign'];
const checks = [];
for(const action of writeActions)checks.push([`gate covers ${action}`, gate.includes(`'${action}'`) && policy.includes(`'${action}'`)]);
checks.push(
  ['same-request confirm is rejected', gate.includes('SEPARATE_ACTION_CONFIRMATION_REQUIRED') && policy.includes('SEPARATE_ACTION_CONFIRMATION_REQUIRED')],
  ['Referer is never treated as approval', !gate.includes('interactiveAssistantPage') && !gate.includes("source.pathname === '/assistant-actions'")],
  ['approval is represented by an in-memory Request identity, not a forgeable header', gate.includes('isApprovedAssistantActionRequest(request)') && policy.includes('APPROVED_INTERNAL_REQUESTS=new WeakSet()')],
  ['all writes are persisted as needs_confirmation before provider routing', policy.includes("'needs_confirmation',1") && policy.includes('createPendingWrite(request,env,user,body)')],
  ['write approval cannot be disabled in provider permissions', policy.includes('CONSEQUENTIAL_CONFIRMATION_REQUIRED') && policy.includes("body?.require_confirmation===false")],
  ['permission policy changes require the workspace owner', policy.includes('WORKSPACE_OWNER_REQUIRED') && policy.includes("toLowerCase()!=='owner'")],
  ['only action creator or workspace owner may approve', policy.includes('ACTION_APPROVER_MISMATCH') && policy.includes("String(row.user_id)!==String(user.id)&&!owner")],
  ['approval expires after 15 minutes', policy.includes('const CONFIRM_TTL_SECONDS=900') && policy.includes('ACTION_CONFIRMATION_EXPIRED')],
  ['approval is audit logged', policy.includes("'approved'") && policy.includes('Approved pending action')],
  ['email sends use the same persisted approval record', policy.includes("String(row.action)==='send_mail'") && policy.includes("['google','outlook']") && policy.includes('completeAssistantActionPolicy')],
  ['central security boundary runs action policy before application routing', securityEntry.includes('enforceAssistantActionPolicy') && securityEntry.indexOf('enforceAssistantActionPolicy') < securityEntry.indexOf('app.fetch(policyRequest')],
  ['central security boundary completes approved email audit state', securityEntry.includes('completeAssistantActionPolicy')],
  ['operations layer retains defense-in-depth consequential gate', operations.includes('requireConsequentialActionConfirmation(request)') && operations.indexOf('requireConsequentialActionConfirmation(request)') < operations.indexOf('const response=await app.fetch(request,env,ctx)')],
  ['OAuth/account linking remains user self-service rather than platform-owner gated', runtime.includes('owner_approval_required: false')],
  ['provider authorization remains required', runtime.includes('provider_authorization_required: true')],
  ['customer retains read/write connection controls', runtime.includes('user_can_disable_read_or_write: true')],
  ['connected assistant UI still exists', ui.includes('assistant-integrations') || ui.includes('Connected Assistant') || ui.includes('CONNECTED ASSISTANT')]
);

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
if (failed.length) {
  console.error(`Consequential action lock failed: ${failed.length} check(s).`);
  process.exit(1);
}
console.log(`Consequential action lock: ${checks.length} checks passed.`);

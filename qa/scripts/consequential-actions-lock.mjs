import fs from 'node:fs';

const gate = fs.readFileSync('worker/src/consequential-action-gate.js', 'utf8');
const operations = fs.readFileSync('worker/src/operations-entrypoint.js', 'utf8');
const runtime = fs.readFileSync('worker/src/assistant-integrations-runtime.js', 'utf8');
const ui = fs.readFileSync('frontend/app/assistant-actions/page.tsx', 'utf8');

const checks = [
  ['gate covers Facebook/social publish', gate.includes("'publish_post'")],
  ['gate covers media publish', gate.includes("'publish_media'")],
  ['gate covers message sending', gate.includes("'send_message'")],
  ['gate covers email sending', gate.includes("'send_mail'")],
  ['gate covers consequential product changes', gate.includes("'manage_product'")],
  ['gate covers campaign creation', gate.includes("'create_campaign'")],
  ['unconfirmed writes are blocked', gate.includes('ACTION_CONFIRMATION_REQUIRED') && gate.includes('requires_confirmation: true')],
  ['explicit confirm is accepted', gate.includes('body?.confirm === true')],
  ['first-party deliberate customer action is accepted without owner approval', gate.includes("source.pathname === '/assistant-actions'")],
  ['operations layer imports gate', operations.includes("requireConsequentialActionConfirmation")],
  ['operations layer runs gate before downstream app fetch', operations.indexOf('requireConsequentialActionConfirmation(request)') < operations.indexOf('const response=await app.fetch(request,env,ctx)')],
  ['OAuth/account linking remains self-service', runtime.includes("owner_approval_required: false") && ui.includes('NO OWNER APPROVAL')],
  ['provider authorization remains required', runtime.includes('provider_authorization_required: true')],
  ['customer retains read/write control', runtime.includes('user_can_disable_read_or_write: true') && ui.includes('Allow AI to post / send / write')],
  ['owner approval is not introduced for connected-account actions', runtime.includes('per_action_owner_approval_required: false')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
if (failed.length) {
  console.error(`Consequential action lock failed: ${failed.length} check(s).`);
  process.exit(1);
}
console.log(`Consequential action lock: ${checks.length} checks passed.`);

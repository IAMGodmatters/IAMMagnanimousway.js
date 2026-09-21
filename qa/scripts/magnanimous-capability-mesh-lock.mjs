import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const mesh=read('worker/src/magnanimous-capability-mesh.js');
const security=read('worker/src/security-entrypoint.js');
const operations=read('worker/src/operations-entrypoint.js');
const dev=read('worker/src/magnanimous-dev-agent.js');
const workflow=read('.github/workflows/magnanimous-railway-deploy.yml');
const owner=read('frontend/app/owner-capability-mesh/page.tsx');
const ownerLayout=read('frontend/app/owner-capability-mesh/layout.tsx');
const ownerCenter=read('frontend/app/owner-center/page.tsx');
const provider=read('worker/src/provider-entrypoint.js');
const universal=read('worker/src/magnanimous-universal-capabilities.js');

for(const needle of [
 "identity:'Magnanimous Capability Mesh'",
 "architecture:'native-first-provider-neutral-capability-router'",
 "'web.search'",
 "'web.fetch_batch'",
 "'web.research'",
 "'github.read'",
 "'github.stage_action'",
 "'cloud.summary'",
 "'cloud.resource.stage_action'",
 "'cloudflare.read'",
 "'cloudflare.stage_action'",
 "'railway.status'",
 "'railway.deploy_exact'",
 "'mesh.self_check'",
 'MAGNANIMOUS_WEB_PARITY',
 'MAGNANIMOUS_DEV_SKILLS',
 'RAILWAY_VISIBLE_TOOL_CONTRACTS',
 'RAILWAY_ARCHITECTURE_TECHNIQUES',
 'magnanimousCloudflareSummary',
 'magnanimousDevAgentSummary',
 'findReadyLocalBridgeDevice',
 'magnanimous_capability_mesh_checks',
 'scheduledMagnanimousCapabilityMesh',
 'Mutations are delegated only to existing staged/confirmation-gated handlers'
])assert(mesh.includes(needle),'Capability Mesh contract missing: '+needle);

assert(!mesh.includes("import TinyFish"),'Capability Mesh must not import TinyFish as a runtime dependency');
assert(!mesh.includes('TINYFISH_API_KEY'),'Capability Mesh must not require TinyFish credentials');
assert(mesh.includes("tinyfish_runtime_dependency:false"),'Capability Mesh must explicitly preserve TinyFish independence');
assert(mesh.includes("provider_required_for_magnanimous_identity:false"),'Railway must remain a replaceable rail, not Magnanimous identity');
assert(mesh.includes("direct_project_adapter_configured:direct"),'Railway direct readiness must be based on actual provider configuration');
assert(mesh.includes("action:'dispatch_workflow'"),'Railway exact deploy must route through the staged GitHub workflow action');
assert(mesh.includes("workflow_id:'magnanimous-railway-deploy.yml'"),'Railway exact deploy must target the guarded exact-commit workflow');
assert(!mesh.includes("confirm:true"),'Capability Mesh must not self-approve staged provider/repository mutations');

assert(dev.includes('export function magnanimousDevAgentSummary'),'Dev Agent readiness must be reusable by the Capability Mesh');
assert(security.includes("handleMagnanimousCapabilityMesh"),'Security entrypoint must mount the Capability Mesh');
assert(security.includes("getProviderRuntimeEnv(env)"),'Capability Mesh must receive server-side provider runtime credentials without exposing them to the browser');
assert(operations.includes('scheduledMagnanimousCapabilityMesh'),'Platform scheduler must record Capability Mesh readiness history');

for(const needle of [
 'workflow_dispatch:',
 'commit_sha:',
 'TARGET_SHA: ${{ inputs.commit_sha || github.sha }}',
 'Validate exact deployment target',
 'TARGET_SHA must be a full 40-character Git commit SHA'
])assert(workflow.includes(needle),'Railway exact-deploy workflow dispatch contract missing: '+needle);

for(const needle of [
 '/api/magnanimous/capability-mesh',
 '/api/magnanimous/capability-mesh/self-check',
 "capability:'railway.deploy_exact'",
 'RUN FULL READINESS CHECK',
 'STAGE CURRENT-MAIN RAILWAY PROMOTION',
 '/developer-agent',
 '/owner-web-agent'
])assert(owner.includes(needle),'Owner Capability Mesh UI missing: '+needle);

assert(ownerCenter.includes('/owner-capability-mesh'),'Owner Center must link to the unified Capability Mesh');
assert(ownerLayout.includes('index:false')&&ownerLayout.includes('follow:false'),'Private Capability Mesh page must remain noindex/nofollow');
assert(provider.includes("['capability-mesh','Capability Mesh'"),'Magnanimous tool inventory must expose Capability Mesh');
assert(provider.includes('Use the Magnanimous Capability Mesh'),'Magnanimous commander protocol must route through Capability Mesh');
assert(provider.includes('capability_mesh:true'),'Operator capability report must expose Capability Mesh');
assert(universal.includes("'capability-mesh'"),'Universal capability registry must include Capability Mesh');
assert(universal.includes("'provider-readiness-routing'"),'Universal execution model must include provider readiness routing');
assert(universal.includes('Route infrastructure, web, repository and deployment work through the Magnanimous Capability Mesh'),'Universal execution strategy must use the Capability Mesh');

console.log('Magnanimous Capability Mesh lock passed — Cloudflare, TinyFish-independent native web, GitHub and Railway-compatible deployment capabilities are unified beneath Magnanimous AI without bypassing truth or approval boundaries.');

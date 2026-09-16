import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const registry=read('worker/src/magnanimous-cloudflare-capability-registry.js');
const runtime=read('worker/src/magnanimous-cloudflare-runtime.js');
const securityEntry=read('worker/src/security-entrypoint.js');
const providerRuntime=read('worker/src/provider-runtime-env.js');
const platformCredentials=read('worker/src/platform-credentials.js');
const workerEntry=read('worker/src/entrypoint.js');
const seed=read('worker/src/cloudflare-tool-seed.js');
const migration=read('worker/migrations/0059_magnanimous_cloudflare_control.sql');
const ui=read('frontend/app/owner-cloudflare/page.tsx');

for(const family of ['compute','data','ai','security','delivery','zero-trust','network','media','email','observability','performance','developer']){
 must(registry.includes(`family('${family}'`),`Cloudflare family missing: ${family}`);
}
for(const skill of ['agents-sdk','durable-objects','wrangler','workers-best-practices','turnstile-spin','web-perf','cloudflare-one']){
 must(registry.includes(`'${skill}'`),`Cloudflare official skill missing: ${skill}`);
}
for(const endpoint of ['https://mcp.cloudflare.com/mcp','https://docs.mcp.cloudflare.com/mcp','https://bindings.mcp.cloudflare.com/mcp','https://observability.mcp.cloudflare.com/mcp']){
 must(registry.includes(endpoint),`Cloudflare MCP endpoint missing: ${endpoint}`);
}
for(const capability of ['workers-ai','dynamic-workers','browser-rendering','ai-crawl-control','cloudflare-agent','durable-objects','d1','kv','r2','queues','workflows','vectorize','ai-gateway','workers-vpc','secrets-store','access','gateway','tunnel','waf','turnstile','dns','cache','images','stream','logpush','radar']){
 must(registry.includes(`'${capability}'`),`Cloudflare capability missing: ${capability}`);
}
for(const technique of ['code-mode','bindings-first','durable-state','event-driven','edge-cache','zero-trust-origin','least-privilege','secrets-store','private-service-connectivity','separate-confirmation','idempotent-retries','ai-gateway','skills-on-demand','mcp-composition','sandbox-isolation','browser-isolation','observability','progressive-delivery','storage-by-access-pattern','security-at-edge','performance-budget']){
 must(registry.includes(`id:'${technique}'`),`Cloudflare architecture technique missing: ${technique}`);
}

must(registry.includes("brain_identity:'Magnanimous AI'"),'Magnanimous AI must remain the Cloudflare control-plane brain.');
must(registry.includes('provider_brand_override_allowed:false'),'Cloudflare must not override Magnanimous public identity.');
must(registry.includes('external_api_token_exposure_allowed:false'),'Cloudflare token exposure must remain forbidden.');
must(registry.includes('mutations_require_separate_confirmation:true'),'Cloudflare mutations must require separate confirmation.');
must(registry.includes('techniques:[...CLOUDFLARE_ARCHITECTURE_TECHNIQUES]'),'Cloudflare techniques must be exposed through the owner summary.');

must(runtime.includes("import { requirePlatformOwner }"),'Cloudflare runtime must require the platform-owner guard.');
must(runtime.includes("const API='https://api.cloudflare.com/client/v4'"),'Cloudflare runtime must use a fixed API origin.');
must(runtime.includes("CLOUDFLARE_PLATFORM_API_TOKEN"),'Cloudflare runtime must use a dedicated platform token name.');
must(!runtime.includes('env.CLOUDFLARE_API_TOKEN'),'Cloudflare runtime must not reuse the broad deployment token.');
must(runtime.includes("status:'needs_confirmation'"),'Cloudflare mutations must be staged before execution.');
must(runtime.includes("body.confirm!==true"),'Cloudflare confirmation must occur in a separate approval request.');
must(runtime.includes('CONFIRM_TTL=900'),'Cloudflare approvals must expire.');
for(const flag of ['CLOUDFLARE_MUTATIONS_ENABLED','CLOUDFLARE_DESTRUCTIVE_ACTIONS_ENABLED','CLOUDFLARE_SPEND_ACTIONS_ENABLED','CLOUDFLARE_IDENTITY_SECRET_ACTIONS_ENABLED','CLOUDFLARE_NETWORK_CONTROL_ENABLED','CLOUDFLARE_RESOURCE_CREATION_ENABLED']){
 must(runtime.includes(flag),`Cloudflare hard lock missing: ${flag}`);
}
must(runtime.includes("return json({path:apiPath,provider_response:result.data,secrets_exposed:false}"),'Cloudflare read responses must explicitly deny secret exposure.');
must(runtime.includes("provider_tokens_exposed:false"),'Cloudflare MCP catalog must not expose provider tokens.');

must(platformCredentials.includes("{id:'cloudflare',name:'Magnanimous Cloudflare Control Plane'"),'Cloudflare credentials must be registered in the central encrypted platform vault.');
must(platformCredentials.includes("{key:'CLOUDFLARE_PLATFORM_API_TOKEN',label:'Dedicated least-privilege Cloudflare Platform API Token',secret:true"),'Cloudflare platform API token must remain a secret vault field.');
for(const key of ['CLOUDFLARE_PLATFORM_API_TOKEN','CLOUDFLARE_PLATFORM_ACCOUNT_ID','CLOUDFLARE_PLATFORM_ZONE_ID']){
 must(platformCredentials.includes(`key:'${key}'`),`Cloudflare vault key missing: ${key}`);
 must(providerRuntime.includes(`'${key}'`),`Cloudflare provider runtime key missing: ${key}`);
}
must(securityEntry.includes("import { getProviderRuntimeEnv } from './provider-runtime-env.js'"),'Cloudflare control plane must consume the server-side provider runtime environment.');
must(securityEntry.includes("policyUrl.pathname.startsWith('/api/cloudflare')"),'Vaulted provider credentials must be scoped to Cloudflare control-plane requests.');
must(securityEntry.includes('handleMagnanimousCloudflare(policyRequest,cloudflareEnv)'),'Cloudflare handler must receive the vaulted provider environment.');

must(ui.includes('MAGNANIMOUS CLOUDFLARE CONTROL'),'Owner Cloudflare console identity is missing.');
must(ui.includes('STAGE ≠ EXECUTE'),'Owner console must distinguish staging from execution.');
must(ui.includes("body:JSON.stringify({confirm:true})"),'Owner console must use a distinct confirmation request.');
must(ui.includes('No Cloudflare API token is entered or displayed in this browser console.'),'Owner console must explicitly keep credentials server-side.');
must(!/type=["']password["']/.test(ui),'Owner Cloudflare console must not collect provider secrets in the browser.');
must(ui.includes("role=\"status\"")&&ui.includes('aria-live="polite"'),'Owner console must expose live status changes accessibly.');
must(ui.includes(':focus-visible'),'Owner console must preserve visible keyboard focus.');

must(seed.includes("from './magnanimous-tool-foundry.js'"),'Cloudflare knowledge must seed through the Magnanimous Tool Foundry.');
must(seed.includes('MAGNANIMOUS_CLOUDFLARE_FAMILIES'),'Cloudflare Tool Foundry seed must cover every capability family.');
must(seed.includes('CLOUDFLARE_ARCHITECTURE_TECHNIQUES'),'Cloudflare Tool Foundry seed must include architecture techniques.');
must(seed.includes('requiresConnection:true'),'Live Cloudflare family recipes must preserve connection/authorization requirements.');
must(seed.includes('stage the exact method/path/payload first'),'Cloudflare tool recipes must preserve staged mutation approval.');
must(workerEntry.includes("from './cloudflare-tool-seed.js'"),'Worker bootstrap must import Cloudflare Tool Foundry seed.');
must(workerEntry.includes('await ensureMagnanimousCloudflareToolSeed(env)'),'Worker bootstrap must seed Cloudflare knowledge.');

must(migration.includes('magnanimous_cloudflare_actions'),'Cloudflare durable action ledger migration is missing.');
must(migration.includes('magnanimous_cloudflare_audit'),'Cloudflare audit ledger migration is missing.');
must(securityEntry.includes("from './magnanimous-cloudflare-runtime.js'"),'Central security entrypoint must mount Cloudflare control plane.');
must(securityEntry.includes('await handleMagnanimousCloudflare(policyRequest,cloudflareEnv)'),'Cloudflare control plane must run after central session/policy resolution with server-side vaulted credentials.');

console.log('Magnanimous Cloudflare current capability, techniques, encrypted vault, Tool Foundry, owner-console and action contracts verified.');

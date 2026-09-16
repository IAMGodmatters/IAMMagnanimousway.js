import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const registry=read('worker/src/magnanimous-cloudflare-capability-registry.js');
const runtime=read('worker/src/magnanimous-cloudflare-runtime.js');
const entry=read('worker/src/security-entrypoint.js');
const migration=read('worker/migrations/0059_magnanimous_cloudflare_control.sql');

for(const family of ['compute','data','ai','security','delivery','zero-trust','network','media','email','observability','performance','developer']){
 must(registry.includes(`family('${family}'`),`Cloudflare family missing: ${family}`);
}
for(const skill of ['agents-sdk','durable-objects','wrangler','workers-best-practices','turnstile-spin','web-perf','cloudflare-one']){
 must(registry.includes(`'${skill}'`),`Cloudflare official skill missing: ${skill}`);
}
for(const endpoint of ['https://mcp.cloudflare.com/mcp','https://docs.mcp.cloudflare.com/mcp','https://bindings.mcp.cloudflare.com/mcp','https://observability.mcp.cloudflare.com/mcp']){
 must(registry.includes(endpoint),`Cloudflare MCP endpoint missing: ${endpoint}`);
}
for(const capability of ['workers-ai','durable-objects','d1','kv','r2','queues','workflows','vectorize','ai-gateway','access','gateway','tunnel','waf','turnstile','dns','cache','images','stream','logpush','radar']){
 must(registry.includes(`'${capability}'`),`Cloudflare capability missing: ${capability}`);
}

must(registry.includes("brain_identity:'Magnanimous AI'"),'Magnanimous AI must remain the Cloudflare control-plane brain.');
must(registry.includes('provider_brand_override_allowed:false'),'Cloudflare must not override Magnanimous public identity.');
must(registry.includes('external_api_token_exposure_allowed:false'),'Cloudflare token exposure must remain forbidden.');
must(registry.includes('mutations_require_separate_confirmation:true'),'Cloudflare mutations must require separate confirmation.');

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

must(migration.includes('magnanimous_cloudflare_actions'),'Cloudflare durable action ledger migration is missing.');
must(migration.includes('magnanimous_cloudflare_audit'),'Cloudflare audit ledger migration is missing.');
must(entry.includes("from './magnanimous-cloudflare-runtime.js'"),'Central security entrypoint must mount Cloudflare control plane.');
must(entry.includes('await handleMagnanimousCloudflare(policyRequest,env)'),'Cloudflare control plane must run after central session/policy resolution.');

console.log('Magnanimous Cloudflare capability and action contracts verified.');

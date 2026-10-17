import { upsertApprovedTeachingTool } from './magnanimous-tool-foundry.js';
import { MAGNANIMOUS_CLOUDFLARE_FAMILIES, CLOUDFLARE_ARCHITECTURE_TECHNIQUES } from './magnanimous-cloudflare-capability-registry.js';
import { MAGNANIMOUS_REGISTRAR_ADAPTERS, REGISTRAR_GUARDRAILS } from './magnanimous-registrar-capability-registry.js';

let seeded=false;
let seedPromise=null;

function riskForFamily(id){
 if(['network','delivery'].includes(id))return'high';
 if(['security','zero-trust','email','media'].includes(id))return'medium';
 return'low';
}

function stepsForFamily(family){
 const capabilityNames=family.capabilities.map(x=>x.name).join(', ');
 return[
  `Classify the task under Cloudflare ${family.name} and identify the smallest capability needed.`,
  `Use the Cloudflare capability map and official MCP/docs discovery to confirm the current endpoint or binding before execution. Relevant capabilities include: ${capabilityNames}.`,
  'Prefer bindings/native Magnanimous runtime primitives for in-Worker resources; prefer official Cloudflare MCP/API only for live account configuration or current provider state.',
  'For read-only account state, use the owner-only /api/cloudflare/read path with a dedicated least-privilege token. Never expose provider credentials.',
  'For any mutation, stage the exact method/path/payload first, classify spend/destructive/identity/network risk, then require the separate approval endpoint and all matching server-side hard locks.',
  'Verify the Cloudflare response, record the action/audit result, and never claim an infrastructure change occurred unless the real provider response confirms it.'
 ];
}

function registrarRisk(adapter){return adapter.capabilities.some(x=>x.mode==='spend')?'high':adapter.capabilities.some(x=>x.mode==='write')?'medium':'low';}
function registrarSteps(adapter){
 const reads=adapter.capabilities.filter(x=>x.mode==='read').map(x=>x.name).join(', ');
 const writes=adapter.capabilities.filter(x=>x.mode==='write').map(x=>x.name).join(', ');
 const spend=adapter.capabilities.filter(x=>x.mode==='spend').map(x=>x.name).join(', ');
 const connection=adapter.connection_keys.join(', ');
 return[
  `Treat ${adapter.name} as a replaceable registrar adapter beneath Magnanimous AI. Official documentation: ${adapter.docs}`,
  `Available researched read capabilities include: ${reads||'provider-specific account state'}. Confirm the current provider contract before a live call.`,
  writes?`Potential non-billable mutations include: ${writes}. Use preview/dry-run where available, durable staging, separate confirmation, idempotency, and post-change verification.`:'No non-billable mutation contract is currently absorbed for this adapter.',
  spend?`Chargeable operations include: ${spend}. These are knowledge-only until an explicit paid-action authorization passes the Magnanimous spend gate. Never infer authorization from the presence of credentials.`:'No chargeable operation is currently catalogued for this adapter.',
  `Connection material is server-side only (${connection||'provider-specific credentials'}). Never expose secret values, transfer/EPP codes, private keys, or raw provider credentials to customer-facing clients or logs.`,
  adapter.state.startsWith('live')?`Runtime state is ${adapter.state}. Use ${adapter.live_via} for live work when connected and authorized.`:`Runtime state is ${adapter.state}. Learn and plan with this adapter now, but do not claim execution until a tested Magnanimous adapter and authorized account connection exist.`,
  REGISTRAR_GUARDRAILS.truth
 ];
}

async function seedRegistrarTools(env){
 for(const adapter of MAGNANIMOUS_REGISTRAR_ADAPTERS){
  await upsertApprovedTeachingTool(env,{
   submissionId:0,
   agentId:'magnanimous-registrar-control',
   name:`registrar-${adapter.id}`,
   purpose:`Research, plan, inspect, and when safely connected execute ${adapter.name} registrar/domain operations through Magnanimous-owned contracts without exposing provider identity or transferring action authority.`,
   family:'registrar',
   risk:registrarRisk(adapter),
   steps:registrarSteps(adapter),
   requiredCapabilities:adapter.capabilities.map(x=>`registrar:${adapter.id}:${x.id}`).slice(0,30),
   requiresConnection:true
  });
 }
 await upsertApprovedTeachingTool(env,{
  submissionId:0,
  agentId:'magnanimous-registrar-control',
  name:'registrar-universal-routing',
  purpose:'Choose the correct connected registrar adapter, normalize provider differences, preserve Magnanimous identity, and apply one consistent safety model across registrar ecosystems.',
  family:'registrar-architecture',
  risk:'medium',
  steps:[REGISTRAR_GUARDRAILS.identity_owner,REGISTRAR_GUARDRAILS.secrets,REGISTRAR_GUARDRAILS.reads,REGISTRAR_GUARDRAILS.dns_mutations,REGISTRAR_GUARDRAILS.spend,REGISTRAR_GUARDRAILS.transfer,REGISTRAR_GUARDRAILS.truth],
  requiredCapabilities:['registrar:discovery','registrar:routing','registrar:normalized-domain-model','registrar:spend-gate','registrar:transfer-secret-protection'],
  requiresConnection:false
 });
}

export async function ensureMagnanimousCloudflareToolSeed(env){
 if(seeded||!env?.DB)return;
 if(seedPromise)return seedPromise;
 seedPromise=(async()=>{
  for(const family of MAGNANIMOUS_CLOUDFLARE_FAMILIES){
   const required=family.capabilities.map(x=>`cloudflare:${x.id}`).slice(0,20);
   await upsertApprovedTeachingTool(env,{
    submissionId:0,
    agentId:'magnanimous-cloudflare-control',
    name:`cloudflare-${family.id}`,
    purpose:`Plan and execute Cloudflare ${family.name} work through Magnanimous-owned contracts while keeping Cloudflare internal, replaceable, least-privilege, and confirmation-gated.`,
    family:'cloudflare',
    risk:riskForFamily(family.id),
    steps:stepsForFamily(family),
    requiredCapabilities:required,
    requiresConnection:true
   });
  }
  await upsertApprovedTeachingTool(env,{
   submissionId:0,
   agentId:'magnanimous-cloudflare-control',
   name:'cloudflare-architecture-techniques',
   purpose:'Apply Cloudflare architecture techniques to Magnanimous platform design without transferring identity, memory ownership, or unsafe action authority to the provider.',
   family:'cloudflare-architecture',
   risk:'low',
   steps:CLOUDFLARE_ARCHITECTURE_TECHNIQUES.map(x=>`${x.name}: ${x.apply}`),
   requiredCapabilities:['cloudflare:architecture','cloudflare:skills','cloudflare:mcp'],
   requiresConnection:false
  });
  await seedRegistrarTools(env);
  seeded=true;
 })();
 try{await seedPromise}finally{if(!seeded)seedPromise=null;}
}

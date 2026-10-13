import { upsertApprovedTeachingTool } from './magnanimous-tool-foundry.js';
import { MAGNANIMOUS_PUBLIC_API_PROVIDERS, getPublicApiCapabilityManifest } from './magnanimous-public-api-capability-registry.js';

let seeded=false;
let seedPromise=null;

function capabilitiesFor(providerId){
  return getPublicApiCapabilityManifest().filter(row=>row.connector_id===`public-api:${providerId}`).map(row=>row.capability);
}

function stepsFor(provider){
  const capabilities=capabilitiesFor(provider.id);
  return [
    `Recognize when the user goal can be grounded by ${provider.use_case}`,
    `Use only the fixed Magnanimous read-only adapter for ${provider.name}; never construct an arbitrary proxy URL or expose a provider credential.`,
    `Available normalized capabilities: ${capabilities.join(', ')||'read-only reference lookup'}.`,
    'Validate all user parameters before the request, bound the provider timeout and response size, and fail safely when the source is unavailable.',
    'Normalize the returned evidence under Magnanimous AI identity while retaining source attribution and links for verification.',
    `Preserve this source-specific guardrail: ${provider.guardrail}`,
    'Do not copy provider proprietary implementation details, scrape restricted content, or treat a discovery directory as the legal authority for provider usage.',
    'When evidence is incomplete, stale, conflicting, or outside the provider scope, say so and use another authorized research path rather than inventing a result.'
  ];
}

export async function ensureMagnanimousPublicApiToolSeed(env){
  if(seeded||!env?.DB)return;
  if(seedPromise)return seedPromise;
  seedPromise=(async()=>{
    for(const provider of MAGNANIMOUS_PUBLIC_API_PROVIDERS){
      const capabilities=capabilitiesFor(provider.id);
      await upsertApprovedTeachingTool(env,{
        submissionId:0,
        agentId:'magnanimous-public-data',
        name:`public-data-${provider.id}`,
        purpose:`Use ${provider.name} as a replaceable read-only evidence source through Magnanimous-owned validation, normalization, policy and verification.`,
        family:'public-data',
        risk:'low',
        steps:stepsFor(provider),
        requiredCapabilities:capabilities.map(x=>`public-data:${x}`).slice(0,20),
        requiresConnection:false
      });
    }
    seeded=true;
  })();
  try{await seedPromise}finally{if(!seeded)seedPromise=null;}
}

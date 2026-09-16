import { upsertApprovedTeachingTool } from './magnanimous-tool-foundry.js';
import { MAGNANIMOUS_CLOUDFLARE_FAMILIES, CLOUDFLARE_ARCHITECTURE_TECHNIQUES } from './magnanimous-cloudflare-capability-registry.js';

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
  seeded=true;
 })();
 try{await seedPromise}finally{if(!seeded)seedPromise=null;}
}

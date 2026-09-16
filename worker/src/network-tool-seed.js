import { upsertApprovedTeachingTool } from './magnanimous-tool-foundry.js';
import { MAGNANIMOUS_NETWORK_FAMILIES, MAGNANIMOUS_NETWORK_ARCHITECTURE, APNIC_READINESS_MODEL } from './magnanimous-network-capability-registry.js';

let seeded=false;
let seedPromise=null;

function riskFor(family){
 if(['routing','philippines-compliance','transport'].includes(family.id))return'high';
 if(['subscriber-core','security','business'].includes(family.id))return'medium';
 return'low';
}

function stepsFor(family){
 const names=family.capabilities.map(x=>x.name).join(', ');
 return[
  `Classify the network task under ${family.name}; relevant capabilities include: ${names}.`,
  'Start with topology, capacity, failure-domain and regulatory assumptions. Treat unknown site, spectrum, pole/tower, backhaul and upstream details as unknown rather than inventing them.',
  'Prefer IPv6-first dual-stack architecture. Separate management, infrastructure, subscriber and public-service address plans; document IPAM before deployment.',
  'Use redundant routing and backhaul design before making availability claims. Validate MTU, addressing, routing policy, DNS, DHCP/AAA, monitoring and rollback paths.',
  'For BGP, RPKI/IRR, route withdrawals, public prefix announcements, spectrum use, radio licensing, paid transit/peering, hardware purchases or public telecom activation: plan freely, but keep execution disabled until real organization authority, applicable licensing and a separate consequential-action approval exist.',
  'Record what was actually measured or configured. Never claim an ASN, IP allocation, spectrum authorization, peering relationship, transit circuit or radio license exists unless verified from the real registry/provider/regulator result.'
 ];
}

export async function ensureMagnanimousNetworkToolSeed(env){
 if(seeded||!env?.DB)return;
 if(seedPromise)return seedPromise;
 seedPromise=(async()=>{
  for(const family of MAGNANIMOUS_NETWORK_FAMILIES){
   await upsertApprovedTeachingTool(env,{
    submissionId:0,
    agentId:'magnanimous-network-architect',
    name:`network-${family.id}`,
    purpose:`Design, explain, audit and safely stage ${family.name} for a Magnanimous-owned Internet access network without pretending regulated or external network authority already exists.`,
    family:'network-infrastructure',
    risk:riskFor(family),
    steps:stepsFor(family),
    requiredCapabilities:family.capabilities.map(x=>`network:${x.id}`).slice(0,30),
    requiresConnection:false
   });
  }
  await upsertApprovedTeachingTool(env,{
   submissionId:0,
   agentId:'magnanimous-network-architect',
   name:'network-sovereignty-roadmap',
   purpose:'Move Magnanimous toward owning its access network, routing identity, IPv6 resources, DNS, subscriber core, monitoring and automation while preserving legal, routing and spend gates.',
   family:'network-architecture',
   risk:'high',
   steps:[
    MAGNANIMOUS_NETWORK_ARCHITECTURE.target,
    MAGNANIMOUS_NETWORK_ARCHITECTURE.reality_boundary,
    MAGNANIMOUS_NETWORK_ARCHITECTURE.preferred_ip_strategy,
    `ASN readiness: ${APNIC_READINESS_MODEL.asn}`,
    `IPv6 LIR readiness: ${APNIC_READINESS_MODEL.ipv6_lir}`,
    `Portable multihoming IPv6: ${APNIC_READINESS_MODEL.ipv6_multihoming}`,
    MAGNANIMOUS_NETWORK_ARCHITECTURE.routing_safety,
    MAGNANIMOUS_NETWORK_ARCHITECTURE.spectrum_safety,
    MAGNANIMOUS_NETWORK_ARCHITECTURE.billing_safety
   ],
   requiredCapabilities:['network:architecture','network:asn','network:ipv6','network:bgp','network:access','network:subscriber-core','network:compliance'],
   requiresConnection:false
  });
  seeded=true;
 })();
 try{await seedPromise}finally{if(!seeded)seedPromise=null;}
}

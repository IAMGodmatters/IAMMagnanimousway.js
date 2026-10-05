// Magnanimous execution parity: distinguish advertised capability from live executability.
export const MAGNANIMOUS_EXECUTION_PARITY=Object.freeze({
 identity:'Magnanimous AI',
 principle:'Never confuse capability inventory with live execution.',
 states:['live-native','live-authorized','live-fallback','degraded','configured-not-proven','contract-only','blocked'],
 selection_order:['live-native','live-authorized-free','live-authorized-funded','live-fallback'],
 required_evidence:['runtime-readiness','authorization','health','recent-outcome','cost-policy','approval-policy'],
 reliability:{
  automatic_failover:true,
  adaptive_provider_scoring:true,
  provider_circuit_breaking:true,
  bounded_timeouts:true,
  graceful_degradation:true,
  distributed_tracing:true,
  preserve_user_request_on_retry:true
 },
 domains:{
  reasoning:['configured-ai-engine','outcome-history'],
  research:['public-web','reference-search','news','optional-authorized-search'],
  browser:['server-browser','local-bridge'],
  code:['sandbox'],
  files:['workspace-storage','semantic-retrieval'],
  media:['media-worker','browser-native-media'],
  tools:['capability-mesh','authorized-connectors','mcp'],
  communications:['email','telecom'],
  payments:['stripe'],
  deployment:['github','railway']
 },
 paid_rule:'Metered execution is eligible only when enabled and workspace funding/entitlement checks pass.',
 truth_rule:'A contract-only or configured-not-proven capability must never be presented as successfully executable.'
});
export function executionState({native=false,authorized=false,healthy=false,fallback=false,configured=false,blocked=false}={}){
 if(blocked)return'blocked';
 if(native&&healthy)return'live-native';
 if(authorized&&healthy)return fallback?'live-fallback':'live-authorized';
 if(configured)return'degraded';
 return'contract-only';
}

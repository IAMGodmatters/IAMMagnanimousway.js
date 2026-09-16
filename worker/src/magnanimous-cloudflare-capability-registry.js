const cap=(id,name,mode='adapter',notes='')=>({id,name,mode,notes});
const family=(id,name,capabilities,extra={})=>({id,name,capabilities,...extra});

export const CLOUDFLARE_MANAGED_MCP_SERVERS=Object.freeze([
 {id:'cloudflare-api',url:'https://mcp.cloudflare.com/mcp',purpose:'Entire Cloudflare API via token-efficient Code Mode search + execute',recommended:true},
 {id:'docs',url:'https://docs.mcp.cloudflare.com/mcp',purpose:'Current Cloudflare developer documentation'},
 {id:'workers-bindings',url:'https://bindings.mcp.cloudflare.com/mcp',purpose:'Workers bindings and developer primitives'},
 {id:'workers-builds',url:'https://builds.mcp.cloudflare.com/mcp',purpose:'Workers build insight and management'},
 {id:'observability',url:'https://observability.mcp.cloudflare.com/mcp',purpose:'Logs, analytics and application debugging'},
 {id:'casb',url:'https://casb.mcp.cloudflare.com/mcp',purpose:'Cloudflare One CASB posture and findings'},
 {id:'radar',url:'https://radar.mcp.cloudflare.com/mcp',purpose:'Internet traffic, URL scan and Radar insight'},
 {id:'blog',url:'https://blog.mcp.cloudflare.com/mcp',purpose:'Cloudflare engineering/product knowledge'}
]);

export const CLOUDFLARE_AGENT_SKILLS=Object.freeze([
 'cloudflare','nextjs-on-cloudflare','agents-sdk','durable-objects','sandbox-next','sandbox-stable','sandbox-migrate-to-next',
 'wrangler','workers-best-practices','cloudflare-email-service','turnstile-spin','web-perf','cloudflare-one','cloudflare-one-migrations'
]);

export const MAGNANIMOUS_CLOUDFLARE_FAMILIES=Object.freeze([
 family('compute','Compute & application runtime',[
  cap('workers','Workers serverless compute'),cap('static-assets','Workers Static Assets'),cap('pages','Pages'),cap('containers','Containers','guarded'),
  cap('durable-objects','Durable Objects'),cap('workflows','Workflows'),cap('queues','Queues'),cap('cron-triggers','Cron Triggers'),
  cap('service-bindings','Service Bindings'),cap('smart-placement','Smart Placement'),cap('workers-builds','Workers Builds'),cap('workers-for-platforms','Workers for Platforms','guarded'),
  cap('sandbox','Sandbox / isolated execution','guarded'),cap('browser-run','Browser Run / browser execution','guarded')
 ]),
 family('data','Data, storage & messaging',[
  cap('d1','D1 SQL'),cap('kv','Workers KV'),cap('r2','R2 object storage'),cap('hyperdrive','Hyperdrive'),cap('vectorize','Vectorize'),
  cap('analytics-engine','Analytics Engine'),cap('queues','Queues'),cap('pipelines','Pipelines'),cap('durable-object-sql','Durable Object SQLite')
 ]),
 family('ai','AI & agent platform',[
  cap('workers-ai','Workers AI'),cap('ai-gateway','AI Gateway'),cap('ai-search','AI Search'),cap('agents-sdk','Agents SDK'),
  cap('agent-skills','Agent Skills'),cap('mcp-client','MCP client'),cap('mcp-server','Remote MCP server'),cap('code-mode','Code Mode'),
  cap('think','@cloudflare/think agent harness'),cap('ai-chat','@cloudflare/ai-chat'),cap('shell','@cloudflare/shell','guarded'),cap('voice','Agents voice'),
  cap('x402','x402 payments','spend-locked'),cap('browser-agents','Browser agents','guarded')
 ]),
 family('security','Application security',[
  cap('waf','Web Application Firewall'),cap('ddos','DDoS protection'),cap('bot-management','Bot Management'),cap('rate-limiting','Rate Limiting'),
  cap('api-shield','API Shield'),cap('page-shield','Page Shield'),cap('turnstile','Turnstile'),cap('ssl-tls','SSL/TLS'),cap('rulesets','Rulesets'),
  cap('firewall-rules','Firewall rules'),cap('url-scanner','URL Scanner'),cap('security-analytics','Security Analytics'),cap('leaked-credentials','Leaked credential detection')
 ]),
 family('delivery','DNS, CDN & traffic delivery',[
  cap('dns','Authoritative DNS'),cap('dnssec','DNSSEC','guarded'),cap('cache','CDN/cache'),cap('cache-rules','Cache Rules'),cap('tiered-cache','Tiered Cache'),
  cap('argo-smart-routing','Argo Smart Routing','spend-locked'),cap('load-balancing','Load Balancing','spend-locked'),cap('waiting-room','Waiting Room'),
  cap('spectrum','Spectrum','spend-locked'),cap('registrar','Cloudflare Registrar','spend-locked'),cap('zone-management','Zone management','guarded')
 ]),
 family('zero-trust','Cloudflare One / Zero Trust',[
  cap('access','Access'),cap('gateway','Secure Web Gateway'),cap('tunnel','Cloudflare Tunnel','guarded'),cap('one-client','Cloudflare One Client / WARP'),
  cap('mesh','Cloudflare Mesh'),cap('browser-isolation','Remote Browser Isolation','guarded'),cap('casb','CASB'),cap('dlp','Data Loss Prevention'),
  cap('email-security','Email security'),cap('device-posture','Device posture'),cap('identity','Identity integrations'),cap('dex','Digital Experience Monitoring')
 ]),
 family('network','Network services',[
  cap('cloudflare-wan','Cloudflare WAN','enterprise-gated'),cap('magic-transit','Magic Transit','enterprise-gated'),cap('network-firewall','Cloudflare Network Firewall','enterprise-gated'),
  cap('network-interconnect','Cloudflare Network Interconnect','enterprise-gated'),cap('gre-ipsec','GRE/IPsec connectors','enterprise-gated'),cap('network-flow','Network Flow'),
  cap('network-analytics','Network Analytics'),cap('packet-capture','Packet Capture','guarded'),cap('bgp-routing','BGP/routing','regulated-gated')
 ]),
 family('media','Media & realtime',[
  cap('images','Cloudflare Images'),cap('stream','Cloudflare Stream','spend-locked'),cap('realtime','Realtime / Calls'),cap('image-resizing','Image Resizing'),
  cap('video-delivery','Video delivery'),cap('webrtc','WebRTC/realtime media')
 ]),
 family('email','Email platform',[
  cap('email-routing','Email Routing'),cap('email-workers','Email Workers'),cap('email-sending','Email Sending','guarded'),cap('email-agent-channel','Agent email channel')
 ]),
 family('observability','Analytics & observability',[
  cap('workers-observability','Workers Observability'),cap('logs','Logs'),cap('tail-workers','Tail Workers'),cap('logpush','Logpush'),cap('log-explorer','Log Explorer'),
  cap('graphql-analytics','GraphQL Analytics API'),cap('web-analytics','Web Analytics'),cap('radar','Cloudflare Radar'),cap('tracing','Tracing'),cap('metrics','Metrics')
 ]),
 family('performance','Performance & web optimization',[
  cap('web-performance','Web performance/Core Web Vitals'),cap('zaraz','Zaraz'),cap('zaraz-consent','Zaraz Consent Management'),cap('managed-components','Managed Components'),
  cap('compression','Compression'),cap('http3','HTTP/3'),cap('early-hints','Early Hints'),cap('origin-optimization','Origin optimization')
 ]),
 family('developer','Developer platform & automation',[
  cap('wrangler','Wrangler CLI'),cap('rest-api','Cloudflare REST API'),cap('openapi','OpenAPI'),cap('graphql-api','GraphQL API'),cap('terraform','Terraform provider'),
  cap('mcp-code-mode','Cloudflare API MCP Code Mode'),cap('skills-plugin','Cloudflare Skills plugin'),cap('local-dev','Local development/Miniflare'),cap('bindings','Bindings'),cap('secrets','Secrets','guarded')
 ])
]);

export const MAGNANIMOUS_CLOUDFLARE_POLICY=Object.freeze({
 identity:'Magnanimous Cloudflare Control Plane',
 brain_identity:'Magnanimous AI',
 public_provider_identity:'Magnanimous AI',
 provider_internal_only:true,
 provider_brand_override_allowed:false,
 provider_memory_ownership_allowed:false,
 external_api_token_exposure_allowed:false,
 cloudflare_api_base:'https://api.cloudflare.com/client/v4',
 cloudflare_mcp_url:'https://mcp.cloudflare.com/mcp',
 code_mode_preferred:true,
 reads_enabled_when_authorized:true,
 mutations_require_separate_confirmation:true,
 spend_actions_default_enabled:false,
 billing_actions_default_enabled:false,
 membership_identity_actions_default_enabled:false,
 api_token_secret_actions_default_enabled:false,
 zone_deletion_default_enabled:false,
 registrar_purchase_default_enabled:false,
 network_route_bgp_actions_default_enabled:false
});

export function magnanimousCloudflareSummary(env={}){
 const token=String(env.CLOUDFLARE_PLATFORM_API_TOKEN||'').trim();
 const account=String(env.CLOUDFLARE_PLATFORM_ACCOUNT_ID||'').trim();
 const zone=String(env.CLOUDFLARE_PLATFORM_ZONE_ID||'').trim();
 return{
  ...MAGNANIMOUS_CLOUDFLARE_POLICY,
  source_checked_at:'2026-09-16',
  api_surface:'Cloudflare API via compact search/execute pattern; official MCP currently covers more than 2,500 endpoints',
  family_count:MAGNANIMOUS_CLOUDFLARE_FAMILIES.length,
  capability_count:MAGNANIMOUS_CLOUDFLARE_FAMILIES.reduce((n,f)=>n+f.capabilities.length,0),
  skills:[...CLOUDFLARE_AGENT_SKILLS],
  mcp_servers:[...CLOUDFLARE_MANAGED_MCP_SERVERS],
  families:MAGNANIMOUS_CLOUDFLARE_FAMILIES,
  readiness:{configured:Boolean(token),account_id_configured:Boolean(account),zone_id_configured:Boolean(zone),least_privilege_token_recommended:true},
  action_model:'Owner-only direct reads; mutations are staged, separately confirmed, audited, and subject to hard spend/security locks.'
 };
}

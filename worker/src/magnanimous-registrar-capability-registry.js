// Provider research snapshot: 2026-09-17. This registry teaches Magnanimous
// what registrar families can do without transferring identity, memory, or
// unsafe action authority to an outside provider.

const cap=(id,name,mode='read')=>({id,name,mode});

export const MAGNANIMOUS_REGISTRAR_ADAPTERS=[
 {
  id:'porkbun',name:'Porkbun',state:'live',live_via:'magnanimous-porkbun-runtime',
  docs:'https://porkbun.com/api/json/v3/documentation',
  auth:['api-key','secret-api-key'],sandbox:true,mcp:true,openapi:true,webhooks:true,
  connection_keys:['PORKBUN_API_KEY','PORKBUN_SECRET_API_KEY'],
  capabilities:[cap('portfolio','Domain portfolio'),cap('domain-detail','Domain metadata'),cap('availability','Availability and pricing'),cap('dns','DNS CRUD','write'),cap('dnssec','DNSSEC'),cap('nameservers','Nameservers and glue','write'),cap('register','Domain registration','spend'),cap('renew','Domain renewal','spend'),cap('transfer-in','Transfer in','spend'),cap('ssl','SSL certificate retrieval'),cap('email-forwarding','Email forwarding','write'),cap('hosting','Hosting management','write')]
 },
 {
  id:'cloudflare-registrar',name:'Cloudflare Registrar',state:'live-read',live_via:'cloudflare-control-plane',
  docs:'https://developers.cloudflare.com/registrar/registrar-api/',
  auth:['api-token','account-id'],sandbox:true,mcp:true,openapi:true,webhooks:false,
  connection_keys:['CLOUDFLARE_PLATFORM_API_TOKEN','CLOUDFLARE_PLATFORM_ACCOUNT_ID'],
  capabilities:[cap('search','Domain search'),cap('availability','Authoritative availability and pricing'),cap('registrations','Registration inventory'),cap('registration-detail','Registration detail'),cap('registration-status','Registration workflow status'),cap('extensions','Extension metadata and registration schemas'),cap('register','Domain registration','spend'),cap('registration-update','Registration settings','write')],
  notes:['Registrar API is beta. Premium registrations are not supported by the API. Renewals and transfers are not enabled through the beta registration workflow.']
 },
 {
  id:'godaddy',name:'GoDaddy',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://developer.godaddy.com/en/docs/api-users/domains',auth:['oauth2'],sandbox:false,mcp:false,openapi:true,webhooks:false,
  connection_keys:['GODADDY_OAUTH_TOKEN','GODADDY_CUSTOMER_ID'],
  capabilities:[cap('search','Availability search'),cap('portfolio','Domain inventory'),cap('domain-detail','Domain detail'),cap('dns','DNS CRUD','write'),cap('nameservers','Nameserver update','write'),cap('contacts','WHOIS contacts','write'),cap('lock','Registry lock','write'),cap('renew','Renewal','spend'),cap('transfer','Transfers','spend'),cap('register','Registration quote/execute','spend')]
 },
 {
  id:'namecheap',name:'Namecheap',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://www.namecheap.com/support/api/methods/',auth:['api-user','api-key','username','client-ip'],sandbox:true,mcp:false,openapi:false,webhooks:false,
  connection_keys:['NAMECHEAP_API_USER','NAMECHEAP_API_KEY','NAMECHEAP_USERNAME','NAMECHEAP_CLIENT_IP'],
  capabilities:[cap('portfolio','Domain inventory'),cap('domain-detail','Domain information'),cap('contacts','Contacts','write'),cap('availability','Availability'),cap('tlds','TLD list'),cap('lock','Registrar lock','write'),cap('dns','DNS host records','write'),cap('nameservers','Nameservers and registered nameserver hosts','write'),cap('register','Registration','spend'),cap('renew','Renewal','spend'),cap('transfer','Transfer in and status','spend')]
 },
 {
  id:'namesilo',name:'NameSilo',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://www.namesilo.com/api-reference',auth:['api-key'],sandbox:true,mcp:false,openapi:false,webhooks:false,
  connection_keys:['NAMESILO_API_KEY'],
  capabilities:[cap('portfolio','Active domain inventory'),cap('domain-detail','Domain information'),cap('availability','Registration and transfer availability'),cap('dns','DNS management','write'),cap('nameservers','Nameserver management','write'),cap('register','Registration','spend'),cap('renew','Renewal','spend'),cap('transfer','Transfer in and status','spend')]
 },
 {
  id:'dynadot',name:'Dynadot',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://www.dynadot.com/domain/api-commands',auth:['api-key'],sandbox:true,mcp:false,openapi:false,webhooks:false,
  connection_keys:['DYNADOT_API_KEY'],
  capabilities:[cap('portfolio','Domain inventory'),cap('domain-detail','Domain state'),cap('pricing','TLD pricing'),cap('availability','Domain search and availability'),cap('dns','DNS management','write'),cap('nameservers','Nameserver management','write'),cap('contacts','WHOIS contacts','write'),cap('privacy','Privacy settings','write'),cap('folders','Portfolio folders','write'),cap('aftermarket','Aftermarket data'),cap('register','Registration','spend'),cap('renew','Renewal','spend'),cap('transfer','Transfer','spend')]
 },
 {
  id:'gandi',name:'Gandi',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://api.gandi.net/docs/domains/',auth:['personal-access-token'],sandbox:true,mcp:false,openapi:true,webhooks:false,
  connection_keys:['GANDI_PERSONAL_ACCESS_TOKEN'],
  capabilities:[cap('portfolio','Domain inventory'),cap('domain-detail','Domain management'),cap('livedns','LiveDNS','write'),cap('dnssec','DNSSEC','write'),cap('nameservers','Nameserver management','write'),cap('owner-change','Change owner','spend'),cap('organization','Organization and sharing context')]
 },
 {
  id:'aws-route53-domains',name:'Amazon Route 53 Domains',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://docs.aws.amazon.com/Route53/latest/APIReference/API_Operations_Amazon_Route_53_Domains.html',auth:['aws-sigv4'],sandbox:false,mcp:false,openapi:false,webhooks:false,
  connection_keys:['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION'],
  capabilities:[cap('portfolio','Domain inventory'),cap('domain-detail','Domain detail'),cap('availability','Availability and suggestions'),cap('pricing','TLD pricing'),cap('contacts','Contact management','write'),cap('privacy','Contact privacy','write'),cap('lock','Transfer lock','write'),cap('nameservers','Nameserver management','write'),cap('dnssec','Delegation signer management','write'),cap('operations','Async operation status'),cap('register','Registration','spend'),cap('renew','Renewal','spend'),cap('transfer','Transfers','spend')]
 },
 {
  id:'opensrs',name:'OpenSRS',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://domains.opensrs.guide/docs/quickstart',auth:['reseller-username','private-key','ip-allowlist'],sandbox:true,mcp:false,openapi:false,webhooks:true,
  connection_keys:['OPENSRS_USERNAME','OPENSRS_PRIVATE_KEY','OPENSRS_BASE_URL'],
  capabilities:[cap('portfolio','Reseller domain portfolio'),cap('domain-detail','Domain detail'),cap('contacts','Contacts','write'),cap('dns','DNS management','write'),cap('nameservers','Nameserver management','write'),cap('renew','Renewal','spend'),cap('transfer','Transfers','spend'),cap('events','Domain events and notifications')]
 },
 {
  id:'name-com',name:'Name.com',state:'knowledge-ready',live_via:'future-adapter',
  docs:'https://docs.name.com/api/v1/',auth:['basic-username-api-token'],sandbox:true,mcp:false,openapi:true,webhooks:false,
  connection_keys:['NAMECOM_USERNAME','NAMECOM_API_TOKEN'],
  capabilities:[cap('portfolio','Domain inventory'),cap('domain-detail','Domain detail'),cap('dns','DNS records','write'),cap('nameservers','Nameservers','write'),cap('privacy','WHOIS privacy','write'),cap('lock','Transfer lock','write'),cap('renew','Renewal','spend')]
 }
];

export const REGISTRAR_GUARDRAILS={
 identity_owner:'Magnanimous AI',
 provider_identity_public:false,
 secrets:'Never return registrar credentials, auth codes, EPP codes, private keys, or raw provider error payloads to customer-facing clients.',
 reads:'Read-only discovery and inventory may run when the selected account is connected and authorized.',
 dns_mutations:'DNS and nameserver changes must use dry-run or preview when supported, durable staging, separate confirmation, idempotency where available, and post-change verification.',
 spend:'Registration, renewal, transfer, restoration, aftermarket purchase, paid owner change, and other chargeable operations remain spend-locked. A provider adapter existing is not authorization to spend money.',
 transfer:'Transfer auth/EPP codes are security-sensitive secrets and must never be logged or surfaced outside the platform owner flow.',
 truth:'Never claim a domain action completed unless the registrar returned a successful real provider result and any asynchronous workflow reached a successful terminal state.'
};

export function getRegistrarAdapter(id){return MAGNANIMOUS_REGISTRAR_ADAPTERS.find(x=>x.id===String(id||'').trim())||null;}
export function publicRegistrarSummary(){return{identity:'Magnanimous AI',provider_identity_public:false,adapters:MAGNANIMOUS_REGISTRAR_ADAPTERS.map(({id,state,capabilities})=>({id,state,capabilities:capabilities.map(({id,name,mode})=>({id,name,mode}))}))};}

import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const dns=read('worker/src/magnanimous-dns-runtime.js');
const registrar=read('worker/src/magnanimous-porkbun-dns-runtime.js');
const credentials=read('worker/src/platform-credentials.js');
const providerEnv=read('worker/src/provider-runtime-env.js');
const brain=read('worker/src/magnanimous-brain-runtime.js');
const migration=read('worker/migrations/0066_magnanimous_dns_provider_actions.sql');
const ownerPage=read('frontend/app/owner-dns/page.tsx');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};
const has=(text,needle,message)=>must(text.includes(needle),message);

has(dns,'handleMagnanimousPorkbunDns','DNS runtime must dispatch registrar adapter');
has(registrar,"const BASE='https://api.porkbun.com/api/json/v3'",'registrar adapter must pin HTTPS API base');
has(registrar,"provider_identity_public:false",'registrar/provider identity must remain private to customers');
has(registrar,"domain_purchase_enabled:false",'domain purchases must remain disabled');
has(registrar,"renewal_enabled:false",'domain renewals must remain disabled');
has(registrar,"transfer_enabled:false",'domain transfers must remain disabled');
has(registrar,"dryRun:true",'provider-side dry run must remain enabled for supported writes');
has(registrar,"status:'needs_confirmation'",'writes must be staged before confirmation');
has(registrar,"Idempotency-Key",'confirmed writes must use an idempotency key');
has(registrar,"CONFIRM_TTL_SECONDS=900",'pending confirmation must expire after 15 minutes');
has(registrar,'function isPlatformOwner(user,env)','registrar account controls must use a platform-owner boundary');
has(registrar,'env?.ADMIN_EMAIL','registrar platform-owner boundary must bind to the configured owner identity');
has(registrar,"if(!isPlatformOwner(user,env))return json({detail:'Platform owner access required for registrar account operations.'},403);",'registrar account controls must reject non-platform owners');
must(!registrar.includes('function isOwner(user)'),'workspace-owner-only authorization must not guard platform registrar controls');
for(const key of ['PORKBUN_API_KEY','PORKBUN_SECRET_API_KEY']){
  has(credentials,`key:'${key}'`,`encrypted provider vault must expose ${key}`);
  has(providerEnv,`'${key}'`,`runtime environment must load ${key}`);
}
has(brain,"id:'dns-domain-intelligence'",'brain inventory must advertise DNS/domain intelligence');
has(migration,'magnanimous_dns_provider_actions','durable DNS provider action ledger migration must exist');
for(const route of ['/api/magnanimous/dns/porkbun/status','/api/magnanimous/dns/porkbun/domains','/api/magnanimous/dns/porkbun/records','/api/magnanimous/dns/porkbun/nameservers','/api/magnanimous/dns/porkbun/dnssec','/api/magnanimous/dns/porkbun/dry-run','/api/magnanimous/dns/porkbun/stage','/api/magnanimous/dns/porkbun/actions'])has(ownerPage,route,`owner DNS console must retain ${route}`);
has(ownerPage,'/owner-integrations','owner DNS console must link to the encrypted Provider Vault');
has(ownerPage,"act(a.id,'confirm')",'owner DNS console must keep execution behind a separate confirmation click');
has(ownerPage,"act(a.id,'cancel')",'owner DNS console must allow cancellation of staged DNS actions');
must(!registrar.includes('domain/create/'),'live domain purchase execution must not be present');
must(!registrar.includes('domain/renew/'),'live domain renewal execution must not be present');
must(!registrar.includes('domain/transfer/'),'live domain transfer execution must not be present');

if(failures.length){
  console.error(`DNS registrar live contract failed (${failures.length}):`);
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log('DNS registrar live contract: PASS');
console.log('Platform-owner boundary + encrypted credential setup + owner DNS console: PASS');

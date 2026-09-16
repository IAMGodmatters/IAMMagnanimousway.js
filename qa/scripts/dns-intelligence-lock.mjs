import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const runtime=read('worker/src/magnanimous-dns-runtime.js');
const router=read('worker/src/router-entrypoint.js');
const cloudflare=read('worker/src/magnanimous-cloudflare-runtime.js');
const providerEnv=read('worker/src/provider-runtime-env.js');
const gateway=read('worker/src/magnanimous-tool-gateway.js');
const universal=read('worker/src/magnanimous-universal-capabilities.js');
const porkbun=read('worker/src/magnanimous-porkbun-dns-runtime.js');
const platformCredentials=read('worker/src/platform-credentials.js');
const brain=read('worker/src/magnanimous-brain-runtime.js');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};
const includes=(text,needle,message)=>must(text.includes(needle),message);

includes(router,"import { handleMagnanimousDns } from './magnanimous-dns-runtime.js';",'router must import the Magnanimous DNS runtime');
includes(router,"url.pathname.startsWith('/api/magnanimous/dns')",'router must give DNS its own Magnanimous route before the generic brain route');
for(const route of ['/api/magnanimous/dns/lookup','/api/magnanimous/dns/propagation','/api/magnanimous/dns/email-security','/api/magnanimous/dns/reverse','/api/magnanimous/dns/rdap','/api/magnanimous/dns/diagnose','/api/magnanimous/dns/cloudflare/records','/api/magnanimous/dns/cloudflare/stage'])includes(runtime,route,`DNS runtime must retain ${route}`);
for(const type of ['A','AAAA','CNAME','MX','NS','TXT','SOA','SRV','CAA','PTR','DS','DNSKEY','TLSA','SVCB','HTTPS','NAPTR'])includes(runtime,`'${type}'`,`DNS runtime must retain ${type} record support`);
includes(runtime,'https://cloudflare-dns.com/dns-query','DNS runtime must retain a fixed Cloudflare DoH resolver');
includes(runtime,'https://dns.google/resolve','DNS runtime must retain a fixed Google Public DNS resolver');
includes(runtime,'https://rdap.org/domain/','DNS runtime must retain RDAP domain context');
includes(runtime,"provider_identity_public:false",'DNS capability metadata must keep provider execution identity private');
includes(runtime,"Registrant contact fields are intentionally not returned",'RDAP output must keep registrant contact details out of Magnanimous responses');
includes(runtime,"new URL('/api/cloudflare/actions',request.url)",'DNS writes must delegate to the existing Cloudflare staged-action gate');
includes(runtime,"new URL('/api/cloudflare/read',request.url)",'Cloudflare DNS inventory must delegate to the owner-only Cloudflare read gate');
includes(cloudflare,"status:'needs_confirmation'",'Cloudflare mutations must stay staged before execution');
includes(cloudflare,"body.confirm!==true",'Cloudflare mutations must retain separate explicit confirmation');
includes(cloudflare,'CLOUDFLARE_PLATFORM_API_TOKEN','DNS writes must use the dedicated Cloudflare platform token path');
must(!runtime.includes('CLOUDFLARE_API_TOKEN'),'DNS runtime must never reuse the broad deployment token');
for(const key of ['CLOUDFLARE_PLATFORM_API_TOKEN','CLOUDFLARE_PLATFORM_ACCOUNT_ID','CLOUDFLARE_PLATFORM_ZONE_ID'])includes(providerEnv,`'${key}'`,`provider runtime must preserve ${key} in the encrypted server-side credential layer`);
includes(runtime,"const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);",'DNS operational routes must require Magnanimous authentication');
includes(gateway,"'dns-domain-intelligence'",'Magnanimous central tool gateway must advertise DNS/domain intelligence as a built-in family');
includes(universal,"id: 'dns-domain-operations'",'Magnanimous universal capability core must recognize DNS/domain operations');
for(const capability of ['dns-lookup','multi-resolver-comparison','dnssec-visibility','reverse-dns','rdap-domain-context','mx-analysis','spf-analysis','dkim-analysis','dmarc-analysis','approval-gated-dns-changes','registrar-adapters'])includes(universal,`'${capability}'`,`Magnanimous universal core must retain ${capability}`);
includes(runtime,"handleMagnanimousPorkbunDns",'Magnanimous DNS runtime must dispatch to the guarded registrar adapter');
for(const key of ['PORKBUN_API_KEY','PORKBUN_SECRET_API_KEY']){includes(providerEnv,"'"+key+"'",'provider runtime must preserve '+key);includes(platformCredentials,"key:'"+key+"'",'encrypted owner credential vault must expose '+key);}
includes(brain,"id:'dns-domain-intelligence'",'central Magnanimous brain capability inventory must include DNS/domain intelligence');
for(const route of ['/api/magnanimous/dns/domain-pricing','/api/magnanimous/dns/porkbun/status','/api/magnanimous/dns/porkbun/domains','/api/magnanimous/dns/porkbun/records','/api/magnanimous/dns/porkbun/nameservers','/api/magnanimous/dns/porkbun/dnssec','/api/magnanimous/dns/porkbun/dry-run','/api/magnanimous/dns/porkbun/stage'])includes(porkbun,route,'registrar adapter must retain '+route);
includes(porkbun,"status='needs_confirmation'",'registrar writes must be durably staged before execution');
includes(porkbun,'dryRun:true','registrar writes must support provider-side dry-run validation');
includes(porkbun,'Idempotency-Key','confirmed registrar writes must use idempotency keys');
includes(porkbun,'CONFIRM_TTL_SECONDS=900','registrar confirmations must expire');
includes(porkbun,"domain_purchase_enabled:false",'domain purchases must remain spend-locked');
must(!porkbun.includes('domain/create/'),'registrar adapter must not expose live domain purchase execution');
must(!porkbun.includes('domain/renew/'),'registrar adapter must not expose live domain renewal execution');
must(!porkbun.includes('domain/transfer/'),'registrar adapter must not expose live domain transfer execution');

if(failures.length){console.error(`Magnanimous DNS lock failed (${failures.length}):`);for(const f of failures)console.error(`- ${f}`);process.exit(1);}
console.log('Magnanimous DNS intelligence lock: PASS');
console.log('DoH lookup + propagation + DNSSEC + email security + reverse DNS + RDAP + diagnosis: PASS');
console.log('Cloudflare DNS inventory + staged owner-only record mutations with separate confirmation: PASS');
console.log('Central tool gateway + universal Magnanimous brain registry integration: PASS');
console.log('Registrar credential vault + safe reads + dry-run/stage/confirm controls: PASS');

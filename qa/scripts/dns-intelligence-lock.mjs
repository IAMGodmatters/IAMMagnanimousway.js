import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const runtime=read('worker/src/magnanimous-dns-runtime.js');
const router=read('worker/src/router-entrypoint.js');
const cloudflare=read('worker/src/magnanimous-cloudflare-runtime.js');
const providerEnv=read('worker/src/provider-runtime-env.js');
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

if(failures.length){console.error(`Magnanimous DNS lock failed (${failures.length}):`);for(const f of failures)console.error(`- ${f}`);process.exit(1);}
console.log('Magnanimous DNS intelligence lock: PASS');
console.log('DoH lookup + propagation + DNSSEC + email security + reverse DNS + RDAP + diagnosis: PASS');
console.log('Cloudflare DNS inventory + staged owner-only record mutations with separate confirmation: PASS');

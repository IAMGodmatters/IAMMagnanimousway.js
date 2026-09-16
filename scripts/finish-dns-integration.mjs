import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function replaceOnce(text,needle,replacement,label){
  if(text.includes(replacement)) return text;
  const i=text.indexOf(needle);
  if(i<0) throw new Error(`Missing patch anchor: ${label}`);
  return text.slice(0,i)+replacement+text.slice(i+needle.length);
}
function appendOnce(text,needle,addition){return text.includes(needle)?text:`${text.trimEnd()}\n\n${addition.trim()}\n`;}

{
  const p='worker/src/magnanimous-dns-runtime.js'; let s=read(p);
  s=replaceOnce(s,"import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';","import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';\nimport { handleMagnanimousPorkbunDns } from './magnanimous-porkbun-dns-runtime.js';",'DNS registrar import');
  s=replaceOnce(s," const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);\n if(request.method==='GET'&&(path==='/api/magnanimous/dns'||path==='/api/magnanimous/dns/capabilities'))"," const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);\n const registrar=await handleMagnanimousPorkbunDns(request,env,user);if(registrar)return registrar;\n if(request.method==='GET'&&(path==='/api/magnanimous/dns'||path==='/api/magnanimous/dns/capabilities'))",'DNS registrar dispatch');
  s=s.replace("'domain diagnosis','Cloudflare DNS record inventory'","'domain diagnosis','domain pricing','registrar DNS portfolio','Cloudflare DNS record inventory'");
  write(p,s);
}

{
  const p='worker/src/provider-runtime-env.js'; let s=read(p);
  s=replaceOnce(s,"  'CLOUDFLARE_PLATFORM_ZONE_ID',\n  'VIDEO_RENDERER_TOKEN'","  'CLOUDFLARE_PLATFORM_ZONE_ID',\n  'PORKBUN_API_KEY',\n  'PORKBUN_SECRET_API_KEY',\n  'VIDEO_RENDERER_TOKEN'",'provider env Porkbun keys');
  write(p,s);
}

{
  const p='worker/src/platform-credentials.js'; let s=read(p);
  const anchor=" {id:'cloudflare',name:'Magnanimous Cloudflare Control Plane',providers:[],fields:[\n  {key:'CLOUDFLARE_PLATFORM_API_TOKEN',label:'Dedicated least-privilege Cloudflare Platform API Token',secret:true,required:false},\n  {key:'CLOUDFLARE_PLATFORM_ACCOUNT_ID',label:'Cloudflare Platform Account ID',secret:false,required:false},\n  {key:'CLOUDFLARE_PLATFORM_ZONE_ID',label:'Cloudflare Platform Zone ID',secret:false,required:false}\n ]},";
  s=replaceOnce(s,anchor,anchor+"\n {id:'porkbun',name:'Magnanimous Registrar / DNS Control',providers:[],fields:[\n  {key:'PORKBUN_API_KEY',label:'Porkbun API Key (use a domain-scoped or sandbox key when possible)',secret:true,required:false},\n  {key:'PORKBUN_SECRET_API_KEY',label:'Porkbun Secret API Key',secret:true,required:false}\n ]},",'platform credential Porkbun group');
  write(p,s);
}

{
  const p='worker/src/magnanimous-brain-runtime.js'; let s=read(p);
  const anchor=" {id:'structured-tools',name:'Structured tool contracts, function routing and provider-neutral adapters',tier:'free-first',ready:true},";
  s=replaceOnce(s,anchor,anchor+"\n {id:'dns-domain-intelligence',name:'DNS, domain, registrar and email-domain diagnostics with guarded DNS actions',tier:'free-first',ready:true},",'brain DNS capability');
  write(p,s);
}

{
  const p='.env.example'; let s=read(p);
  s=appendOnce(s,'PORKBUN_API_KEY=',`# Optional registrar/DNS account adapter. Prefer a dedicated domain-scoped or sandbox key.\n# These may also be stored in the encrypted platform-owner Provider Vault.\nPORKBUN_API_KEY=\nPORKBUN_SECRET_API_KEY=`);
  write(p,s);
}

{
  const p='qa/scripts/dns-intelligence-lock.mjs'; let s=read(p);
  s=replaceOnce(s,"const universal=read('worker/src/magnanimous-universal-capabilities.js');","const universal=read('worker/src/magnanimous-universal-capabilities.js');\nconst porkbun=read('worker/src/magnanimous-porkbun-dns-runtime.js');\nconst platformCredentials=read('worker/src/platform-credentials.js');\nconst brain=read('worker/src/magnanimous-brain-runtime.js');",'DNS lock dependencies');
  const anchor="for(const capability of ['dns-lookup','multi-resolver-comparison','dnssec-visibility','reverse-dns','rdap-domain-context','mx-analysis','spf-analysis','dkim-analysis','dmarc-analysis','approval-gated-dns-changes','registrar-adapters'])includes(universal,`'${capability}'`,`Magnanimous universal core must retain ${capability}`);";
  const addition=[
    anchor,
    "includes(runtime,\"handleMagnanimousPorkbunDns\",'Magnanimous DNS runtime must dispatch to the guarded registrar adapter');",
    "for(const key of ['PORKBUN_API_KEY','PORKBUN_SECRET_API_KEY']){includes(providerEnv,\"'\"+key+\"'\",'provider runtime must preserve '+key);includes(platformCredentials,\"key:'\"+key+\"'\",'encrypted owner credential vault must expose '+key);}",
    "includes(brain,\"id:'dns-domain-intelligence'\",'central Magnanimous brain capability inventory must include DNS/domain intelligence');",
    "for(const route of ['/api/magnanimous/dns/domain-pricing','/api/magnanimous/dns/porkbun/status','/api/magnanimous/dns/porkbun/domains','/api/magnanimous/dns/porkbun/records','/api/magnanimous/dns/porkbun/nameservers','/api/magnanimous/dns/porkbun/dnssec','/api/magnanimous/dns/porkbun/dry-run','/api/magnanimous/dns/porkbun/stage'])includes(porkbun,route,'registrar adapter must retain '+route);",
    "includes(porkbun,\"status='needs_confirmation'\",'registrar writes must be durably staged before execution');",
    "includes(porkbun,'dryRun:true','registrar writes must support provider-side dry-run validation');",
    "includes(porkbun,'Idempotency-Key','confirmed registrar writes must use idempotency keys');",
    "includes(porkbun,'CONFIRM_TTL_SECONDS=900','registrar confirmations must expire');",
    "includes(porkbun,\"domain_purchase_enabled:false\",'domain purchases must remain spend-locked');",
    "must(!porkbun.includes('domain/create/'),'registrar adapter must not expose live domain purchase execution');",
    "must(!porkbun.includes('domain/renew/'),'registrar adapter must not expose live domain renewal execution');",
    "must(!porkbun.includes('domain/transfer/'),'registrar adapter must not expose live domain transfer execution');"
  ].join('\n');
  s=replaceOnce(s,anchor,addition,'DNS lock registrar checks');
  s=s.replace("console.log('Central tool gateway + universal Magnanimous brain registry integration: PASS');","console.log('Central tool gateway + universal Magnanimous brain registry integration: PASS');\nconsole.log('Registrar credential vault + safe reads + dry-run/stage/confirm controls: PASS');");
  write(p,s);
}

{
  const p='dns-core/ABSORPTION.md'; let s=read(p);
  s=appendOnce(s,'## Registrar adapter completion',`## Registrar adapter completion\n\n- Porkbun credentials can be stored in the existing encrypted platform-owner Provider Vault or protected runtime secrets.\n- Provider-neutral domain pricing is available without exposing the execution-provider identity.\n- Owner-only registrar reads cover portfolio metadata, editable DNS records, nameservers, DNSSEC, glue records, and availability.\n- DNS record and nameserver writes are provider-side dry-run first, then stored as a durable needs_confirmation action, then executed only through a separate confirmation request with an idempotency key.\n- Domain registration, renewal, and transfer remain disabled in the runtime because they spend money; capability metadata may describe them, but Magnanimous does not execute them through this DNS adapter.\n- Production DNS behavior is verified after deployment with authenticated live checks.`);
  write(p,s);
}

console.log('Magnanimous DNS final non-workflow integration patch applied.');

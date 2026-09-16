import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function replaceOnce(text,needle,replacement,label){
  if(text.includes(replacement)) return text;
  const i=text.indexOf(needle);
  if(i<0) throw new Error(`Missing patch anchor: ${label}`);
  return text.slice(0,i)+replacement+text.slice(i+needle.length);
}
function appendOnce(text,needle,addition){
  return text.includes(needle)?text:`${text.trimEnd()}\n\n${addition.trim()}\n`;
}

// Wire the registrar adapter under the existing Magnanimous DNS route.
{
  const p='worker/src/magnanimous-dns-runtime.js'; let s=read(p);
  s=replaceOnce(
    s,
    "import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';",
    "import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';\nimport { handleMagnanimousPorkbunDns } from './magnanimous-porkbun-dns-runtime.js';",
    'DNS registrar import'
  );
  s=replaceOnce(
    s,
    " const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);\n if(request.method==='GET'&&(path==='/api/magnanimous/dns'||path==='/api/magnanimous/dns/capabilities'))",
    " const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);\n const registrar=await handleMagnanimousPorkbunDns(request,env,user);if(registrar)return registrar;\n if(request.method==='GET'&&(path==='/api/magnanimous/dns'||path==='/api/magnanimous/dns/capabilities'))",
    'DNS registrar dispatch'
  );
  s=s.replace("'domain diagnosis','Cloudflare DNS record inventory'","'domain diagnosis','domain pricing','registrar DNS portfolio','Cloudflare DNS record inventory'");
  write(p,s);
}

// Allow registrar credentials to flow from the encrypted owner vault/bootstrap.
{
  const p='worker/src/provider-runtime-env.js'; let s=read(p);
  s=replaceOnce(
    s,
    "  'CLOUDFLARE_PLATFORM_ZONE_ID',\n  'VIDEO_RENDERER_TOKEN'",
    "  'CLOUDFLARE_PLATFORM_ZONE_ID',\n  'PORKBUN_API_KEY',\n  'PORKBUN_SECRET_API_KEY',\n  'VIDEO_RENDERER_TOKEN'",
    'provider env Porkbun keys'
  );
  write(p,s);
}

// Reuse the existing encrypted Provider Vault rather than adding another secret store.
{
  const p='worker/src/platform-credentials.js'; let s=read(p);
  const anchor=" {id:'cloudflare',name:'Magnanimous Cloudflare Control Plane',providers:[],fields:[\n  {key:'CLOUDFLARE_PLATFORM_API_TOKEN',label:'Dedicated least-privilege Cloudflare Platform API Token',secret:true,required:false},\n  {key:'CLOUDFLARE_PLATFORM_ACCOUNT_ID',label:'Cloudflare Platform Account ID',secret:false,required:false},\n  {key:'CLOUDFLARE_PLATFORM_ZONE_ID',label:'Cloudflare Platform Zone ID',secret:false,required:false}\n ]},";
  const replacement=anchor+"\n {id:'porkbun',name:'Magnanimous Registrar / DNS Control',providers:[],fields:[\n  {key:'PORKBUN_API_KEY',label:'Porkbun API Key (use a domain-scoped or sandbox key when possible)',secret:true,required:false},\n  {key:'PORKBUN_SECRET_API_KEY',label:'Porkbun Secret API Key',secret:true,required:false}\n ]},";
  s=replaceOnce(s,anchor,replacement,'platform credential Porkbun group');
  write(p,s);
}

// Make DNS/domain operations visible in the central brain capability inventory.
{
  const p='worker/src/magnanimous-brain-runtime.js'; let s=read(p);
  const anchor=" {id:'structured-tools',name:'Structured tool contracts, function routing and provider-neutral adapters',tier:'free-first',ready:true},";
  const replacement=anchor+"\n {id:'dns-domain-intelligence',name:'DNS, domain, registrar and email-domain diagnostics with guarded DNS actions',tier:'free-first',ready:true},";
  s=replaceOnce(s,anchor,replacement,'brain DNS capability');
  write(p,s);
}

// Synchronize optional protected deployment secrets and add live production DNS smoke checks.
{
  const p='.github/workflows/deploy.yml'; let s=read(p);
  s=replaceOnce(
    s,
    "          MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}\n          INTEGRATION_CREDENTIALS_KEY:",
    "          MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}\n          PORKBUN_API_KEY: ${{ secrets.PORKBUN_API_KEY }}\n          PORKBUN_SECRET_API_KEY: ${{ secrets.PORKBUN_SECRET_API_KEY }}\n          INTEGRATION_CREDENTIALS_KEY:",
    'deploy Porkbun env'
  );
  s=replaceOnce(
    s,
    '          sync_secret MISTRAL_API_KEY "$MISTRAL_API_KEY"\n          sync_secret INTEGRATION_CREDENTIALS_KEY',
    '          sync_secret MISTRAL_API_KEY "$MISTRAL_API_KEY"\n          sync_secret PORKBUN_API_KEY "$PORKBUN_API_KEY"\n          sync_secret PORKBUN_SECRET_API_KEY "$PORKBUN_SECRET_API_KEY"\n          sync_secret INTEGRATION_CREDENTIALS_KEY',
    'deploy Porkbun secret sync'
  );
  const meBlock='          status=$(curl -sS -o /tmp/me.json -w \'%{http_code}\' "$BASE_URL/api/auth/me" -H "Authorization: Bearer $token")\n          if [ "$status" != "200" ]; then echo "Authenticated account check returned HTTP $status"; cat /tmp/me.json || true; exit 1; fi\n';
  const dnsSmoke=meBlock+`\n          # Prove the deployed Magnanimous DNS runtime works with authenticated production traffic.\n          status=$(curl -sS -o /tmp/dns-capabilities.json -w '%{http_code}' "$BASE_URL/api/magnanimous/dns/capabilities" -H "Authorization: Bearer $token")\n          if [ "$status" != "200" ]; then echo "Magnanimous DNS capabilities returned HTTP $status"; cat /tmp/dns-capabilities.json || true; exit 1; fi\n          python - <<'PY'\n          import json\n          data=json.load(open('/tmp/dns-capabilities.json'))\n          assert data.get('identity') == 'Magnanimous AI', data\n          assert data.get('capability') == 'dns-domain-intelligence', data\n          assert data.get('provider_identity_public') is False, data\n          assert 'A' in (data.get('record_types') or []), data\n          PY\n\n          status=$(curl -sS -o /tmp/dns-lookup.json -w '%{http_code}' -X POST "$BASE_URL/api/magnanimous/dns/lookup" -H 'content-type: application/json' -H "Authorization: Bearer $token" --data '{"name":"iammagnanimousway.com","type":"A","resolver":"all"}')\n          if [ "$status" != "200" ]; then echo "Magnanimous DNS live lookup returned HTTP $status"; cat /tmp/dns-lookup.json || true; exit 1; fi\n          python - <<'PY'\n          import json\n          data=json.load(open('/tmp/dns-lookup.json'))\n          results=data.get('results') or []\n          assert data.get('name') == 'iammagnanimousway.com', data\n          assert data.get('type') == 'A', data\n          assert len(results) >= 2, data\n          assert any(not r.get('error') for r in results), data\n          PY\n\n          status=$(curl -sS -o /tmp/domain-pricing.json -w '%{http_code}' "$BASE_URL/api/magnanimous/dns/domain-pricing" -H "Authorization: Bearer $token")\n          if [ "$status" != "200" ]; then echo "Magnanimous domain pricing returned HTTP $status"; cat /tmp/domain-pricing.json || true; exit 1; fi\n          python - <<'PY'\n          import json\n          data=json.load(open('/tmp/domain-pricing.json'))\n          assert data.get('identity') == 'Magnanimous AI', data\n          assert data.get('provider_identity_public') is False, data\n          assert isinstance(data.get('pricing'), dict) and data.get('pricing'), data\n          PY\n\n          registrar_status=$(curl -sS -o /tmp/registrar-owner-denied.json -w '%{http_code}' "$BASE_URL/api/magnanimous/dns/porkbun/status" -H "Authorization: Bearer $token")\n          if [ "$registrar_status" != "403" ]; then echo "Registrar account controls must be platform-owner-only; got HTTP $registrar_status"; cat /tmp/registrar-owner-denied.json || true; exit 1; fi\n          echo "Magnanimous DNS lookup, domain pricing, provider privacy, and registrar owner isolation verified in production."\n`;
  s=replaceOnce(s,meBlock,dnsSmoke,'production DNS smoke tests');
  write(p,s);
}

// Environment documentation for protected runtime secrets.
{
  const p='.env.example'; let s=read(p);
  s=appendOnce(s,'PORKBUN_API_KEY=',`# Optional registrar/DNS account adapter. Prefer a dedicated domain-scoped or sandbox key.\n# These may also be stored in the encrypted platform-owner Provider Vault.\nPORKBUN_API_KEY=\nPORKBUN_SECRET_API_KEY=`);
  write(p,s);
}

// Expand the DNS regression lock so this integration cannot silently regress.
{
  const p='qa/scripts/dns-intelligence-lock.mjs'; let s=read(p);
  s=replaceOnce(
    s,
    "const universal=read('worker/src/magnanimous-universal-capabilities.js');",
    "const universal=read('worker/src/magnanimous-universal-capabilities.js');\nconst porkbun=read('worker/src/magnanimous-porkbun-dns-runtime.js');\nconst platformCredentials=read('worker/src/platform-credentials.js');\nconst brain=read('worker/src/magnanimous-brain-runtime.js');\nconst deploy=read('.github/workflows/deploy.yml');",
    'DNS lock dependencies'
  );
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
    "must(!porkbun.includes('domain/transfer/'),'registrar adapter must not expose live domain transfer execution');",
    "includes(deploy,'Magnanimous DNS live lookup returned HTTP','deployment smoke must exercise live DNS resolution');",
    "includes(deploy,'Magnanimous domain pricing returned HTTP','deployment smoke must exercise provider-neutral domain pricing');",
    "includes(deploy,'Registrar account controls must be platform-owner-only','deployment smoke must verify registrar owner isolation');"
  ].join('\n');
  s=replaceOnce(s,anchor,addition,'DNS lock registrar checks');
  s=s.replace(
    "console.log('Central tool gateway + universal Magnanimous brain registry integration: PASS');",
    "console.log('Central tool gateway + universal Magnanimous brain registry integration: PASS');\nconsole.log('Registrar credential vault + safe reads + dry-run/stage/confirm controls + production DNS smoke: PASS');"
  );
  write(p,s);
}

// Document the completed provider-neutral architecture.
{
  const p='dns-core/ABSORPTION.md'; let s=read(p);
  s=appendOnce(s,'## Registrar adapter completion',`## Registrar adapter completion\n\n- Porkbun credentials can be stored in the existing encrypted platform-owner Provider Vault or protected runtime secrets.\n- Provider-neutral domain pricing is available without exposing the execution-provider identity.\n- Owner-only registrar reads cover portfolio metadata, editable DNS records, nameservers, DNSSEC, glue records, and availability.\n- DNS record and nameserver writes are provider-side dry-run first, then stored as a durable needs_confirmation action, then executed only through a separate confirmation request with an idempotency key.\n- Domain registration, renewal, and transfer remain disabled in the runtime because they spend money; capability metadata may describe them, but Magnanimous does not execute them through this DNS adapter.\n- Deployment smoke tests exercise authenticated DNS capabilities, live multi-resolver lookup, provider-neutral domain pricing, and customer denial on owner-only registrar controls.`);
  write(p,s);
}

// The one-shot patcher and workflow delete themselves after a successful patch.
for(const p of ['scripts/finish-dns-integration.mjs','.github/workflows/finish-dns-integration.yml']){
  try{fs.unlinkSync(p);}catch{}
}
console.log('Magnanimous DNS final integration patch applied.');

import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(text,needle,msg)=>must(text.includes(needle),msg||('Missing '+needle));

const connector=read('worker/src/magnanimous-universal-ai-connector.js');
const oauth=read('worker/src/magnanimous-plugin-oauth.js');
const pricing=read('worker/src/magnanimous-unified-plugin-pricing.js');
const usage=read('worker/src/usage-guard.js');
const enterprise=read('worker/src/enterprise-commercialization-runtime.js');
const webhook=read('worker/src/stripe-webhook-hardened.js');
const pricingPage=read('frontend/app/pricing/page.tsx');
const support=read('frontend/app/plugin-support/page.tsx');
const demo=read('frontend/app/plugin-demo/page.tsx');
const runtime=read('frontend/app/platform-runtime-script.tsx');
const template=read('frontend/app/template.tsx');
const sitemap=read('frontend/public/sitemap.xml');
const deploy=read('.github/workflows/deploy.yml');
const packet=read('docs/MAGNANIMOUS-CHATGPT-PLUGIN-SUBMISSION-PACKET-2026-09-28.md');
const submission=JSON.parse(read('docs/magnanimous-chatgpt-plugin-submission.json'));
const logo=read('frontend/public/magnanimous-plugin-logo.svg');
const icon=read('frontend/public/magnanimous-plugin-composer-icon.svg');

for(const needle of [
 "name:'Magnanimous AI'",
 "publisher:'I AM MAGNANIMOUS WAY™'",
 "identity:'Magnanimous AI'",
 "external_deployment_plugin_required:false",
 "provider_purchase_required_for_control_plane:false",
 "areas:['web','cloud','edge']",
 "unified_tool:'magnanimous_operate'",
 "base_fee_usd:0",
 "billing_model:'free-native-plus-prepaid-final-charge'",
 "subscription_required:false",
 "topup_tool:'magnanimous_plugin_billing'",
 "customer_price_display:'final Magnanimous charge shown before paid usage'",
 "discovery:{use_when:",
 "selection_note:'Tool descriptions describe supported user intent and boundaries so compatible AI clients can select Magnanimous when it matches the request; they do not force or manipulate selection over unrelated tools.'"
])has(connector,needle,'Public plugin manifest contract regressed: '+needle);

for(const needle of [
 "description:'Use this when the user wants current public-web discovery",
 "description:'Use this when the user wants Magnanimous AI to read or extract a specific public web page",
 "description:'Use this when the user wants source-backed multi-page public-web research",
 "description:'Use this when the user wants to inspect Magnanimous AI native web/browser, cloud/deployment, or edge/runtime capabilities",
 "description:'Use this when the user explicitly wants an authorized Magnanimous AI operation spanning web/browser, cloud/deployment, or edge/runtime"
])has(connector,needle,'ChatGPT tool-discovery metadata regressed: '+needle);

for(const needle of [
 "PUBLIC_SCOPES=Object.freeze(['openid','email','capabilities.read','brain.ask','web.read','offline_access'])",
 "'/.well-known/openid-configuration'",
 "userinfo_endpoint:base+'/oauth/userinfo'",
 "path==='/oauth/userinfo'",
 "email_verified:Boolean(verification.verified)",
 "DEFAULT_SCOPES=PUBLIC_SCOPES",
 "PRIVILEGED_ROLES=Object.freeze(['owner','admin'])",
 "scopesForUser",
 "omitted_scopes",
 "access_tier:privilegedUser(user)?'owner-admin':'customer-safe'",
 "JSON.stringify(scopes)"
])has(oauth,needle,'OAuth customer/owner boundary regressed: '+needle);

for(const needle of [
 "MAGNANIMOUS_PLUGIN_BASE_FEE_USD=0",
 "markup_percent:PROVIDER_PRICE_MARKUP_PERCENT",
 "billing_model:'free-native-plus-prepaid-pass-through'",
 "subscription_required_for_plugin:false",
 "prepaid_required_for_paid_origin_cost:true",
 "silent_owner_funding:false",
 "customer_charge_usd:charge.customer_charge_usd"
])has(pricing,needle,'Plugin pricing contract regressed: '+needle);

has(usage,'export async function canUsePassThrough','Subscription-free pass-through authorization missing');
has(usage,"code:'FREE_NATIVE_PATH'",'Free native path contract missing');
has(usage,"code:'PREPAID_FUNDED'",'Prepaid funded path contract missing');
has(enterprise,"purpose:'magnanimous-prepaid-usage'",'prepaid top-up purpose regressed');
has(enterprise,"markup_percent:20",'Stripe top-up no longer discloses exact 20% markup');
has(enterprise,"subscription_required:false",'Stripe top-up unexpectedly requires subscription');
has(webhook,'Stripe Magnanimous prepaid direct-cost usage credit','Stripe wallet settlement label regressed');

for(const needle of [
 'MAGNANIMOUS AI - ALL-IN-ONE CONNECTOR',
 '$0 base fee',
 'final charge shown before use',
 '/api/enterprise/usage-wallet/topup',
 'Internal supplier cost and margin calculations stay private to the platform owner.'
])has(pricingPage,needle,'Public pricing surface regressed: '+needle);

has(support,'The Magnanimous AI connection has a $0 base fee.','Support pricing disclosure missing');
has(support,'final Magnanimous customer price is shown before the operation','Support final-price disclosure missing');
has(demo,'Magnanimous AI Plugin Demo','Plugin review demo missing');
has(demo,"['FAIR USAGE PRICING','$0 base • final price shown'","Plugin demo final-price slide missing");
for(const src of [runtime,template]){has(src,"'/plugin-support'","Plugin support route is no longer public");has(src,"'/plugin-demo'","Plugin demo route is no longer public")}
has(sitemap,'https://iammagnanimousway.com/plugin-support/','Plugin support sitemap entry missing');
has(sitemap,'https://iammagnanimousway.com/plugin-demo/','Plugin demo sitemap entry missing');

for(const needle of [
 'Magnanimous connector manifest',
 "pricing.get('base_fee_usd') == 0",
 "pricing.get('billing_model') == 'free-native-plus-prepaid-final-charge'",
 "pricing.get('subscription_required') is False",
 'Magnanimous MCP OAuth challenge is live.',
 'Magnanimous plugin support page',
 'Magnanimous plugin demo page',
 'Public pricing page',
 'final charge shown before use'
])has(deploy,needle,'Production smoke no longer locks: '+needle);

has(packet,'## Exactly five positive review tests','Submission packet no longer has exactly five positive tests section');
has(packet,'## Exactly three negative review tests','Submission packet no longer has exactly three negative tests section');
must(submission.app?.name==='Magnanimous AI','Submission app name changed');
must(submission.pricing?.base_fee_usd===0,'Submission base fee changed');
must(submission.pricing?.markup_percent===20,'Submission markup changed');
must(submission.pricing?.subscription_required_for_plugin===false,'Submission unexpectedly requires a plugin subscription');
must(submission.app?.mcp==='https://iammagnanimousway.com/mcp','Submission MCP URL changed');
must(submission.app?.support==='https://iammagnanimousway.com/plugin-support/','Submission support URL changed');
must(submission.app?.demo==='https://iammagnanimousway.com/plugin-demo/','Submission demo URL changed');

has(logo,'Magnanimous AI','Directory logo identity missing');
has(icon,'Magnanimous AI icon','Composer icon identity missing');
must(!pricingPage.includes('20%')&&!support.includes('20%')&&!demo.includes('20%'),'Public customer surfaces exposed internal markup math');
must(!support.includes('Stripe')&&!support.includes('ChatGPT')&&!support.includes('TinyFish')&&!support.includes('Railway')&&!support.includes('Cloudflare'),'Support page exposed third-party product branding');
must(!demo.includes('Stripe')&&!demo.includes('ChatGPT')&&!demo.includes('TinyFish')&&!demo.includes('Railway')&&!demo.includes('Cloudflare')&&!demo.includes('OpenAI'),'Demo page exposed third-party product branding');

console.log('Magnanimous public plugin release lock PASS',JSON.stringify({
 identity:'Magnanimous AI',
 areas:['web','cloud','edge'],
 base_fee_usd:0,
 customer_safe_scopes:['capabilities.read','brain.ask','web.read','offline_access'],
 privileged_roles:['owner','admin'],
 mcp:'https://iammagnanimousway.com/mcp',
 support:'https://iammagnanimousway.com/plugin-support/',
 demo:'https://iammagnanimousway.com/plugin-demo/'
}));

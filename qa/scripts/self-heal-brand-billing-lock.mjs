import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const voice=read('frontend/lib/natural-speech.ts');
const chat=read('frontend/lib/magnanimous-chat-transport.ts');
const video=read('frontend/app/video-agents/page.tsx');
const pricing=read('frontend/app/pricing/page.tsx');
const provider=read('worker/src/provider-entrypoint.js');
const sponsored=read('worker/src/sponsored-ad-runtime.js');
const billing=read('worker/src/premium-origin-costs.js');
const guard=read('worker/src/premium-runtime-guard.js');
const security=read('worker/src/security-entrypoint.js');
const tiers=read('worker/src/billing-tiers-runtime.js');
const monetization=read('worker/src/monetization-runtime.js');
const wrangler=read('worker/wrangler.jsonc');

const checks=[
 ['speech has automatic stall recovery',voice.includes("recover('speech-stall')")&&voice.includes('maxRecoveryAttempts')],
 ['speech retry falls back to a safe profile',voice.includes('useSafeProfile')&&voice.includes("utterance.pitch=1")],
 ['chat retries bounded transient edge failures',chat.includes('maxTransientEdgeRetries')&&chat.includes('x-magnanimous-self-heal-attempt')],
 ['public video page hides execution vendors',!/(Cloudflare|HEYGEN|TAVUS|OpenAI|Anthropic|Gemini|ElevenLabs|Railway)/i.test(video)],
 ['public pricing uses Magnanimous premium branding',pricing.includes('Magnanimous Premium')&&!pricing.includes('Additional provider usage')],
 ['public ads require ownership or revenue approval',provider.includes('(owner_owned=1 OR revenue_approved=1)')],
 ['paid sponsored checkout marks revenue approval',sponsored.includes('revenue_approved')&&sponsored.includes("bind(headline, destination, label, 'home', 1, 0, 1")],
 ['monetization declares outside revenue approval',monetization.includes('outside_ads_require_revenue_approval: true')],
 ['premium markup is exactly twenty percent',billing.includes('const MARKUP_PERCENT=20')],
 ['public premium catalog strips provider identity',billing.includes('publicPremiumCatalog')&&!/origin_provider:quote\.origin_provider/.test(billing)],
 ['owner premium catalog retains origin audit',billing.includes('ownerPremiumCostCatalog')],
 ['premium direct customer routing is hidden',guard.includes('HIDDEN_DIRECT_AI')&&guard.includes("provider:'cloudflare-ai'")],
 ['premium guard is wired into active security runtime',security.includes('premiumPreflight')&&security.includes('premiumPostprocess')],
 ['owner origin costs are admin-only',tiers.includes('/api/admin/billing/origin-costs')&&tiers.includes("Owner access required.")],
 ['metered providers remain disabled by default',wrangler.includes('"ENABLE_METERED_PROVIDERS": "false"')],
 ['current free model pool includes GLM, Gemma and Nemotron',provider.includes('@cf/zai-org/glm-4.7-flash')&&provider.includes('@cf/google/gemma-4-26b-a4b-it')&&provider.includes('@cf/nvidia/nemotron-3-120b-a12b')],
 ['premium model is isolated behind funded route',wrangler.includes('@cf/zai-org/glm-5.3-flash')&&guard.includes('MAGNANIMOUS_PREMIUM_MODEL')]
];

let failed=false;
for(const [label,ok] of checks){console.log((ok?'PASS: ':'FAIL: ')+label);if(!ok)failed=true}
if(failed)process.exit(1);
console.log('Magnanimous self-heal, brand firewall, ad revenue policy, and premium billing contracts PASS.');

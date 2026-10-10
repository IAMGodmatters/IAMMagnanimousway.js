import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const page=read('frontend/app/magnanimous-crm/page.tsx');
const pricing=read('frontend/app/pricing/page.tsx');
const tier=read('worker/src/billing-tiers-runtime.js');
const refs=read('worker/src/payment-reference.js');
const links=read('worker/src/payment-link-runtime.js');
const webhook=read('worker/src/stripe-webhook-hardened.js');
const terms=read('frontend/components/PremiumAgreementConsent.tsx');
const research=read('docs/CRM-BEST-OF-BREED-2026.md');
const must=(text,needle,label)=>{if(!text.includes(needle))throw Error(`CRM COMMERCIALIZATION LOCK: ${label}`)};
for(const [needle,label] of [
 ['MAGNANIMOUS CRM PRO • STANDALONE REVENUE OPERATING SYSTEM','standalone CRM identity'],
 ['/api/operations/crm/command-center','command center data'],
 ['/api/operations/crm/advanced','advanced CRM data'],
 ['/api/operations/crm/studio','CRM studio data'],
 ['Attio','current benchmark coverage'],
 ['Native first • outside systems stay replaceable','native-first architecture']
])must(page,needle,label);
for(const [needle,label] of [
 ['Magnanimous CRM Pro • $79/month','standalone public price'],
 ['Magnanimous Business • $119/month','Business public price'],
 ['$98.99 × 1.20 = $118.788','20 percent bundle formula'],
 ['cost × 1.20','provider markup disclosure']
])must(pricing,needle,label);
for(const [needle,label] of [
 ["id: 'crm', name: 'Magnanimous CRM Pro', price_usd: 79",'CRM backend price'],
 ["id: 'business', name: 'Magnanimous Business', price_usd: 119",'Business backend price'],
 ['calculated_usd:118.788','Business formula'],
 ['configuredPriceForPlan','Stripe Price verification'],
 ["line_items[0][price_data][unit_amount]",'safe Stripe price_data fallback'],
 ["target_markup_percent: targetMarkup(env)",'20 percent runtime policy']
])must(tier,needle,label);
must(refs,'plus|crm|business|pro|scale','CRM payment reference identity');
must(links,"const LINK_KEYS={plus:'STRIPE_PAYMENT_LINK_PLUS'}",'stale paid-plan links disabled');
must(webhook,"const PLANS=new Set(['plus','crm','business','scale'])",'webhook paid catalog');
must(terms,"crm:{version:'crm-2026-10-10.1'",'CRM terms');
must(terms,"business:{version:'business-2026-10-10.1'",'Business terms');
for(const source of ['Attio','Pipedrive','HubSpot','Dynamics 365','Salesforce','Close','Creatio'])must(research,source,'research source '+source);
console.log('CRM commercialization lock passed.');

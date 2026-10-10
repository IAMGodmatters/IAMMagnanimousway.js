import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const page=read('frontend/app/magnanimous-crm/page.tsx');
const pricing=read('frontend/app/pricing/page.tsx');
const tier=read('worker/src/billing-tiers-runtime.js');
const refs=read('worker/src/payment-reference.js');
const links=read('worker/src/payment-link-runtime.js');
const webhook=read('worker/src/stripe-webhook-hardened.js');
const usage=read('worker/src/usage-guard.js');
const compat=read('worker/src/billing-plan-compatibility.js');
const businessPlan=read('worker/src/business-plan-subscription-runtime.js');
const router=read('worker/src/router-entrypoint.js');
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
 ['Magnanimous Business • $214/month','Business public price'],
 ['$177.99 × 1.20 = $213.588','20 percent complete-bundle formula'],
 ['cost × 1.20','provider markup disclosure']
])must(pricing,needle,label);
for(const [needle,label] of [
 ["id: 'crm', name: 'Magnanimous CRM Pro', price_usd: 79",'CRM backend price'],
 ["id: 'business', name: 'Magnanimous Business', price_usd: 214",'Business backend price'],
 ['professional_business_plan_usd:79','Professional Business Plan included in bundle basis'],
 ['calculated_usd:213.588','Business formula'],
 ['configuredPriceForPlan','Stripe Price verification'],
 ["line_items[0][price_data][unit_amount]",'safe Stripe price_data fallback'],
 ["target_markup_percent: targetMarkup(env)",'20 percent runtime policy']
])must(tier,needle,label);
must(refs,'plus|crm|business|pro|scale','CRM payment reference identity');
for(const key of ["crm:'STRIPE_PAYMENT_LINK_CRM'","business:'STRIPE_PAYMENT_LINK_BUSINESS'","scale:'STRIPE_PAYMENT_LINK_SCALE'"])must(links,key,'verified recurring Payment Link '+key);
must(webhook,"const PLANS=new Set(['plus','crm','business','scale'])",'webhook paid catalog');
must(webhook,"const compatibilityPlan=plan==='scale'?'business':plan",'annual Business webhook compatibility');
must(usage,'crm:{rank:1.5','CRM must remain below historical Business rank boundary');
must(usage,'business:{rank:2','Business historical rank compatibility');
must(usage,"const PLAN_ALIAS={pro:'business'}",'legacy Pro entitlement alias');
must(businessPlan,"INCLUDED_BUSINESS_PLANS=new Set(['business','scale','pro'])",'Professional Business Plan included in monthly annual and legacy Business');
must(compat,"String(data?.plan||'').toLowerCase()!=='scale'",'annual billing response compatibility');
must(router,'applyBillingPlanCompatibility','billing compatibility wired into runtime');
must(terms,"crm:{version:'crm-2026-10-10.1'",'CRM terms');
must(terms,"business:{version:'business-2026-10-10.2'",'Business terms');
for(const source of ['Attio','Pipedrive','HubSpot','Dynamics 365','Salesforce','Close','Creatio'])must(research,source,'research source '+source);
console.log('CRM commercialization lock passed.');

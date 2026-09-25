import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PASS_THROUGH_MARKUP_PERCENT,customerChargeUsd,originCapacityFromCustomerFunds,quoteProviderCost,publicProviderCostCatalog} from '../../worker/src/provider-cost-catalog.js';

const read=p=>fs.readFileSync(p,'utf8');
assert.equal(PASS_THROUGH_MARKUP_PERCENT,20);
assert.equal(customerChargeUsd(1),1.2);
assert.equal(originCapacityFromCustomerFunds(12),10);
const groq=quoteProviderCost({provider:'groq',model:'openai/gpt-oss-20b',input_tokens:1_000_000,output_tokens:1_000_000});
assert.equal(groq.origin_cost_usd,.375);
assert.equal(groq.customer_charge_usd,.45);
const catalog=publicProviderCostCatalog();
assert.equal(catalog.pass_through_markup_percent,20);
assert.equal(catalog.researched_at,'2026-09-25');
assert.ok(catalog.providers.some(p=>p.provider==='cloudflare-ai'&&p.auto_route===true));
assert.ok(catalog.providers.some(p=>p.provider==='google'&&p.models.some(m=>m.model==='gemini-3.8-flash')));
assert.ok(catalog.providers.some(p=>p.provider==='groq'&&p.models.some(m=>m.model==='openai/gpt-oss-20b')));
assert.ok(catalog.providers.some(p=>p.provider==='openai'&&p.models.some(m=>m.model==='gpt-6-luna')));

const usage=read('worker/src/usage-guard.js');
for(const value of ['PASS_THROUGH_MARKUP_PERCENT','customerChargeUsd(overage)','originCapacityFromCustomerFunds','billing_pass_through_charges','prepaid_origin_capacity_usd'])
 assert.ok(usage.includes(value),`usage guard missing ${value}`);
assert.ok(usage.includes("plus:{rank:1,metered_ai:true"),'Plus must allow explicitly funded premium AI without enabling carrier/video spend.');

const tiers=read('worker/src/billing-tiers-runtime.js');
assert.ok(tiers.includes("Optional funded premium AI at verified origin cost + 20%"));
assert.ok(tiers.includes('usageStatus(env,user.tenant_id)'));

const premium=read('worker/src/premium-runtime-guard.js');
assert.ok(premium.includes("required_plan:'plus',entitlement:'metered_ai'"));
assert.ok(premium.includes("estimateAiCostUsd(provider,String(body.model||''))"));

const mesh=read('worker/src/agent-mesh-runtime.js');
for(const value of ["gemini-3.8-flash","openai/gpt-oss-20b","filterHealthyProviders(env,configuredCandidates)","recordProviderFailure","recordProviderSuccess","const automatic=ordered.filter(p=>p.auto_route"])
 assert.ok(mesh.includes(value),`Agent Mesh self-heal/cost contract missing ${value}`);
assert.ok(mesh.includes("required_plan:'plus',entitlement:'metered_ai'"));
assert.ok(mesh.includes("p.id==='cloudflare-ai'"),'Explicit paid-provider failures must retain the Cloudflare free-first fallback.');
assert.ok(!mesh.includes("const candidates=preferred?[preferred,...ordered.filter(p=>p.id!==preferred.id)]:ordered;"),'Old auto-route-to-every-provider pattern must not return.');

const heal=read('worker/src/self-heal-runtime.js');
for(const value of ['magnanimous_provider_health','cooldown_until','scheduledSelfHeal','filterHealthyProviders','recordVoiceIssue','voice_retry_count:1'])
 assert.ok(heal.includes(value),`self-heal runtime missing ${value}`);

const natural=read('frontend/lib/natural-speech.ts');
for(const value of ['RETRYABLE_SPEECH_ERRORS','speechSafeModeUntil','onRetry?','retryBudget=1','splitSpeechText(text,95)','utterance.voice=null'])
 assert.ok(natural.includes(value),`natural speech self-heal missing ${value}`);

const voice=read('frontend/app/voice-orchestrator.tsx');
for(const value of ['/api/self-heal/voice','automatic-safe-retry','safe-retry-exhausted','Magnanimous AI automatically retried the voice'])
 assert.ok(voice.includes(value),`voice orchestrator self-heal missing ${value}`);

const operations=read('worker/src/operations-entrypoint.js');
assert.ok(operations.includes("/api/provider-costs"));
assert.ok(operations.includes('scheduledSelfHeal(env)'));
assert.ok(operations.includes('handleSelfHeal(request,env)'));

const payment=read('worker/src/payment-link-runtime.js');
assert.ok(payment.includes("/api/billing/topup"));
assert.ok(payment.includes('encodeTopupPaymentReference'));

const pricing=read('frontend/app/pricing/page.tsx');
for(const value of ['OPTIONAL PROVIDER UPGRADES','Origin pricing ↗','pass_through_markup_percent','/api/billing/topup'])
 assert.ok(pricing.includes(value),`pricing transparency missing ${value}`);

const wrangler=read('worker/wrangler.jsonc');
for(const value of ['"ALLOW_EXTERNAL_FREE_TIER_FALLBACK": "false"','"GOOGLE_MODEL": "gemini-3.8-flash"','"GROQ_MODEL": "openai/gpt-oss-20b"','"OPENAI_MODEL": "gpt-6-luna"','"BUSINESS_PLAN_FINAL_MODEL": "gpt-6-sol"'])
 assert.ok(wrangler.includes(value),`model policy missing ${value}`);

const repair=read('.github/workflows/repair-agent-mesh-timeouts.yml');
assert.ok(repair.includes("cron: '*/30 * * * *'"));
console.log('Magnanimous self-heal + provider cost lock PASS');

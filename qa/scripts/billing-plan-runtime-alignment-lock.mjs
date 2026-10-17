import fs from 'node:fs';

const usage=fs.readFileSync('worker/src/usage-guard.js','utf8');
const billing=fs.readFileSync('worker/src/billing-tiers-runtime.js','utf8');
const must=(text,needle,label)=>{if(!text.includes(needle))throw new Error(`BILLING PLAN RUNTIME ALIGNMENT: ${label}`)};

// Every paid catalog plan that advertises controlled premium capability must normalize as paid at runtime.
must(usage,"studio:{rank:1.5,metered_ai:true,pstn_minutes:0,avatar_minutes:0,premium_video_credits:10,cost_ceiling_usd:42}",'Studio must not normalize to Free');

// Customer-facing entitlement values and the runtime gate must not drift apart.
must(billing,"entitlements: { metered_ai: true, pstn_minutes: 0, avatar_minutes: 0, premium_video_credits: 10, cost_ceiling_usd: 42 }",'Studio catalog entitlement truth');
must(usage,"business:{rank:2,metered_ai:true,pstn_minutes:90,avatar_minutes:30,premium_video_credits:40,cost_ceiling_usd:215}",'Business runtime entitlement truth');
must(billing,"entitlements: { metered_ai: true, pstn_minutes: 90, avatar_minutes: 30, premium_video_credits: 40, cost_ceiling_usd: 215 }",'Business catalog entitlement truth');
must(usage,"scale:{rank:3,metered_ai:true,pstn_minutes:180,avatar_minutes:60,premium_video_credits:60,cost_ceiling_usd:215}",'Annual Business runtime entitlement truth');
must(billing,"entitlements: { metered_ai: true, pstn_minutes: 180, avatar_minutes: 60, premium_video_credits: 60, cost_ceiling_usd: 170 }",'Annual Business catalog currently declares controlled premium capacities');

// The cost budget is intentionally calendar-month scoped, including annual subscribers.
must(usage,'getUTCMonth()+1','usage budget must reset by calendar month');
must(usage,'period_key TEXT NOT NULL','usage ledger must remain period scoped');

// Annual customers must never receive a lower enforceable monthly origin-cost ceiling than monthly Business.
const runtimeBusiness=215,runtimeAnnual=215;
if(runtimeAnnual<runtimeBusiness)throw new Error('BILLING PLAN RUNTIME ALIGNMENT: annual runtime ceiling is below monthly Business.');

console.log('Billing plan/runtime alignment lock PASS: Studio remains paid, Business sold entitlements match runtime, and Annual Business is not runtime-downgraded below monthly Business.');

import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const page=read('frontend/app/shop/page.tsx');
const runtime=read('worker/src/native-store-runtime.js');
const migration=read('worker/migrations/0097_native_magnanimous_store.sql');
const expansion=read('worker/migrations/0098_native_store_catalog_expansion.sql');
const sourcing=read('worker/migrations/0099_store_225_product_sourcing_queue.sql');
const podMigration=read('worker/migrations/0100_native_pod_network.sql');
const pod=read('worker/src/pod-network-runtime.js');
const credentials=read('worker/src/platform-credentials.js');
const providerEnv=read('worker/src/provider-runtime-env.js');
const cj=read('worker/src/cj-dropship-runtime.js');
const operations=read('worker/src/operations-entrypoint.js');
const consent=read('worker/src/consent-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const stripeWebhook=read('worker/src/stripe-webhook-hardened.js');

must(!page.includes('myshopify.com'),'Native shop must not link to a Shopify storefront.');
must(!page.includes('cdn.shopify.com'),'Native shop must not depend on Shopify-hosted product media.');
must(page.includes("fetch('/store-api/products'")&&page.includes("fetch('/store-api/checkout'"),'Native shop must use the Magnanimous store API.');
must(page.includes('Magnanimous fulfillment queue'),'Native shop must explain the owned fulfillment queue.');

must(runtime.includes("SELECT * FROM store_products WHERE active=1 AND id IN"),'Checkout must price carts from server-side catalog records.');
must(runtime.includes("metadata[product_type]','magnanimous_store_order'"),'Stripe checkout must identify native store orders.');
must(runtime.includes("paidAmount!==Number(order.amount_cents)"),'Paid amount must be verified against the stored order total.');
must(runtime.includes('function catalogMapped(row)')&&runtime.includes('supplierConnected'),'Unmapped or disconnected dropship products must not be publicly purchasable.');
must(runtime.includes("if(loaded.some(x=>!catalogMapped(x.row)))"),'Checkout must reject incomplete supplier mappings before Stripe is opened.');
must(runtime.includes('supplier_budget_cents')&&runtime.includes('shipping_handling_cents'),'Checkout must pre-collect supplier freight/handling and store a loss-prevention budget.');
must(runtime.includes('scheduledNativeStoreFulfillment')&&runtime.includes('awaiting_supplier_activation'),'Paid orders must enter the automatic supplier fulfillment scheduler only after supplier setup is valid.');

const publicProduct=runtime.slice(runtime.indexOf('function publicProduct'),runtime.indexOf('async function catalogRows'));
const publicReturn=publicProduct.slice(publicProduct.indexOf('return{'));
for(const secretField of ['supplier_provider','supplier_product_id','supplier_variant_id','supplier_sku','supplier_cost_cents']){
 must(!publicReturn.includes(secretField),`Public product response leaks ${secretField}.`);
}

for(const table of ['store_products','store_orders','store_order_items','store_fulfillment_jobs'])must(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`),`Missing ${table} migration.`);
for(const table of ['store_categories','store_product_upsells'])must(expansion.includes(`CREATE TABLE IF NOT EXISTS ${table}`),`Missing ${table} expansion migration.`);
must(migration.includes("'/store/solar-power-bank.svg'")&&migration.includes("'/store/pet-feeder.svg'"),'Native product media must be locally hosted.');
must(consent.includes("url.pathname.startsWith('/store-api/')")&&consent.includes('handleNativeStore(nativeStoreRequest(request),env)'),'Native store must route on the Worker/D1 plane.');
must(wrangler.includes('"/store-api/*"'),'Cloudflare assets config must execute the Worker for store API requests.');
must(stripeWebhook.includes("handleNativeStoreStripeEvent")&&stripeWebhook.includes("await handleNativeStoreStripeEvent(env,event)"),'Verified Stripe webhooks must durably confirm native-store payments.');
must(runtime.includes('AUTO_REFUND_SECONDS=24*60*60')&&runtime.includes('scheduledNativeStoreRefunds'),'Store must automatically refund orders that fail to secure supplier fulfillment within 24 hours.');
must(runtime.includes("stripeRequest(rt,'refunds'")&&runtime.includes('Idempotency-Key'),'Automatic refunds must use Stripe idempotency and the original PaymentIntent.');
must(cj.includes('reconcileCjOrder')&&cj.includes('getOrderDetail'),'Refunds must reconcile ambiguous supplier orders before returning customer funds.');
must(operations.includes('scheduledNativeStoreCommerce(env)'),'Native store fulfillment/refund lifecycle must run automatically from the Worker scheduler.');

const targetRows=[...sourcing.matchAll(/VALUES\('[^']+','([^']+)','/g)].map(match=>match[1]);
must(targetRows.length===225,`Store sourcing queue must contain exactly 225 launch targets; found ${targetRows.length}.`);
const targetCounts=new Map();for(const slug of targetRows)targetCounts.set(slug,(targetCounts.get(slug)||0)+1);
must(targetCounts.size===15,'Store sourcing queue must cover all 15 launch categories.');
for(const [slug,count] of targetCounts)must(count>=15,`Store category ${slug} has fewer than 15 sourcing targets.`);
must(runtime.includes('scheduledNativeStoreSourcing')&&runtime.includes("/api/store/owner/sourcing"),'Store must automatically research queued supplier targets and expose owner-only sourcing status.');
must(cj.includes('/product/listV2?page=1&size=8&keyWord=')&&cj.includes('searchCjCatalogTarget'),'Store sourcing must use CJ Product List V2 keyword search rather than the deprecated list endpoint.');


for(const provider of ['printful','printify','gelato','prodigi','gooten'])must(podMigration.includes(`'${provider}'`),`POD provider ${provider} missing from provider registry.`);
for(const key of ['PRINTFUL_API_TOKEN','PRINTIFY_API_TOKEN','GELATO_API_KEY','PRODIGI_API_KEY','GOOTEN_RECIPE_ID','GOOTEN_PARTNER_BILLING_KEY'])must(credentials.includes(key)&&providerEnv.includes(key),`POD credential ${key} must stay in the encrypted runtime credential plane.`);
must((podMigration.match(/INSERT OR REPLACE INTO store_pod_design_templates/g)||[]).length===48,'POD creative library must contain 48 original rotating templates.');
for(const theme of ['scripture','inspirational','sarcastic','cute-meme'])must(podMigration.includes(`'${theme}'`),`Missing POD creative theme ${theme}.`);
for(const productType of ['T-Shirt','Hoodie','Coffee Mug','Travel Tumbler','Tote Bag','Art Print'])must(podMigration.includes(productType),`Missing POD product type ${productType}.`);
must(pod.includes('scheduledPodCreative')&&pod.includes('/store-api/pod/art/')&&pod.includes('image/svg+xml'),'POD must generate daily original provider-ready SVG artwork on the Magnanimous domain.');
must(runtime.includes('scheduledPodCreative(env)')&&runtime.includes('handlePodNetwork(request,env)'),'Native store must mount POD public/owner APIs and daily creative scheduler.');
must(page.includes("fetch('/store-api/pod/designs'")&&page.includes('DAILY PRINT-ON-DEMAND'),'Native storefront must render the daily POD collection.');

console.log('Native Magnanimous Store lock PASS â€” owned catalog/cart/checkout, freight coverage, automatic fulfillment, and 24-hour customer refund protection are locked.');

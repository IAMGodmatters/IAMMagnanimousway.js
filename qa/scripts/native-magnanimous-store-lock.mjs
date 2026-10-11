import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const page=read('frontend/app/shop/page.tsx');
const runtime=read('worker/src/native-store-runtime.js');
const migration=read('worker/migrations/0097_native_magnanimous_store.sql');
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
must(runtime.includes('function dropshipMapped(row)')&&runtime.includes("available:dropshipMapped(row)&&stocked"),'Unmapped dropship products must not be publicly purchasable.');
must(runtime.includes("if(loaded.some(x=>!dropshipMapped(x.row)))"),'Checkout must reject incomplete supplier mappings before Stripe is opened.');
must(runtime.includes("supplier_auto_spend:false"),'Supplier auto-spend must remain fail-closed.');
must(runtime.includes("awaiting_supplier_activation")&&runtime.includes("awaiting_supplier_mapping"),'Dropship jobs must remain gated until supplier setup is valid.');

const publicProduct=runtime.slice(runtime.indexOf('function publicProduct'),runtime.indexOf('async function listProducts'));
for(const secretField of ['supplier_provider','supplier_product_id','supplier_variant_id','supplier_sku','supplier_cost_cents']){
 must(!publicProduct.includes(secretField),`Public product response leaks ${secretField}.`);
}

for(const table of ['store_products','store_orders','store_order_items','store_fulfillment_jobs'])must(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`),`Missing ${table} migration.`);
must(migration.includes("'/store/solar-power-bank.svg'")&&migration.includes("'/store/pet-feeder.svg'"),'Native product media must be locally hosted.');
must(consent.includes("url.pathname.startsWith('/store-api/')")&&consent.includes('handleNativeStore(nativeStoreRequest(request),env)'),'Native store must route on the Worker/D1 plane.');
must(wrangler.includes('"/store-api/*"'),'Cloudflare assets config must execute the Worker for store API requests.');
must(stripeWebhook.includes("handleNativeStoreStripeEvent")&&stripeWebhook.includes("await handleNativeStoreStripeEvent(env,event)"),'Verified Stripe webhooks must durably confirm native-store payments.');
must(stripeWebhook.includes("approval-gated dropshipping"),'Store webhook receipts must preserve fail-closed dropshipping fulfillment.');

console.log('Native Magnanimous Store lock PASS — owned catalog/cart/checkout, private supplier data, and fail-closed dropship fulfillment are locked.');

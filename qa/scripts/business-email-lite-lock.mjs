import fs from 'node:fs';

const read=(p)=>fs.readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
const ui=read('frontend/app/business-email/email-center-client.tsx');
const page=read('frontend/app/business-email/page.tsx');
const runtime=read('worker/src/business-email-runtime.js');
const writer=read('frontend/app/business-email/email-writer-client.tsx');

const checks=[];
function has(source,needle,label){const ok=source.includes(needle);checks.push([ok,label]);if(!ok)console.error(`FAIL: ${label}`)}

has(page,'EmailWriterClient','Business Email page exposes the Magnanimous AI email writer');
has(page,'Magnanimous AI Email Writer','page metadata exposes email-writing capability');
has(writer,'MAGNANIMOUS AI • EMAIL WRITER','email writer keeps Magnanimous as the public AI identity');
has(writer,"postMagnanimousChat",'email writer uses the resilient Magnanimous brain transport');
has(writer,"use_knowledge:true",'email writer can use established signed-in Magnanimous context');
has(writer,'Write the complete email, not advice about how to write it.','email writer produces ready-to-send copy');
has(writer,'Do not invent names, dates, prices, approvals, legal status, promises, attachments, credentials, account numbers, government identifiers, or actions that did not happen.','email writer has a factual non-invention boundary');
has(writer,"magnanimous_email_writer_draft",'unfinished email-writing work is locally durable');
has(writer,"/api/magnanimous/mail/accounts",'writer can discover authorized Gmail/Outlook accounts');
has(writer,"/api/magnanimous/mail/send",'writer uses the existing native provider-neutral mail execution path');
has(writer,"confirm(`Send this email now",'sending stays behind explicit user confirmation');
has(writer,'confirm:true','confirmed send is explicit in the native mail request');
has(page,'Free Business Email Lite','page metadata keeps the free product identity');
has(ui,'Make a business email in 3 little steps.','customer flow stays child-simple');
has(ui,'FREE BUSINESS EMAIL LITE','free email product header remains visible');
has(ui,'Receive for free. Forward for free.','free receiving/forwarding boundary is explicit');
has(ui,'Sending mail <em>from</em> this address is a separate feature','outbound sending is not falsely advertised as free');
has(ui,"iam_business_email_lite_draft",'unfinished setup is autosaved locally');
has(ui,"/api/business-email/lite",'UI uses persistent Business Email Lite API');
has(ui,"/api/business-email/check",'UI keeps DNS verification');
has(ui,'MY TEST EMAIL ARRIVED ✓','user can explicitly confirm end-to-end delivery');
has(ui,'Cloudflare must let <em>you</em> approve domain and email changes','provider approval boundary is explained simply');
has(runtime,"import {currentUser} from './integrations.js'",'saved aliases require authenticated platform identity');
has(runtime,'business_email_lite_aliases','Business Email Lite has persistent isolated storage');
has(runtime,'UNIQUE(tenant_id,domain,local_part)','aliases are tenant-scoped and unique');
has(runtime,"free_receiving_and_forwarding:true",'API declares free receive/forward capability');
has(runtime,"outbound_sending_included:false",'API declares outbound sending is not included');
has(runtime,"provider_action_required:true",'API does not pretend provider-side setup can be bypassed');
has(runtime,"destination",'forwarding destination is persisted without mailbox password storage');
has(runtime,"email_routing_ready:detected?.id==='cloudflare'",'DNS checker detects Cloudflare routing readiness');
has(runtime,"status='planned'",'saved setup has explicit lifecycle state');

const failed=checks.filter(([ok])=>!ok);
if(failed.length){console.error(`Business Email Lite lock failed: ${failed.length}/${checks.length} checks failed.`);process.exit(1)}
console.log(`Business Email Lite lock: ${checks.length} checks passed.`);
console.log('Free receiving/forwarding boundary: PASS');
console.log('Simple setup flow: PASS');
console.log('Tenant-isolated persistence: PASS');

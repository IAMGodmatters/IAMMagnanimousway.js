import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {suggestWhatsAppProductReply} from '../../worker/src/white-label-whatsapp-inbox.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const runtime=read('worker/src/white-label-whatsapp-inbox.js');
const operations=read('worker/src/operations-entrypoint.js');
const page=read('frontend/app/white-label/whatsapp/page.tsx');
const home=read('frontend/app/white-label/page.tsx');
const shell=read('frontend/app/white-label/app/page.tsx');
const credentials=read('worker/src/platform-credentials.js');
const security=read('worker/src/security-hardening.js');

assert.ok(operations.includes('handleWhiteLabelWhatsApp(request,env)'),'WhatsApp inbox handler must be mounted');
assert.ok(runtime.includes("'/api/white-label/native/whatsapp/webhook'"),'Webhook must use a route that is not intercepted by the OAuth router');
assert.ok(runtime.includes("request.headers.get('x-hub-signature-256')"),'Inbound events must verify Meta signatures');
assert.ok(runtime.includes("provider:'whatsapp'"), 'Replies must use the authorized assistant action router');
assert.ok(runtime.includes("action:'send_message'"),'Replies must use the audited WhatsApp send action');
assert.ok(runtime.includes("reply_status='review'"),'Messages must wait for human review');
assert.ok(runtime.includes('23*3600'),'Free-form replies must stay inside a conservative service window');
assert.ok(runtime.includes('tenant_id=? AND client_id=?'),'Inbox data must remain tenant/client scoped');
assert.ok(runtime.includes("reply_status='needs-review'"),'Ambiguous provider failures must not auto-retry');
assert.ok(credentials.includes("key:'WHATSAPP_VERIFY_TOKEN'"),'Owner credentials must expose a secure webhook verification token field');
assert.ok(security.includes("path === '/api/white-label/native/whatsapp/webhook') return false"),'Signed Meta webhooks must be exempt from customer-session entitlement checks');
assert.ok(page.includes('Edit before sending.'),'The UI must require review before sending');
assert.ok(page.includes('/api/white-label/native/whatsapp/webhook'),'The UI must show the routable callback path');
assert.ok(home.includes("key:'whatsapp'"),'White Label must list the WhatsApp inbox');
assert.ok(shell.includes('whatsapp:'),'The White Label app shell must open the WhatsApp inbox');

const fakeDb={prepare(){return{bind(){return{all:async()=>({results:[{name:'Solar Starter',sku:'SOLAR-1',stock:4}]})}}}}};
const matched=await suggestWhatsAppProductReply(fakeDb,'tenant-a','client-a','Do you have Solar Starter?');
assert.match(matched,/Solar Starter/);
const fallback=await suggestWhatsAppProductReply(fakeDb,'tenant-a','client-a','What can I buy?');
assert.match(fallback,/Which product/);

const db=new DatabaseSync(':memory:');
db.exec(read('worker/migrations/0076_white_label_whatsapp_inbox.sql'));
db.prepare('INSERT INTO white_label_whatsapp_routes(phone_number_id,tenant_id,client_id,integration_external_account_id,created_by,created_at) VALUES(?,?,?,?,?,?)').run('123456','tenant-a','client-a','wa-a','user-a',1);
assert.throws(()=>db.prepare('INSERT INTO white_label_whatsapp_routes(phone_number_id,tenant_id,client_id,integration_external_account_id,created_by,created_at) VALUES(?,?,?,?,?,?)').run('123456','tenant-b','client-b','wa-b','user-b',2),/UNIQUE constraint/);
db.close();

console.log('White Label WhatsApp lock: signature, review, routing, isolation, audit and no-auto-retry contracts PASS');

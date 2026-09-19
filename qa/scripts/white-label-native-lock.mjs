import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {invoiceBody,projectBody} from '../../worker/src/white-label-native-products.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const runtime=read('worker/src/white-label-native-products.js');
const operations=read('worker/src/operations-entrypoint.js');
const security=read('worker/src/security-hardening.js');
const home=read('frontend/app/white-label/page.tsx');
const shell=read('frontend/app/white-label/app/page.tsx');
const studio=read('frontend/app/white-label/native/page.tsx');

const invoice=invoiceBody({customer:'Client',currency:'USD',items:[{description:'Service',quantity:3,unit_price:10.25},{description:'Parts',quantity:1,unit_price:2.95}],tax_percent:10});
assert.equal(invoice.subtotal_cents,3370);
assert.equal(invoice.tax_cents,337);
assert.equal(invoice.total_cents,3707);
assert.equal(invoice.payment_processed,false);
assert.throws(()=>invoiceBody({customer:'',items:[{description:'Thing',quantity:1,unit_price:1}]}),/Customer/);
assert.throws(()=>invoiceBody({customer:'Client',items:[{description:'Thing',quantity:-1,unit_price:1}]}),/Each line/);
assert.throws(()=>invoiceBody({customer:'Client',items:[{description:'Thing',quantity:1,unit_price:Infinity}]}),/Each line/);
const project=projectBody('website',{name:'Site',theme_color:'invalid',sections:[{heading:'About',copy:'Us'}]});
assert.equal(project.theme_color,'#164c78');
assert.equal(project.deployment_status,'draft-only');
assert.equal(project.code_export_ready,false);

for(const name of ['invoice','pos','website','app-builder']){
 assert.ok(home.includes(`key:'${name}'`),`White Label catalog missing ${name}`);
 assert.ok(shell.includes(`${name}:`)||shell.includes(`'${name}':`),`App shell missing ${name}`);
}
assert.ok(operations.includes('handleWhiteLabelNativeProducts(request,env)'),'Native handler not mounted');
assert.ok(security.includes("path.startsWith('/api/white-label/native/')"),'Native routes missing agency security boundary');
assert.ok(runtime.includes('CHECK(stock>=0)'),'POS inventory must prevent negative stock');
assert.ok(runtime.includes('await env.DB.batch(['),'POS changes must be transactional');
assert.ok(runtime.includes("payment_method!=='cash'"),'POS must explicitly validate payment type');
assert.ok(runtime.includes('external_payment_confirmed!==true'),'POS must not infer an external payment');
assert.ok(runtime.includes("c.id,kind"),'Documents must be client-scoped');
assert.ok(runtime.includes("tenant_id=? AND client_id=?"),'POS must be tenant/client scoped');
assert.ok(studio.includes('No card payment was processed here.'),'POS UI must disclose no card processing');
const db=new DatabaseSync(':memory:');
db.exec('CREATE TABLE bpo_clients(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL);');
db.exec(read('worker/migrations/0075_white_label_native_products.sql'));
db.prepare('INSERT INTO white_label_pos_products(id,tenant_id,client_id,name,sku,price_cents,stock,created_at) VALUES(?,?,?,?,?,?,?,?)').run('p1','t1','c1','Book','book',1099,2,1);
assert.throws(()=>db.prepare('UPDATE white_label_pos_products SET stock=stock-? WHERE id=? AND tenant_id=? AND client_id=?').run(3,'p1','t1','c1'),/CHECK constraint/);
assert.equal(db.prepare('SELECT stock FROM white_label_pos_products WHERE id=?').get('p1').stock,2);
db.close();
console.log('Native White Label lock: invoice math, isolation, payment claims, stock guards and UI mounts PASS');

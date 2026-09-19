import {currentUser} from './integrations.js';
import {recordWhiteLabelAction} from './white-label-brain-runtime.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
const text=(value,max=200)=>String(value??'').trim().slice(0,max);
const now=()=>Math.floor(Date.now()/1000);
const TYPES=new Set(['invoice','website','app']);
const money=value=>{const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1_000_000?Math.round(n*100):null};

export async function hasWhiteLabelAccess(env,user){
 if(!env?.DB||!user)return false;
 if(String(env.ADMIN_EMAIL||'').trim().toLowerCase()===String(user.email||'').trim().toLowerCase()&&['owner','admin'].includes(String(user.role||'').toLowerCase()))return true;
 try{
  const subscription=await env.DB.prepare("SELECT plan,current_period_end FROM billing_subscriptions WHERE tenant_id=? AND status IN ('active','trialing') LIMIT 1").bind(String(user.tenant_id)).first();
  if(subscription?.current_period_end&&Number(subscription.current_period_end)<now())return false;
  const tenant=subscription?null:await env.DB.prepare('SELECT plan FROM tenants WHERE id=? LIMIT 1').bind(String(user.tenant_id)).first();
  return ['agency','agency_pro'].includes(String(subscription?.plan||tenant?.plan||'').toLowerCase());
 }catch{return false}
}

async function ensure(env){
 await env.DB.batch([
  env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_native_documents (
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,kind TEXT NOT NULL,
   title TEXT NOT NULL,body_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',
   created_by TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
   UNIQUE(tenant_id,client_id,kind,title)
  )`),
  env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_white_label_native_documents ON white_label_native_documents(tenant_id,client_id,kind,updated_at DESC)'),
  env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_pos_products (
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,name TEXT NOT NULL,
   sku TEXT NOT NULL,price_cents INTEGER NOT NULL CHECK(price_cents>=0),
   stock INTEGER NOT NULL CHECK(stock>=0),active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,
   UNIQUE(tenant_id,client_id,sku)
  )`),
  env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_white_label_pos_products ON white_label_pos_products(tenant_id,client_id,active)'),
  env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_pos_sales (
   id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,items_json TEXT NOT NULL,
   total_cents INTEGER NOT NULL,payment_method TEXT NOT NULL,payment_status TEXT NOT NULL,
   created_by TEXT NOT NULL,created_at INTEGER NOT NULL
  )`)
 ]);
}

async function client(env,user,id){
 const clientId=text(id,80);if(!clientId)return null;
 return env.DB.prepare('SELECT id,name FROM bpo_clients WHERE id=? AND tenant_id=? LIMIT 1').bind(clientId,String(user.tenant_id)).first();
}

export function invoiceBody(body){
 const currency=text(body.currency||'USD',3).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Object.assign(new Error('Choose a three-letter currency.'),{status:400});
 const customer=text(body.customer,180),due=text(body.due_date,10);
 if(!customer)throw Object.assign(new Error('Customer name is required.'),{status:400});
 if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw Object.assign(new Error('Use YYYY-MM-DD for the due date.'),{status:400});
 const lines=Array.isArray(body.items)?body.items.slice(0,50):[];
 if(!lines.length)throw Object.assign(new Error('Add at least one invoice line.'),{status:400});
 const items=lines.map(line=>{
  const description=text(line.description,240),quantity=Number(line.quantity),price_cents=money(line.unit_price);
  if(!description||!Number.isInteger(quantity)||quantity<1||quantity>10000||price_cents===null)throw Object.assign(new Error('Each line needs a description, whole-number quantity and valid price.'),{status:400});
  return{description,quantity,unit_price_cents:price_cents,total_cents:quantity*price_cents};
 });
 const tax=Number(body.tax_percent||0);if(!Number.isFinite(tax)||tax<0||tax>100)throw Object.assign(new Error('Tax percent must be between 0 and 100.'),{status:400});
 const subtotal_cents=items.reduce((sum,item)=>sum+item.total_cents,0),tax_cents=Math.round(subtotal_cents*tax/100);
 return{customer,customer_email:text(body.customer_email,240),currency,due_date:due,tax_percent:tax,notes:text(body.notes,2000),items,subtotal_cents,tax_cents,total_cents:subtotal_cents+tax_cents,payment_processed:false};
}

export function projectBody(kind,body){
 const name=text(body.name,160),description=text(body.description,1800);
 if(!name)throw Object.assign(new Error('Give the project a name.'),{status:400});
 const sections=Array.isArray(body.sections)?body.sections.slice(0,12).map(x=>({heading:text(x.heading,120),copy:text(x.copy,1200)})).filter(x=>x.heading||x.copy):[];
 return{kind,name,description,headline:text(body.headline||name,240),call_to_action:text(body.call_to_action||'Contact us',100),sections,theme_color:/^#[0-9a-fA-F]{6}$/.test(String(body.theme_color||''))?body.theme_color:'#164c78',deployment_status:'draft-only',code_export_ready:false};
}

async function documents(request,env,user,url){
 const kind=url.pathname.split('/')[4],tenant=String(user.tenant_id);
 if(!TYPES.has(kind))return null;
 const match=url.pathname.match(/^\/api\/white-label\/native\/(?:invoice|website|app)\/([0-9a-f-]{36})$/);
 if(match){
  const row=await env.DB.prepare('SELECT * FROM white_label_native_documents WHERE id=? AND tenant_id=? AND kind=?').bind(match[1],tenant,kind).first();
  if(!row)return json({detail:'Document not found in this workspace.'},404);
  if(request.method==='GET')return json({document:{...row,body:JSON.parse(row.body_json)}});
  if(request.method==='PATCH'){
   if(row.status!=='draft')return json({detail:'Only drafts can be edited.'},409);
   const b=await request.json().catch(()=>({})),body=kind==='invoice'?invoiceBody(b):projectBody(kind,b),title=kind==='invoice'?text(b.number,80):body.name;
   if(!title)return json({detail:'A unique invoice number or project name is required.'},400);
   await env.DB.prepare('UPDATE white_label_native_documents SET title=?,body_json=?,updated_at=? WHERE id=? AND tenant_id=? AND kind=?').bind(title,JSON.stringify(body),now(),row.id,tenant,kind).run();
   return json({ok:true,id:row.id,body});
  }
  return json({detail:'Method not allowed.'},405);
 }
 if(url.pathname!==`/api/white-label/native/${kind}`)return json({detail:'Route not found.'},404);
 if(request.method==='GET'){
  const c=await client(env,user,url.searchParams.get('client_id'));if(!c)return json({detail:'Choose a client belonging to this workspace.'},400);
  const {results=[]}=await env.DB.prepare('SELECT * FROM white_label_native_documents WHERE tenant_id=? AND client_id=? AND kind=? ORDER BY updated_at DESC LIMIT 100').bind(tenant,c.id,kind).all();
  return json({documents:results.map(row=>({...row,body:JSON.parse(row.body_json)})),client:c});
 }
 if(request.method==='POST'){
  const b=await request.json().catch(()=>({})),c=await client(env,user,b.client_id);if(!c)return json({detail:'Choose a client belonging to this workspace.'},400);
  const body=kind==='invoice'?invoiceBody(b):projectBody(kind,b),title=kind==='invoice'?text(b.number,80):body.name;
  if(!title)return json({detail:'A unique invoice number is required.'},400);
  const id=crypto.randomUUID(),ts=now();
  try{await env.DB.prepare('INSERT INTO white_label_native_documents(id,tenant_id,client_id,kind,title,body_json,status,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,kind,title,JSON.stringify(body),'draft',String(user.id),ts,ts).run()}
  catch{return json({detail:'That number or project name is already used for this client.'},409)}
  return json({ok:true,id,kind,title,body,status:'draft'},201);
 }
 return json({detail:'Method not allowed.'},405);
}

async function pos(request,env,user,url){
 const tenant=String(user.tenant_id),path=url.pathname;
 if(path==='/api/white-label/native/pos/products'&&request.method==='GET'){
  const c=await client(env,user,url.searchParams.get('client_id'));if(!c)return json({detail:'Choose a client belonging to this workspace.'},400);
  const {results=[]}=await env.DB.prepare('SELECT id,name,sku,price_cents,stock,active FROM white_label_pos_products WHERE tenant_id=? AND client_id=? ORDER BY name LIMIT 200').bind(tenant,c.id).all();
  return json({products:results,client:c});
 }
 if(path==='/api/white-label/native/pos/products'&&request.method==='POST'){
  const b=await request.json().catch(()=>({})),c=await client(env,user,b.client_id),name=text(b.name,160),sku=text(b.sku,80),price=money(b.price),stock=Number(b.stock);
  if(!c||!name||!sku||price===null||!Number.isInteger(stock)||stock<0||stock>100000)return json({detail:'Choose a client, name, SKU, valid price and nonnegative whole-number stock.'},400);
  const id=crypto.randomUUID();try{await env.DB.prepare('INSERT INTO white_label_pos_products(id,tenant_id,client_id,name,sku,price_cents,stock,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,name,sku,price,stock,now()).run()}
  catch{return json({detail:'SKU already exists for this client.'},409)}
  return json({ok:true,id,price_cents:price,stock},201);
 }
 if(path==='/api/white-label/native/pos/sales'&&request.method==='POST'){
  const b=await request.json().catch(()=>({})),c=await client(env,user,b.client_id);if(!c)return json({detail:'Choose a client belonging to this workspace.'},400);
  if(b.payment_method!=='cash'&&b.payment_method!=='external')return json({detail:'Choose cash or external payment; this POS does not process cards.'},400);
  if(b.payment_method==='external'&&b.external_payment_confirmed!==true)return json({detail:'Confirm the external payment was completed before recording this sale.'},400);
  const raw=Array.isArray(b.items)?b.items:[];if(!raw.length||raw.length>50)return json({detail:'Add 1–50 products to the sale.'},400);
  const quantities=new Map();for(const x of raw){const id=text(x.product_id,36),qty=Number(x.quantity);if(!/^[0-9a-f-]{36}$/.test(id)||!Number.isInteger(qty)||qty<1||qty>10000)return json({detail:'Each sale item needs a valid product and quantity.'},400);quantities.set(id,(quantities.get(id)||0)+qty)}
  const items=[];for(const [id,quantity] of quantities){
   const product=await env.DB.prepare('SELECT id,name,sku,price_cents,stock FROM white_label_pos_products WHERE id=? AND tenant_id=? AND client_id=? AND active=1').bind(id,tenant,c.id).first();
   if(!product||product.stock<quantity)return json({detail:`Product unavailable or insufficient stock: ${product?.name||id}.`},409);
   items.push({product_id:id,name:product.name,sku:product.sku,quantity,unit_price_cents:product.price_cents,total_cents:quantity*product.price_cents});
  }
  const total=items.reduce((sum,x)=>sum+x.total_cents,0),id=crypto.randomUUID(),ts=now();
  // D1 batch is transactional. The stock CHECK constraint rolls back the sale if a concurrent checkout exhausts stock.
  try{await env.DB.batch([
   ...items.map(x=>env.DB.prepare('UPDATE white_label_pos_products SET stock=stock-? WHERE id=? AND tenant_id=? AND client_id=? AND active=1').bind(x.quantity,x.product_id,tenant,c.id)),
   env.DB.prepare('INSERT INTO white_label_pos_sales(id,tenant_id,client_id,items_json,total_cents,payment_method,payment_status,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,JSON.stringify(items),total,b.payment_method,b.payment_method==='cash'?'cash-recorded':'externally-confirmed',String(user.id),ts)
  ])}catch{return json({detail:'Stock changed during checkout. Refresh the cart and try again.'},409)}
  return json({ok:true,id,items,total_cents:total,payment_status:b.payment_method==='cash'?'cash-recorded':'externally-confirmed',card_processed:false},201);
 }
 if(path==='/api/white-label/native/pos/sales'&&request.method==='GET'){
  const c=await client(env,user,url.searchParams.get('client_id'));if(!c)return json({detail:'Choose a client belonging to this workspace.'},400);
  const {results=[]}=await env.DB.prepare('SELECT * FROM white_label_pos_sales WHERE tenant_id=? AND client_id=? ORDER BY created_at DESC LIMIT 100').bind(tenant,c.id).all();
  return json({sales:results.map(x=>({...x,items:JSON.parse(x.items_json)}))});
 }
 return json({detail:'Route not found.'},404);
}

export async function handleWhiteLabelNativeProducts(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/white-label/native/'))return null;
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use White Label.'},401);
 if(!await hasWhiteLabelAccess(env,user))return json({detail:'An active Agency White Label plan is required.'},403);
 try{
  await ensure(env);
  const response=url.pathname.startsWith('/api/white-label/native/pos/')?await pos(request,env,user,url):await documents(request,env,user,url);
  if(!response)return json({detail:'Route not found.'},404);
  if(response.ok&&request.method!=='GET')await recordWhiteLabelAction(env,user,{path:url.pathname,method:request.method,responseStatus:response.status}).catch(()=>{});
  return response;
 }catch(error){return json({detail:error?.message||'Native White Label request failed.'},error?.status||500)}
}

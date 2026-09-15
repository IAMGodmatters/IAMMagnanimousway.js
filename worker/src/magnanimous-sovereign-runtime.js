import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);

export const MAGNANIMOUS_SOVEREIGN_STACK={
 identity:'Magnanimous AI',
 rule:'Magnanimous AI owns identity, orchestration, memory, reasoning policy, verification and learning. External engines and transports are replaceable execution adapters only.',
 layers:[
  {id:'brain',name:'Magnanimous Cognitive Core',mode:'native-control',status:'active'},
  {id:'memory',name:'Magnanimous Persistent Memory',mode:'native-control',status:'active'},
  {id:'reasoning',name:'Magnanimous Deliberation + Verification',mode:'native-control',status:'active'},
  {id:'model-fabric',name:'Replaceable Model Execution Fabric',mode:'adapter',status:'active'},
  {id:'voice',name:'Magnanimous Voice Runtime',mode:'native-first',status:'active'},
  {id:'rtc',name:'Magnanimous WebRTC Calling',mode:'native-first',status:'active'},
  {id:'pstn',name:'Magnanimous Carrier Gateway',mode:'licensed-or-byoc-transport',status:'adapter-required'},
  {id:'messaging',name:'Magnanimous Omnichannel Messaging',mode:'native-or-official-channel-adapter',status:'active'},
  {id:'avatar',name:'Magnanimous Virtual Host',mode:'native-first',status:'active'},
  {id:'crm',name:'Magnanimous CRM',mode:'native-control',status:'active'},
  {id:'site-builder',name:'Magnanimous Site Builder',mode:'white-label-product',status:'product-ready'},
  {id:'app-builder',name:'Magnanimous App Builder',mode:'white-label-product',status:'product-ready'},
  {id:'pos',name:'Magnanimous POS',mode:'white-label-product',status:'product-ready'},
  {id:'invoice',name:'Magnanimous Invoice Maker',mode:'white-label-product',status:'product-ready'}
 ]
};

const PRODUCTS=[
 {id:'ai',name:'Magnanimous AI',category:'intelligence',standalone:true,white_label:true,pricing_model:'plan'},
 {id:'crm',name:'Magnanimous CRM',category:'business',standalone:true,white_label:true,pricing_model:'plan'},
 {id:'voice-center',name:'Magnanimous Voice & Contact Center',category:'communications',standalone:true,white_label:true,pricing_model:'base-plus-usage'},
 {id:'virtual-host',name:'Magnanimous Virtual Host',category:'communications',standalone:true,white_label:true,pricing_model:'base-plus-usage'},
 {id:'whatsapp-commerce',name:'Magnanimous WhatsApp Commerce',category:'communications',standalone:true,white_label:true,pricing_model:'base-plus-channel-cost'},
 {id:'site-builder',name:'Magnanimous Website Builder',category:'builder',standalone:true,white_label:true,pricing_model:'plan'},
 {id:'app-builder',name:'Magnanimous App Builder',category:'builder',standalone:true,white_label:true,pricing_model:'plan-plus-publishing-costs'},
 {id:'pos',name:'Magnanimous POS',category:'commerce',standalone:true,white_label:true,pricing_model:'plan-plus-payment-processing'},
 {id:'invoice',name:'Magnanimous Invoice Maker',category:'commerce',standalone:true,white_label:true,pricing_model:'plan'}
];

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sovereign_product_settings(
  tenant_id TEXT NOT NULL, product_id TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
  white_label INTEGER NOT NULL DEFAULT 0, brand_name TEXT NOT NULL DEFAULT '', custom_domain TEXT NOT NULL DEFAULT '',
  config_json TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,product_id)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sovereign_reasoning_evaluations(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  task_class TEXT NOT NULL DEFAULT 'general', score REAL NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
 )`).run();
}

function publicArchitecture(){return {...MAGNANIMOUS_SOVEREIGN_STACK,execution_provider_details_private:true,products:PRODUCTS};}

async function settings(env,user){
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT product_id,enabled,white_label,brand_name,custom_domain,config_json,updated_at FROM sovereign_product_settings WHERE tenant_id=?').bind(user.tenant_id).all();
 return results.map(x=>({...x,enabled:!!x.enabled,white_label:!!x.white_label,config:(()=>{try{return JSON.parse(x.config_json||'{}')}catch{return{}}})()}));
}

async function saveProduct(request,env,user){
 await ensureSchema(env);const body=await request.json().catch(()=>({}));const id=String(body.product_id||'').trim();
 if(!PRODUCTS.some(x=>x.id===id))return json({detail:'Unknown Magnanimous product.'},400);
 const ts=now(),brand=String(body.brand_name||'').trim().slice(0,120),domain=String(body.custom_domain||'').trim().slice(0,255),config=JSON.stringify(body.config&&typeof body.config==='object'?body.config:{}).slice(0,12000);
 await env.DB.prepare(`INSERT INTO sovereign_product_settings(tenant_id,product_id,enabled,white_label,brand_name,custom_domain,config_json,updated_at)
 VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,product_id) DO UPDATE SET enabled=excluded.enabled,white_label=excluded.white_label,brand_name=excluded.brand_name,custom_domain=excluded.custom_domain,config_json=excluded.config_json,updated_at=excluded.updated_at`)
 .bind(user.tenant_id,id,body.enabled===false?0:1,body.white_label?1:0,brand,domain,config,ts).run();
 return json({ok:true,product_id:id,enabled:body.enabled!==false,white_label:!!body.white_label,brand_name:brand,custom_domain:domain});
}

async function evaluateReasoning(request,env,user){
 await ensureSchema(env);const body=await request.json().catch(()=>({}));const score=Math.max(0,Math.min(1,Number(body.score||0))),verified=body.verified?1:0;
 await env.DB.prepare('INSERT INTO sovereign_reasoning_evaluations(tenant_id,user_id,task_class,score,verified,notes,created_at) VALUES(?,?,?,?,?,?,?)').bind(user.tenant_id,user.id,String(body.task_class||'general').slice(0,80),score,verified,String(body.notes||'').slice(0,2000),now()).run();
 return json({ok:true,score,verified:!!verified,learning_target:'Magnanimous reasoning policy and routing'});
}

export async function handleMagnanimousSovereign(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/magnanimous/sovereign'))return null;
 if(path==='/api/magnanimous/sovereign/architecture'&&request.method==='GET')return json(publicArchitecture());
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 if(path==='/api/magnanimous/sovereign/products'&&request.method==='GET')return json({products:PRODUCTS,settings:await settings(env,user),provider_details_private:true});
 if(path==='/api/magnanimous/sovereign/products'&&request.method==='POST')return saveProduct(request,env,user);
 if(path==='/api/magnanimous/sovereign/reasoning/evaluate'&&request.method==='POST')return evaluateReasoning(request,env,user);
 return json({detail:'Sovereign capability route not found.'},404);
}

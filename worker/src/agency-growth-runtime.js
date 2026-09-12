import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const text=(v,n=8000)=>String(v||'').trim().slice(0,n);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v||0)));
const money=v=>Math.round(Number(v||0)*100)/100;

async function ensure(env){
 const statements=[
  `CREATE TABLE IF NOT EXISTS agency_client_settings (tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,brand_name TEXT NOT NULL DEFAULT '',logo_url TEXT NOT NULL DEFAULT '',custom_domain TEXT NOT NULL DEFAULT '',accent_color TEXT NOT NULL DEFAULT '',white_label_enabled INTEGER NOT NULL DEFAULT 0,monthly_platform_fee_usd REAL NOT NULL DEFAULT 0,default_markup_percent REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,client_id))`,
  `CREATE TABLE IF NOT EXISTS agency_bookings (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,contact_name TEXT NOT NULL,contact_email TEXT NOT NULL DEFAULT '',contact_phone TEXT NOT NULL DEFAULT '',service TEXT NOT NULL DEFAULT '',start_at INTEGER NOT NULL,end_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'booked',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_agency_bookings_client_start ON agency_bookings(tenant_id,client_id,start_at)`,
  `CREATE TABLE IF NOT EXISTS agency_funnels (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,headline TEXT NOT NULL DEFAULT '',offer TEXT NOT NULL DEFAULT '',cta_label TEXT NOT NULL DEFAULT 'Get started',cta_url TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',visits INTEGER NOT NULL DEFAULT 0,leads INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,slug))`,
  `CREATE TABLE IF NOT EXISTS agency_reputation_items (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'manual',customer_name TEXT NOT NULL DEFAULT '',rating REAL NOT NULL DEFAULT 5,review_text TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'needs-response',response_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_agency_reputation_client ON agency_reputation_items(tenant_id,client_id,created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS agency_usage_rebill (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,period TEXT NOT NULL,category TEXT NOT NULL,units REAL NOT NULL DEFAULT 0,cost_usd REAL NOT NULL DEFAULT 0,markup_percent REAL NOT NULL DEFAULT 0,customer_charge_usd REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'unbilled',note TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_agency_usage_client_period ON agency_usage_rebill(tenant_id,client_id,period)`
 ];
 for(const q of statements)await env.DB.prepare(q).run();
}
async function client(env,tenant,id){try{return await env.DB.prepare('SELECT id,name,industry,status FROM bpo_clients WHERE id=? AND tenant_id=?').bind(id,tenant).first()}catch{return null}}
async function clients(env,tenant){try{const{results=[]}=await env.DB.prepare('SELECT id,name,industry,status FROM bpo_clients WHERE tenant_id=? ORDER BY name').bind(tenant).all();return results}catch{return[]}}
function ownerOnly(user){return ['owner','admin'].includes(String(user?.role||'').toLowerCase())}

async function overview(env,tenant){
 const scalar=async(sql)=>Number((await env.DB.prepare(sql).bind(tenant).first())?.n||0);
 const [clientRows,bookings,activeFunnels,reviews,unbilled]=await Promise.all([
  clients(env,tenant),
  scalar("SELECT COUNT(*) n FROM agency_bookings WHERE tenant_id=? AND status='booked' AND start_at>=strftime('%s','now')"),
  scalar("SELECT COUNT(*) n FROM agency_funnels WHERE tenant_id=? AND status='active'"),
  scalar("SELECT COUNT(*) n FROM agency_reputation_items WHERE tenant_id=? AND status='needs-response'"),
  env.DB.prepare("SELECT COALESCE(SUM(customer_charge_usd),0) total FROM agency_usage_rebill WHERE tenant_id=? AND status='unbilled'").bind(tenant).first()
 ]);
 return{ok:true,clients:clientRows.length,upcoming_bookings:bookings,active_funnels:activeFunnels,reviews_needing_response:reviews,unbilled_usage_usd:money(unbilled?.total||0),pricing_position:{agency:299,agency_pro:499,ordinary_max:199},client_identity_source:'bpo_clients'};
}

export async function handleAgencyGrowth(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/agency'))return null;if(!env?.DB)return json({detail:'Agency workspace database is unavailable.'},503);
 try{
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Agency Command.'},401);const tenant=String(user.tenant_id),owner=ownerOnly(user);
  if(request.method==='GET'&&url.pathname==='/api/agency/overview')return json(await overview(env,tenant));
  if(request.method==='GET'&&url.pathname==='/api/agency/clients')return json({clients:await clients(env,tenant),identity_source:'bpo_clients'});

  let m=url.pathname.match(/^\/api\/agency\/clients\/([^/]+)\/settings$/);
  if(m&&request.method==='GET'){
   const c=await client(env,tenant,m[1]);if(!c)return json({detail:'Client account not found.'},404);const settings=await env.DB.prepare('SELECT * FROM agency_client_settings WHERE tenant_id=? AND client_id=?').bind(tenant,m[1]).first();return json({client:c,settings:settings||{client_id:c.id,brand_name:c.name,logo_url:'',custom_domain:'',accent_color:'',white_label_enabled:0,monthly_platform_fee_usd:0,default_markup_percent:0,status:'active'}})
  }
  if(m&&request.method==='PUT'){
   if(!owner)return json({detail:'Workspace owner access required for white-label settings.'},403);const c=await client(env,tenant,m[1]);if(!c)return json({detail:'Client account not found.'},404);const b=await request.json().catch(()=>({})),ts=now();
   await env.DB.prepare(`INSERT INTO agency_client_settings(tenant_id,client_id,brand_name,logo_url,custom_domain,accent_color,white_label_enabled,monthly_platform_fee_usd,default_markup_percent,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,client_id) DO UPDATE SET brand_name=excluded.brand_name,logo_url=excluded.logo_url,custom_domain=excluded.custom_domain,accent_color=excluded.accent_color,white_label_enabled=excluded.white_label_enabled,monthly_platform_fee_usd=excluded.monthly_platform_fee_usd,default_markup_percent=excluded.default_markup_percent,status=excluded.status,updated_at=excluded.updated_at`).bind(tenant,c.id,text(b.brand_name||c.name,160),text(b.logo_url,700),text(b.custom_domain,240),text(b.accent_color,40),b.white_label_enabled?1:0,money(b.monthly_platform_fee_usd),clamp(b.default_markup_percent,0,300),text(b.status||'active',30),ts,ts).run();return json({ok:true})
  }

  if(url.pathname==='/api/agency/bookings'){
   if(request.method==='GET'){const clientId=text(url.searchParams.get('client_id'),80);let sql='SELECT b.*,c.name client_name FROM agency_bookings b JOIN bpo_clients c ON c.id=b.client_id WHERE b.tenant_id=?';const args=[tenant];if(clientId){sql+=' AND b.client_id=?';args.push(clientId)}sql+=' ORDER BY b.start_at DESC LIMIT 300';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({bookings:results})}
   if(request.method==='POST'){const b=await request.json().catch(()=>({})),c=await client(env,tenant,text(b.client_id,80));if(!c)return json({detail:'Choose a valid client account.'},400);const name=text(b.contact_name,180),start=Number(b.start_at||0),end=Number(b.end_at||0);if(!name||!start||!end||end<=start)return json({detail:'Contact, start time and a valid end time are required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO agency_bookings(id,tenant_id,client_id,contact_name,contact_email,contact_phone,service,start_at,end_at,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,name,text(b.contact_email,240),text(b.contact_phone,80),text(b.service,180),start,end,text(b.status||'booked',30),text(b.notes,3000),ts,ts).run();return json({ok:true,id},201)}
  }
  m=url.pathname.match(/^\/api\/agency\/bookings\/([^/]+)$/);if(m&&request.method==='PATCH'){const row=await env.DB.prepare('SELECT * FROM agency_bookings WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Booking not found.'},404);const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE agency_bookings SET status=?,notes=?,updated_at=? WHERE id=? AND tenant_id=?').bind(text(b.status||row.status,30),text(b.notes===undefined?row.notes:b.notes,3000),now(),m[1],tenant).run();return json({ok:true})}

  if(url.pathname==='/api/agency/funnels'){
   if(request.method==='GET'){const clientId=text(url.searchParams.get('client_id'),80);let sql='SELECT f.*,c.name client_name FROM agency_funnels f JOIN bpo_clients c ON c.id=f.client_id WHERE f.tenant_id=?';const args=[tenant];if(clientId){sql+=' AND f.client_id=?';args.push(clientId)}sql+=' ORDER BY f.updated_at DESC LIMIT 200';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({funnels:results})}
   if(request.method==='POST'){if(!owner)return json({detail:'Workspace owner access required to publish funnels.'},403);const b=await request.json().catch(()=>({})),c=await client(env,tenant,text(b.client_id,80));if(!c)return json({detail:'Choose a valid client account.'},400);const name=text(b.name,180),slug=text(b.slug,120).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');if(!name||!slug)return json({detail:'Funnel name and slug are required.'},400);const id=crypto.randomUUID(),ts=now();try{await env.DB.prepare('INSERT INTO agency_funnels(id,tenant_id,client_id,name,slug,headline,offer,cta_label,cta_url,status,visits,leads,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,name,slug,text(b.headline,300),text(b.offer,4000),text(b.cta_label||'Get started',120),text(b.cta_url,700),text(b.status||'draft',30),0,0,ts,ts).run()}catch{return json({detail:'That funnel slug is already in use.'},409)}return json({ok:true,id},201)}
  }
  m=url.pathname.match(/^\/api\/agency\/funnels\/([^/]+)$/);if(m&&request.method==='PATCH'){if(!owner)return json({detail:'Workspace owner access required.'},403);const row=await env.DB.prepare('SELECT * FROM agency_funnels WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Funnel not found.'},404);const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE agency_funnels SET name=?,headline=?,offer=?,cta_label=?,cta_url=?,status=?,updated_at=? WHERE id=? AND tenant_id=?').bind(text(b.name===undefined?row.name:b.name,180),text(b.headline===undefined?row.headline:b.headline,300),text(b.offer===undefined?row.offer:b.offer,4000),text(b.cta_label===undefined?row.cta_label:b.cta_label,120),text(b.cta_url===undefined?row.cta_url:b.cta_url,700),text(b.status===undefined?row.status:b.status,30),now(),m[1],tenant).run();return json({ok:true})}

  if(url.pathname==='/api/agency/reputation'){
   if(request.method==='GET'){const clientId=text(url.searchParams.get('client_id'),80);let sql='SELECT r.*,c.name client_name FROM agency_reputation_items r JOIN bpo_clients c ON c.id=r.client_id WHERE r.tenant_id=?';const args=[tenant];if(clientId){sql+=' AND r.client_id=?';args.push(clientId)}sql+=' ORDER BY r.created_at DESC LIMIT 300';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({items:results})}
   if(request.method==='POST'){const b=await request.json().catch(()=>({})),c=await client(env,tenant,text(b.client_id,80));if(!c)return json({detail:'Choose a valid client account.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO agency_reputation_items(id,tenant_id,client_id,source,customer_name,rating,review_text,status,response_text,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,text(b.source||'manual',80),text(b.customer_name,180),clamp(b.rating||5,1,5),text(b.review_text,8000),text(b.status||'needs-response',30),text(b.response_text,8000),ts,ts).run();return json({ok:true,id},201)}
  }
  m=url.pathname.match(/^\/api\/agency\/reputation\/([^/]+)$/);if(m&&request.method==='PATCH'){const row=await env.DB.prepare('SELECT * FROM agency_reputation_items WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Review item not found.'},404);const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE agency_reputation_items SET status=?,response_text=?,updated_at=? WHERE id=? AND tenant_id=?').bind(text(b.status||row.status,30),text(b.response_text===undefined?row.response_text:b.response_text,8000),now(),m[1],tenant).run();return json({ok:true})}

  if(url.pathname==='/api/agency/usage'){
   if(request.method==='GET'){const clientId=text(url.searchParams.get('client_id'),80);let sql='SELECT u.*,c.name client_name FROM agency_usage_rebill u JOIN bpo_clients c ON c.id=u.client_id WHERE u.tenant_id=?';const args=[tenant];if(clientId){sql+=' AND u.client_id=?';args.push(clientId)}sql+=' ORDER BY u.period DESC,u.created_at DESC LIMIT 500';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({items:results})}
   if(request.method==='POST'){if(!owner)return json({detail:'Workspace owner access required for usage rebilling.'},403);const b=await request.json().catch(()=>({})),c=await client(env,tenant,text(b.client_id,80));if(!c)return json({detail:'Choose a valid client account.'},400);const settings=await env.DB.prepare('SELECT default_markup_percent FROM agency_client_settings WHERE tenant_id=? AND client_id=?').bind(tenant,c.id).first();const markup=clamp(b.markup_percent===undefined?settings?.default_markup_percent||0:b.markup_percent,0,300),cost=money(b.cost_usd),charge=money(cost*(1+markup/100)),id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO agency_usage_rebill(id,tenant_id,client_id,period,category,units,cost_usd,markup_percent,customer_charge_usd,status,note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,c.id,text(b.period||new Date().toISOString().slice(0,7),20),text(b.category||'AI usage',120),Number(b.units||0),cost,markup,charge,text(b.status||'unbilled',30),text(b.note,2000),ts,ts).run();return json({ok:true,id,cost_usd:cost,markup_percent:markup,customer_charge_usd:charge},201)}
  }
  m=url.pathname.match(/^\/api\/agency\/usage\/([^/]+)$/);if(m&&request.method==='PATCH'){if(!owner)return json({detail:'Workspace owner access required.'},403);const row=await env.DB.prepare('SELECT * FROM agency_usage_rebill WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Usage item not found.'},404);const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE agency_usage_rebill SET status=?,note=?,updated_at=? WHERE id=? AND tenant_id=?').bind(text(b.status||row.status,30),text(b.note===undefined?row.note:b.note,2000),now(),m[1],tenant).run();return json({ok:true})}

  return json({detail:'Agency Command endpoint not found.'},404);
 }catch(error){console.error('agency growth error',error);return json({detail:error?.message||'Agency Command could not complete this request.'},500)}
}

import {INTEGRATIONS,currentUser,decrypt,ensureIntegrationTables,shopeeSign} from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const WRITE_ACTIONS=new Set(['publish_post','publish_media','send_message','manage_product','create_campaign']);

async function ensureAssistantTables(env){
  await ensureIntegrationTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_permissions (
    tenant_id TEXT NOT NULL, provider TEXT NOT NULL, can_read INTEGER NOT NULL DEFAULT 1, can_write INTEGER NOT NULL DEFAULT 1,
    require_confirmation INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL,
    PRIMARY KEY(tenant_id,provider)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_actions (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, provider TEXT NOT NULL, external_account_id TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL, status TEXT NOT NULL, requires_confirmation INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL DEFAULT '{}', result_json TEXT NOT NULL DEFAULT '{}', error_text TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, provider TEXT NOT NULL,
    action TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
  )`).run();
}
function parseJson(v,fallback={}){try{return JSON.parse(v||'{}')}catch{return fallback}}
function providerDef(id){return INTEGRATIONS.find(x=>x.id===id)}
async function permission(env,tenantId,provider){
  const row=await env.DB.prepare('SELECT can_read,can_write,require_confirmation FROM assistant_permissions WHERE tenant_id=? AND provider=?').bind(tenantId,provider).first();
  return row?{can_read:!!row.can_read,can_write:!!row.can_write,require_confirmation:!!row.require_confirmation}:{can_read:true,can_write:true,require_confirmation:true};
}
async function connection(env,tenantId,provider,external=''){
  const row=external
    ?await env.DB.prepare('SELECT * FROM integrations WHERE tenant_id=? AND provider=? AND external_account_id=? ORDER BY updated_at DESC LIMIT 1').bind(tenantId,provider,external).first()
    :await env.DB.prepare('SELECT * FROM integrations WHERE tenant_id=? AND provider=? ORDER BY updated_at DESC LIMIT 1').bind(tenantId,provider).first();
  if(!row)return null;
  return {...row,access_token:await decrypt(row.access_token,env),refresh_token:await decrypt(row.refresh_token,env),metadata:parseJson(row.metadata_json)};
}
async function logActivity(env,user,provider,action,status,detail=''){
  await env.DB.prepare('INSERT INTO assistant_activity(tenant_id,user_id,provider,action,status,detail,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(user.tenant_id,user.id,provider,action,status,String(detail||'').slice(0,1000),now()).run();
}
async function providerFetch(url,options={}){
  const r=await fetch(url,options),text=await r.text();let d;try{d=JSON.parse(text)}catch{d={raw:text}};
  if(!r.ok||d?.error)throw new Error(d?.error?.message||d?.message||`Provider request failed (${r.status})`);return d;
}
async function shopifyGraph(conn,query,variables={}){
  const shop=String(conn.metadata.shop_domain||conn.external_account_id||'').replace(/^https?:\/\//,'').replace(/\/$/,'');
  if(!shop)throw new Error('Shopify store domain is missing from this connection.');
  return providerFetch(`https://${shop}/admin/api/2026-07/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':conn.access_token},body:JSON.stringify({query,variables})});
}
async function shopeeGet(env,conn,path,params={}){
  const shopId=String(conn.metadata.shop_id||conn.external_account_id||'');if(!shopId)throw new Error('Shopee shop ID is missing.');
  const ts=now(),sign=await shopeeSign(env,path,ts,conn.access_token,shopId);const u=new URL(`https://partner.shopeemobile.com${path}`);
  u.searchParams.set('partner_id',String(env.SHOPEE_PARTNER_ID));u.searchParams.set('timestamp',String(ts));u.searchParams.set('access_token',conn.access_token);u.searchParams.set('shop_id',shopId);u.searchParams.set('sign',sign);
  Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));return providerFetch(u.toString());
}
async function execute(env,user,provider,action,payload,external=''){
  const conn=await connection(env,user.tenant_id,provider,external);if(!conn)throw new Error(`Connect ${providerDef(provider)?.name||provider} before asking the assistant to use it.`);
  const metaVersion=env.META_GRAPH_VERSION||'v23.0';
  if(provider==='x'){
    if(action==='read_profile')return providerFetch('https://api.x.com/2/users/me',{headers:{Authorization:`Bearer ${conn.access_token}`}});
    if(action==='publish_post'){
      const text=String(payload.text||'').trim();if(!text)throw new Error('Post text is required.');
      return providerFetch('https://api.x.com/2/tweets',{method:'POST',headers:{Authorization:`Bearer ${conn.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({text})});
    }
  }
  if(provider==='facebook'){
    const pageId=conn.external_account_id;
    if(action==='read_engagement')return providerFetch(`https://graph.facebook.com/${metaVersion}/${encodeURIComponent(pageId)}/feed?fields=id,message,created_time,permalink_url&limit=20&access_token=${encodeURIComponent(conn.access_token)}`);
    if(action==='publish_post'){
      const message=String(payload.text||payload.message||'').trim();if(!message)throw new Error('Facebook post text is required.');
      return providerFetch(`https://graph.facebook.com/${metaVersion}/${encodeURIComponent(pageId)}/feed`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({message,access_token:conn.access_token})});
    }
  }
  if(provider==='instagram'){
    const igId=conn.external_account_id;
    if(action==='read_profile')return providerFetch(`https://graph.facebook.com/${metaVersion}/${encodeURIComponent(igId)}?fields=id,username,followers_count,media_count&access_token=${encodeURIComponent(conn.access_token)}`);
    if(action==='publish_media'){
      const imageUrl=String(payload.image_url||'').trim(),caption=String(payload.caption||'').trim();if(!imageUrl)throw new Error('A public image URL is required for Instagram publishing.');
      const created=await providerFetch(`https://graph.facebook.com/${metaVersion}/${encodeURIComponent(igId)}/media`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({image_url:imageUrl,caption,access_token:conn.access_token})});
      return providerFetch(`https://graph.facebook.com/${metaVersion}/${encodeURIComponent(igId)}/media_publish`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({creation_id:String(created.id),access_token:conn.access_token})});
    }
  }
  if(provider==='whatsapp'&&action==='send_message'){
    const phoneNumberId=String(payload.phone_number_id||conn.metadata.phone_number_id||'').trim(),to=String(payload.to||'').trim(),text=String(payload.text||'').trim();
    if(!phoneNumberId||!to||!text)throw new Error('WhatsApp needs phone_number_id, recipient number, and message text.');
    return providerFetch(`https://graph.facebook.com/${metaVersion}/${encodeURIComponent(phoneNumberId)}/messages`,{method:'POST',headers:{Authorization:`Bearer ${conn.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body:text}})});
  }
  if(provider==='shopify'){
    if(action==='read_products')return shopifyGraph(conn,'query { products(first:20, sortKey:UPDATED_AT, reverse:true) { nodes { id title status updatedAt handle } } }');
    if(action==='read_orders')return shopifyGraph(conn,'query { orders(first:20, sortKey:CREATED_AT, reverse:true) { nodes { id name createdAt displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } } } }');
    if(action==='read_customers')return shopifyGraph(conn,'query { customers(first:20, sortKey:UPDATED_AT, reverse:true) { nodes { id displayName email phone updatedAt } } }');
  }
  if(provider==='shopee'){
    if(action==='read_products')return shopeeGet(env,conn,'/api/v2/product/get_item_list',{offset:0,page_size:20,item_status:'NORMAL'});
    if(action==='read_orders')return shopeeGet(env,conn,'/api/v2/order/get_order_list',{time_range_field:'create_time',time_from:now()-1209600,time_to:now(),page_size:20,response_optional_fields:'order_status'});
  }
  if(provider==='snapchat'){
    if(action==='read_profile'||action==='read_ad_accounts')return providerFetch('https://adsapi.snapchat.com/v1/me',{headers:{Authorization:`Bearer ${conn.access_token}`}});
  }
  throw new Error(`${providerDef(provider)?.name||provider} does not expose the assistant action “${action}” in this release.`);
}
async function runAction(env,user,row){
  const payload=parseJson(row.payload_json);try{
    await env.DB.prepare("UPDATE assistant_actions SET status='running',updated_at=? WHERE id=? AND tenant_id=?").bind(now(),row.id,user.tenant_id).run();
    const result=await execute(env,user,row.provider,row.action,payload,row.external_account_id);
    await env.DB.prepare("UPDATE assistant_actions SET status='completed',result_json=?,error_text='',updated_at=? WHERE id=? AND tenant_id=?").bind(JSON.stringify(result||{}).slice(0,100000),now(),row.id,user.tenant_id).run();
    await logActivity(env,user,row.provider,row.action,'completed','Assistant action completed.');return {ok:true,status:'completed',result};
  }catch(e){
    await env.DB.prepare("UPDATE assistant_actions SET status='failed',error_text=?,updated_at=? WHERE id=? AND tenant_id=?").bind(String(e?.message||e).slice(0,1000),now(),row.id,user.tenant_id).run();
    await logActivity(env,user,row.provider,row.action,'failed',e?.message||'Provider action failed.');throw e;
  }
}

export async function handleAssistantIntegrations(request,env){
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/assistant-integrations'))return null;
  try{
    if(!env?.DB)return json({error:'Assistant integration database is not configured.'},503);await ensureAssistantTables(env);
    const user=await currentUser(request,env);if(!user)return json({error:'Sign in to use connected-account assistance.'},401);
    if(request.method==='GET'&&url.pathname==='/api/assistant-integrations/context'){
      const {results:rows=[]}=await env.DB.prepare('SELECT provider,external_account_id,display_name,token_expires_at FROM integrations WHERE tenant_id=? ORDER BY provider,updated_at DESC').bind(user.tenant_id).all();
      const providers=[];for(const def of INTEGRATIONS){const p=await permission(env,user.tenant_id,def.id);providers.push({id:def.id,name:def.name,category:def.category,capabilities:def.capabilities||[],permission:p,connections:rows.filter(r=>r.provider===def.id)})}
      const {results:activity=[]}=await env.DB.prepare('SELECT provider,action,status,detail,created_at FROM assistant_activity WHERE tenant_id=? ORDER BY id DESC LIMIT 20').bind(user.tenant_id).all();
      return json({tenant_id:user.tenant_id,providers,activity});
    }
    const pm=url.pathname.match(/^\/api\/assistant-integrations\/permissions\/([^/]+)$/);
    if(pm&&request.method==='PUT'){
      const def=providerDef(pm[1]);if(!def)return json({error:'Unknown provider.'},404);const b=await request.json();const ts=now();
      await env.DB.prepare(`INSERT INTO assistant_permissions(tenant_id,provider,can_read,can_write,require_confirmation,updated_at) VALUES(?,?,?,?,?,?)
        ON CONFLICT(tenant_id,provider) DO UPDATE SET can_read=excluded.can_read,can_write=excluded.can_write,require_confirmation=excluded.require_confirmation,updated_at=excluded.updated_at`)
        .bind(user.tenant_id,def.id,b.can_read===false?0:1,b.can_write===false?0:1,b.require_confirmation===false?0:1,ts).run();
      return json({ok:true,permission:await permission(env,user.tenant_id,def.id)});
    }
    if(request.method==='GET'&&url.pathname==='/api/assistant-integrations/actions'){
      const {results=[]}=await env.DB.prepare('SELECT id,provider,external_account_id,action,status,requires_confirmation,payload_json,result_json,error_text,created_at,updated_at FROM assistant_actions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 50').bind(user.tenant_id).all();
      return json({actions:results.map(r=>({...r,payload:parseJson(r.payload_json),result:parseJson(r.result_json)}))});
    }
    if(request.method==='POST'&&url.pathname==='/api/assistant-integrations/actions'){
      const b=await request.json(),provider=String(b.provider||''),action=String(b.action||''),def=providerDef(provider);if(!def)return json({error:'Unknown provider.'},404);if(!(def.capabilities||[]).includes(action))return json({error:`${def.name} does not advertise the ${action} capability.`},400);
      const conn=await connection(env,user.tenant_id,provider,String(b.external_account_id||''));if(!conn)return json({error:`Connect ${def.name} first.`},409);const perms=await permission(env,user.tenant_id,provider),isWrite=WRITE_ACTIONS.has(action);
      if(isWrite&&!perms.can_write)return json({error:`AI write access is disabled for ${def.name}.`},403);if(!isWrite&&!perms.can_read)return json({error:`AI read access is disabled for ${def.name}.`},403);
      const requires=isWrite&&perms.require_confirmation&&b.confirm!==true,id=crypto.randomUUID(),ts=now();
      await env.DB.prepare('INSERT INTO assistant_actions(id,tenant_id,user_id,provider,external_account_id,action,status,requires_confirmation,payload_json,result_json,error_text,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id,user.tenant_id,user.id,provider,conn.external_account_id,action,requires?'needs_confirmation':'queued',requires?1:0,JSON.stringify(b.payload||{}),'{}','',ts,ts).run();
      await logActivity(env,user,provider,action,requires?'needs_confirmation':'queued',requires?'Waiting for user approval.':'Queued by the assistant.');
      if(requires)return json({ok:true,id,status:'needs_confirmation',message:'This write action is ready and waiting for your approval.'},202);
      const row=await env.DB.prepare('SELECT * FROM assistant_actions WHERE id=? AND tenant_id=?').bind(id,user.tenant_id).first();return json({id,...await runAction(env,user,row)});
    }
    const confirm=url.pathname.match(/^\/api\/assistant-integrations\/actions\/([^/]+)\/confirm$/);
    if(confirm&&request.method==='POST'){
      const row=await env.DB.prepare('SELECT * FROM assistant_actions WHERE id=? AND tenant_id=?').bind(confirm[1],user.tenant_id).first();if(!row)return json({error:'Assistant action not found.'},404);if(row.status!=='needs_confirmation')return json({error:`Action is already ${row.status}.`},409);
      await env.DB.prepare("UPDATE assistant_actions SET status='queued',requires_confirmation=0,updated_at=? WHERE id=? AND tenant_id=?").bind(now(),row.id,user.tenant_id).run();return json({id:row.id,...await runAction(env,user,{...row,status:'queued',requires_confirmation:0})});
    }
    return json({error:'Assistant integration endpoint not found.'},404);
  }catch(e){console.error('assistant integrations error',e);return json({error:e?.message||'Assistant integration service error.'},500)}
}

import app from './index.js';
import { handleLeadPhone } from './lead-phone.js';
import { handleIntegrations } from './integrations.js';
import { handleSponsoredAds } from './sponsored-ad-runtime.js';

const CRM_TABLES=['crm_contacts','crm_activities','crm_opportunities'];
async function hashPassword(password,salt){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}:${password}`));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function repairLegacySchema(env){
  if(!env?.DB)return;
  const base=[
    `CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,owner_user_id TEXT,created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,UNIQUE(tenant_id,email))`,
    `CREATE TABLE IF NOT EXISTS crm_contacts (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,first_name TEXT NOT NULL,last_name TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',company TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'lead',source TEXT NOT NULL DEFAULT '',tags TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS crm_activities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER NOT NULL,type TEXT NOT NULL DEFAULT 'note',title TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',due_at INTEGER,completed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS crm_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER,name TEXT NOT NULL,stage TEXT NOT NULL DEFAULT 'new',value REAL NOT NULL DEFAULT 0,probability REAL NOT NULL DEFAULT 0,expected_close_at INTEGER,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
  ];
  for(const sql of base){try{await env.DB.prepare(sql).run()}catch(e){}}
  const cols=[['tenant_id','TEXT'],['name',"TEXT NOT NULL DEFAULT 'User'"],['password_salt',"TEXT NOT NULL DEFAULT ''"],['active','INTEGER NOT NULL DEFAULT 1']];
  for(const [c,d] of cols){try{await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${c} ${d}`).run()}catch(e){}}
  for(const t of CRM_TABLES){try{await env.DB.prepare(`ALTER TABLE ${t} ADD COLUMN tenant_id TEXT`).run()}catch(e){}}

  let ownerTenant=await env.DB.prepare('SELECT id FROM tenants WHERE slug=?').bind('owner').first();
  if(!ownerTenant){
    const id=crypto.randomUUID();
    try{
      await env.DB.prepare('INSERT INTO tenants(id,name,slug,created_at) VALUES(?,?,?,?)').bind(id,'I AM Magnanimous','owner',Math.floor(Date.now()/1000)).run();
      ownerTenant={id};
    }catch(e){
      ownerTenant=await env.DB.prepare('SELECT id FROM tenants WHERE slug=?').bind('owner').first();
    }
  }
  if(!ownerTenant?.id)return;

  try{await env.DB.prepare("UPDATE users SET tenant_id=? WHERE tenant_id IS NULL OR tenant_id=''").bind(ownerTenant.id).run()}catch(e){}
  for(const t of CRM_TABLES){try{await env.DB.prepare(`UPDATE ${t} SET tenant_id=? WHERE tenant_id IS NULL OR tenant_id=''`).bind(ownerTenant.id).run()}catch(e){}}

  // Bootstrap the configured owner only when no owner account exists. On normal
  // requests, never rotate or overwrite an existing password hash. Only repair
  // the tenant/role link needed by legacy records.
  if(env.ADMIN_EMAIL&&env.ADMIN_PASSWORD){
    const email=String(env.ADMIN_EMAIL).trim().toLowerCase();
    let owner=await env.DB.prepare('SELECT id,tenant_id,role FROM users WHERE email=? ORDER BY created_at ASC LIMIT 1').bind(email).first();
    if(!owner){
      const salt=crypto.randomUUID(),passwordHash=await hashPassword(env.ADMIN_PASSWORD,salt),uid=crypto.randomUUID();
      await env.DB.prepare('INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(uid,ownerTenant.id,'Owner',email,'owner',passwordHash,salt,1,Math.floor(Date.now()/1000)).run();
      owner={id:uid,tenant_id:ownerTenant.id,role:'owner'};
    }else if(owner.tenant_id!==ownerTenant.id||owner.role!=='owner'){
      await env.DB.prepare("UPDATE users SET tenant_id=?,name=?,role='owner',active=1 WHERE id=?").bind(ownerTenant.id,'Owner',owner.id).run();
      owner={...owner,tenant_id:ownerTenant.id,role:'owner'};
    }
    await env.DB.prepare('UPDATE tenants SET owner_user_id=? WHERE id=?').bind(owner.id,ownerTenant.id).run();
  }
}

export default {
  async fetch(request,env,ctx){
    await repairLegacySchema(env);
    const sponsored=await handleSponsoredAds(request,env);
    if(sponsored)return sponsored;
    const integration=await handleIntegrations(request,env);
    if(integration)return integration;
    const feature=await handleLeadPhone(request,env);
    if(feature)return feature;
    return app.fetch(request,env,ctx);
  }
};

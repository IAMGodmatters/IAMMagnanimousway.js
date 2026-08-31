import app from './index.js';

const CRM_TABLES = ['crm_contacts', 'crm_activities', 'crm_opportunities'];

async function hashPassword(password, salt) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function repairLegacySchema(env) {
  if (!env?.DB) return;

  const baseTables = [
    `CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,owner_user_id TEXT,created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,UNIQUE(tenant_id,email))`,
    `CREATE TABLE IF NOT EXISTS crm_contacts (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,first_name TEXT NOT NULL,last_name TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',company TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'lead',source TEXT NOT NULL DEFAULT '',tags TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS crm_activities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER NOT NULL,type TEXT NOT NULL DEFAULT 'note',title TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',due_at INTEGER,completed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS crm_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER,name TEXT NOT NULL,stage TEXT NOT NULL DEFAULT 'new',value REAL NOT NULL DEFAULT 0,probability REAL NOT NULL DEFAULT 0,expected_close_at INTEGER,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
  ];
  for (const sql of baseTables) { try { await env.DB.prepare(sql).run(); } catch (e) {} }

  const userColumns = [
    ['tenant_id', 'TEXT'], ['name', "TEXT NOT NULL DEFAULT 'User'"],
    ['password_salt', "TEXT NOT NULL DEFAULT ''"], ['active', 'INTEGER NOT NULL DEFAULT 1']
  ];
  for (const [column, definition] of userColumns) {
    try { await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${column} ${definition}`).run(); } catch (e) {}
  }
  for (const table of CRM_TABLES) {
    try { await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT`).run(); } catch (e) {}
  }

  let ownerTenant = await env.DB.prepare('SELECT id FROM tenants WHERE slug=?').bind('owner').first();
  if (!ownerTenant) {
    const tenantId = crypto.randomUUID();
    try {
      await env.DB.prepare('INSERT INTO tenants(id,name,slug,created_at) VALUES(?,?,?,?)')
        .bind(tenantId, 'I AM Magnanimous', 'owner', Math.floor(Date.now() / 1000)).run();
      ownerTenant = { id: tenantId };
    } catch (e) {
      ownerTenant = await env.DB.prepare('SELECT id FROM tenants WHERE slug=?').bind('owner').first();
    }
  }
  if (!ownerTenant?.id) return;

  try { await env.DB.prepare("UPDATE users SET tenant_id=? WHERE tenant_id IS NULL OR tenant_id=''").bind(ownerTenant.id).run(); } catch (e) {}
  for (const table of CRM_TABLES) {
    try { await env.DB.prepare(`UPDATE ${table} SET tenant_id=? WHERE tenant_id IS NULL OR tenant_id=''`).bind(ownerTenant.id).run(); } catch (e) {}
  }

  // Always repair the configured platform owner. Older deployments could
  // leave the account in a legacy tenant or omit it entirely, which caused
  // the admin endpoint to return "Owner access required" after login.
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const email = String(env.ADMIN_EMAIL).trim().toLowerCase();
    let owner = await env.DB.prepare(
      'SELECT id,tenant_id FROM users WHERE email=? ORDER BY CASE WHEN tenant_id=? THEN 0 ELSE 1 END, created_at ASC LIMIT 1'
    ).bind(email, ownerTenant.id).first();

    if (!owner) {
      const uid = crypto.randomUUID();
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(env.ADMIN_PASSWORD, salt);
      await env.DB.prepare(
        'INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)'
      ).bind(uid, ownerTenant.id, 'Owner', email, 'owner', passwordHash, salt, 1, Math.floor(Date.now() / 1000)).run();
      owner = { id: uid, tenant_id: ownerTenant.id };
    } else {
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(env.ADMIN_PASSWORD, salt);
      await env.DB.prepare(
        'UPDATE users SET tenant_id=?,name=?,role=?,password_hash=?,password_salt=?,active=1 WHERE id=?'
      ).bind(ownerTenant.id, 'Owner', 'owner', passwordHash, salt, owner.id).run();
    }

    await env.DB.prepare('UPDATE tenants SET owner_user_id=? WHERE id=?').bind(owner.id, ownerTenant.id).run();
  }
}

export default {
  async fetch(request, env, ctx) {
    await repairLegacySchema(env);
    return app.fetch(request, env, ctx);
  }
};

import app from './index.js';

const CRM_TABLES = ['crm_contacts', 'crm_activities', 'crm_opportunities'];

async function repairLegacySchema(env) {
  if (!env?.DB) return;

  // Ensure the tables exist before attempting ALTER/SELECT operations. This is
  // important for older databases where migrations were not applied.
  const baseTables = [
    `CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,owner_user_id TEXT,created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,UNIQUE(tenant_id,email))`,
    `CREATE TABLE IF NOT EXISTS crm_contacts (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,first_name TEXT NOT NULL,last_name TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',company TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'lead',source TEXT NOT NULL DEFAULT '',tags TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS crm_activities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER NOT NULL,type TEXT NOT NULL DEFAULT 'note',title TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',due_at INTEGER,completed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS crm_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER,name TEXT NOT NULL,stage TEXT NOT NULL DEFAULT 'new',value REAL NOT NULL DEFAULT 0,probability REAL NOT NULL DEFAULT 0,expected_close_at INTEGER,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
  ];
  for (const sql of baseTables) {
    try { await env.DB.prepare(sql).run(); } catch (e) {}
  }

  // Older deployments created users without the multi-tenant fields.
  // CREATE TABLE IF NOT EXISTS never changes an existing SQLite table, so add
  // the fields explicitly when they are missing.
  const userColumns = [
    ['tenant_id', 'TEXT'],
    ['name', "TEXT NOT NULL DEFAULT 'User'"],
    ['password_salt', "TEXT NOT NULL DEFAULT ''"],
    ['active', 'INTEGER NOT NULL DEFAULT 1']
  ];
  for (const [column, definition] of userColumns) {
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${column} ${definition}`).run();
    } catch (e) {}
  }

  // The CRM tables also need tenant isolation on legacy databases.
  for (const table of CRM_TABLES) {
    try {
      await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT`).run();
    } catch (e) {}
  }

  // Create/find the owner's tenant so existing private data stays private.
  let ownerTenant = await env.DB.prepare(
    'SELECT id FROM tenants WHERE slug=?'
  ).bind('owner').first();

  if (!ownerTenant) {
    const tenantId = crypto.randomUUID();
    try {
      await env.DB.prepare(
        'INSERT INTO tenants(id,name,slug,created_at) VALUES(?,?,?,?)'
      ).bind(tenantId, 'I AM Magnanimous', 'owner', Math.floor(Date.now() / 1000)).run();
      ownerTenant = { id: tenantId };
    } catch (e) {
      ownerTenant = await env.DB.prepare(
        'SELECT id FROM tenants WHERE slug=?'
      ).bind('owner').first();
    }
  }

  if (!ownerTenant?.id) return;

  // Attach all existing legacy records to the owner's workspace. New users
  // receive their own tenant through the signup flow in index.js.
  try {
    await env.DB.prepare(
      'UPDATE users SET tenant_id=? WHERE tenant_id IS NULL OR tenant_id=\'\''
    ).bind(ownerTenant.id).run();
  } catch (e) {}

  for (const table of CRM_TABLES) {
    try {
      await env.DB.prepare(`UPDATE ${table} SET tenant_id=? WHERE tenant_id IS NULL OR tenant_id=''`)
        .bind(ownerTenant.id).run();
    } catch (e) {}
  }

  // Upgrade the existing owner account to the current password format when
  // credentials are configured. The plaintext password is never stored.
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const email = String(env.ADMIN_EMAIL).trim().toLowerCase();
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email=? AND tenant_id=?'
    ).bind(email, ownerTenant.id).first();

    if (existing) {
      const salt = crypto.randomUUID();
      const bytes = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${salt}:${env.ADMIN_PASSWORD}`)
      );
      const passwordHash = [...new Uint8Array(bytes)]
        .map(x => x.toString(16).padStart(2, '0')).join('');
      await env.DB.prepare(
        'UPDATE users SET name=?, role=?, password_hash=?, password_salt=?, active=1 WHERE id=?'
      ).bind('Owner', 'owner', passwordHash, salt, existing.id).run();
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    await repairLegacySchema(env);
    return app.fetch(request, env, ctx);
  }
};

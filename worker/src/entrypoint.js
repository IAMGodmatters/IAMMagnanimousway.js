import app from './index.js';

const CRM_TABLES = ['crm_contacts', 'crm_activities', 'crm_opportunities'];

async function repairLegacySchema(env) {
  if (!env?.DB) return;

  // Older deployments created a users table without the multi-tenant fields.
  // SQLite's CREATE TABLE IF NOT EXISTS does not upgrade an existing table, so
  // add the missing columns before index.js runs its tenant-aware queries.
  const userColumns = [
    ['tenant_id', 'TEXT'],
    ['name', "TEXT NOT NULL DEFAULT 'User'"],
    ['password_salt', "TEXT NOT NULL DEFAULT ''"],
    ['active', 'INTEGER NOT NULL DEFAULT 1']
  ];
  for (const [column, definition] of userColumns) {
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${column} ${definition}`).run();
    } catch (e) {
      // Column already exists, or the legacy users table has not been created yet.
    }
  }

  // The CRM tables also need tenant isolation on legacy databases.
  for (const table of CRM_TABLES) {
    try {
      await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT`).run();
    } catch (e) {
      // Column already exists, or the table does not exist yet.
    }
  }

  // Create/find the owner's tenant so legacy rows can be safely attached to
  // the existing private workspace. index.js will also initialize this tenant.
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

  // Keep existing legacy data in the owner's workspace rather than exposing it
  // to every tenant or losing it during the schema transition.
  try {
    await env.DB.prepare(
      'UPDATE users SET tenant_id=? WHERE tenant_id IS NULL'
    ).bind(ownerTenant.id).run();
  } catch (e) {}

  for (const table of CRM_TABLES) {
    try {
      await env.DB.prepare(`UPDATE ${table} SET tenant_id=? WHERE tenant_id IS NULL`)
        .bind(ownerTenant.id).run();
    } catch (e) {}
  }

  // If the owner account already existed in the legacy schema, upgrade it to
  // the new password format using the configured ADMIN_PASSWORD. This keeps
  // the existing account usable without exposing or storing the plaintext
  // password in the database.
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

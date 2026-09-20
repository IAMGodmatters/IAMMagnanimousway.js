import fs from 'node:fs';
import path from 'node:path';

function migrationFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /^\d+.*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function ensureLegacyBootstrap(binding) {
  // This repository's checked-in migration history starts after the original
  // single-tenant auth bootstrap. Recreate only that pre-migration baseline
  // so historical repair migrations can replay exactly as they did in production.
  binding.db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member',
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crm_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'lead',
      source TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crm_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT,
      contact_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'note',
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      due_at INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crm_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT,
      contact_id INTEGER,
      name TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'new',
      value REAL NOT NULL DEFAULT 0,
      probability REAL NOT NULL DEFAULT 0,
      expected_close_at INTEGER,
      notes TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY(tenant_id,key)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'Sponsored',
      placement TEXT NOT NULL DEFAULT 'home',
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);
}

export function applyMagnanimousMigrations(binding, migrationsDir) {
  const dir = path.resolve(migrationsDir);

  ensureLegacyBootstrap(binding);

  binding.db.exec(
    'CREATE TABLE IF NOT EXISTS magnanimous_runtime_migrations (' +
    'name TEXT PRIMARY KEY,' +
    'applied_at INTEGER NOT NULL' +
    ')'
  );

  const known = new Set(
    binding.db.prepare('SELECT name FROM magnanimous_runtime_migrations').all().map((row) => String(row.name))
  );

  const applied = [];
  const files = migrationFiles(dir);

  for (const name of files) {
    if (known.has(name)) continue;

    const sql = fs.readFileSync(path.join(dir, name), 'utf8');

    binding.db.exec('BEGIN IMMEDIATE');
    try {
      binding.db.exec(sql);
      binding.db
        .prepare('INSERT INTO magnanimous_runtime_migrations(name,applied_at) VALUES(?,?)')
        .run(name, Math.floor(Date.now() / 1000));
      binding.db.exec('COMMIT');
      applied.push(name);
    } catch (error) {
      try { binding.db.exec('ROLLBACK'); } catch {}
      error.message = 'Magnanimous migration ' + name + ' failed: ' + error.message;
      throw error;
    }
  }

  return { applied, total: files.length };
}

import fs from 'node:fs';
import path from 'node:path';

function migrationFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /^\d+.*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function applyMagnanimousMigrations(binding, migrationsDir) {
  const dir = path.resolve(migrationsDir);

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

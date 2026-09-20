import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { openMagnanimousDb } from '../src/d1-compat.mjs';
import { applyMagnanimousMigrations } from '../src/migrations.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'magnanimous-runtime-'));
const db = openMagnanimousDb(path.join(dir, 'test.sqlite'));

try {
  const result = applyMagnanimousMigrations(db, path.join(root, 'worker/migrations'));
  assert.ok(result.total > 50, 'expected full migration set, got ' + result.total);

  await db.prepare(
    'CREATE TABLE IF NOT EXISTS runtime_compat_test(' +
    'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
    'name TEXT NOT NULL)'
  ).run();

  const insert = await db
    .prepare('INSERT INTO runtime_compat_test(name) VALUES(?)')
    .bind('Magnanimous')
    .run();

  assert.equal(insert.success, true);
  assert.equal(insert.meta.changes, 1);

  const first = await db
    .prepare('SELECT id,name FROM runtime_compat_test WHERE name=?')
    .bind('Magnanimous')
    .first();

  assert.equal(first.name, 'Magnanimous');

  const all = await db
    .prepare('SELECT id,name FROM runtime_compat_test')
    .all();

  assert.equal(all.results.length, 1);

  await db.batch([
    db
      .prepare('UPDATE runtime_compat_test SET name=? WHERE id=?')
      .bind('Magnanimous AI', first.id),
    db
      .prepare('INSERT INTO runtime_compat_test(name) VALUES(?)')
      .bind('Magnanimous Runtime')
  ]);

  const count = await db
    .prepare('SELECT COUNT(*) count FROM runtime_compat_test')
    .first();

  assert.equal(Number(count.count), 2);

  console.log(
    'Magnanimous standalone SQL compatibility verified across ' +
    result.total +
    ' migrations.'
  );
} finally {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

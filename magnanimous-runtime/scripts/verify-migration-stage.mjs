import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

import { stageD1SqlExport } from '../src/migration-stage.mjs';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'magnanimous-migration-stage-'));
try {
  const sql = `
    CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT NOT NULL);
    INSERT INTO users(id,email) VALUES('u1','one@example.test'),('u2','two@example.test');
    CREATE TABLE jobs(id INTEGER PRIMARY KEY, state TEXT NOT NULL);
    INSERT INTO jobs(state) VALUES('ready');
  `;
  const target = path.join(root, 'production.sqlite');
  const result = await stageD1SqlExport(sql, {
    migrationRoot: root,
    targetPath: target,
    source: {
      repository: 'IAMGodmatters/IAMMagnanimousway.js',
      ref: 'refs/heads/main',
      sha: 'verification',
      workflow_ref: 'IAMGodmatters/IAMMagnanimousway.js/.github/workflows/magnanimous-production-data-stage.yml@refs/heads/main'
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.integrity, 'ok');
  assert.equal(result.table_count, 2);
  assert.deepEqual(result.table_counts, { jobs: 1, users: 2 });
  assert.ok(result.sql_sha256);
  assert.ok(result.sqlite_sha256);
  assert.ok(result.schema_sha256);
  assert.equal((await fs.stat(target)).isFile(), true);
  assert.equal((await fs.stat(target + '.stage.json')).isFile(), true);

  await assert.rejects(
    () => stageD1SqlExport('CREATE TABLE x(id INTEGER);', {
      migrationRoot: root,
      targetPath: path.join(root, '..', 'escape.sqlite')
    }),
    /inside the configured migration root/
  );

  console.log('Magnanimous production data staging verification PASS');
} finally {
  await fs.rm(root, { recursive: true, force: true });
}

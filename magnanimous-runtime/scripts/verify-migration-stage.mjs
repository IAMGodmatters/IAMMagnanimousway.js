import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { stageD1SqlExport, stageD1SqliteSnapshot } from '../src/migration-stage.mjs';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'magnanimous-migration-stage-'));
try {
  const sql = `
    CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT NOT NULL);
    INSERT INTO users(id,email) VALUES('u1','one@example.test'),('u2','two@example.test');
    CREATE TABLE jobs(id INTEGER PRIMARY KEY, state TEXT NOT NULL);
    INSERT INTO jobs(state) VALUES('ready');
  `;
  const legacyTarget = path.join(root, 'legacy.sqlite');
  const legacy = await stageD1SqlExport(sql, {
    migrationRoot: root,
    targetPath: legacyTarget,
    source: {
      repository: 'IAMGodmatters/IAMMagnanimousway.js',
      ref: 'refs/heads/main',
      sha: 'verification',
      workflow_ref: 'IAMGodmatters/IAMMagnanimousway.js/.github/workflows/magnanimous-production-data-stage.yml@refs/heads/main'
    }
  });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.integrity, 'ok');
  assert.equal(legacy.foreign_key_violations, 0);
  assert.equal(legacy.table_count, 2);
  assert.deepEqual(legacy.table_counts, { jobs: 1, users: 2 });
  assert.ok(legacy.sql_sha256);
  assert.ok(legacy.sqlite_sha256);
  assert.ok(legacy.schema_sha256);

  const sourcePath = path.join(root, 'source.sqlite');
  const source = new DatabaseSync(sourcePath);
  source.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE knowledge_chunks(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    INSERT INTO knowledge_chunks(tenant_id,source_id,source_type,title,url,content,created_at)
    VALUES('tenant-1',7,'manual','Hello','https://example.test','FTS content',1);
    CREATE VIRTUAL TABLE knowledge_fts USING fts5(
      title, content, url UNINDEXED, tenant_id UNINDEXED, source_id UNINDEXED, chunk_id UNINDEXED, source_type UNINDEXED
    );
    INSERT INTO knowledge_fts(title,content,url,tenant_id,source_id,chunk_id,source_type)
    SELECT title,content,url,tenant_id,CAST(source_id AS TEXT),CAST(id AS TEXT),source_type FROM knowledge_chunks;
  `);
  source.close();

  const target = path.join(root, 'production.sqlite');
  const snapshot = await stageD1SqliteSnapshot(await fs.readFile(sourcePath), {
    migrationRoot: root,
    targetPath: target,
    source: {
      repository: 'IAMGodmatters/IAMMagnanimousway.js',
      ref: 'refs/heads/main',
      sha: 'verification-sqlite',
      workflow_ref: 'IAMGodmatters/IAMMagnanimousway.js/.github/workflows/magnanimous-production-data-stage.yml@refs/heads/main'
    }
  });

  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.integrity, 'ok');
  assert.equal(snapshot.foreign_key_violations, 0);
  assert.equal(snapshot.table_count, 2);
  assert.deepEqual(snapshot.table_counts, { knowledge_chunks: 1, knowledge_fts: 1 });
  assert.ok(snapshot.sqlite_sha256);
  assert.ok(snapshot.schema_sha256);
  assert.equal((await fs.stat(target)).isFile(), true);
  assert.equal((await fs.stat(target + '.stage.json')).isFile(), true);

  await assert.rejects(
    () => stageD1SqliteSnapshot(Buffer.from('not-a-database'), {
      migrationRoot: root,
      targetPath: path.join(root, '..', 'escape.sqlite')
    }),
    /inside the configured migration root/
  );

  console.log('Magnanimous production data staging verification PASS');
} finally {
  await fs.rm(root, { recursive: true, force: true });
}

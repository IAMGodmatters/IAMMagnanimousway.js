import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { stageD1SqlExport, stageD1SqliteSnapshot, stageCredentialVaultRewrap } from '../src/migration-stage.mjs';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'magnanimous-migration-stage-'));

async function encryptCredential(value,source){
  const digest=crypto.createHash('sha256').update('iam-platform-credentials-v1:'+source).digest();
  const key=await crypto.webcrypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt']);
  const iv=crypto.randomBytes(12);
  const cipher=Buffer.from(await crypto.webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,Buffer.from(value)));
  return 'enc1.'+iv.toString('base64')+'.'+cipher.toString('base64');
}
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
    CREATE TABLE platform_credentials(
      credential_key TEXT PRIMARY KEY,
      encrypted_value TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT NOT NULL DEFAULT ''
    );
    INSERT INTO platform_credentials(credential_key,encrypted_value,updated_at,updated_by)
    VALUES('TWILIO_AUTH_TOKEN','enc1.b2xk.b2xkLWNpcGhlcg==',1,'owner');
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
  assert.equal(snapshot.table_count, 3);
  assert.deepEqual(snapshot.table_counts, { knowledge_chunks: 1, knowledge_fts: 1, platform_credentials: 1 });
  assert.ok(snapshot.sqlite_sha256);
  assert.ok(snapshot.schema_sha256);
  assert.equal((await fs.stat(target)).isFile(), true);
  assert.equal((await fs.stat(target + '.stage.json')).isFile(), true);

  const secretFile=path.join(root,'runtime-secrets.json');
  const targetKey='verification-target-key-0123456789abcdef0123456789abcdef';
  await fs.writeFile(secretFile,JSON.stringify({INTEGRATION_CREDENTIALS_KEY:targetKey}),{mode:0o600});
  const rewrapped=await encryptCredential('verification-provider-secret',targetKey);

  const queuedTarget=path.join(root,'queued-production.sqlite');
  const queuedResult=await stageCredentialVaultRewrap({
    count:1,
    rows:[{credential_key:'TWILIO_AUTH_TOKEN',encrypted_value:rewrapped,updated_at:1,updated_by:'owner'}]
  },{targetPath:queuedTarget,runtimeSecretsFile:secretFile});
  assert.equal(queuedResult.ok,true);
  assert.equal(queuedResult.pending,true);
  assert.equal(queuedResult.count,1);
  assert.equal((await fs.stat(queuedTarget + '.credential-rewrap.pending.json')).isFile(),true);

  const queuedStage=await stageD1SqliteSnapshot(await fs.readFile(sourcePath),{
    migrationRoot:root,
    targetPath:queuedTarget,
    runtimeSecretsFile:secretFile,
    source:{
      repository:'IAMGodmatters/IAMMagnanimousway.js',
      ref:'refs/heads/main',
      sha:'verification-queued-rewrap',
      workflow_ref:'IAMGodmatters/IAMMagnanimousway.js/.github/workflows/magnanimous-production-data-stage.yml@refs/heads/main'
    }
  });
  assert.equal(queuedStage.ok,true);
  assert.equal(queuedStage.credential_rewrap?.pending_applied,true);
  assert.equal(await fs.access(queuedTarget + '.credential-rewrap.pending.json').then(()=>true,()=>false),false);
  const queuedDb=new DatabaseSync(queuedTarget,{readOnly:true});
  const queuedCredential=queuedDb.prepare('SELECT encrypted_value FROM platform_credentials WHERE credential_key=?').get('TWILIO_AUTH_TOKEN');
  queuedDb.close();
  assert.equal(queuedCredential.encrypted_value,rewrapped);

  const rewrapResult=await stageCredentialVaultRewrap({
    count:1,
    rows:[{credential_key:'TWILIO_AUTH_TOKEN',encrypted_value:rewrapped,updated_at:1,updated_by:'owner'}]
  },{targetPath:target,runtimeSecretsFile:secretFile});
  assert.equal(rewrapResult.ok,true);
  assert.equal(rewrapResult.count,1);
  assert.ok(rewrapResult.ciphertext_sha256);
  const verifyDb=new DatabaseSync(target,{readOnly:true});
  const credential=verifyDb.prepare('SELECT encrypted_value FROM platform_credentials WHERE credential_key=?').get('TWILIO_AUTH_TOKEN');
  verifyDb.close();
  assert.equal(credential.encrypted_value,rewrapped);

  await assert.rejects(
    () => stageCredentialVaultRewrap({
      count:1,
      rows:[{credential_key:'WRONG_KEY',encrypted_value:rewrapped}]
    },{targetPath:target,runtimeSecretsFile:secretFile}),
    /key set does not match/
  );

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

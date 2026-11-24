import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openMagnanimousDb } from '../../magnanimous-runtime/src/d1-compat.mjs';
import { handleMagnanimousVibeStudio } from '../../worker/src/magnanimous-vibe-studio.js';

globalThis.crypto ??= webcrypto;

const secret = 'magnanimous-vibe-studio-runtime-test-secret';
const directory = mkdtempSync(path.join(tmpdir(), 'magnanimous-vibe-studio-'));
const db = openMagnanimousDb(path.join(directory, 'vibe-studio.sqlite'));
const env = {
  DB: db,
  SESSION_SECRET: secret,
  MAGNANIMOUS_DEVELOPER_EMAIL: 'owner@example.test',
};

async function hmacHex(value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  return [...signature].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function ownerToken(userId, tenantId) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const payload = userId + '|' + tenantId + '|owner|' + expires;
  return payload + '|' + await hmacHex(payload);
}

async function call(token, method, route, body) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const request = new Request('https://magnanimous.test' + route, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = await handleMagnanimousVibeStudio(request, env);
  assert.ok(response, 'Vibe Studio handler must claim ' + route);
  return { status: response.status, data: await response.json() };
}

async function createProject(token, title) {
  const result = await call(token, 'POST', '/api/magnanimous/vibe-studio/projects', {
    title,
    brief: 'A bounded runtime integration test for Magnanimous Vibe Studio.',
    template: 'landing',
  });
  assert.equal(result.status, 201, 'Owner should be able to create a private prototype.');
  assert.equal(result.data.saved, true);
  assert.equal(result.data.production_published, false);
  return result.data.project;
}

async function createFile(token, projectId, filePath, content) {
  return call(token, 'POST', '/api/magnanimous/vibe-studio/projects/' + projectId + '/files', {
    path: filePath,
    content,
  });
}

try {
  await db.exec(`
    CREATE TABLE users (
      id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (id, tenant_id)
    );
    CREATE TABLE tenants (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      owner_user_id TEXT NOT NULL
    );
    CREATE TABLE billing_subscriptions (
      tenant_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);
  await db.exec(readFileSync('worker/migrations/0109_magnanimous_vibe_studio.sql', 'utf8'));
  await db.exec(readFileSync('worker/migrations/0113_magnanimous_vibe_multifile.sql', 'utf8'));

  await db.batch([
    db.prepare('INSERT INTO users(id,tenant_id,name,email,role,active) VALUES(?,?,?,?,?,1)')
      .bind('owner-user-a', 'owner-tenant-a', 'Owner A', 'owner@example.test', 'owner'),
    db.prepare('INSERT INTO tenants(id,slug,owner_user_id) VALUES(?,?,?)')
      .bind('owner-tenant-a', 'owner', 'owner-user-a'),
    db.prepare('INSERT INTO users(id,tenant_id,name,email,role,active) VALUES(?,?,?,?,?,1)')
      .bind('customer-user-b', 'customer-tenant-b', 'Customer B', 'customer@example.test', 'member'),
    db.prepare('INSERT INTO tenants(id,slug,owner_user_id) VALUES(?,?,?)')
      .bind('customer-tenant-b', 'customer', 'customer-user-b'),
    db.prepare('INSERT INTO billing_subscriptions(tenant_id,plan,status) VALUES(?,?,?)')
      .bind('customer-tenant-b', 'business', 'active'),
  ]);

  const tokenA = await ownerToken('owner-user-a', 'owner-tenant-a');
  const tokenB = await ownerToken('customer-user-b', 'customer-tenant-b');

  const unauthenticated = await call('', 'GET', '/api/magnanimous/vibe-studio/projects');
  assert.equal(unauthenticated.status, 401, 'Unauthenticated requests must fail closed.');

  const project = await createProject(tokenA, 'SQLite-backed Vibe Studio project');
  const root = '/api/magnanimous/vibe-studio/projects/' + project.id;
  const initialCss = 'body { color: #123456; }';
  const created = await createFile(tokenA, project.id, 'src/styles.css', initialCss);
  assert.equal(created.status, 201, 'Nested CSS files should be stored.');
  assert.equal(created.data.file.path, 'src/styles.css');
  assert.equal(created.data.file.revision, 1);
  assert.equal(created.data.production_published, false);

  const listed = await call(tokenA, 'GET', root + '/files');
  assert.equal(listed.status, 200);
  assert.equal(listed.data.files.length, 1);
  assert.equal(listed.data.files[0].content, initialCss);
  assert.equal(listed.data.limits.max_files, 20);

  const history = await call(tokenA, 'GET', root + '/files/src%2Fstyles.css/versions');
  assert.equal(history.status, 200);
  assert.deepEqual(history.data.versions.map((item) => item.revision), [1]);

  const firstUpdate = await call(tokenA, 'PUT', root + '/files/src%2Fstyles.css', {
    content: 'body { color: #abcdef; }',
    expected_revision: 1,
    note: 'Runtime integration update',
  });
  assert.equal(firstUpdate.status, 200, 'A current revision should save.');
  assert.equal(firstUpdate.data.file.revision, 2);
  assert.equal(firstUpdate.data.production_published, false);

  const versionOne = await call(tokenA, 'GET', root + '/files/src%2Fstyles.css/versions/1');
  const versionTwo = await call(tokenA, 'GET', root + '/files/src%2Fstyles.css/versions/2');
  assert.equal(versionOne.data.version.content, initialCss, 'Previous file content must remain immutable.');
  assert.equal(versionTwo.data.version.content, 'body { color: #abcdef; }');

  const staleUpdate = await call(tokenA, 'PUT', root + '/files/src%2Fstyles.css', {
    content: 'body { color: red; }',
    expected_revision: 1,
  });
  assert.equal(staleUpdate.status, 409, 'Stale revisions must not overwrite newer file content.');

  const duplicateFile = await createFile(tokenA, project.id, 'src/styles.css', 'duplicate path');
  assert.equal(duplicateFile.status, 409, 'Duplicate project paths must not replace existing files.');
  const utf8Boundary = await createFile(tokenA, project.id, 'utf8-boundary.md', '😀'.repeat(16_384));
  assert.equal(utf8Boundary.status, 201, 'A file at exactly 65,536 UTF-8 bytes must be accepted.');
  const utf8Overflow = await createFile(tokenA, project.id, 'utf8-overflow.md', '😀'.repeat(16_385));
  assert.equal(utf8Overflow.status, 400, 'Multi-byte content must be measured in UTF-8 bytes, not JavaScript characters.');

  const traversal = await createFile(tokenA, project.id, '../secret.js', 'globalThis.secret = true;');
  assert.equal(traversal.status, 400, 'Path traversal must be rejected.');
  const externalCss = await createFile(tokenA, project.id, 'external.css', '@import url(https://example.test/remote.css);');
  assert.equal(externalCss.status, 400, 'External CSS imports must be rejected.');
  const oversizedFile = await createFile(tokenA, project.id, 'oversized.md', 'x'.repeat(65_537));
  assert.equal(oversizedFile.status, 400, 'Per-file UTF-8 limits must be enforced.');
  const oversizedRequest = await createFile(tokenA, project.id, 'oversized-request.md', 'x'.repeat(524_300));
  assert.equal(oversizedRequest.status, 413, 'Streaming request-size limits must be enforced.');

  const customerRoot = '/api/customer/code-studio/projects/' + project.id;
  const crossTenantProject = await call(tokenB, 'GET', customerRoot);
  assert.equal(crossTenantProject.status, 404, 'An active paid customer tenant must not read another tenant owner project.');
  const crossTenantFiles = await call(tokenB, 'GET', customerRoot + '/files');
  assert.equal(crossTenantFiles.status, 404, 'An active paid customer tenant must not read another tenant file list.');

  const sizeProject = await createProject(tokenA, 'Project byte limit test');
  for (let index = 1; index <= 3; index += 1) {
    const result = await createFile(tokenA, sizeProject.id, 'large-' + index + '.md', 'x'.repeat(65_536));
    assert.equal(result.status, 201, 'A project may store each bounded file while total usage remains below its cap.');
  }
  const totalOverflow = await createFile(tokenA, sizeProject.id, 'large-4.md', 'x'.repeat(65_536));
  assert.equal(totalOverflow.status, 413, 'Combined project source bytes must never exceed 256 KiB.');

  const countProject = await createProject(tokenA, 'Project file count test');
  for (let index = 1; index <= 19; index += 1) {
    const result = await createFile(tokenA, countProject.id, 'file-' + String(index).padStart(2, '0') + '.md', '# ' + index);
    assert.equal(result.status, 201, 'The project must allow its configured auxiliary file count.');
  }
  const countOverflow = await createFile(tokenA, countProject.id, 'file-20.md', '# overflow');
  assert.equal(countOverflow.status, 409, 'The twentieth auxiliary file must be rejected; index.html is the twentieth total file.');

  const deletion = await call(tokenA, 'DELETE', root + '/files/src%2Fstyles.css');
  assert.equal(deletion.status, 405, 'File deletion must remain unavailable so checkpoints are preserved.');

  console.log('Magnanimous Vibe Studio SQLite runtime: PASS — migrations, owner authentication, tenant isolation, nested paths, immutable file revisions, stale-write conflicts, UTF-8/request/project limits, file-count limits, and no-publication safeguards.');
} finally {
  db.close();
  rmSync(directory, { recursive: true, force: true });
}

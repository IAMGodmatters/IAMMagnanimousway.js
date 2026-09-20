import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const GITHUB_OIDC_JWKS = 'https://token.actions.githubusercontent.com/.well-known/jwks';
let jwksCache = { expiresAt: 0, keys: [] };

function b64url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 ? '='.repeat(4 - (normalized.length % 4)) : '';
  return Buffer.from(normalized + pad, 'base64');
}

function decodeJson(value) {
  return JSON.parse(b64url(value).toString('utf8'));
}

function audienceIncludes(claim, expected) {
  return Array.isArray(claim) ? claim.includes(expected) : String(claim || '') === expected;
}

async function oidcKeys() {
  if (jwksCache.expiresAt > Date.now() && jwksCache.keys.length) return jwksCache.keys;
  const response = await fetch(GITHUB_OIDC_JWKS, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('GitHub OIDC signing keys could not be loaded.');
  const body = await response.json();
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  if (!keys.length) throw new Error('GitHub OIDC signing keys were empty.');
  jwksCache = { expiresAt: Date.now() + 3600000, keys };
  return keys;
}

export async function verifyGitHubActionsOidc(token, {
  audience = 'magnanimous-production-data-stage',
  repository = 'IAMGodmatters/IAMMagnanimousway.js',
  ref = 'refs/heads/main',
  workflowFile = '.github/workflows/magnanimous-production-data-stage.yml'
} = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid GitHub OIDC token.');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJson(encodedHeader);
  const claims = decodeJson(encodedPayload);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported GitHub OIDC token signature.');

  const keys = await oidcKeys();
  const jwk = keys.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('GitHub OIDC signing key was not found.');

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const valid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(encodedHeader + '.' + encodedPayload),
    publicKey,
    b64url(encodedSignature)
  );
  if (!valid) throw new Error('GitHub OIDC signature verification failed.');

  const now = Math.floor(Date.now() / 1000);
  if (String(claims.iss || '') !== GITHUB_OIDC_ISSUER) throw new Error('Unexpected GitHub OIDC issuer.');
  if (!audienceIncludes(claims.aud, audience)) throw new Error('Unexpected GitHub OIDC audience.');
  if (Number(claims.exp || 0) <= now) throw new Error('GitHub OIDC token is expired.');
  if (Number(claims.nbf || 0) > now + 30) throw new Error('GitHub OIDC token is not active yet.');
  if (String(claims.repository || '') !== repository) throw new Error('Unexpected GitHub OIDC repository.');
  if (String(claims.ref || '') !== ref) throw new Error('Unexpected GitHub OIDC ref.');
  if (String(claims.repository_owner || '') !== 'IAMGodmatters') throw new Error('Unexpected GitHub OIDC repository owner.');
  if (String(claims.event_name || '') !== 'push') throw new Error('Migration staging requires a main-branch push workflow.');
  const workflowRef = String(claims.workflow_ref || claims.job_workflow_ref || '');
  if (!workflowRef.includes('/' + workflowFile + '@refs/heads/main')) {
    throw new Error('Unexpected GitHub OIDC workflow.');
  }

  return {
    repository: claims.repository,
    ref: claims.ref,
    sha: String(claims.sha || ''),
    actor: String(claims.actor || ''),
    workflow_ref: workflowRef
  };
}

function qname(name) {
  return '"' + String(name).replaceAll('"', '""') + '"';
}

function summarizeDatabase(db) {
  const rows = db.prepare('PRAGMA table_list').all()
    .filter(row => String(row.schema || '') === 'main')
    .filter(row => ['table','virtual'].includes(String(row.type || '')))
    .filter(row => !String(row.name || '').startsWith('sqlite_'))
    .filter(row => !String(row.name || '').startsWith('_cf_'))
    .sort((a,b) => String(a.name).localeCompare(String(b.name)));
  const tableCounts = {};
  const schema = [];
  for (const row of rows) {
    const name = String(row.name);
    tableCounts[name] = Number(db.prepare('SELECT COUNT(*) AS n FROM ' + qname(name)).get()?.n || 0);
    const master = db.prepare("SELECT sql FROM sqlite_master WHERE name=? AND type='table'").get(name);
    schema.push([name, String(master?.sql || '')]);
  }
  const integrity = String(db.prepare('PRAGMA integrity_check').get()?.integrity_check || '');
  const foreignKeyViolations = db.prepare('PRAGMA foreign_key_check').all().length;
  return {
    integrity,
    foreign_key_violations: foreignKeyViolations,
    table_count: rows.length,
    table_counts: tableCounts,
    schema_sha256: crypto.createHash('sha256').update(JSON.stringify(schema)).digest('hex')
  };
}

export async function stageD1SqlExport(sqlText, {
  migrationRoot = '/app/persist/migration',
  targetPath = '',
  runtimeSecretsFile = '/app/persist/secrets/runtime.json',
  source = {}
} = {}) {
  const sql = String(sqlText || '');
  if (!sql.trim()) throw new Error('D1 export body is empty.');

  const root = path.resolve(migrationRoot);
  const finalPath = path.resolve(targetPath || path.join(root, 'production.sqlite'));
  if (finalPath !== root && !finalPath.startsWith(root + path.sep)) {
    throw new Error('Migration target must remain inside the configured migration root.');
  }

  await fs.mkdir(root, { recursive: true });
  const tempPath = path.join(root, '.production-' + crypto.randomUUID() + '.sqlite');
  const cleaned = sql.replace(/PRAGMA\s+defer_foreign_keys\s*=\s*TRUE\s*;?/ig, '');
  const db = new DatabaseSync(tempPath);
  let summary;
  try {
    db.exec('PRAGMA foreign_keys=OFF;');
    db.exec(cleaned);
    db.exec('PRAGMA foreign_keys=ON;');
    summary = summarizeDatabase(db);
    if (summary.integrity.toLowerCase() !== 'ok') throw new Error('SQLite integrity_check failed after staged D1 import.');
  } catch (error) {
    try { db.close(); } catch {}
    await fs.rm(tempPath, { force: true });
    throw error;
  }
  db.close();

  const sqlSha256 = crypto.createHash('sha256').update(sql).digest('hex');
  const sqliteBytes = await fs.readFile(tempPath);
  const sqliteSha256 = crypto.createHash('sha256').update(sqliteBytes).digest('hex');
  const pendingCredentialRewrap = await applyPendingCredentialVaultRewrap(tempPath, {
    pendingPath: finalPath + '.credential-rewrap.pending.json',
    runtimeSecretsFile
  });
  const finalSqliteSha256 = crypto.createHash('sha256').update(await fs.readFile(tempPath)).digest('hex');

  await fs.rm(finalPath, { force: true });
  await fs.rename(tempPath, finalPath);
  const metadata = {
    ok: true,
    staged_at: new Date().toISOString(),
    target: finalPath,
    sql_sha256: sqlSha256,
    sqlite_sha256: sqliteSha256,
    final_sqlite_sha256: finalSqliteSha256,
    credential_rewrap: pendingCredentialRewrap,
    ...summary,
    source: {
      repository: String(source.repository || ''),
      ref: String(source.ref || ''),
      sha: String(source.sha || ''),
      workflow_ref: String(source.workflow_ref || '')
    }
  };
  await fs.writeFile(finalPath + '.stage.json', JSON.stringify(metadata, null, 2), { mode: 0o600 });
  if (pendingCredentialRewrap?.pending_path) await fs.rm(pendingCredentialRewrap.pending_path, { force: true });
  return metadata;
}


export async function stageD1SqliteSnapshot(snapshotBytes, {
  migrationRoot = '/app/persist/migration',
  targetPath = '',
  runtimeSecretsFile = '/app/persist/secrets/runtime.json',
  source = {}
} = {}) {
  const bytes = Buffer.from(snapshotBytes || []);
  if (!bytes.length) throw new Error('D1 SQLite snapshot body is empty.');

  const root = path.resolve(migrationRoot);
  const finalPath = path.resolve(targetPath || path.join(root, 'production.sqlite'));
  if (finalPath !== root && !finalPath.startsWith(root + path.sep)) {
    throw new Error('Migration target must remain inside the configured migration root.');
  }

  await fs.mkdir(root, { recursive: true });
  const tempPath = path.join(root, '.production-' + crypto.randomUUID() + '.sqlite');
  await fs.writeFile(tempPath, bytes, { mode: 0o600 });

  let db;
  let summary;
  try {
    db = new DatabaseSync(tempPath);
    summary = summarizeDatabase(db);
    if (summary.integrity.toLowerCase() !== 'ok') throw new Error('SQLite integrity_check failed for staged D1 snapshot.');
    if (summary.foreign_key_violations !== 0) throw new Error('Foreign-key validation failed for staged D1 snapshot.');
    db.close();
    db = null;
  } catch (error) {
    try { db?.close(); } catch {}
    await fs.rm(tempPath, { force: true });
    throw error;
  }

  const sqliteSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const pendingCredentialRewrap = await applyPendingCredentialVaultRewrap(tempPath, {
    pendingPath: finalPath + '.credential-rewrap.pending.json',
    runtimeSecretsFile
  });
  const finalSqliteSha256 = crypto.createHash('sha256').update(await fs.readFile(tempPath)).digest('hex');
  await fs.rm(finalPath, { force: true });
  await fs.rename(tempPath, finalPath);
  const metadata = {
    ok: true,
    staged_at: new Date().toISOString(),
    target: finalPath,
    sqlite_sha256: sqliteSha256,
    final_sqlite_sha256: finalSqliteSha256,
    credential_rewrap: pendingCredentialRewrap,
    sqlite_bytes: bytes.length,
    ...summary,
    source: {
      repository: String(source.repository || ''),
      ref: String(source.ref || ''),
      sha: String(source.sha || ''),
      workflow_ref: String(source.workflow_ref || '')
    }
  };
  await fs.writeFile(finalPath + '.stage.json', JSON.stringify(metadata, null, 2), { mode: 0o600 });
  if (pendingCredentialRewrap?.pending_path) await fs.rm(pendingCredentialRewrap.pending_path, { force: true });
  return metadata;
}


function credentialKeyDigest(source) {
  return crypto.createHash('sha256').update('iam-platform-credentials-v1:' + String(source || '')).digest();
}

async function verifyCredentialCiphertext(value, source) {
  const raw = String(value || '');
  if (!raw.startsWith('enc1.')) throw new Error('Credential migration ciphertext is not encrypted.');
  const parts = raw.split('.');
  if (parts.length !== 3) throw new Error('Credential migration ciphertext format is invalid.');
  const iv = Buffer.from(parts[1], 'base64');
  const cipher = Buffer.from(parts[2], 'base64');
  if (iv.length !== 12 || cipher.length < 17) throw new Error('Credential migration ciphertext payload is invalid.');
  const key = await crypto.webcrypto.subtle.importKey(
    'raw',
    credentialKeyDigest(source),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const plain = await crypto.webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  );
  if (!plain || plain.byteLength === 0) throw new Error('Credential migration ciphertext decrypted to an empty value.');
}


async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function credentialRowsDigest(rows) {
  const digestInput = rows
    .map(row => String(row.credential_key) + ':' + String(row.encrypted_value))
    .sort()
    .join('\n');
  return crypto.createHash('sha256').update(digestInput).digest('hex');
}

async function validateCredentialVaultPayload(payload, targetKey) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const declaredCount = Number(payload?.count ?? rows.length);
  if (declaredCount !== rows.length) throw new Error('Credential migration row count is inconsistent.');

  const incoming = rows.map(row => String(row?.credential_key || '')).sort();
  if (new Set(incoming).size !== incoming.length) throw new Error('Credential migration contains duplicate keys.');

  for (const row of rows) {
    const key = String(row?.credential_key || '');
    const encrypted = String(row?.encrypted_value || '');
    if (!key || !encrypted) throw new Error('Credential migration row is incomplete.');
    await verifyCredentialCiphertext(encrypted, targetKey);
  }

  return {
    rows,
    count: rows.length,
    ciphertext_sha256: credentialRowsDigest(rows)
  };
}

async function applyCredentialVaultRows(dbPath, rows, targetKey) {
  const validated = await validateCredentialVaultPayload({ count: rows.length, rows }, targetKey);
  const db = new DatabaseSync(dbPath);
  try {
    const exists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='platform_credentials'"
    ).get();
    if (!exists) {
      if (validated.rows.length) throw new Error('Staged database is missing platform_credentials.');
      return { ok: true, count: 0, ciphertext_sha256: validated.ciphertext_sha256 };
    }

    const current = db.prepare('SELECT credential_key FROM platform_credentials ORDER BY credential_key').all()
      .map(row => String(row.credential_key || ''));
    const incoming = validated.rows.map(row => String(row.credential_key || '')).sort();
    if (JSON.stringify(current) !== JSON.stringify(incoming)) {
      throw new Error('Credential migration key set does not match the staged database.');
    }

    const update = db.prepare('UPDATE platform_credentials SET encrypted_value=? WHERE credential_key=?');
    db.exec('BEGIN IMMEDIATE;');
    try {
      for (const row of validated.rows) update.run(String(row.encrypted_value), String(row.credential_key));
      db.exec('COMMIT;');
    } catch (error) {
      try { db.exec('ROLLBACK;'); } catch {}
      throw error;
    }

    return {
      ok: true,
      count: validated.count,
      ciphertext_sha256: validated.ciphertext_sha256
    };
  } finally {
    db.close();
  }
}

async function readStandaloneVaultKey(runtimeSecretsFile) {
  const secrets = JSON.parse(await fs.readFile(runtimeSecretsFile, 'utf8'));
  const targetKey = String(secrets?.INTEGRATION_CREDENTIALS_KEY || '');
  if (targetKey.length < 32) throw new Error('Standalone integration credential key is not staged.');
  return targetKey;
}

async function applyPendingCredentialVaultRewrap(dbPath, {
  pendingPath,
  runtimeSecretsFile
} = {}) {
  if (!pendingPath || !(await fileExists(pendingPath))) return null;
  const targetKey = await readStandaloneVaultKey(runtimeSecretsFile);
  const payload = JSON.parse(await fs.readFile(pendingPath, 'utf8'));
  const validated = await validateCredentialVaultPayload(payload, targetKey);
  const result = await applyCredentialVaultRows(dbPath, validated.rows, targetKey);
  return { ...result, pending_applied: true, pending_path: pendingPath };
}

export async function stageCredentialVaultRewrap(payload, {
  targetPath = '/app/persist/migration/production.sqlite',
  runtimeSecretsFile = '/app/persist/secrets/runtime.json'
} = {}) {
  const targetKey = await readStandaloneVaultKey(runtimeSecretsFile);
  const validated = await validateCredentialVaultPayload(payload, targetKey);
  const dbPath = path.resolve(targetPath);
  const pendingPath = dbPath + '.credential-rewrap.pending.json';

  if (!(await fileExists(dbPath))) {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    const tempPendingPath = pendingPath + '.' + crypto.randomUUID() + '.tmp';
    await fs.writeFile(
      tempPendingPath,
      JSON.stringify({ count: validated.count, rows: validated.rows }),
      { mode: 0o600 }
    );
    await fs.rename(tempPendingPath, pendingPath);
    return {
      ok: true,
      pending: true,
      count: validated.count,
      ciphertext_sha256: validated.ciphertext_sha256
    };
  }

  const result = await applyCredentialVaultRows(dbPath, validated.rows, targetKey);
  const meta = {
    ...result,
    pending: false,
    staged_at: new Date().toISOString()
  };
  await fs.writeFile(dbPath + '.credentials.json', JSON.stringify(meta, null, 2), { mode: 0o600 });
  await fs.rm(pendingPath, { force: true });
  return meta;
}

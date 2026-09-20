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
  const rows = db.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();
  const tableCounts = {};
  const schema = [];
  for (const row of rows) {
    tableCounts[row.name] = Number(db.prepare('SELECT COUNT(*) AS n FROM ' + qname(row.name)).get()?.n || 0);
    schema.push([row.name, String(row.sql || '')]);
  }
  const integrity = String(db.prepare('PRAGMA integrity_check').get()?.integrity_check || '');
  return {
    integrity,
    table_count: rows.length,
    table_counts: tableCounts,
    schema_sha256: crypto.createHash('sha256').update(JSON.stringify(schema)).digest('hex')
  };
}

export async function stageD1SqlExport(sqlText, {
  migrationRoot = '/app/persist/migration',
  targetPath = '',
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

  await fs.rm(finalPath, { force: true });
  await fs.rename(tempPath, finalPath);
  const metadata = {
    ok: true,
    staged_at: new Date().toISOString(),
    target: finalPath,
    sql_sha256: sqlSha256,
    sqlite_sha256: sqliteSha256,
    ...summary,
    source: {
      repository: String(source.repository || ''),
      ref: String(source.ref || ''),
      sha: String(source.sha || ''),
      workflow_ref: String(source.workflow_ref || '')
    }
  };
  await fs.writeFile(finalPath + '.stage.json', JSON.stringify(metadata, null, 2), { mode: 0o600 });
  return metadata;
}

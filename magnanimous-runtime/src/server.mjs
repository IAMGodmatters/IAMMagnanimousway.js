import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import app from '../../worker/src/security-entrypoint.js';
import { getProviderRuntimeEnv } from '../../worker/src/provider-runtime-env.js';
import { openMagnanimousDb } from './d1-compat.mjs';
import { applyMagnanimousMigrations } from './migrations.mjs';
import { MagnanimousAiBinding } from './ai-binding.mjs';
import { openMagnanimousObjectStore } from './object-store.mjs';
import { openMagnanimousKvStore } from './kv-cache.mjs';
import { openMagnanimousDurableWork } from './durable-work.mjs';
import { openMagnanimousEventHub } from './event-hub.mjs';
import { MagnanimousRateLimiter } from './rate-limit.mjs';
import { openMagnanimousVectorStore } from './vector-store.mjs';
import { openMagnanimousAnalyticsEngine } from './analytics-engine.mjs';
import { openMagnanimousSecretVault } from './secret-vault.mjs';
import { openMagnanimousPipeline } from './pipeline.mjs';
import { magnanimousServiceBindings } from './service-bindings.mjs';
import { MagnanimousMetrics } from './metrics.mjs';
import { MagnanimousImageGenerationBinding } from './image-generation-binding.mjs';
import { openMagnanimousCloudControl } from './cloud-control.mjs';
import { openMagnanimousMailer } from './native-mailer.mjs';
import { verifyGitHubActionsOidc, stageD1SqlExport, stageD1SqliteSnapshot, stageCredentialVaultRewrap } from './migration-stage.mjs';
import { stageRuntimeSecrets, loadRuntimeSecrets } from './runtime-secret-store.mjs';
import { deployMagnanimousCommit, deploymentControlConfig } from './deployment-control.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const assetsRoot = path.resolve(
  process.env.MAGNANIMOUS_ASSETS_DIR || path.join(root, 'frontend/out')
);

const db = openMagnanimousDb(
  process.env.MAGNANIMOUS_DB_PATH || path.join(root, 'data/iam-magnanimous.sqlite')
);

const migrationState = applyMagnanimousMigrations(
  db,
  path.join(root, 'worker/migrations')
);

const objectStore = openMagnanimousObjectStore(
  process.env.MAGNANIMOUS_OBJECTS_PATH || path.join(root, 'data/object-store')
);
const kv = openMagnanimousKvStore(db, 'runtime');
const durableWork = openMagnanimousDurableWork(db);
const eventHub = openMagnanimousEventHub(db);
const rateLimiter = new MagnanimousRateLimiter();
const vectorStore = openMagnanimousVectorStore(db, 'runtime');
const analytics = openMagnanimousAnalyticsEngine(db);
const secretVault = process.env.MAGNANIMOUS_SECRETS_KEY
  ? openMagnanimousSecretVault(db, process.env.MAGNANIMOUS_SECRETS_KEY)
  : null;
const pipeline = openMagnanimousPipeline({ objectStore, work: durableWork, analytics });
const services = magnanimousServiceBindings(process.env);
const imageGenerator = new MagnanimousImageGenerationBinding(process.env);
const metrics = new MagnanimousMetrics();
const cloudControl = openMagnanimousCloudControl({ db, objectStore, env: process.env });
const mailer = openMagnanimousMailer({ db, env: process.env });

let env;
const aiBinding = {
  async run(model, input) {
    const runtimeEnv = await getProviderRuntimeEnv(env || process.env);
    return new MagnanimousAiBinding(runtimeEnv).run(model, input);
  }
};

env = new Proxy(
  {
    DB: db,
    AI: aiBinding,
    MAGNANIMOUS_RUNTIME: 'standalone-node',
    MAGNANIMOUS_OBJECT_STORE: objectStore,
    MAGNANIMOUS_KV: kv,
    MAGNANIMOUS_QUEUE: durableWork,
    MAGNANIMOUS_WORKFLOWS: durableWork,
    MAGNANIMOUS_EVENTS: eventHub,
    MAGNANIMOUS_VECTORIZE: vectorStore,
    MAGNANIMOUS_ANALYTICS: analytics,
    MAGNANIMOUS_SECRETS: secretVault,
    MAGNANIMOUS_PIPELINE: pipeline,
    MAGNANIMOUS_SANDBOX: services.sandbox,
    MAGNANIMOUS_BROWSER: services.browser,
    MAGNANIMOUS_IMAGES: services.images,
    MAGNANIMOUS_IMAGE_GENERATOR: imageGenerator,
    MAGNANIMOUS_CLOUD_CONTROL: cloudControl,
    MAGNANIMOUS_MAIL: mailer,
    OBJECT_STORE: objectStore,
    KV: kv,
    QUEUE: durableWork,
    WORKFLOWS: durableWork,
    EVENTS: eventHub,
    VECTORIZE: vectorStore,
    ANALYTICS_ENGINE: analytics,
    PIPELINE: pipeline,
    SANDBOX: services.sandbox,
    BROWSER: services.browser,
    IMAGES: services.images,
    CLOUD_CONTROL: cloudControl
  },
  {
    get(target, key) {
      return key in target ? target[key] : process.env[String(key)];
    }
  }
);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2'
};

function workerFirst(pathname) {
  return pathname.startsWith('/api/') ||
    pathname === '/health' ||
    pathname === '/mcp' ||
    pathname.startsWith('/.well-known/') ||
    ['/persistent', '/restore', '/research', '/agency', '/email'].includes(pathname) ||
    pathname.startsWith('/funnels');
}

function safeAssetCandidates(pathname) {
  let decoded = '';
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return [];
  }

  const rel = decoded.replace(/^\/+/, '');
  if (rel.includes('..')) return [];
  if (!rel) return ['index.html'];

  const ext = path.extname(rel);
  return ext ? [rel] : [rel, rel + '.html', path.join(rel, 'index.html')];
}

async function staticResponse(pathname) {
  for (const rel of safeAssetCandidates(pathname)) {
    const candidate = path.resolve(assetsRoot, rel);
    if (!candidate.startsWith(assetsRoot + path.sep) && candidate !== assetsRoot) continue;

    try {
      const body = await fs.readFile(candidate);
      const headers = {
        'content-type': mime[path.extname(candidate).toLowerCase()] || 'application/octet-stream',
        'cache-control': candidate.endsWith('.html')
          ? 'public, max-age=300'
          : 'public, max-age=31536000, immutable'
      };
      return new Response(body, { status: 200, headers });
    } catch {}
  }

  return null;
}

async function nodeRequest(req) {
  const proto = String(
    req.headers['x-forwarded-proto'] ||
    process.env.MAGNANIMOUS_PUBLIC_PROTO ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  ).split(',')[0].trim();

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost');
  const url = proto + '://' + host + (req.url || '/');

  const init = {
    method: req.method,
    headers: req.headers
  };

  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    init.body = Buffer.concat(chunks);
  }

  return new Request(url, init);
}

async function send(res, response) {
  res.statusCode = response.status;

  for (const [key, value] of response.headers) {
    res.setHeader(key, value);
  }

  if (response.body == null) {
    res.end();
    return;
  }

  const data = Buffer.from(await response.arrayBuffer());
  res.end(data);
}

async function readLimitedBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      const error = new Error('Migration export exceeds the configured maximum size.');
      error.code = 'MIGRATION_TOO_LARGE';
      throw error;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function runtimeRevision() {
  return String(
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.MAGNANIMOUS_DEPLOY_REVISION ||
    ''
  ).trim();
}

async function handleDeployment(req, res, pathname) {
  if (!['/__magnanimous_runtime/deployment','/__magnanimous_runtime/deployment/railway'].includes(pathname)) return false;
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Method not allowed.' }));
    return true;
  }

  const authorization = String(req.headers.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Signed GitHub Actions identity required.' }));
    return true;
  }

  try {
    const source = await verifyGitHubActionsOidc(token, {
      audience: String(process.env.MAGNANIMOUS_DEPLOY_AUDIENCE || process.env.MAGNANIMOUS_RAILWAY_DEPLOY_AUDIENCE || 'magnanimous-railway-deploy'),
      repository: String(process.env.MAGNANIMOUS_GITHUB_MIGRATION_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js'),
      ref: 'refs/heads/main',
      workflowFile: '.github/workflows/magnanimous-railway-deploy.yml'
    });
    const body = await readLimitedBody(req, 65536);
    const payload = JSON.parse(body.toString('utf8'));
    const commitSha = String(payload?.commit_sha || '').trim();
    if (!commitSha || commitSha !== String(source.sha || '').trim()) {
      throw new Error('Requested deployment commit does not match the signed GitHub Actions commit.');
    }
    const result = await deployMagnanimousCommit(commitSha, { env: process.env });
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({
      ...result,
      source: { repository: source.repository, ref: source.ref, sha: source.sha }
    }));
  } catch (error) {
    const code = String(error?.code || '');
    const notConfigured = ['MAGNANIMOUS_DEPLOY_ADAPTER_DISABLED','MAGNANIMOUS_DEPLOY_ADAPTER_UNSUPPORTED','RAILWAY_DEPLOY_DISABLED','RAILWAY_DEPLOY_NOT_CONFIGURED','RAILWAY_DEPLOY_SCOPE_MISSING'].includes(code);
    const providerFailure = String(error?.message || '').startsWith('Railway exact-commit deployment failed') ||
      String(error?.message || '').includes('deployment API returned');
    console.error('Magnanimous deployment gateway failed', String(error?.message || error));
    res.statusCode = notConfigured ? 503 : providerFailure ? 502 : 403;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({
      detail: notConfigured
        ? 'Magnanimous deployment capacity adapter is not configured.'
        : providerFailure
          ? 'Railway deployment provider request failed.'
          : 'Magnanimous deployment authorization failed.',
      code: code || (providerFailure ? 'RAILWAY_DEPLOY_PROVIDER_FAILED' : 'RAILWAY_DEPLOY_FORBIDDEN')
    }));
  }
  return true;
}

async function handleMigrationStage(req, res, pathname) {
  if (!['/__magnanimous_runtime/migration/stage-d1','/__magnanimous_runtime/migration/stage-secrets','/__magnanimous_runtime/migration/stage-credential-rewrap'].includes(pathname)) return false;
  if (String(process.env.MAGNANIMOUS_GITHUB_MIGRATION_ENABLED || '').toLowerCase() !== 'true') {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Migration staging is disabled.' }));
    return true;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Method not allowed.' }));
    return true;
  }

  const authorization = String(req.headers.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Signed GitHub Actions identity required.' }));
    return true;
  }

  try {
    const secretStage = pathname.endsWith('/stage-secrets') || pathname.endsWith('/stage-credential-rewrap');
    const source = await verifyGitHubActionsOidc(token, {
      audience: String(process.env.MAGNANIMOUS_GITHUB_MIGRATION_AUDIENCE || 'magnanimous-production-data-stage'),
      repository: String(process.env.MAGNANIMOUS_GITHUB_MIGRATION_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js'),
      ref: 'refs/heads/main',
      workflowFile: secretStage
        ? '.github/workflows/magnanimous-runtime-secrets-stage.yml'
        : '.github/workflows/magnanimous-production-data-stage.yml',
      allowedEvents: ['push', 'workflow_dispatch']
    });
    const revision = runtimeRevision();
    const sourceRevision = String(source.sha || '').trim();
    const requestedRuntimeRevision = String(req.headers['x-magnanimous-runtime-revision'] || '').trim();
    if (secretStage) {
      if (!revision || !requestedRuntimeRevision || revision !== requestedRuntimeRevision) {
        throw new Error('Secret staging target revision mismatch: request is not bound to the live standalone runtime.');
      }
    } else if (revision && sourceRevision && revision !== sourceRevision) {
      throw new Error('Migration staging revision mismatch: live runtime does not match the signed GitHub commit.');
    }
    const maxBytes = pathname.endsWith('/stage-secrets') || pathname.endsWith('/stage-credential-rewrap')
      ? 1048576
      : Math.max(1048576, Number(process.env.MAGNANIMOUS_MIGRATION_MAX_BYTES || 104857600));
    const body = await readLimitedBody(req, maxBytes);
    if (pathname.endsWith('/stage-secrets')) {
      const payload = JSON.parse(body.toString('utf8'));
      const secretFile = String(process.env.MAGNANIMOUS_RUNTIME_SECRETS_FILE || '/app/persist/secrets/runtime.json');
      const result = await stageRuntimeSecrets(payload, {
        root: String(process.env.MAGNANIMOUS_RUNTIME_SECRETS_ROOT || '/app/persist/secrets'),
        targetPath: secretFile
      });
      const reloaded = await loadRuntimeSecrets({ file: secretFile, override: true });
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({
        ...result,
        reloaded: reloaded.loaded,
        loaded_count: reloaded.count,
        source: { repository: source.repository, ref: source.ref, sha: source.sha },
        target_revision: revision
      }));
      return true;
    }
    if (pathname.endsWith('/stage-credential-rewrap')) {
      const payload = JSON.parse(body.toString('utf8'));
      const result = await stageCredentialVaultRewrap(payload, {
        targetPath: String(process.env.MAGNANIMOUS_MIGRATION_STAGE_PATH || '/app/persist/migration/production.sqlite'),
        runtimeSecretsFile: String(process.env.MAGNANIMOUS_RUNTIME_SECRETS_FILE || '/app/persist/secrets/runtime.json')
      });
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ ...result, source: { repository: source.repository, ref: source.ref, sha: source.sha }, target_revision: revision }));
      return true;
    }
    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    const options = {
      migrationRoot: String(process.env.MAGNANIMOUS_MIGRATION_ROOT || '/app/persist/migration'),
      targetPath: String(process.env.MAGNANIMOUS_MIGRATION_STAGE_PATH || ''),
      runtimeSecretsFile: String(process.env.MAGNANIMOUS_RUNTIME_SECRETS_FILE || '/app/persist/secrets/runtime.json'),
      source
    };
    const result = contentType.includes('application/vnd.sqlite3')
      ? await stageD1SqliteSnapshot(body, options)
      : await stageD1SqlExport(body.toString('utf8'), options);
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify(result));
  } catch (error) {
    const tooLarge = error?.code === 'MIGRATION_TOO_LARGE';
    console.error('Magnanimous migration staging failed', String(error?.message || error));
    res.statusCode = tooLarge ? 413 : 403;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ detail: 'Migration staging authorization or import failed.' }));
  }
  return true;
}

function internalAuthorized(req) {
  const expected = String(process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN || '');
  return Boolean(expected) && String(req.headers['x-magnanimous-service-token'] || '') === expected;
}

const DEPLOY_SMOKE_TENANT_TABLES = [
  'auth_sessions',
  'agent_branch_training_submissions',
  'agent_branch_knowledge',
  'agent_mesh_messages',
  'white_label_brain_signals',
  'white_label_brain_memory',
  'magnanimous_outcomes',
  'agency_client_apps',
  'agency_automation_runs',
  'agency_automations',
  'agency_affiliate_referrals',
  'agency_affiliate_programs',
  'agency_community_spaces',
  'agency_portal_pages',
  'agency_learning_assets',
  'agency_contracts',
  'agency_projects',
  'agency_catalog_items',
  'agency_usage_rebill',
  'agency_reputation_items',
  'agency_funnels',
  'agency_bookings',
  'agency_client_settings',
  'unified_inbox_audit',
  'unified_inbox_messages',
  'unified_inbox_threads',
  'cc_supervisor_sessions',
  'cc_recording_sessions',
  'creator_feedback',
  'creator_bookmarks',
  'creator_competitors',
  'media_library_assets',
  'magnanimous_local_bridge_tasks',
  'magnanimous_local_bridge_devices',
  'magnanimous_local_bridge_pairings',
  'data_studio_workbooks',
  'magnanimous_business_ai_jobs',
  'magnanimous_work_steps',
  'magnanimous_work_items',
  'bpo_audit_events',
  'bpo_work_items',
  'bpo_programs',
  'bpo_clients',
  'crm_activities',
  'crm_opportunities',
  'crm_contacts',
  'billing_usage_guard',
  'billing_management_requests',
  'voice_agent_turns',
  'voice_do_not_call',
  'voice_agents',
  'tenant_settings',
  'billing_subscriptions',
  'qa_observations'
];

async function handleDeploymentSmokeControl(req, res, pathname) {
  if (pathname !== '/__magnanimous_runtime/smoke/tenant') return false;
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Method not allowed.' }));
    return true;
  }

  const authorization = String(req.headers.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ detail: 'Signed GitHub Actions identity required.' }));
    return true;
  }

  try {
    const source = await verifyGitHubActionsOidc(token, {
      audience: String(process.env.MAGNANIMOUS_DEPLOY_SMOKE_AUDIENCE || 'magnanimous-deploy-smoke'),
      repository: String(process.env.MAGNANIMOUS_GITHUB_MIGRATION_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js'),
      ref: 'refs/heads/main',
      workflowFile: '.github/workflows/deploy.yml',
      allowedEvents: ['push', 'workflow_dispatch']
    });
    const payload = JSON.parse((await readLimitedBody(req, 16384)).toString('utf8'));
    const revision = String(runtimeRevision() || '').trim();
    const sourceSha = String(source.sha || '').trim();
    const workflowSha = String(payload?.workflow_sha || '').trim();
    const requestedRuntimeSha = String(payload?.runtime_sha || '').trim();
    const fullSha = /^[0-9a-f]{40}$/i;
    if (!fullSha.test(revision) || !fullSha.test(sourceSha) || workflowSha !== sourceSha || requestedRuntimeSha !== revision) {
      throw new Error('Deployment smoke control revision binding mismatch.');
    }

    const tenantId = String(payload?.tenant_id || '').trim();
    const action = String(payload?.action || '').trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new Error('Invalid deployment smoke tenant identifier.');
    }

    const tenant = await db.prepare('SELECT id,name FROM tenants WHERE id=? LIMIT 1').bind(tenantId).first();
    const smokeUser = await db.prepare("SELECT id,email,name FROM users WHERE tenant_id=? AND lower(email) LIKE 'deploy-smoke-%@example.com' AND name='Deployment Smoke Test' LIMIT 1").bind(tenantId).first();
    if (!tenant?.id || tenant?.name !== 'Deployment Smoke Test' || !smokeUser?.id) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ detail: 'Disposable deployment smoke tenant not found.' }));
      return true;
    }

    if (action === 'grant_agency') {
      const now = Math.floor(Date.now() / 1000);
      await db.batch([
        db.prepare(`INSERT INTO billing_subscriptions(tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at)
          VALUES(?,?,?,?,?,?,?,?)
          ON CONFLICT(tenant_id) DO UPDATE SET plan=excluded.plan,status=excluded.status,updated_at=excluded.updated_at`)
          .bind(tenantId, 'agency', null, null, 'active', null, now, now),
        db.prepare("UPDATE tenants SET plan='agency' WHERE id=?").bind(tenantId)
      ]);
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ ok: true, action, tenant_id: tenantId, plan: 'agency', source_sha: source.sha }));
      return true;
    }

    if (action === 'cleanup') {
      const tableRows = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const existing = new Set((tableRows.results || []).map((row) => String(row.name || '')));
      const statements = [];
      for (const table of DEPLOY_SMOKE_TENANT_TABLES) {
        if (existing.has(table)) statements.push(db.prepare(`DELETE FROM ${table} WHERE tenant_id=?`).bind(tenantId));
      }
      if (existing.has('consent_records') && existing.has('users')) {
        statements.push(db.prepare('DELETE FROM consent_records WHERE user_id IN (SELECT id FROM users WHERE tenant_id=?)').bind(tenantId));
      }
      statements.push(db.prepare('DELETE FROM users WHERE tenant_id=?').bind(tenantId));
      statements.push(db.prepare('DELETE FROM tenants WHERE id=?').bind(tenantId));
      await db.batch(statements);
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ ok: true, action, tenant_id: tenantId, source_sha: source.sha }));
      return true;
    }

    res.statusCode = 400;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ detail: 'Unsupported deployment smoke action.' }));
  } catch (error) {
    console.error('Magnanimous deployment smoke control failed', String(error?.message || error));
    res.statusCode = 403;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ detail: 'Deployment smoke authorization or control failed.' }));
  }
  return true;
}

function executionContext() {
  const pending = [];

  return {
    ctx: {
      waitUntil(promise) {
        pending.push(Promise.resolve(promise));
      }
    },
    done() {
      return Promise.allSettled(pending);
    }
  };
}

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();
  const requestId = String(req.headers['x-request-id'] || crypto.randomUUID());
  res.setHeader('x-request-id', requestId);
  try {
    const pathname = new URL(req.url || '/', 'http://local').pathname;

    if (await handleDeployment(req, res, pathname)) {
      metrics.observe(res.statusCode, Date.now() - startedAt);
      return;
    }

    if (await handleMigrationStage(req, res, pathname)) {
      metrics.observe(res.statusCode, Date.now() - startedAt);
      return;
    }

    if (await handleDeploymentSmokeControl(req, res, pathname)) {
      metrics.observe(res.statusCode, Date.now() - startedAt);
      return;
    }

    if (pathname === '/__magnanimous_runtime/health' || pathname === '/__magnanimous_runtime/capabilities') {
      await send(
        res,
        Response.json({
          status: 'ok',
          identity: 'Magnanimous AI',
          runtime: 'standalone-node',
          database: 'magnanimous-sqlite',
          migrations: migrationState,
          deploy_revision: runtimeRevision() || null,
          deployment_automation: (() => {
            const config = deploymentControlConfig(process.env);
            return {
              provider_role: config.provider_role,
              provider: config.provider,
              enabled: config.enabled,
              configured: config.configured,
              magnanimous_control_plane: config.magnanimous_control_plane,
              provider_identity_owner: config.provider_identity_owner,
              provider_memory_owner: config.provider_memory_owner,
              provider_reasoning_owner: config.provider_reasoning_owner,
              oidc_gateway: true,
              exact_commit: config.exact_commit
            };
          })(),
          cloud_vendor_required: false,
          mail: mailer.status(),
          first_party_capabilities: {
            relational_sql: true,
            static_assets: true,
            scheduled_work: true,
            ai_binding: true,
            object_storage: true,
            key_value_cache: true,
            durable_queue: true,
            durable_workflows: true,
            event_coordination: true,
            application_rate_limiting: true,
            vector_storage_query: true,
            analytics_engine: true,
            durable_ingestion_pipeline: true,
            encrypted_secret_vault: Boolean(secretVault),
            isolated_sandbox: services.sandbox.configured,
            server_browser_rendering: services.browser.configured,
            image_transformation: services.images.configured,
            image_generation: imageGenerator.configured,
            prometheus_metrics: true,
            tls_reverse_proxy: true,
            self_hosted_dns_profile: true,
            magnanimous_cloud_control_plane: true,
            native_transactional_mail: mailer.configured
          }
        })
      );
      metrics.observe(200, Date.now() - startedAt);
      return;
    }

    if (pathname === '/__magnanimous_runtime/cloud') {
      if (!internalAuthorized(req)) {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ detail: 'Magnanimous internal service token required.' }));
        metrics.observe(401, Date.now() - startedAt);
        return;
      }
      await send(res, Response.json(await cloudControl.summary(), { headers: { 'cache-control': 'no-store' } }));
      metrics.observe(200, Date.now() - startedAt);
      return;
    }

    if (pathname === '/__magnanimous_runtime/metrics') {
      if (!internalAuthorized(req)) {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ detail: 'Magnanimous internal service token required.' }));
        metrics.observe(401, Date.now() - startedAt);
        return;
      }
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain; version=0.0.4; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(metrics.prometheus());
      metrics.observe(200, Date.now() - startedAt);
      return;
    }

    if (pathname === '/__magnanimous_runtime/services') {
      if (!internalAuthorized(req)) {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ detail: 'Magnanimous internal service token required.' }));
        metrics.observe(401, Date.now() - startedAt);
        return;
      }
      const checks = {};
      for (const [name, service] of Object.entries(services)) {
        if (!service.configured) { checks[name] = { configured: false, ok: false }; continue; }
        try { checks[name] = { configured: true, ok: true, health: await service.health() }; }
        catch (error) { checks[name] = { configured: true, ok: false, detail: String(error?.message || error) }; }
      }
      await send(res, Response.json({ identity: 'Magnanimous AI', services: checks }, { headers: { 'cache-control': 'no-store' } }));
      metrics.observe(200, Date.now() - startedAt);
      return;
    }

    if (pathname.startsWith('/api/')) {
      const remote = String(req.socket?.remoteAddress || 'unknown');
      const sensitive = /^\/api\/auth\/(signup|login|forgot|reset)/.test(pathname);
      const result = rateLimiter.check((sensitive ? 'auth:' : 'api:') + remote, sensitive
        ? { limit: Number(process.env.MAGNANIMOUS_AUTH_RATE_LIMIT || 60), windowMs: 300000 }
        : { limit: Number(process.env.MAGNANIMOUS_API_RATE_LIMIT || 1200), windowMs: 60000 });
      res.setHeader('ratelimit-limit', String(result.limit));
      res.setHeader('ratelimit-remaining', String(result.remaining));
      res.setHeader('ratelimit-reset', String(Math.ceil(result.resetAt / 1000)));
      if (!result.allowed) {
        res.statusCode = 429;
        res.setHeader('retry-after', String(Math.ceil(result.retryAfterMs / 1000)));
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ detail: 'Magnanimous request limit reached. Try again shortly.', code: 'MAGNANIMOUS_RATE_LIMIT' }));
        metrics.observe(429, Date.now() - startedAt);
        return;
      }
    }

    if (!workerFirst(pathname)) {
      const asset = await staticResponse(pathname);
      if (asset) {
        await send(res, asset);
        metrics.observe(asset.status, Date.now() - startedAt);
        return;
      }
    }

    const request = await nodeRequest(req);
    const work = executionContext();
    const response = await app.fetch(request, env, work.ctx);

    await send(res, response);
    metrics.observe(response.status, Date.now() - startedAt);
    work.done().catch(() => {});
  } catch (error) {
    console.error('Magnanimous standalone request failed', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        detail: 'Magnanimous standalone runtime error.',
        code: 'MAGNANIMOUS_RUNTIME_ERROR'
      })
    );
    metrics.observe(500, Date.now() - startedAt);
  }
});

const port = Number(process.env.PORT || 8788);
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
  console.log(
    'Magnanimous standalone runtime listening on ' +
    host + ':' + port +
    '; migrations applied=' + migrationState.applied.length +
    '/' + migrationState.total
  );
});

if (
  String(process.env.MAGNANIMOUS_SCHEDULER_ENABLED || 'true').toLowerCase() !== 'false' &&
  typeof app.scheduled === 'function'
) {
  const interval = Math.max(
    60000,
    Number(process.env.MAGNANIMOUS_SCHEDULE_INTERVAL_MS || 900000)
  );

  setInterval(() => {
    const work = executionContext();
    Promise.resolve(
      app.scheduled(
        { scheduledTime: Date.now(), cron: '*/15 * * * *' },
        env,
        work.ctx
      )
    )
      .catch((error) => console.error('Magnanimous scheduled task failed', error))
      .finally(() => work.done().catch(() => {}));
  }, interval).unref();
}

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import app from '../../worker/src/security-entrypoint.js';
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
import { verifyGitHubActionsOidc, stageD1SqlExport, stageD1SqliteSnapshot, stageCredentialVaultRewrap } from './migration-stage.mjs';
import { stageRuntimeSecrets, loadRuntimeSecrets } from './runtime-secret-store.mjs';
import { deployRailwayCommit, railwayDeployConfig } from './railway-deploy.mjs';

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

const env = new Proxy(
  {
    DB: db,
    AI: new MagnanimousAiBinding(process.env),
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

async function handleRailwayDeployment(req, res, pathname) {
  if (pathname !== '/__magnanimous_runtime/deployment/railway') return false;
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
      audience: String(process.env.MAGNANIMOUS_RAILWAY_DEPLOY_AUDIENCE || 'magnanimous-railway-deploy'),
      repository: String(process.env.MAGNANIMOUS_GITHUB_MIGRATION_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js'),
      ref: 'refs/heads/main',
      workflowFile: '.github/workflows/magnanimous-railway-deploy.yml'
    });
    const body = await readLimitedBody(req, 65536);
    const payload = JSON.parse(body.toString('utf8'));
    const commitSha = String(payload?.commit_sha || '').trim();
    if (!commitSha || commitSha !== String(source.sha || '').trim()) {
      throw new Error('Requested Railway commit does not match the signed GitHub Actions commit.');
    }
    const result = await deployRailwayCommit(commitSha, { env: process.env });
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({
      ...result,
      source: { repository: source.repository, ref: source.ref, sha: source.sha }
    }));
  } catch (error) {
    const code = String(error?.code || '');
    const notConfigured = ['RAILWAY_DEPLOY_DISABLED','RAILWAY_DEPLOY_NOT_CONFIGURED','RAILWAY_DEPLOY_SCOPE_MISSING'].includes(code);
    const providerFailure = String(error?.message || '').startsWith('Railway exact-commit deployment failed') ||
      String(error?.message || '').includes('deployment API returned');
    console.error('Magnanimous Railway deployment gateway failed', String(error?.message || error));
    res.statusCode = notConfigured ? 503 : providerFailure ? 502 : 403;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({
      detail: notConfigured
        ? 'Magnanimous Railway deployment gateway is not configured.'
        : providerFailure
          ? 'Railway deployment provider request failed.'
          : 'Railway deployment authorization failed.',
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
    if (revision && String(source.sha || '').trim() && revision !== String(source.sha || '').trim()) {
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
        source: { repository: source.repository, ref: source.ref, sha: source.sha }
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
      res.end(JSON.stringify({ ...result, source: { repository: source.repository, ref: source.ref, sha: source.sha } }));
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

    if (await handleRailwayDeployment(req, res, pathname)) {
      metrics.observe(res.statusCode, Date.now() - startedAt);
      return;
    }

    if (await handleMigrationStage(req, res, pathname)) {
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
            const config = railwayDeployConfig(process.env);
            return {
              provider_role: 'replaceable infrastructure adapter',
              enabled: config.enabled,
              configured: config.configured,
              oidc_gateway: true,
              exact_commit: true
            };
          })(),
          cloud_vendor_required: false,
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
            magnanimous_cloud_control_plane: true
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

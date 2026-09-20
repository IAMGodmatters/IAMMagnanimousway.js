import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
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
    OBJECT_STORE: objectStore,
    KV: kv,
    QUEUE: durableWork,
    WORKFLOWS: durableWork,
    EVENTS: eventHub,
    VECTORIZE: vectorStore,
    ANALYTICS_ENGINE: analytics,
    PIPELINE: pipeline
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
  try {
    const pathname = new URL(req.url || '/', 'http://local').pathname;

    if (pathname === '/__magnanimous_runtime/health' || pathname === '/__magnanimous_runtime/capabilities') {
      await send(
        res,
        Response.json({
          status: 'ok',
          identity: 'Magnanimous AI',
          runtime: 'standalone-node',
          database: 'magnanimous-sqlite',
          migrations: migrationState,
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
            encrypted_secret_vault: Boolean(secretVault)
          }
        })
      );
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
        return;
      }
    }

    if (!workerFirst(pathname)) {
      const asset = await staticResponse(pathname);
      if (asset) {
        await send(res, asset);
        return;
      }
    }

    const request = await nodeRequest(req);
    const work = executionContext();
    const response = await app.fetch(request, env, work.ctx);

    await send(res, response);
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

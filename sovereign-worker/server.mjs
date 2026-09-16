import http from 'node:http';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';

const port = Number(process.env.MAGNANIMOUS_WORKER_PORT || 8080);
const frontendOrigin = new URL(process.env.MAGNANIMOUS_FRONTEND_ORIGIN || 'http://127.0.0.1:3000');
const backendOrigin = new URL(process.env.MAGNANIMOUS_BACKEND_ORIGIN || 'http://127.0.0.1:8000');
const publicOrigin = String(process.env.MAGNANIMOUS_PUBLIC_ORIGIN || '').replace(/\/$/, '');
const requestTimeoutMs = Math.max(1_000, Number(process.env.MAGNANIMOUS_UPSTREAM_TIMEOUT_MS || 60_000));
const maxBodyBytes = Math.max(1_048_576, Number(process.env.MAGNANIMOUS_MAX_BODY_BYTES || 25 * 1024 * 1024));

const hopByHop = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length',
]);

function requestId() {
  return `mw_${crypto.randomUUID().replaceAll('-', '')}`;
}

function addSecurityHeaders(headers, rid) {
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'SAMEORIGIN');
  headers.set('permissions-policy', 'camera=(self), microphone=(self), geolocation=(self)');
  headers.set('x-magnanimous-request-id', rid);
  headers.set('server', 'Magnanimous Worker Runtime');
  headers.delete('cf-ray');
  headers.delete('server-timing');
}

function targetFor(url) {
  const base = url.pathname.startsWith('/api/') || url.pathname === '/health' ? backendOrigin : frontendOrigin;
  return new URL(`${url.pathname}${url.search}`, base);
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw Object.assign(new Error('Request body too large'), { status: 413 });
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function cleanRequestHeaders(req, rid, clientIp) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (hopByHop.has(name.toLowerCase()) || value == null) continue;
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else headers.set(name, value);
  }
  headers.set('x-magnanimous-request-id', rid);
  headers.set('x-forwarded-proto', req.socket.encrypted ? 'https' : 'http');
  headers.set('x-forwarded-host', req.headers.host || '');
  if (clientIp) headers.set('x-forwarded-for', clientIp);
  if (publicOrigin) headers.set('x-magnanimous-public-origin', publicOrigin);
  return headers;
}

async function proxy(req, res) {
  const rid = requestId();
  const incoming = new URL(req.url || '/', publicOrigin || `http://${req.headers.host || 'localhost'}`);

  if (incoming.pathname === '/__magnanimous/health') {
    const body = JSON.stringify({
      status: 'ok',
      service: 'magnanimous-worker-runtime',
      identity: 'Magnanimous',
      frontend_origin_configured: Boolean(frontendOrigin),
      backend_origin_configured: Boolean(backendOrigin),
    });
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-magnanimous-request-id': rid,
      'server': 'Magnanimous Worker Runtime',
    });
    res.end(body);
    return;
  }

  const target = targetFor(incoming);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Upstream timeout')), requestTimeoutMs);
  try {
    const body = await readBody(req);
    const upstream = await fetch(target, {
      method: req.method,
      headers: cleanRequestHeaders(req, rid, req.socket.remoteAddress || ''),
      body,
      redirect: 'manual',
      signal: controller.signal,
    });
    const headers = new Headers(upstream.headers);
    for (const header of hopByHop) headers.delete(header);
    addSecurityHeaders(headers, rid);

    const outgoing = {};
    for (const [name, value] of headers.entries()) outgoing[name] = value;
    res.writeHead(upstream.status, outgoing);
    if (!upstream.body || req.method === 'HEAD') {
      res.end();
      return;
    }
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    const status = Number(error?.status || (error?.name === 'AbortError' ? 504 : 502));
    const body = JSON.stringify({
      error: status === 413 ? 'REQUEST_TOO_LARGE' : status === 504 ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      message: status === 413 ? 'Request body exceeds the configured Magnanimous limit.' : 'Magnanimous could not reach an internal service.',
      request_id: rid,
    });
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-magnanimous-request-id': rid,
      'server': 'Magnanimous Worker Runtime',
    });
    res.end(body);
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer((req, res) => {
  proxy(req, res).catch((error) => {
    console.error('Magnanimous worker request failed', error);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    if (!res.writableEnded) res.end(JSON.stringify({ error: 'MAGNANIMOUS_WORKER_FAILURE' }));
  });
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Magnanimous Worker Runtime listening on :${port}`);
});

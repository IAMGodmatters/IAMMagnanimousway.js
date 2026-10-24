import assert from 'node:assert/strict';
import test from 'node:test';
import app from '../src/index.js';

test('gateway replaces client credentials with its server-held renderer token', async () => {
  const previous = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url, options };
    return Response.json({ download_url: '/api/video/download/random.mp4' });
  };
  try {
    const request = new Request('https://gateway.example/api/video/render', {
      method: 'POST',
      headers: {
        authorization: 'Bearer browser-secret',
        cookie: 'session=private',
        'cf-connecting-ip': '192.0.2.12',
        'x-forwarded-for': '192.0.2.13',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    const response = await app.fetch(request, {
      VIDEO_RENDERER_URL: 'https://renderer.example',
      VIDEO_RENDERER_TOKEN: 'server-only-secret',
    });
    assert.equal(response.status, 200);
    assert.equal(forwarded.url, 'https://renderer.example/api/video/render');
    assert.equal(forwarded.options.headers.get('authorization'), 'Bearer server-only-secret');
    for (const header of ['cookie', 'cf-connecting-ip', 'x-forwarded-for']) {
      assert.equal(forwarded.options.headers.has(header), false);
    }
    assert.equal(forwarded.options.redirect, 'manual');
  } finally {
    globalThis.fetch = previous;
  }
});

test('gateway never forwards browser bearer tokens without an upstream secret', async () => {
  const previous = globalThis.fetch;
  let forwardedAuthorization;
  globalThis.fetch = async (_url, options) => {
    forwardedAuthorization = options.headers.get('authorization');
    return Response.json({ ok: true });
  };
  try {
    const response = await app.fetch(new Request('https://gateway.example/api/video/render', {
      method: 'POST',
      headers: { authorization: 'Bearer browser-secret' },
      body: '{}',
    }), { VIDEO_RENDERER_URL: 'https://renderer.example' });
    assert.equal(response.status, 200);
    assert.equal(forwardedAuthorization, null);
  } finally {
    globalThis.fetch = previous;
  }
});

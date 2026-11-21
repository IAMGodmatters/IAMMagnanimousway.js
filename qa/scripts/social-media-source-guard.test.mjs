import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SOCIAL_VIDEO_BYTES,
  inspectPublicVideoSource,
  validatePublicVideoResponse,
  boundedMediaStream
} from '../../worker/src/social-media-source-guard.js';

const headers = (type='video/mp4', length='1024') => new Headers({
  'content-type': type,
  'content-length': length
});

test('accepts only supported video media types with a bounded positive length', () => {
  assert.deepEqual(validatePublicVideoResponse(headers(), 1024), {
    contentType: 'video/mp4', contentLength: 1024
  });
  assert.deepEqual(validatePublicVideoResponse(headers('video/quicktime', '2048')), {
    contentType: 'video/quicktime', contentLength: 2048
  });
  assert.deepEqual(validatePublicVideoResponse(headers('video/webm', '4096')), {
    contentType: 'video/webm', contentLength: 4096
  });
  assert.throws(() => validatePublicVideoResponse(headers('application/octet-stream', '1024')), /MP4, MOV\/QuickTime or WebM/);
  assert.throws(() => validatePublicVideoResponse(headers('video/mp4', '0')), /invalid or empty/);
  assert.throws(() => validatePublicVideoResponse(headers('video/mp4', String(MAX_SOCIAL_VIDEO_BYTES + 1))), /256 MiB/);
  assert.throws(() => validatePublicVideoResponse(new Headers({'content-type':'video/mp4'})), /Content-Length/);
  assert.throws(() => validatePublicVideoResponse(headers('video/mp4','1024'), 2048), /length changed/);
});

test('inspects public media with HEAD before allowing a provider write', async () => {
  let call;
  const result = await inspectPublicVideoSource('https://media.example/video.mp4', async (url, options) => {
    call = {url, options};
    return new Response(null, {status: 200, headers: headers('video/mp4', '8192')});
  });
  assert.equal(call.options.method, 'HEAD');
  assert.equal(call.options.redirect, 'error');
  assert.deepEqual(result, {contentType:'video/mp4',contentLength:8192});
});

test('falls back to a one-byte range request when HEAD is unavailable', async () => {
  const calls = [];
  const result = await inspectPublicVideoSource('https://media.example/video.mov', async (url, options) => {
    calls.push(options);
    if (options.method === 'HEAD') return new Response(null, {status:405});
    return new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array([0]));},cancel(){}}), {
      status:206,
      headers:new Headers({'content-type':'video/quicktime','content-range':'bytes 0-0/16384','content-length':'1'})
    });
  });
  assert.equal(calls[0].method,'HEAD');
  assert.equal(calls[1].headers.range,'bytes=0-0');
  assert.equal(result.contentType,'video/quicktime');
  assert.equal(result.contentLength,16384);
});

test('rejects redirects, inaccessible sources and unknown range totals before provider calls', async () => {
  await assert.rejects(
    () => inspectPublicVideoSource('https://media.example/video.mp4', async () => new Response(null,{status:302})),
    /metadata request failed/
  );
  await assert.rejects(
    () => inspectPublicVideoSource('https://media.example/video.mp4', async (_url, options) => options.method==='HEAD'
      ? new Response(null,{status:405})
      : new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array([0]));}}),{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 0-0/*','content-length':'1'}})),
    /Content-Length/
  );
});

test('bounded upload stream rejects a body larger than the inspected size', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(4));
      controller.enqueue(new Uint8Array(4));
      controller.close();
    }
  });
  const bounded = boundedMediaStream(body,{expectedBytes:4,maxBytes:16});
  await assert.rejects(() => new Response(bounded).arrayBuffer(), /exceeded its inspected size/);
});

test('bounded upload stream rejects a short body instead of silently uploading partial media', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(3));
      controller.close();
    }
  });
  const bounded = boundedMediaStream(body,{expectedBytes:4,maxBytes:16});
  await assert.rejects(() => new Response(bounded).arrayBuffer(), /did not match the inspected Content-Length/);
});

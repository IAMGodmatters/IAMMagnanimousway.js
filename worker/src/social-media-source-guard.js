export const MAX_SOCIAL_VIDEO_BYTES = 256 * 1024 * 1024;
export const ALLOWED_SOCIAL_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm'
]);


const INTERNAL_HOST_SUFFIXES = new Set([
  'localhost',
  'local',
  'localdomain',
  'internal',
  'test',
  'invalid',
  'example',
  'home.arpa',
  'lan',
  'home',
  'corp',
  'intranet',
  'onion'
]);

function hasInternalHostSuffix(host) {
  return [...INTERNAL_HOST_SUFFIXES].some(suffix => host === suffix || host.endsWith(`.${suffix}`));
}

// One canonical policy is shared by draft creation, direct publishing and media fetches.
// A trailing DNS root dot must not bypass local/private hostname checks.
export function publicHttpsMediaUrl(value) {
  let url;
  try {
    url = new URL(String(value || ''));
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;

  const host = String(url.hostname || '').toLowerCase().replace(/\.+$/, '');
  if (!host || !host.includes('.') || host.includes(':') || hasInternalHostSuffix(host)) return null;

  // WHATWG URL parsing canonicalizes legacy IPv4 forms; this also rejects numeric
  // and hexadecimal host-label forms if a runtime preserves their original spelling.
  if (host.split('.').every(label => /^(?:\d+|0x[0-9a-f]+)$/i.test(label))) return null;

  return url;
}

const preflightError = (message, code = 'SOCIAL_MEDIA_SOURCE_INVALID') =>
  Object.assign(new Error(message), { preflight: true, code });

function normalizedType(headers) {
  return String(headers?.get?.('content-type') || '').split(';', 1)[0].trim().toLowerCase();
}

function validateMetadata(headers, contentLengthValue) {
  const contentType = normalizedType(headers);
  if (!ALLOWED_SOCIAL_VIDEO_TYPES.has(contentType)) {
    throw preflightError('Video source must use MP4, MOV/QuickTime or WebM media.', 'SOCIAL_MEDIA_TYPE_UNSUPPORTED');
  }
  const rawLength = String(contentLengthValue ?? headers?.get?.('content-length') ?? '').trim();
  if (!/^\d+$/.test(rawLength)) {
    throw preflightError('Video source must expose its full Content-Length before publishing.', 'SOCIAL_MEDIA_LENGTH_REQUIRED');
  }
  const contentLength = Number(rawLength);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    throw preflightError('Video source has an invalid or empty Content-Length.', 'SOCIAL_MEDIA_LENGTH_INVALID');
  }
  if (contentLength > MAX_SOCIAL_VIDEO_BYTES) {
    throw preflightError('Video source exceeds the 256 MiB first-release safety limit.', 'SOCIAL_MEDIA_TOO_LARGE');
  }
  return { contentType, contentLength };
}

async function cancelBody(response) {
  try { await response?.body?.cancel(); } catch {}
}

export function validatePublicVideoResponse(headers, expectedLength) {
  const metadata = validateMetadata(headers);
  if (expectedLength != null && metadata.contentLength !== Number(expectedLength)) {
    throw preflightError('Video source length changed between inspection and download. No provider upload was started.', 'SOCIAL_MEDIA_LENGTH_CHANGED');
  }
  return metadata;
}

export async function inspectPublicVideoSource(url, fetchImpl = fetch) {
  let head;
  try {
    head = await fetchImpl(url, { method: 'HEAD', redirect: 'error' });
  } catch {
    throw preflightError('Video source metadata could not be checked. Use a public HTTPS URL that supports HEAD or byte-range inspection.');
  }

  if (head.ok) {
    try {
      const metadata = validateMetadata(head.headers);
      await cancelBody(head);
      return metadata;
    } catch (error) {
      await cancelBody(head);
      if (error?.code !== 'SOCIAL_MEDIA_LENGTH_REQUIRED') throw error;
    }
  } else if (![403, 405, 501].includes(head.status)) {
    await cancelBody(head);
    throw preflightError(`Video source metadata request failed (${head.status}).`);
  } else {
    await cancelBody(head);
  }

  let probe;
  try {
    probe = await fetchImpl(url, { headers: { range: 'bytes=0-0' }, redirect: 'error' });
  } catch {
    throw preflightError('Video source does not allow a safe byte-range metadata check.');
  }
  if (!probe.ok && probe.status !== 206) {
    await cancelBody(probe);
    throw preflightError(`Video source byte-range inspection failed (${probe.status}).`);
  }

  let totalLength = '';
  if (probe.status === 206) {
    const range = String(probe.headers.get('content-range') || '').match(/^bytes\s+\d+-\d+\/(\d+)$/i);
    totalLength = range?.[1] || '';
  } else {
    totalLength = String(probe.headers.get('content-length') || '');
  }
  try {
    return validateMetadata(probe.headers, totalLength);
  } finally {
    await cancelBody(probe);
  }
}

export function boundedMediaStream(body, { expectedBytes, maxBytes = MAX_SOCIAL_VIDEO_BYTES } = {}) {
  if (!body || typeof body.getReader !== 'function') {
    throw preflightError('Video source did not provide a readable media stream.');
  }
  const reader = body.getReader();
  let total = 0;
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (expectedBytes != null && total !== Number(expectedBytes)) {
            controller.error(new Error('Downloaded video size did not match the inspected Content-Length. The provider result must be checked before any retry.'));
            return;
          }
          controller.close();
          return;
        }
        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
        total += chunk.byteLength;
        if (total > maxBytes || (expectedBytes != null && total > Number(expectedBytes))) {
          await reader.cancel().catch(() => {});
          controller.error(new Error('Downloaded video exceeded its inspected size. The provider result must be checked before any retry.'));
          return;
        }
        controller.enqueue(chunk);
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    }
  });
}

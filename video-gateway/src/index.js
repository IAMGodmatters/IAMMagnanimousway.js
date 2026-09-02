const RENDER_TIMEOUT_MS = 240_000;
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

function withCors(headers = new Headers()) {
  const out = new Headers(headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) out.set(key, value);
  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCors(new Headers({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    })),
  });
}

async function proxy(request, env) {
  if (!env.VIDEO_RENDERER_URL) return json({ detail: "Video renderer is not configured yet." }, 503);
  const incoming = new URL(request.url);
  const targetBase = env.VIDEO_RENDERER_URL.replace(/\/$/, "");
  const target = `${targetBase}${incoming.pathname}${incoming.search}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS);
  try {
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("origin");
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "follow",
      signal: controller.signal,
    });
    const outHeaders = withCors(response.headers);
    outHeaders.set("cache-control", "no-store");
    if (response.headers.get("content-type")) outHeaders.set("content-type", response.headers.get("content-type"));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outHeaders });
  } catch (error) {
    const detail = error?.name === "AbortError" ? "Video rendering timed out." : "Video renderer is temporarily unavailable.";
    return json({ detail }, 504);
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ status: "ok", service: "iamagnanimous-video-gateway" });
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withCors() });
    }
    if (!url.pathname.startsWith("/api/video/")) {
      return new Response("Not Found", { status: 404, headers: withCors(new Headers({"content-type":"text/plain; charset=utf-8"})) });
    }
    return proxy(request, env);
  },
};

function textFromResponses(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === 'string' && part.text.trim()) return part.text.trim();
    }
  }
  return '';
}

async function integrationDerivedToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const bytes = new TextEncoder().encode('magnanimous-edge-ai-bridge-integration-v1\0' + raw);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...hash].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function cloudflareModelPath(model) {
  return String(model || '').split('/').filter(Boolean).map((part) => encodeURIComponent(part)).join('/');
}

function cloudflareText(data) {
  const result = data?.result;
  if (typeof result === 'string' && result.trim()) return result.trim();
  if (typeof result?.response === 'string' && result.response.trim()) return result.response.trim();
  if (typeof data?.response === 'string' && data.response.trim()) return data.response.trim();
  return '';
}

function normalizeMessages(input) {
  if (Array.isArray(input?.messages)) {
    return input.messages.map((item) => ({
      role: String(item?.role || 'user'),
      content: String(item?.content || '')
    }));
  }
  if (input?.prompt) return [{ role: 'user', content: String(input.prompt) }];
  return [{ role: 'user', content: String(input?.input || '') }];
}

export class MagnanimousAiBinding {
  constructor(env = process.env) {
    this.env = env;
  }

  async run(_legacyModel, input = {}) {
    const messages = normalizeMessages(input);
    const maxTokens = Number(
      input.max_tokens ||
      input.max_completion_tokens ||
      this.env.MAGNANIMOUS_AI_MAX_TOKENS ||
      2200
    );

    const requestedModel = String(_legacyModel || this.env.CLOUDFLARE_AI_MODEL || '@cf/zai-org/glm-4.7-flash').trim();
    const edgeBridgeToken = String(this.env.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN || '').trim()
      || await integrationDerivedToken(this.env.INTEGRATION_CREDENTIALS_KEY);
    const edgeBridgeUrl = String(this.env.MAGNANIMOUS_EDGE_AI_BRIDGE_URL || 'https://iammagnanimousway.com/api/internal/edge-ai/run').trim();
    if (edgeBridgeToken && edgeBridgeUrl && requestedModel.startsWith('@cf/')) {
      const response = await fetch(edgeBridgeUrl, {
        method: 'POST',
        headers: {'content-type':'application/json',authorization:'Bearer '+edgeBridgeToken},
        body: JSON.stringify({model:requestedModel,messages,max_tokens:maxTokens})
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = String(data?.response || data?.result?.response || '').trim();
        if (text) return {response:text,result:{response:text},provider:'magnanimous-private-edge-ai'};
      }
    }

    const cloudflareToken = String(this.env.CLOUDFLARE_PLATFORM_API_TOKEN || this.env.CLOUDFLARE_API_TOKEN || '').trim();
    const cloudflareAccount = String(this.env.CLOUDFLARE_PLATFORM_ACCOUNT_ID || this.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
    if (cloudflareToken && cloudflareAccount) {
      const model = requestedModel;
      if (model.startsWith('@cf/')) {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccount)}/ai/run/${cloudflareModelPath(model)}`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: 'Bearer ' + cloudflareToken
            },
            body: JSON.stringify({ messages, max_tokens: maxTokens })
          }
        );
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          const text = cloudflareText(data);
          if (text) return { response: text, result: { response: text }, provider: 'cloudflare-workers-ai-rest' };
        }
        const detail = String(data?.errors?.[0]?.message || data?.messages?.[0]?.message || '').trim();
        throw new Error('Cloudflare Workers AI REST rail returned HTTP ' + response.status + (detail ? ': ' + detail : ''));
      }
    }

    const compatibleBase = String(this.env.MAGNANIMOUS_AI_BASE_URL || '').replace(/\/$/, '');
    const compatibleMode=String(this.env.MAGNANIMOUS_AI_BASE_BILLING_MODE||'unverified').trim().toLowerCase();
    if (compatibleBase && ['free','self-hosted'].includes(compatibleMode)) {
      const model = String(this.env.MAGNANIMOUS_AI_MODEL || this.env.OPENAI_MODEL || 'magnanimous-default');
      const headers = { 'content-type': 'application/json' };
      if (this.env.MAGNANIMOUS_AI_API_KEY) {
        headers.authorization = 'Bearer ' + this.env.MAGNANIMOUS_AI_API_KEY;
      }

      const response = await fetch(compatibleBase + '/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, max_tokens: maxTokens })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Magnanimous AI execution rail returned HTTP ' + response.status);

      const text = String(data?.choices?.[0]?.message?.content || '').trim();
      if (!text) throw new Error('Magnanimous AI execution rail returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-compatible' };
    }

    if (this.env.OLLAMA_BASE_URL) {
      const base = String(this.env.OLLAMA_BASE_URL).replace(/\/$/, '');
      const response = await fetch(base + '/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.env.OLLAMA_MODEL || 'qwen3:8b',
          messages,
          stream: false
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Local Magnanimous model rail returned HTTP ' + response.status);

      const text = String(data?.message?.content || '').trim();
      if (!text) throw new Error('Local Magnanimous model rail returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-local' };
    }


    throw new Error(
      'No funded free-first Magnanimous AI execution rail is available. Use the private Edge AI bridge, protected Workers AI rail, local model, or an explicitly free/self-hosted compatible rail. Metered providers are routed only through the tenant-aware billing guard.'
    );
  }
}

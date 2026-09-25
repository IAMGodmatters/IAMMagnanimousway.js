function textFromResponses(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === 'string' && part.text.trim()) return part.text.trim();
    }
  }
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

function promptFromMessages(messages) {
  return messages.map((item) => `${String(item.role || 'user').toUpperCase()}:\n${String(item.content || '')}`).join('\n\n');
}

function timeoutSignal(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('worker-compute-timeout')), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function workerFreeCompute(env, messages) {
  const configured = String(env.MAGNANIMOUS_WORKER_COMPUTE_URL || env.PUBLIC_SITE_URL || '').trim();
  if (!configured) throw new Error('Magnanimous Worker compute URL is not configured.');
  const endpoint = new URL('/api/chat/compute', configured);
  const railwayHost = String(env.RAILWAY_PUBLIC_DOMAIN || '').trim().toLowerCase();
  if (railwayHost && endpoint.hostname.toLowerCase() === railwayHost) {
    throw new Error('Magnanimous Worker compute URL resolves to the standalone service.');
  }

  const payload = JSON.stringify({
    message: promptFromMessages(messages),
    compute_only: true,
    provider: 'auto',
    allow_metered_accelerator: false,
    use_knowledge: false,
    use_tools: false,
    learn_links: false,
    remember_search: false,
    specialist_routing: false,
    live_search: false,
    news: false
  });

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const timeout = timeoutSignal(50000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-magnanimous-compute-client': 'standalone' },
        body: payload,
        signal: timeout.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`Worker compute returned HTTP ${response.status}: ${String(data?.detail || data?.error || 'request failed').slice(0, 300)}`);
      const text = String(data?.output || data?.answer || '').trim();
      if (!text) throw new Error('Worker compute returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-worker-free-first' };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 350));
    } finally {
      timeout.clear();
    }
  }
  throw lastError || new Error('Magnanimous Worker compute failed.');
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

    const compatibleBase = String(this.env.MAGNANIMOUS_AI_BASE_URL || '').replace(/\/$/, '');
    if (compatibleBase) {
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

    let workerComputeError = null;
    try {
      return await workerFreeCompute(this.env, messages);
    } catch (error) {
      workerComputeError = error;
      console.warn('Magnanimous free-first Worker compute unavailable; evaluating allowed fallbacks.', String(error?.message || error));
    }

    const meteredEnabled = String(this.env.ENABLE_METERED_PROVIDERS || '').toLowerCase() === 'true';
    if (this.env.OPENAI_API_KEY && meteredEnabled) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + this.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: this.env.OPENAI_MODEL || 'gpt-5.6-sol',
          input: messages,
          max_output_tokens: maxTokens
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Configured AI execution rail returned HTTP ' + response.status);

      const text = textFromResponses(data);
      if (!text) throw new Error('Configured AI execution rail returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-metered-fallback' };
    }

    throw new Error(
      `No usable free-first Magnanimous AI execution rail is available. ${String(workerComputeError?.message || '').slice(0, 500)} Metered OpenAI remains disabled unless ENABLE_METERED_PROVIDERS=true.`
    );
  }
}

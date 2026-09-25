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

function enabled(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('ai-rail-timeout'), Math.max(1000, Number(timeoutMs) || 30000));
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class MagnanimousAiBinding {
  constructor(env = process.env) {
    this.env = env;
  }

  isConfigured() {
    return Boolean(
      String(this.env.MAGNANIMOUS_AI_BASE_URL || '').trim() ||
      String(this.env.OLLAMA_BASE_URL || '').trim() ||
      (enabled(this.env.ENABLE_METERED_PROVIDERS) && String(this.env.OPENAI_API_KEY || '').trim())
    );
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

      const response = await fetchWithTimeout(compatibleBase + '/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, max_tokens: maxTokens })
      }, Number(this.env.MAGNANIMOUS_AI_TIMEOUT_MS || 30000));
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Magnanimous AI execution rail returned HTTP ' + response.status);

      const text = String(data?.choices?.[0]?.message?.content || '').trim();
      if (!text) throw new Error('Magnanimous AI execution rail returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-compatible' };
    }

    if (this.env.OLLAMA_BASE_URL) {
      const base = String(this.env.OLLAMA_BASE_URL).replace(/\/$/, '');
      const response = await fetchWithTimeout(base + '/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.env.OLLAMA_MODEL || 'qwen3:8b',
          messages,
          stream: false
        })
      }, Number(this.env.MAGNANIMOUS_AI_TIMEOUT_MS || 30000));
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Local Magnanimous model rail returned HTTP ' + response.status);

      const text = String(data?.message?.content || '').trim();
      if (!text) throw new Error('Local Magnanimous model rail returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-local' };
    }

    if (enabled(this.env.ENABLE_METERED_PROVIDERS) && this.env.OPENAI_API_KEY) {
      const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
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
      }, Number(this.env.MAGNANIMOUS_AI_TIMEOUT_MS || 30000));
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Configured AI execution rail returned HTTP ' + response.status);

      const text = textFromResponses(data);
      if (!text) throw new Error('Configured AI execution rail returned no text.');
      return { response: text, result: { response: text }, provider: 'magnanimous-metered-fallback' };
    }

    throw new Error(
      'No standalone Magnanimous AI execution rail is configured. Set OLLAMA_BASE_URL or MAGNANIMOUS_AI_BASE_URL; metered OPENAI_API_KEY is used only when ENABLE_METERED_PROVIDERS=true.'
    );
  }
}

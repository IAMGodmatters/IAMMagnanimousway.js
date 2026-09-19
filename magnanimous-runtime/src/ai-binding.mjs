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

    if (this.env.OPENAI_API_KEY) {
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
      'No Magnanimous AI execution rail is configured. Set OLLAMA_BASE_URL or MAGNANIMOUS_AI_BASE_URL; metered OPENAI_API_KEY remains optional.'
    );
  }
}

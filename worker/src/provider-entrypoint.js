import app from './entrypoint.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY' },
  { id: 'anthropic', name: 'Anthropic', key: 'ANTHROPIC_API_KEY' },
  { id: 'google', name: 'Google Gemini', key: 'GOOGLE_API_KEY' },
  { id: 'groq', name: 'Groq', key: 'GROQ_API_KEY' },
  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY' },
  { id: 'cloudflare-ai', name: 'Cloudflare Workers AI', key: 'AI' }
];

function configured(env, p) { return Boolean(env?.[p.key]); }

async function openai(env, message, model) {
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: model || env.OPENAI_MODEL || 'gpt-5.6', input: message })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || 'OpenAI request failed');
  return d.output_text || '';
}

async function anthropic(env, message, model) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: model || env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 4096, messages: [{ role: 'user', content: message }] })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || 'Anthropic request failed');
  return (d.content || []).map(x => x.text || '').join('');
}

async function google(env, message, model) {
  const m = model || env.GOOGLE_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || 'Google Gemini request failed');
  return (d.candidates?.[0]?.content?.parts || []).map(x => x.text || '').join('');
}

async function openaiCompatible(env, base, key, model, message, label) {
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: message }] })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || `${label} request failed`);
  return d.choices?.[0]?.message?.content || '';
}

async function cloudflare(env, message, model) {
  const result = await env.AI.run(model || env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct', { messages: [{ role: 'user', content: message }] });
  return result?.response || result?.result?.response || '';
}

async function callProvider(id, env, message, model) {
  if (id === 'openai') return openai(env, message, model);
  if (id === 'anthropic') return anthropic(env, message, model);
  if (id === 'google') return google(env, message, model);
  if (id === 'groq') return openaiCompatible(env, 'https://api.groq.com/openai/v1', env.GROQ_API_KEY, model || env.GROQ_MODEL || 'llama-3.3-70b-versatile', message, 'Groq');
  if (id === 'mistral') return openaiCompatible(env, 'https://api.mistral.ai/v1', env.MISTRAL_API_KEY, model || env.MISTRAL_MODEL || 'mistral-large-latest', message, 'Mistral');
  if (id === 'cloudflare-ai') return cloudflare(env, message, model);
  throw new Error('Unknown AI provider');
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/providers' && request.method === 'GET') {
    return json({ providers: PROVIDERS.map(p => ({ id: p.id, name: p.name, configured: configured(env, p), type: 'ai' })) });
  }
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message) return json({ detail: 'Message is required.' }, 400);
    const requested = String(body.provider || 'auto').toLowerCase();
    const candidates = requested !== 'auto' ? PROVIDERS.filter(p => p.id === requested) : PROVIDERS;
    const configuredCandidates = candidates.filter(p => configured(env, p));
    if (!configuredCandidates.length) return json({ detail: 'No configured AI provider is available. Configure at least one provider API key.' }, 503);
    const errors = [];
    for (const p of configuredCandidates) {
      try {
        const output = await callProvider(p.id, env, message, body.model);
        return json({ output, provider: p.id, provider_name: p.name });
      } catch (e) { errors.push(`${p.name}: ${e.message}`); }
    }
    return json({ detail: `All configured AI providers failed. ${errors.join(' | ')}` }, 502);
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const handled = await handle(request, env);
    return handled || app.fetch(request, env, ctx);
  }
};

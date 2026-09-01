import app from './entrypoint.js';
import { handleIntegrations } from './integrations.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const PROVIDERS = [
  { id: 'cloudflare-ai', name: 'Cloudflare Workers AI', key: 'AI', tier: 'free-first' },
  { id: 'google', name: 'Google Gemini', key: 'GOOGLE_API_KEY', tier: 'free-first' },
  { id: 'groq', name: 'Groq', key: 'GROQ_API_KEY', tier: 'free-first' },
  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY', tier: 'free-first' },
  { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY', tier: 'metered' },
  { id: 'anthropic', name: 'Anthropic', key: 'ANTHROPIC_API_KEY', tier: 'metered' }
];

const TOOLS = [
  ['odin','Odin AI Orchestrator','Routes requests across configured AI providers and platform tools.'],
  ['ai-chat','AI Chat','General-purpose AI assistant.'],
  ['writing','Writing Helper','Create, rewrite, summarize and polish content.'],
  ['research','Research Helper','Organize research questions, sources and briefs.'],
  ['bible-study','Bible Study','Study Scripture and organize biblical topics.'],
  ['marketing','Marketing Helper','Create campaigns, captions, offers and content plans.'],
  ['business','Business Helper','Business planning, ideas and analysis.'],
  ['coding','Coding Helper','Explain, generate and troubleshoot code.'],
  ['video-studio','Text → Video Studio','Create creator-ready video content.'],
  ['social','Social Media Helper','Create platform-ready social posts and scripts.'],
  ['video-script','Video Script Helper','Create short- and long-form video scripts.'],
  ['travel','Travel Helper','Build travel plans and itineraries.'],
  ['customer-service','Customer Service Helper','Draft helpful customer responses.']
].map(([id,name,description]) => ({ id, name, description }));

function configured(env, p) {
  if (p.id === 'cloudflare-ai') return env?.AI != null;
  return typeof env?.[p.key] === 'string' && env[p.key].trim().length > 0;
}
function meteredEnabled(env) { return String(env?.ENABLE_METERED_PROVIDERS || '').toLowerCase() === 'true'; }

async function openai(env, message, model) {
  const r = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: model || env.OPENAI_MODEL || 'gpt-5.6', input: message }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'OpenAI request failed'); return d.output_text || '';
}
async function anthropic(env, message, model) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: model || env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 4096, messages: [{ role: 'user', content: message }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'Anthropic request failed'); return (d.content || []).map(x => x.text || '').join('');
}
async function google(env, message, model) {
  const m = model || env.GOOGLE_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'Google Gemini request failed'); return (d.candidates?.[0]?.content?.parts || []).map(x => x.text || '').join('');
}
async function openaiCompatible(base, key, model, message, label) {
  const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages: [{ role: 'user', content: message }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || `${label} request failed`); return d.choices?.[0]?.message?.content || '';
}
async function cloudflare(env, message, model) {
  if (env?.AI == null) throw new Error('Cloudflare Workers AI binding is not configured');
  const result = await env.AI.run(model || env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fast', { messages: [{ role: 'user', content: message }] });
  return result?.response || result?.result?.response || '';
}
async function callProvider(id, env, message, model) {
  if (id === 'openai') return openai(env, message, model);
  if (id === 'anthropic') return anthropic(env, message, model);
  if (id === 'google') return google(env, message, model);
  if (id === 'groq') return openaiCompatible('https://api.groq.com/openai/v1', env.GROQ_API_KEY, model || env.GROQ_MODEL || 'llama-3.3-70b-versatile', message, 'Groq');
  if (id === 'mistral') return openaiCompatible('https://api.mistral.ai/v1', env.MISTRAL_API_KEY, model || env.MISTRAL_MODEL || 'mistral-large-latest', message, 'Mistral');
  if (id === 'cloudflare-ai') return cloudflare(env, message, model);
  throw new Error('Unknown AI provider');
}
function availableProviders(env) { return PROVIDERS.filter(p => p.tier !== 'metered' || meteredEnabled(env)); }

async function getRuntimeEnv(env) {
  if (env?.SESSION_SECRET) return env;
  if (!env?.DB) return env;
  try {
    let row = await env.DB.prepare("SELECT value FROM settings WHERE key='auth_session_secret'").first();
    let secret = row?.value;
    if (!secret) {
      secret = crypto.randomUUID() + crypto.randomUUID();
      await env.DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('auth_session_secret',?)").bind(secret).run();
    }
    return { ...env, SESSION_SECRET: secret };
  } catch (_) {
    return env;
  }
}

async function handle(request, env) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/integrations')) {
    const handled = await handleIntegrations(request, env);
    if (handled) return handled;
  }

  if (url.pathname === '/api/tools' && request.method === 'GET') return json({ tools: TOOLS });
  if (url.pathname === '/api/ads' && request.method === 'GET') {
    try {
      const placement = url.searchParams.get('placement') || 'home';
      const { results } = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads WHERE active=1 AND placement=? ORDER BY id DESC').bind(placement).all();
      return json({ ads: results || [] });
    } catch (_) {
      return json({ ads: [] });
    }
  }
  if (url.pathname === '/api/providers' && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ id: p.id, name: p.name, configured: configured(env, p), enabled: p.tier !== 'metered' || meteredEnabled(env), tier: p.tier, type: 'ai' }));
    const enabled = providers.filter(p => p.configured && p.enabled);
    return json({ free_first: true, metered_providers_enabled: meteredEnabled(env), providers, configured_count: enabled.length, free_configured_count: enabled.filter(p => p.tier === 'free-first').length });
  }
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const body = await request.json(); const message = String(body.message || '').trim(); if (!message) return json({ detail: 'Message is required.' }, 400);
    const requested = String(body.provider || 'auto').toLowerCase(); const available = availableProviders(env); const candidates = requested !== 'auto' ? available.filter(p => p.id === requested) : available; const configuredCandidates = candidates.filter(p => configured(env, p));
    if (!configuredCandidates.length) return json({ detail: requested === 'auto' ? 'No free-first AI provider is configured. Add a free-tier provider key or Cloudflare Workers AI binding.' : 'The requested AI provider is not configured or is disabled.' }, 503);
    const errors = []; for (const p of configuredCandidates) { try { const output = await callProvider(p.id, env, message, body.model); return json({ output, provider: p.id, provider_name: p.name }); } catch (e) { errors.push(`${p.name}: ${e.message}`); } }
    return json({ detail: `All enabled AI providers failed. ${errors.join(' | ')}` }, 502);
  }
  return null;
}
export default { async fetch(request, env, ctx) { const runtimeEnv = await getRuntimeEnv(env); const handled = await handle(request, runtimeEnv); return handled || app.fetch(request, runtimeEnv, ctx); } };
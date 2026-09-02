import app from './entrypoint.js';
import { handleIntegrations } from './integrations.js';
import { getKnowledgeContext } from './knowledge-runtime.js';

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
  ['odin','I AM Operator','Coordinates requests across configured AI providers and platform capabilities.'],
  ['ai-chat','AI Chat','General-purpose AI assistant.'],
  ['writing','Writing Helper','Create, rewrite, summarize and polish content.'],
  ['research','Research Helper','Research live web/news sources and private workspace knowledge.'],
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

function extractCloudflareText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result.response === 'string') return result.response;
  if (typeof result.result?.response === 'string') return result.result.response;
  if (typeof result.result === 'string') return result.result;
  if (Array.isArray(result.result)) return result.result.map(x => x?.response || x?.text || '').filter(Boolean).join('\n');
  if (Array.isArray(result.choices)) return result.choices.map(x => x?.message?.content || x?.text || '').filter(Boolean).join('\n');
  return '';
}

async function cloudflare(env, message, model) {
  if (env?.AI == null) throw new Error('Cloudflare Workers AI binding is not configured');
  const requested = String(model || env.CLOUDFLARE_AI_MODEL || '').trim();
  const models = [...new Set([
    requested,
    '@cf/meta/llama-3.1-8b-instruct-fast',
    '@cf/meta/llama-3.2-1b-instruct',
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
  ].filter(Boolean))];
  const errors = [];
  for (const m of models) {
    try {
      const result = await env.AI.run(m, {
        messages: [
          { role: 'system', content: 'You are I AM Operator, the orchestration assistant for I AM Magnanimous Way. Start with the user’s outcome, coordinate the relevant platform capabilities, and be useful, clear, practical, and concise unless the user asks for depth. When grounding sources are provided, use them carefully and cite them with their bracket numbers. Never mix one tenant workspace with another. For actions that would change or send data through connected external services, make the proposed action clear so the user can remain in control of approval.' },
          { role: 'user', content: message }
        ],
        max_tokens: 1400
      });
      const text = extractCloudflareText(result).trim();
      if (text) return { text, model: m };
      errors.push(`${m}: empty response`);
    } catch (e) {
      errors.push(`${m}: ${e?.message || 'inference failed'}`);
    }
  }
  throw new Error(`Workers AI inference failed. ${errors.join(' | ')}`);
}

async function callProvider(id, env, message, model) {
  if (id === 'openai') return { text: await openai(env, message, model), model: model || env.OPENAI_MODEL || 'gpt-5.6' };
  if (id === 'anthropic') return { text: await anthropic(env, message, model), model: model || env.ANTHROPIC_MODEL || 'claude-sonnet-4-5' };
  if (id === 'google') return { text: await google(env, message, model), model: model || env.GOOGLE_MODEL || 'gemini-2.5-flash' };
  if (id === 'groq') return { text: await openaiCompatible('https://api.groq.com/openai/v1', env.GROQ_API_KEY, model || env.GROQ_MODEL || 'llama-3.3-70b-versatile', message, 'Groq'), model: model || env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
  if (id === 'mistral') return { text: await openaiCompatible('https://api.mistral.ai/v1', env.MISTRAL_API_KEY, model || env.MISTRAL_MODEL || 'mistral-large-latest', message, 'Mistral'), model: model || env.MISTRAL_MODEL || 'mistral-large-latest' };
  if (id === 'cloudflare-ai') return cloudflare(env, message, model);
  throw new Error('Unknown AI provider');
}
function availableProviders(env) { return PROVIDERS.filter(p => p.tier !== 'metered' || meteredEnabled(env)); }

async function getRuntimeEnv(env) {
  if (env?.SESSION_SECRET) return env;
  if (!env?.DB) return env;
  try {
    const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
    if (row?.value) return { ...env, SESSION_SECRET: String(row.value) };
  } catch (_) {}
  return env;
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
    } catch (_) { return json({ ads: [] }); }
  }
  if (url.pathname === '/api/providers' && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ id: p.id, name: p.name, configured: configured(env, p), enabled: p.tier !== 'metered' || meteredEnabled(env), tier: p.tier, type: 'ai' }));
    const enabled = providers.filter(p => p.configured && p.enabled);
    const ready = enabled.length > 0;
    return json({ free_first: true, metered_providers_enabled: meteredEnabled(env), providers, configured_count: enabled.length, free_configured_count: enabled.filter(p => p.tier === 'free-first').length, operator_ready: ready, odin_ready: ready });
  }
  if (url.pathname === '/api/odin/health' && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ id: p.id, configured: configured(env, p), enabled: p.tier !== 'metered' || meteredEnabled(env) }));
    return json({ ok: true, operator: 'online', odin: 'online', workers_ai_bound: env?.AI != null, web_search_configured: Boolean(env?.BRAVE_SEARCH_API_KEY), providers });
  }
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message) return json({ detail: 'Message is required.' }, 400);
    let grounding={context:'',sources:[],search_configured:Boolean(env?.BRAVE_SEARCH_API_KEY)};
    if(body.use_knowledge!==false){
      try{grounding=await getKnowledgeContext(request,env,message,{liveSearch:Boolean(body.live_search),news:Boolean(body.news),remember:Boolean(body.remember_search),freshness:String(body.freshness||''),localLimit:6,webLimit:5,newsLimit:5})}catch(e){console.error('knowledge grounding failed',e)}
    }
    const groundedMessage=`${message}${grounding.context||''}`;
    const requested = String(body.provider || 'auto').toLowerCase();
    const available = availableProviders(env);
    const candidates = requested !== 'auto' ? available.filter(p => p.id === requested) : available;
    const configuredCandidates = candidates.filter(p => configured(env, p));
    if (!configuredCandidates.length) return json({ detail: requested === 'auto' ? 'I AM Operator has no configured AI provider. Cloudflare Workers AI should be bound as AI, or another free-first provider must be configured.' : 'The requested AI provider is not configured or is disabled.', code: 'NO_AI_PROVIDER' }, 503);
    const errors = [];
    for (const p of configuredCandidates) {
      try {
        const result = await callProvider(p.id, env, groundedMessage, body.model);
        if (!result?.text?.trim()) throw new Error('Provider returned an empty response');
        return json({ output: result.text, provider: p.id, provider_name: p.name, model: result.model, operator: true, odin: true, grounded: grounding.sources.length>0, sources: grounding.sources, web_search_configured: grounding.search_configured });
      } catch (e) { errors.push(`${p.name}: ${e?.message || 'provider failed'}`); }
    }
    return json({ detail: `I AM Operator could not complete the request. ${errors.join(' | ')}`, code: 'AI_PROVIDER_FAILURE' }, 502);
  }
  return null;
}
export default { async fetch(request, env, ctx) { const runtimeEnv = await getRuntimeEnv(env); const handled = await handle(request, runtimeEnv); return handled || app.fetch(request, runtimeEnv, ctx); } };

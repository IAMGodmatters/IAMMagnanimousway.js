import app from './entrypoint.js';
import { handleIntegrations, currentUser } from './integrations.js';
import { getKnowledgeContext, handleKnowledge } from './knowledge-runtime.js';
import { getMagnanimousMemoryContext } from './magnanimous-brain-runtime.js';
import { getMagnanimousToolFoundryContext, handleMagnanimousToolFoundry } from './magnanimous-tool-foundry.js';
import { getMagnanimousOgenicPrompt, buildMagnanimousOgenicPlan, handleMagnanimousOgenic } from './magnanimous-ogenic-god-toolkit.js';
import { hasAnyReadyLocalBridge, hasReadyLocalBridge, hasAnyReadyLocalBridgeCapability } from './magnanimous-local-bridge-runtime.js';
import { getMagnanimousSingleBrainSummary, magnanimousPublicRoutingSummary } from './magnanimous-single-brain-contract.js';
import { getConnectorAbsorptionPrompt } from './magnanimous-connector-absorption.js';
import {canUsePremium,recordUsage} from './usage-guard.js';
import {conservativeProviderReserve,providerBillingMode,providerOriginCost} from './provider-origin-pricing.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);
const MEMORY_MARKER = '\n\nMAGNANIMOUS CENTRAL BRAIN CONTEXT';

const COMMANDER_PROTOCOL = `MAGNANIMOUS COMMAND LAYER
You are speaking as Magnanimous AI, the commander-in-chief orchestration brain for I AM Magnanimous Way™.
Magnanimous AI is the only public AI identity for the platform. Specialist agents are Magnanimous departments, not separate AI products. All outside AI models, search engines, plugins, MCP servers, SaaS products, carriers, browsers, hosts and generators are private replaceable execution engines or tools under Magnanimous routing. They are never the platform identity or the final authority over the workflow.
Use Magnanimous private memory, learned lessons, stored knowledge and native tool recipes before reaching outward. Use fresh research when facts are current, stale, uncertain or source-dependent.
Magnanimous AI is the durable remembrance layer for the platform: decisions, useful context, learned lessons, proven workflows and continuity belong to Magnanimous memory, never to a replaceable outside model.
When the user supplies a public link, learn the readable information into the tenant knowledge workspace so the user does not have to keep supplying the same link. Do not copy secrets, credentials, paywalled material or proprietary backend code.
Repeated successful low-risk workflows should become reusable Magnanimous-native recipes. External providers remain necessary only when they offer a capability, live data, account access or compute Magnanimous cannot truthfully reproduce natively.
Specialist agents are Magnanimous departments. Magnanimous owns planning, continuity, routing, verification, memory and learning across them. Never ask ordinary customers to choose an outside provider or model; choose the best authorized path privately.
Use the Magnanimous Capability Mesh as the provider-neutral execution map for native web, GitHub engineering, Magnanimous Cloud, optional Cloudflare adapters and optional Railway capacity rails. Prefer native-ready surfaces, report degraded readiness truthfully, and never confuse an installed contract with a live authorized executor.
Never claim an external action happened without an actual authorized tool result. Never bypass security, identity, payment or permission boundaries.`;

const PROVIDERS = [
  { id: 'cloudflare-ai', name: 'Cloudflare Workers AI', key: 'AI', tier: 'free-first' },
  { id: 'google', name: 'Google Gemini', key: 'GOOGLE_API_KEY', tier: 'free-first' },
  { id: 'groq', name: 'Groq', key: 'GROQ_API_KEY', tier: 'free-first' },
  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY', tier: 'free-first' },
  { id: 'openrouter-free', name: 'OpenRouter Free Models', key: 'OPENROUTER_API_KEY', tier: 'free-first' },
  { id: 'nvidia-kimi', name: 'NVIDIA NIM — Kimi K3', key: 'NVIDIA_API_KEY', tier: 'free-first' },
  { id: 'nvidia-deepseek-pro', name: 'NVIDIA NIM — DeepSeek V4 Pro', key: 'NVIDIA_API_KEY', tier: 'free-first' },
  { id: 'nvidia-deepseek-flash', name: 'NVIDIA NIM — DeepSeek V4.1 Flash', key: 'NVIDIA_API_KEY', tier: 'free-first' },
  { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY', tier: 'metered' },
  { id: 'anthropic', name: 'Anthropic', key: 'ANTHROPIC_API_KEY', tier: 'metered' }
];

const TOOLS = [
  ['magnanimous','Magnanimous AI','Commander-in-chief brain that plans, remembers, learns, routes, verifies and coordinates every supported platform capability.'],
  ['ai-chat','AI Chat','General-purpose AI assistant.'],
  ['writing','Writing Helper','Create, rewrite, summarize and polish content.'],
  ['research','Research Helper','Research live web/news sources and private workspace knowledge.'],
  ['native-web','Native Web Agent','Magnanimous-owned browser search, rendered extraction, browser workflows, persistent local sessions and monitoring through a paired Local Bridge.'],
  ['capability-mesh','Capability Mesh','Unified Magnanimous routing across native web, GitHub, Magnanimous Cloud, Cloudflare adapters and Railway deployment rails.'],
  ['bible-study','Bible Study','Study Scripture and organize biblical topics.'],
  ['marketing','Marketing Helper','Create campaigns, captions, offers and content plans.'],
  ['business','Business Helper','Business planning, ideas and analysis.'],
  ['business-launch','Professional Business Launch','Intake, research, validation, financial review, hostile critique and final plan preparation.'],
  ['coding','Coding Helper','Explain, generate and troubleshoot code.'],
  ['video-studio','Text → Video Studio','Create creator-ready video content.'],
  ['social','Social Media Helper','Create platform-ready social posts and scripts.'],
  ['video-script','Video Script Helper','Create short- and long-form video scripts.'],
  ['travel','Travel Helper','Build travel plans and itineraries.'],
  ['customer-service','Customer Service Helper','Draft helpful customer responses.']
].map(([id,name,description]) => ({ id, name, description }));

function nvidiaExecutionAllowed(env){
  const licensed=String(env?.NVIDIA_AI_ENTERPRISE_LICENSE_CONFIRMED||'').toLowerCase()==='true';
  const mode=String(env?.MAGNANIMOUS_ENV||env?.NODE_ENV||'production').toLowerCase();
  const developer=String(env?.NVIDIA_NIM_DEVELOPER_MODE||'').toLowerCase()==='true'&&['development','test'].includes(mode);
  return licensed||developer;
}
function configured(env, p) {
  if (p.id === 'cloudflare-ai') return env?.AI != null;
  if(p.id.startsWith('nvidia-')&&!nvidiaExecutionAllowed(env))return false;
  return typeof env?.[p.key] === 'string' && env[p.key].trim().length > 0;
}
function meteredEnabled(env) { return String(env?.ENABLE_METERED_PROVIDERS || '').toLowerCase() === 'true'; }
function effectiveTier(env,p){
  const billing=providerBillingMode(env,p.id);
  return billing!=='free'&&p.tier==='free-first'?'metered':p.tier;
}
function providerEnabled(env,p){return effectiveTier(env,p)!=='metered'||meteredEnabled(env)}
function selectedExecutionModel(env,p,body={}){
 const explicit=String(body.model||'').trim();if(explicit)return explicit;
 const quality=String(body.quality||body.route_policy||'').toLowerCase();
 if(p.id==='openai')return ['max','maximum','quality'].includes(quality)?String(env.OPENAI_QUALITY_MODEL||'gpt-6-sol'):String(env.OPENAI_MODEL||'gpt-6-luna');
 if(p.id==='anthropic')return String(env.ANTHROPIC_MODEL||'claude-sonnet-5');
 if(p.id==='google')return String(env.GOOGLE_MODEL||'gemini-3.8-flash');
 if(p.id==='groq')return String(env.GROQ_MODEL||'openai/gpt-oss-120b');
 if(p.id==='mistral')return String(env.MISTRAL_MODEL||'mistral-large-latest');
 if(p.id==='openrouter-free')return String(env.OPENROUTER_FREE_MODEL||'openrouter/free');
 if(p.id==='nvidia-kimi')return String(env.NVIDIA_KIMI_MODEL||'moonshotai/kimi-k3');
 if(p.id==='nvidia-deepseek-pro')return String(env.NVIDIA_DEEPSEEK_PRO_MODEL||'deepseek-ai/deepseek-v4-pro-0813');
 if(p.id==='nvidia-deepseek-flash')return String(env.NVIDIA_DEEPSEEK_FLASH_MODEL||'deepseek-ai/deepseek-v4.1-flash');
 return'';
}
function originalUserMessage(message) {
  const text = String(message || '');
  const i = text.indexOf(MEMORY_MARKER);
  return (i >= 0 ? text.slice(0, i) : text).trim();
}
function extractBrainContext(message) {
  const text = String(message || '');
  const i = text.indexOf(MEMORY_MARKER);
  return i >= 0 ? text.slice(i) : '';
}
function extractUrls(message) {
  const matches = String(message || '').match(/https?:\/\/[^\s<>{}\[\]"']+/gi) || [];
  return [...new Set(matches.map(x => x.replace(/[),.;!?]+$/g, '')))].slice(0, 4);
}
function needsFreshResearch(message) {
  return /\b(latest|current|today|recent|now|this week|this month|news|price|availability|status|updated|update|verify|source|citation|research|competitor|market)\b/i.test(String(message || ''));
}
function nativeCapability(message, task) {
  const m = String(message || '').toLowerCase();
  if (/browse|browser|open website|click|fill|form|scrape|crawl|rendered page|web automation|website monitor/.test(m)) return 'native-web-browser-automation';
  if (/shopify|shopee|tiktok shop|product|catalog|markup|upsell|dropship|inventory|store/.test(m)) return 'commerce-catalog-operations';
  if (/facebook|instagram|tiktok|linkedin|youtube|social|caption|hashtag|post/.test(m)) return 'social-content-operations';
  if (/website|next\.?js|cloudflare|github|deploy|repository|worker|d1|frontend|backend/.test(m)) return 'web-platform-development';
  if (/call center|contact center|twilio|telnyx|phone|dialer|ivr|voice/.test(m)) return 'communications-operations';
  if (/crm|lead|customer|pipeline|sales/.test(m)) return 'crm-sales-operations';
  if (/finance|budget|cash flow|break-even|profit|expense|revenue/.test(m)) return 'financial-analysis';
  if (/image|picture|graphic|logo|visual/.test(m)) return 'visual-creation';
  if (/video|avatar|cinema|render/.test(m)) return 'video-creation';
  return `${task || 'general'}-workflow`;
}

const PROVIDER_FETCH_TIMEOUT_MS=30000;
const PROVIDER_REQUEST_BUDGET_MS=55000;
const CLOUDFLARE_MODEL_BUDGET_MS=45000;
const CLOUDFLARE_ATTEMPT_TIMEOUT_MS=18000;
let outcomeSchemaReady=false;
let outcomeSchemaPromise=null;

async function providerFetch(input,init={},timeoutMs=PROVIDER_FETCH_TIMEOUT_MS){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort('provider-timeout'),Math.max(1000,Number(timeoutMs)||PROVIDER_FETCH_TIMEOUT_MS));
  try{return await fetch(input,{...init,signal:controller.signal})}finally{clearTimeout(timer)}
}
async function withinProviderBudget(promise,timeoutMs,label='AI execution'){
  let timer;
  try{
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out`)),Math.max(1000,Number(timeoutMs)||1000))})
    ]);
  }finally{clearTimeout(timer)}
}

async function openai(env, message, model) {
  const r = await providerFetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: model || env.OPENAI_MODEL || 'gpt-6-luna', input: message }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'OpenAI request failed');
  return {text:d.output_text || '',usage:d.usage||{}};
}
async function anthropic(env, message, model) {
  const r = await providerFetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: model || env.ANTHROPIC_MODEL || 'claude-sonnet-5', max_tokens: 4096, messages: [{ role: 'user', content: message }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'Anthropic request failed');
  return {text:(d.content || []).map(x => x.text || '').join(''),usage:d.usage||{}};
}
async function google(env, message, model) {
  const m = model || env.GOOGLE_MODEL || 'gemini-3.8-flash';
  const r = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,  { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: message }] }], generationConfig:{maxOutputTokens:4096} }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || 'Google Gemini request failed');
  return {text:(d.candidates?.[0]?.content?.parts || []).map(x => x.text || '').join(''),usage:d.usageMetadata||{}};
}
async function openaiCompatible(base, key, model, message, label) {
  const r = await providerFetch(`${base}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ model, max_tokens:4096, messages: [{ role: 'user', content: message }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || `${label} request failed`);
  return {text:d.choices?.[0]?.message?.content || '',usage:d.usage||{}};
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
    '@cf/zai-org/glm-4.7-flash',
    '@cf/nvidia/nemotron-3-120b-a12b',
    '@cf/google/gemma-4-26b-a4b-it'
  ].filter(Boolean))];
  const errors = [],deadline=Date.now()+CLOUDFLARE_MODEL_BUDGET_MS;
  for (const m of models) {
    const remaining=deadline-Date.now();
    if(remaining<1500){errors.push('Workers AI fallback budget exhausted');break}
    try {
      const result = await withinProviderBudget(env.AI.run(m, {
        messages: [
          { role: 'system', content: COMMANDER_PROTOCOL },
          { role: 'user', content: message }
        ],
        max_tokens: 1400
      }),Math.min(CLOUDFLARE_ATTEMPT_TIMEOUT_MS,remaining),`Workers AI ${m}`);
      const text = extractCloudflareText(result).trim();
      if (text) return { text, model: m };
      errors.push(`${m}: empty response`);
    } catch (e) {
      errors.push(`${m}: ${e?.message || 'inference failed'}`);
    }
  }
  throw new Error(`Workers AI inference failed within the bounded request budget. ${errors.join(' | ')}`);
}

async function callProvider(id, env, message, model) {
  if (id === 'openai') {const m=model || env.OPENAI_MODEL || 'gpt-6-luna',out=await openai(env,message,m);return {...out,model:m};}
  if (id === 'anthropic') {const m=model || env.ANTHROPIC_MODEL || 'claude-sonnet-5',out=await anthropic(env,message,m);return {...out,model:m};}
  if (id === 'google') {const m=model || env.GOOGLE_MODEL || 'gemini-3.8-flash',out=await google(env,message,m);return {...out,model:m};}
  if (id === 'groq') {const m=model || env.GROQ_MODEL || 'openai/gpt-oss-120b',out=await openaiCompatible('https://api.groq.com/openai/v1',env.GROQ_API_KEY,m,message,'Groq');return {...out,model:m};}
  if (id === 'mistral') {const m=model || env.MISTRAL_MODEL || 'mistral-large-latest',out=await openaiCompatible('https://api.mistral.ai/v1',env.MISTRAL_API_KEY,m,message,'Mistral');return {...out,model:m};}
  if (id === 'openrouter-free') {const m=model || env.OPENROUTER_FREE_MODEL || 'openrouter/free',out=await openaiCompatible('https://openrouter.ai/api/v1',env.OPENROUTER_API_KEY,m,message,'OpenRouter Free');return {...out,model:m};}
  if (id === 'nvidia-kimi') {const m=model || env.NVIDIA_KIMI_MODEL || 'moonshotai/kimi-k3',out=await openaiCompatible('https://integrate.api.nvidia.com/v1',env.NVIDIA_API_KEY,m,message,'NVIDIA Kimi');return {...out,model:m};}
  if (id === 'nvidia-deepseek-pro') {const m=model || env.NVIDIA_DEEPSEEK_PRO_MODEL || 'deepseek-ai/deepseek-v4-pro-0813',out=await openaiCompatible('https://integrate.api.nvidia.com/v1',env.NVIDIA_API_KEY,m,message,'NVIDIA DeepSeek Pro');return {...out,model:m};}
  if (id === 'nvidia-deepseek-flash') {const m=model || env.NVIDIA_DEEPSEEK_FLASH_MODEL || 'deepseek-ai/deepseek-v4.1-flash',out=await openaiCompatible('https://integrate.api.nvidia.com/v1',env.NVIDIA_API_KEY,m,message,'NVIDIA DeepSeek Flash');return {...out,model:m};}
  if (id === 'cloudflare-ai') return cloudflare(env, message, model);
  throw new Error('Unknown AI provider');
}
function availableProviders(env) { return PROVIDERS.filter(p => providerEnabled(env,p)); }
function taskClass(message,body={}){
  const m=String(message||'').toLowerCase();
  if(body.live_search||body.news||/research|latest|current|source|cite|market size|competitor/.test(m))return'research';
  if(/code|debug|typescript|javascript|python|sql|api|function|repository|deploy/.test(m))return'coding';
  if(/business plan|financial|cash flow|break-even|investor|lender|grant|startup|strategy|market/.test(m))return'business';
  if(/write|rewrite|email|caption|script|post|copy|letter|proposal/.test(m))return'writing';
  return'general';
}
async function ensureOutcomeSchema(env){
  if(!env?.DB||outcomeSchemaReady)return;
  if(outcomeSchemaPromise)return outcomeSchemaPromise;
  outcomeSchemaPromise=env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_outcomes (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,provider TEXT NOT NULL DEFAULT 'native',task TEXT NOT NULL DEFAULT '',success INTEGER NOT NULL DEFAULT 0,quality REAL NOT NULL DEFAULT 0,cost_hint REAL NOT NULL DEFAULT 0,latency_ms INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run()
    .then(()=>{outcomeSchemaReady=true})
    .catch(error=>{outcomeSchemaPromise=null;throw error});
  return outcomeSchemaPromise;
}
async function learnedProviderScores(request,env,task){
  if(!env?.DB)return new Map();
  try{
    const user=await currentUser(request,env);if(!user)return new Map();await ensureOutcomeSchema(env);
    const cutoff=now()-90*86400;
    const {results=[]}=await env.DB.prepare(`SELECT provider,COUNT(*) samples,AVG(success) success_rate,AVG(quality) quality,AVG(latency_ms) latency,AVG(cost_hint) cost FROM magnanimous_outcomes WHERE tenant_id=? AND user_id=? AND capability=? AND created_at>=? GROUP BY provider`).bind(String(user.tenant_id),String(user.id),task,cutoff).all();
    return new Map(results.map(x=>[String(x.provider),{samples:Number(x.samples||0),success_rate:Number(x.success_rate||0),quality:Number(x.quality||0),latency:Number(x.latency||0),cost:Number(x.cost||0)}]));
  }catch{return new Map()}
}
function routeProviders(env,message,body={},learned=new Map()){
  const available=availableProviders(env).filter(p=>configured(env,p));
  const quality=String(body.quality||body.route_policy||'').toLowerCase();
  const task=taskClass(message,body);
  const order={
    research:['google','nvidia-kimi','cloudflare-ai','nvidia-deepseek-flash','groq','mistral','nvidia-deepseek-pro','openrouter-free','openai','anthropic'],
    coding:['nvidia-deepseek-pro','nvidia-deepseek-flash','nvidia-kimi','mistral','groq','cloudflare-ai','google','openrouter-free','openai','anthropic'],
    business:['nvidia-kimi','nvidia-deepseek-pro','google','cloudflare-ai','nvidia-deepseek-flash','mistral','groq','openrouter-free','openai','anthropic'],
    writing:['cloudflare-ai','nvidia-kimi','nvidia-deepseek-flash','mistral','google','groq','nvidia-deepseek-pro','openrouter-free','openai','anthropic'],
    general:['cloudflare-ai','nvidia-kimi','nvidia-deepseek-flash','google','groq','mistral','nvidia-deepseek-pro','openrouter-free','openai','anthropic']
  }[task]||[];
  const preferred=(quality==='max'||quality==='maximum'||quality==='quality')?['openai','anthropic',...order]:order;
  const rank=new Map([...new Set(preferred)].map((id,i)=>[id,i]));
  const adaptiveScore=p=>{
    const base=rank.get(p.id)??99,stats=learned.get(p.id);
    if(!stats||stats.samples<2)return base;
    const reliability=(stats.success_rate*1.4)+(stats.quality*.8);
    const latencyPenalty=Math.min(.45,stats.latency/40000);
    const costPenalty=Math.min(.4,stats.cost*.1);
    return base-reliability+latencyPenalty+costPenalty;
  };
  return available.sort((a,b)=>adaptiveScore(a)-adaptiveScore(b));
}
async function recordProviderOutcome(request,env,{task,provider,message,success,quality=0,latency=0,notes=''}){
  if(!env?.DB)return;
  try{
    const user=await currentUser(request,env);if(!user)return;await ensureOutcomeSchema(env);
    await env.DB.prepare('INSERT INTO magnanimous_outcomes(tenant_id,user_id,capability,provider,task,success,quality,cost_hint,latency_ms,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(String(user.tenant_id),String(user.id),task,String(provider||'native'),String(message||'').slice(0,1000),success?1:0,Math.max(0,Math.min(1,Number(quality||0))),0,Math.max(0,Number(latency||0)),String(notes||'').slice(0,1500),now()).run();
  }catch(e){console.error('Magnanimous outcome learning failed',e)}
}
async function learnFromLinks(request,env,message,enabled=true){
  if(!enabled||!env?.DB)return[];
  const urls=extractUrls(message),learned=[];
  for(const target of urls){
    try{
      const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
      const r=await handleKnowledge(new Request(new URL('/api/knowledge/ingest',request.url),{method:'POST',headers,body:JSON.stringify({kind:'url',url:target})}),env);
      const d=await r?.clone().json().catch(()=>({}));
      learned.push({url:target,ok:Boolean(r?.ok),title:d?.title||'',chunks:Number(d?.chunks||0),detail:r?.ok?'absorbed':String(d?.error||d?.detail||`status ${r?.status||0}`)});
    }catch(e){learned.push({url:target,ok:false,title:'',chunks:0,detail:String(e?.message||'ingest failed')})}
  }
  return learned;
}
async function foundryCall(request,env,path,body){
  if(!env?.DB)return null;
  try{
    const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
    const r=await handleMagnanimousToolFoundry(new Request(new URL(path,request.url),{method:'POST',headers,body:JSON.stringify(body)}),env);
    return r?await r.clone().json().catch(()=>null):null;
  }catch{return null}
}

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

  if (url.pathname.startsWith('/api/magnanimous/tool-foundry')) {
    const handled = await handleMagnanimousToolFoundry(request, env);
    if (handled) return handled;
  }

  if (url.pathname === '/api/tools' && request.method === 'GET') return json({ tools: TOOLS });
  if (url.pathname === '/api/operator/capabilities' && request.method === 'GET') {
    const localBridgeReady=await hasAnyReadyLocalBridge(env).catch(()=>false);
    const nativeBrowserReady=await hasAnyReadyLocalBridgeCapability(env,'browser_fetch').catch(()=>false);
    const providerRows=PROVIDERS.map(p=>({configured:configured(env,p),enabled:providerEnabled(env,p),tier:effectiveTier(env,p)}));
    return json({
    operator:'Magnanimous AI',
    command_role:'commander-in-chief',
    public_ai_identity:'Magnanimous AI',
    routing:{task_aware:true,automatic_failover:true,manual_provider_override:false,private_execution_selection:true,free_first_default:true,maximum_quality_option:true,learned_tool_planning:true,integration_ranking:true,adaptive_provider_learning:true,ogenic_god_toolkit:true,cloud_local_hybrid:true,suggestive_initiation:true},
    execution_routing:magnanimousPublicRoutingSummary(providerRows),
    single_brain:getMagnanimousSingleBrainSummary(),
    knowledge:{private_workspace_grounding:true,live_web_search:true,news_search:true,automatic_link_learning:true,remembered_research:true,brave_search_configured:Boolean(env?.BRAVE_SEARCH_API_KEY),fallback_enabled:true},
    execution:{specialist_agent_mesh:true,connected_actions:true,crm:true,business_email:true,calling:true,video:true,social:true,professional_business_launch:true,tool_foundry:true,universal_tool_gateway:true,capability_mesh:true,native_recipe_growth:true,ogenic_god_toolkit:true,netwalk_contract:true,safe_action_initiation:true,native_web_agent:true},
    native_web:{runtime:true,browser_ready:nativeBrowserReady,search:true,rendered_fetch:true,batch_fetch:true,source_backed_research:true,read_flows:true,interactive_flows:true,persistent_local_profiles:true,persistent_browser_sessions:true,status_streaming:true,completion_webhooks:true,scheduled_monitoring:true,monitor_run_now:true,usage_accounting:true,free_first:true,tinyfish_required:false,remote_cdp_exposed:false,owned_geo_proxy_fleet:false,execution_surface:'Magnanimous Local Bridge + local Chromium'},
    learning_loop:['absorb links and sources','retrieve saved knowledge','plan centrally','route execution','verify outcome','score providers and recipes','promote successful low-risk recipes'],
    business_launch:{pipeline:['Intake','Clarify','Research','Validate','Financial Review','Draft','Hostile Review','Consistency Check','Audience Adaptation','Final Polish']},
    local_bridge:{runtime:true,connected:localBridgeReady,native_browser_ready:nativeBrowserReady,transport:'outbound-only',raw_shell:false},
    note:'Magnanimous is the persistent command and learning layer. External integrations remain necessary where account authorization, live provider data or specialized compute is required.'
  });
  }
  if (url.pathname === '/api/ads' && request.method === 'GET') {
    if(String(env.MAGNANIMOUS_SPONSORED_ADS_ENABLED||'').trim().toLowerCase()!=='true')return json({ads:[]});
    try {
      const placement = url.searchParams.get('placement') || 'home';
      const { results } = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads WHERE active=1 AND placement=? ORDER BY id DESC').bind(placement).all();
      return json({ ads: results || [] });
    } catch (_) { return json({ ads: [] }); }
  }
  if (url.pathname === '/api/providers' && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ id: p.id, name: p.name, configured: configured(env, p), enabled: providerEnabled(env,p), tier: effectiveTier(env,p), type: 'execution-engine' }));
    const enabled = providers.filter(p => p.configured && p.enabled);
    const ready = enabled.length > 0;
    return json({ free_first: true, metered_providers_enabled: meteredEnabled(env), command_role:'commander-in-chief', task_aware_routing:true, automatic_failover:true, learned_tool_planning:true, adaptive_provider_learning:true, automatic_link_learning:true, providers, configured_count: enabled.length, free_configured_count: enabled.filter(p => p.tier === 'free-first').length, magnanimous_ready: ready, operator_ready: ready });
  }
  if (url.pathname === '/api/magnanimous/single-brain' && request.method === 'GET') return json(getMagnanimousSingleBrainSummary());
  if ((url.pathname === '/api/magnanimous/health' || url.pathname === '/api/odin/health') && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ configured: configured(env, p), enabled: providerEnabled(env,p), tier:effectiveTier(env,p) }));
    const localBridgeReady=await hasAnyReadyLocalBridge(env).catch(()=>false);
    const nativeBrowserReady=await hasAnyReadyLocalBridgeCapability(env,'browser_fetch').catch(()=>false);
    return json({ ok: true, magnanimous: 'online', operator: 'Magnanimous AI', public_ai_identity:'Magnanimous AI', command_role:'commander-in-chief', task_aware_routing:true, automatic_failover:true, learned_tool_planning:true, adaptive_provider_learning:true, automatic_link_learning:true, native_recipe_growth:true, ogenic_god_toolkit:true, suggestive_initiation:true, local_bridge_runtime:true, local_bridge_configured:localBridgeReady, local_bridge_transport:'outbound-only', native_web_runtime:true, native_browser_ready:nativeBrowserReady, native_web_tinyfish_required:false, native_web_execution_surface:'Magnanimous Local Bridge + local Chromium', workers_ai_bound: env?.AI != null, web_search_configured:true, news_search_configured:true, brave_search_configured:Boolean(env?.BRAVE_SEARCH_API_KEY), research_fallback_enabled:true, routing:magnanimousPublicRoutingSummary(providers), single_brain:getMagnanimousSingleBrainSummary() });
  }
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const body = await request.json();
    const computeOnly=body.compute_only===true;
    const message = String(body.message || '').trim();
    if (!message) return json({ detail: 'Message is required.' }, 400);
    const userMessage=originalUserMessage(message);
    const task=taskClass(userMessage,body);
    const capability=nativeCapability(userMessage,task);
    let brainContext=computeOnly?'':extractBrainContext(message);
    if(!computeOnly&&!brainContext){try{brainContext=await getMagnanimousMemoryContext(request,env)}catch{brainContext=''}}

    const linkLearning=computeOnly?[]:await learnFromLinks(request,env,userMessage,body.learn_links!==false);
    const absorbedLinks=linkLearning.filter(x=>x.ok);
    const autoResearch=computeOnly?false:(body.live_search===true||body.news===true||(body.live_search!==false&&(task==='research'||needsFreshResearch(userMessage))));
    const rememberResearch=computeOnly?false:(body.remember_search!==false&&(autoResearch||absorbedLinks.length>0));

    let grounding={context:'',sources:[],search_configured:true};
    if(!computeOnly&&body.use_knowledge!==false){
      try{grounding=await getKnowledgeContext(request,env,userMessage,{liveSearch:autoResearch,news:Boolean(body.news),remember:rememberResearch,freshness:String(body.freshness||''),localLimit:8,webLimit:6,newsLimit:5})}catch(e){console.error('knowledge grounding failed',e)}
    }
    let toolPlanning={context:'',tools:[],recommended_integrations:[]};
    if(!computeOnly&&body.use_tools!==false){
      try{toolPlanning=await getMagnanimousToolFoundryContext(request,env,userMessage)}catch(e){console.error('tool planning context failed',e)}
    }
    const observed=(computeOnly||body.use_tools===false)?null:await foundryCall(request,env,'/api/magnanimous/tool-foundry/observe',{capability,example_task:userMessage});
    const learnedScores=computeOnly?new Map():await learnedProviderScores(request,env,task);
    const learningState=[...learnedScores.entries()].map(([provider,x])=>({provider,...x}));
    const signedInUser=computeOnly?null:await currentUser(request,env).catch(()=>null),localBridgeReady=signedInUser?await hasReadyLocalBridge(env,signedInUser.tenant_id).catch(()=>false):false;
    const ogenicRuntimeEnv=localBridgeReady?{...env,MAGNANIMOUS_LOCAL_BRIDGE_READY:true}:env;
    const ogenicPlan=computeOnly?{classification:'CLOUD',groups:[],initiative:'disabled',status:'compute-only',network_direction:'none'}:buildMagnanimousOgenicPlan(userMessage,ogenicRuntimeEnv),ogenicContext=computeOnly?'':getMagnanimousOgenicPrompt(userMessage),absorbedCapabilityContext=computeOnly?'':getConnectorAbsorptionPrompt(userMessage);
    let ogenicInitiative=null;
    if(!computeOnly&&body.use_tools!==false&&body.ogenic_initiative!==false&&(ogenicPlan.groups.some(x=>x.id==='code-system')||ogenicPlan.classification==='LOCAL'||ogenicPlan.classification==='HYBRID')){
      try{
        const initiativeUrl=new URL('/api/magnanimous/ogenic/initiate',request.url),initiativeHeaders=new Headers(request.headers);
        initiativeHeaders.set('content-type','application/json');
        const initiativeResponse=await handleMagnanimousOgenic(new Request(initiativeUrl.toString(),{method:'POST',headers:initiativeHeaders,body:JSON.stringify({goal:userMessage,repo:body.repo||'IAMGodmatters/IAMMagnanimousway.js',ref:body.ref||'main',workspace:body.workspace||'',local_payload:body.local_payload||{}})}),env);
        const initiativeData=await initiativeResponse?.clone().json().catch(()=>null);
        ogenicInitiative=initiativeData?{http_status:initiativeResponse.status,initiated:Boolean(initiativeData.initiated),initiative:initiativeData.initiative||null,code:initiativeData.code||null,result:initiativeData.result?{mode:initiativeData.result.mode||null,repo:initiativeData.result.repo||null,ref:initiativeData.result.ref||null}:null}:null;
      }catch(error){ogenicInitiative={initiated:false,code:'INITIATIVE_ERROR',detail:String(error?.message||error).slice(0,300)}}
    }
    const initiativeContext=ogenicInitiative?`\nOGENIC SAFE INITIATIVE RESULT: ${JSON.stringify(ogenicInitiative)}\nUse this as evidence only. A plan/read action is not a write, merge or deployment.\n`:'';
    const groundedMessage=computeOnly?`MAGNANIMOUS COMPUTE-ONLY EXECUTION\nYou are a replaceable compute engine beneath Magnanimous AI. Advisory analysis only. You have no tool, memory, account, repository, approval, merge, deployment, publishing, payment, deletion, credential or security-policy authority. Never claim an external action occurred.\n\n${userMessage}`:`${COMMANDER_PROTOCOL}\n\n${ogenicContext}\n\nUSER REQUEST:\n${userMessage}${brainContext||''}${grounding.context||''}${toolPlanning.context||''}${absorbedCapabilityContext?`\n\n${absorbedCapabilityContext}`:''}\n\nCURRENT MAGNANIMOUS ROUTING STATE:\nTask class: ${task}\nNative capability family: ${capability}\nLinks absorbed this turn: ${absorbedLinks.length}\nStored/fresh sources available: ${grounding.sources?.length||0}${initiativeContext}\nUse external execution engines only as needed; return one unified Magnanimous answer.`;
    const requested = String(body.provider || 'auto').toLowerCase();
    const acceleratorPool=computeOnly&&body.allow_metered_accelerator!==true?availableProviders(env).filter(p=>effectiveTier(env,p)==='free-first'):availableProviders(env);
    const candidates = requested !== 'auto' ? acceleratorPool.filter(p => p.id === requested && configured(env,p)) : routeProviders(env,userMessage,body,learnedScores).filter(p=>acceleratorPool.some(a=>a.id===p.id));
    if (!candidates.length) return json({ detail: requested === 'auto' ? 'Magnanimous AI has no configured execution engine. Cloudflare Workers AI should be bound as AI, or another free-first provider must be configured.' : 'The requested execution engine is not configured or is disabled.', code: 'NO_AI_PROVIDER' }, 503);
    const errors = [],providerDeadline=Date.now()+PROVIDER_REQUEST_BUDGET_MS;
    for (const p of candidates) {
      const started=Date.now(),remaining=providerDeadline-started;
      if(remaining<1500){errors.push('Magnanimous AI execution budget exhausted before another provider could start.');break}
      try {
        const billingMode=providerBillingMode(env,p.id),paidExecution=billingMode==='paid'||effectiveTier(env,p)==='metered';
        const executionModel=selectedExecutionModel(env,p,body);
        let reserve=null;
        if(paidExecution){
          if(!signedInUser){errors.push(`${p.name}: paid execution requires a signed-in funded workspace`);continue}
          reserve=conservativeProviderReserve({provider:p.id,model:executionModel,input_text:groundedMessage,max_output_tokens:4096,billing_mode:billingMode});
          if(!reserve.ok){errors.push(`${p.name}: ${reserve.code||'origin pricing is not verified'}`);continue}
          const gate=await canUsePremium(env,signedInUser.tenant_id,{category:'premium AI',estimated_provider_origin_cost_usd:reserve.provider_origin_cost_usd,required_plan:'business',entitlement:'metered_ai'});
          if(!gate.ok){errors.push(`${p.name}: ${gate.code||'premium budget unavailable'}`);continue}
        }
        const result = await withinProviderBudget(callProvider(p.id, env, groundedMessage, executionModel),Math.min(45000,remaining),`${p.name} execution`);
        if (!result?.text?.trim()) throw new Error('Provider returned an empty response');
        if(paidExecution){
          const priced=providerOriginCost({provider:p.id,model:result.model,usage:result.usage,billing_mode:billingMode});
          if(!priced.ok)throw new Error(`BILLING_EVIDENCE_REQUIRED: ${priced.code||priced.detail||'origin usage unavailable'}`);
          if(priced.provider_origin_cost_usd>0){
            await recordUsage(env,signedInUser.tenant_id,{
              category:'premium-ai',provider:p.id,units:Number(priced.usage?.input_tokens||0)+Number(priced.usage?.output_tokens||0),
              provider_origin_cost_usd:priced.provider_origin_cost_usd,
              reference_id:`${p.id}:${result.model}:${crypto.randomUUID()}`,
              pricing_source:priced.pricing_source,pricing_verified_at:priced.pricing_verified_at
            });
          }
        }
        if(!computeOnly)await recordProviderOutcome(request,env,{task,provider:p.id,message:userMessage,success:true,quality:.85,latency:Date.now()-started,notes:`capability=${capability}; grounded=${grounding.sources.length}; links=${absorbedLinks.length}`});
        if(!computeOnly&&body.use_tools!==false)await foundryCall(request,env,'/api/magnanimous/tool-foundry/outcome',{name:capability,success:true});
        return json({ output: result.text, provider: p.id, provider_name: p.name, model: result.model, magnanimous: true, operator: true, command_role:'commander-in-chief', provider_role:'execution-engine', routed_automatically:requested==='auto', route_task:task, native_capability:capability, route_policy:String(body.quality||body.route_policy||'free-first'), fallback_candidates:candidates.map(x=>x.id), adaptive_provider_learning:true, provider_learning:learningState, grounded: grounding.sources.length>0, sources: grounding.sources, web_search_configured: grounding.search_configured, automatic_research:autoResearch, remembered_research:rememberResearch, link_learning:{enabled:body.learn_links!==false,absorbed:absorbedLinks.length,results:linkLearning}, native_recipe_learning:{observed:true,gap_count:Number(observed?.gap_count||0),proposal:observed?.proposal||null}, tool_planning:{enabled:body.use_tools!==false,learned_tools:toolPlanning.tools?.map(x=>({name:x.name,status:x.status,risk:x.risk}))||[],recommended_integrations:toolPlanning.recommended_integrations?.map(x=>({id:x.id,name:x.name,priority:x.priority,capabilities:x.capabilities}))||[]}, ogenic:{classification:ogenicPlan.classification,groups:ogenicPlan.groups.map(x=>x.id),initiative:ogenicPlan.initiative,status:ogenicPlan.status,network_direction:ogenicPlan.network_direction,safe_initiative:ogenicInitiative} });
      } catch (e) {
        const detail=e?.message || 'provider failed';errors.push(`${p.name}: ${detail}`);
        if(!computeOnly)await recordProviderOutcome(request,env,{task,provider:p.id,message:userMessage,success:false,quality:0,latency:Date.now()-started,notes:detail});
      }
    }
    if(!computeOnly&&body.use_tools!==false)await foundryCall(request,env,'/api/magnanimous/tool-foundry/outcome',{name:capability,success:false});
    return json({ detail: `Magnanimous AI could not complete the request. ${errors.join(' | ')}`, code: 'AI_PROVIDER_FAILURE',route_task:task,native_capability:capability }, 502);
  }
  return null;
}
export default { async fetch(request, env, ctx) { const runtimeEnv = await getRuntimeEnv(env); const handled = await handle(request, runtimeEnv); return handled || app.fetch(request, runtimeEnv, ctx); } };
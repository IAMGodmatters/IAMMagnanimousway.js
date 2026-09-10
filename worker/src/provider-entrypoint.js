import app from './entrypoint.js';
import { handleIntegrations, currentUser } from './integrations.js';
import { getKnowledgeContext, handleKnowledge } from './knowledge-runtime.js';
import { getMagnanimousMemoryContext } from './magnanimous-brain-runtime.js';
import { getMagnanimousToolFoundryContext, handleMagnanimousToolFoundry } from './magnanimous-tool-foundry.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);
const MEMORY_MARKER = '\n\nMAGNANIMOUS CENTRAL BRAIN CONTEXT';

const COMMANDER_PROTOCOL = `MAGNANIMOUS COMMAND LAYER
You are speaking as Magnanimous AI, the commander-in-chief orchestration brain for I AM Magnanimous Way™.
All outside AI models, search engines, plugins, MCP servers, SaaS products, carriers and generators are replaceable execution engines or tools under Magnanimous routing. They are never the platform identity or the final authority over the workflow.
Use Magnanimous private memory, learned lessons, stored knowledge and native tool recipes before reaching outward. Use fresh research when facts are current, stale, uncertain or source-dependent.
When the user supplies a public link, learn the readable information into the tenant knowledge workspace so the user does not have to keep supplying the same link. Do not copy secrets, credentials, paywalled material or proprietary backend code.
Repeated successful low-risk workflows should become reusable Magnanimous-native recipes. External providers remain necessary only when they offer a capability, live data, account access or compute Magnanimous cannot truthfully reproduce natively.
Specialist agents are execution arms. Magnanimous owns planning, continuity, routing, verification and learning across them.
Never claim an external action happened without an actual authorized tool result. Never bypass security, identity, payment or permission boundaries.`;

const PROVIDERS = [
  { id: 'cloudflare-ai', name: 'Cloudflare Workers AI', key: 'AI', tier: 'free-first' },
  { id: 'google', name: 'Google Gemini', key: 'GOOGLE_API_KEY', tier: 'free-first' },
  { id: 'groq', name: 'Groq', key: 'GROQ_API_KEY', tier: 'free-first' },
  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY', tier: 'free-first' },
  { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY', tier: 'metered' },
  { id: 'anthropic', name: 'Anthropic', key: 'ANTHROPIC_API_KEY', tier: 'metered' }
];

const TOOLS = [
  ['magnanimous','Magnanimous AI','Commander-in-chief brain that plans, remembers, learns, routes, verifies and coordinates every supported platform capability.'],
  ['ai-chat','AI Chat','General-purpose AI assistant.'],
  ['writing','Writing Helper','Create, rewrite, summarize and polish content.'],
  ['research','Research Helper','Research live web/news sources and private workspace knowledge.'],
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

function configured(env, p) {
  if (p.id === 'cloudflare-ai') return env?.AI != null;
  return typeof env?.[p.key] === 'string' && env[p.key].trim().length > 0;
}
function meteredEnabled(env) { return String(env?.ENABLE_METERED_PROVIDERS || '').toLowerCase() === 'true'; }
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
          { role: 'system', content: COMMANDER_PROTOCOL },
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
function taskClass(message,body={}){
  const m=String(message||'').toLowerCase();
  if(body.live_search||body.news||/research|latest|current|source|cite|market size|competitor/.test(m))return'research';
  if(/code|debug|typescript|javascript|python|sql|api|function|repository|deploy/.test(m))return'coding';
  if(/business plan|financial|cash flow|break-even|investor|lender|grant|startup|strategy|market/.test(m))return'business';
  if(/write|rewrite|email|caption|script|post|copy|letter|proposal/.test(m))return'writing';
  return'general';
}
async function ensureOutcomeSchema(env){
  if(!env?.DB)return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_outcomes (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,provider TEXT NOT NULL DEFAULT 'native',task TEXT NOT NULL DEFAULT '',success INTEGER NOT NULL DEFAULT 0,quality REAL NOT NULL DEFAULT 0,cost_hint REAL NOT NULL DEFAULT 0,latency_ms INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run();
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
    research:['google','cloudflare-ai','groq','mistral','openai','anthropic'],
    coding:['mistral','groq','cloudflare-ai','google','openai','anthropic'],
    business:['google','cloudflare-ai','mistral','groq','openai','anthropic'],
    writing:['cloudflare-ai','mistral','google','groq','openai','anthropic'],
    general:['cloudflare-ai','google','groq','mistral','openai','anthropic']
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

  if (url.pathname === '/api/tools' && request.method === 'GET') return json({ tools: TOOLS });
  if (url.pathname === '/api/operator/capabilities' && request.method === 'GET') return json({
    operator:'Magnanimous AI',
    command_role:'commander-in-chief',
    routing:{task_aware:true,automatic_failover:true,manual_provider_override:true,free_first_default:true,maximum_quality_option:true,learned_tool_planning:true,integration_ranking:true,adaptive_provider_learning:true},
    providers:PROVIDERS.map(p=>({id:p.id,name:p.name,tier:p.tier,configured:configured(env,p),enabled:p.tier!=='metered'||meteredEnabled(env)})),
    knowledge:{private_workspace_grounding:true,live_web_search:true,news_search:true,automatic_link_learning:true,remembered_research:true,brave_search_configured:Boolean(env?.BRAVE_SEARCH_API_KEY),fallback_enabled:true},
    execution:{specialist_agent_mesh:true,connected_actions:true,crm:true,business_email:true,calling:true,video:true,social:true,professional_business_launch:true,tool_foundry:true,universal_tool_gateway:true,native_recipe_growth:true},
    learning_loop:['absorb links and sources','retrieve saved knowledge','plan centrally','route execution','verify outcome','score providers and recipes','promote successful low-risk recipes'],
    business_launch:{pipeline:['Intake','Clarify','Research','Validate','Financial Review','Draft','Hostile Review','Consistency Check','Audience Adaptation','Final Polish']},
    note:'Magnanimous is the persistent command and learning layer. External integrations remain necessary where account authorization, live provider data or specialized compute is required.'
  });
  if (url.pathname === '/api/ads' && request.method === 'GET') {
    try {
      const placement = url.searchParams.get('placement') || 'home';
      const { results } = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads WHERE active=1 AND placement=? ORDER BY id DESC').bind(placement).all();
      return json({ ads: results || [] });
    } catch (_) { return json({ ads: [] }); }
  }
  if (url.pathname === '/api/providers' && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ id: p.id, name: p.name, configured: configured(env, p), enabled: p.tier !== 'metered' || meteredEnabled(env), tier: p.tier, type: 'execution-engine' }));
    const enabled = providers.filter(p => p.configured && p.enabled);
    const ready = enabled.length > 0;
    return json({ free_first: true, metered_providers_enabled: meteredEnabled(env), command_role:'commander-in-chief', task_aware_routing:true, automatic_failover:true, learned_tool_planning:true, adaptive_provider_learning:true, automatic_link_learning:true, providers, configured_count: enabled.length, free_configured_count: enabled.filter(p => p.tier === 'free-first').length, magnanimous_ready: ready, operator_ready: ready });
  }
  if ((url.pathname === '/api/magnanimous/health' || url.pathname === '/api/odin/health') && request.method === 'GET') {
    const providers = PROVIDERS.map(p => ({ id: p.id, configured: configured(env, p), enabled: p.tier !== 'metered' || meteredEnabled(env) }));
    return json({ ok: true, magnanimous: 'online', operator: 'Magnanimous AI', command_role:'commander-in-chief', task_aware_routing:true, automatic_failover:true, learned_tool_planning:true, adaptive_provider_learning:true, automatic_link_learning:true, native_recipe_growth:true, workers_ai_bound: env?.AI != null, web_search_configured:true, news_search_configured:true, brave_search_configured:Boolean(env?.BRAVE_SEARCH_API_KEY), research_fallback_enabled:true, providers });
  }
  if (url.pathname === '/api/chat' && request.method === 'POST') {
    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message) return json({ detail: 'Message is required.' }, 400);
    const userMessage=originalUserMessage(message);
    const task=taskClass(userMessage,body);
    const capability=nativeCapability(userMessage,task);
    let brainContext=extractBrainContext(message);
    if(!brainContext){try{brainContext=await getMagnanimousMemoryContext(request,env)}catch{brainContext=''}}

    const linkLearning=await learnFromLinks(request,env,userMessage,body.learn_links!==false);
    const absorbedLinks=linkLearning.filter(x=>x.ok);
    const autoResearch=body.live_search===true||body.news===true||(body.live_search!==false&&(task==='research'||needsFreshResearch(userMessage)));
    const rememberResearch=body.remember_search!==false&&(autoResearch||absorbedLinks.length>0);

    let grounding={context:'',sources:[],search_configured:true};
    if(body.use_knowledge!==false){
      try{grounding=await getKnowledgeContext(request,env,userMessage,{liveSearch:autoResearch,news:Boolean(body.news),remember:rememberResearch,freshness:String(body.freshness||''),localLimit:8,webLimit:6,newsLimit:5})}catch(e){console.error('knowledge grounding failed',e)}
    }
    let toolPlanning={context:'',tools:[],recommended_integrations:[]};
    if(body.use_tools!==false){
      try{toolPlanning=await getMagnanimousToolFoundryContext(request,env,userMessage)}catch(e){console.error('tool planning context failed',e)}
    }
    const observed=body.use_tools===false?null:await foundryCall(request,env,'/api/magnanimous/tool-foundry/observe',{capability,example_task:userMessage});
    const learnedScores=await learnedProviderScores(request,env,task);
    const learningState=[...learnedScores.entries()].map(([provider,x])=>({provider,...x}));
    const groundedMessage=`${COMMANDER_PROTOCOL}\n\nUSER REQUEST:\n${userMessage}${brainContext||''}${grounding.context||''}${toolPlanning.context||''}\n\nCURRENT MAGNANIMOUS ROUTING STATE:\nTask class: ${task}\nNative capability family: ${capability}\nLinks absorbed this turn: ${absorbedLinks.length}\nStored/fresh sources available: ${grounding.sources?.length||0}\nUse external execution engines only as needed; return one unified Magnanimous answer.`;
    const requested = String(body.provider || 'auto').toLowerCase();
    const candidates = requested !== 'auto' ? availableProviders(env).filter(p => p.id === requested && configured(env,p)) : routeProviders(env,userMessage,body,learnedScores);
    if (!candidates.length) return json({ detail: requested === 'auto' ? 'Magnanimous AI has no configured execution engine. Cloudflare Workers AI should be bound as AI, or another free-first provider must be configured.' : 'The requested execution engine is not configured or is disabled.', code: 'NO_AI_PROVIDER' }, 503);
    const errors = [];
    for (const p of candidates) {
      const started=Date.now();
      try {
        const result = await callProvider(p.id, env, groundedMessage, body.model);
        if (!result?.text?.trim()) throw new Error('Provider returned an empty response');
        await recordProviderOutcome(request,env,{task,provider:p.id,message:userMessage,success:true,quality:.85,latency:Date.now()-started,notes:`capability=${capability}; grounded=${grounding.sources.length}; links=${absorbedLinks.length}`});
        if(body.use_tools!==false)await foundryCall(request,env,'/api/magnanimous/tool-foundry/outcome',{name:capability,success:true});
        return json({ output: result.text, provider: p.id, provider_name: p.name, model: result.model, magnanimous: true, operator: true, command_role:'commander-in-chief', provider_role:'execution-engine', routed_automatically:requested==='auto', route_task:task, native_capability:capability, route_policy:String(body.quality||body.route_policy||'free-first'), fallback_candidates:candidates.map(x=>x.id), adaptive_provider_learning:true, provider_learning:learningState, grounded: grounding.sources.length>0, sources: grounding.sources, web_search_configured: grounding.search_configured, automatic_research:autoResearch, remembered_research:rememberResearch, link_learning:{enabled:body.learn_links!==false,absorbed:absorbedLinks.length,results:linkLearning}, native_recipe_learning:{observed:true,gap_count:Number(observed?.gap_count||0),proposal:observed?.proposal||null}, tool_planning:{enabled:body.use_tools!==false,learned_tools:toolPlanning.tools?.map(x=>({name:x.name,status:x.status,risk:x.risk}))||[],recommended_integrations:toolPlanning.recommended_integrations?.map(x=>({id:x.id,name:x.name,priority:x.priority,capabilities:x.capabilities}))||[]} });
      } catch (e) {
        const detail=e?.message || 'provider failed';errors.push(`${p.name}: ${detail}`);
        await recordProviderOutcome(request,env,{task,provider:p.id,message:userMessage,success:false,quality:0,latency:Date.now()-started,notes:detail});
      }
    }
    if(body.use_tools!==false)await foundryCall(request,env,'/api/magnanimous/tool-foundry/outcome',{name:capability,success:false});
    return json({ detail: `Magnanimous AI could not complete the request. ${errors.join(' | ')}`, code: 'AI_PROVIDER_FAILURE',route_task:task,native_capability:capability }, 502);
  }
  return null;
}
export default { async fetch(request, env, ctx) { const runtimeEnv = await getRuntimeEnv(env); const handled = await handle(request, runtimeEnv); return handled || app.fetch(request, runtimeEnv, ctx); } };
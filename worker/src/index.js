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
  ['customer-service','Customer Service Helper','Draft helpful customer responses.'],
].map(([id,name,description]) => ({id,name,description}));

const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8'}});
const unauthorized = () => json({detail:'Admin login required'},401);

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function session(email, env) {
  const exp = Math.floor(Date.now()/1000) + 86400;
  const payload = `${email}|${exp}`;
  return `${payload}|${await hmac(env.SESSION_SECRET, payload)}`;
}
async function validSession(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ') || !env.SESSION_SECRET || !env.ADMIN_EMAIL) return false;
  const token = auth.slice(7).split('|');
  if (token.length !== 3) return false;
  const [email, exp, sig] = token;
  if (email !== env.ADMIN_EMAIL || Number(exp) < Math.floor(Date.now()/1000)) return false;
  const expected = await hmac(env.SESSION_SECRET, `${email}|${exp}`);
  return sig === expected;
}
async function init(env) {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, url TEXT NOT NULL, label TEXT NOT NULL DEFAULT 'Sponsored', placement TEXT NOT NULL DEFAULT 'home', active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL)"),
    env.DB.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('site_name','I AM Magnanimous AI Platform')"),
    env.DB.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('tagline','Free AI tools, Odin orchestration, and creator tools in one place.')"),
    env.DB.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('canva_url','')"),
  ]);
}
async function settings(env) {
  const {results} = await env.DB.prepare('SELECT key,value FROM settings').all();
  const data = Object.fromEntries(results.map(r=>[r.key,r.value]));
  return {site_name:data.site_name || 'I AM Magnanimous AI Platform', tagline:data.tagline || '', canva_url:data.canva_url || ''};
}

export default {
  async fetch(request, env) {
    try {
      await init(env);
      const url = new URL(request.url);
      const path = url.pathname;
      if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'Content-Type, Authorization'}});

      if (path === '/health') return json({status:'ok',service:'iamagnanimous-ai',version:'3.0.0-cloudflare'});
      if (path === '/api/tools') return json({tools:TOOLS});
      if (path === '/api/providers') return json({providers:[
        {id:'openai',name:'OpenAI',configured:Boolean(env.OPENAI_API_KEY)},
        {id:'cloudflare-ai',name:'Cloudflare Workers AI',configured:Boolean(env.AI)},
        {id:'local-video',name:'Local Video Renderer',configured:false}
      ]});

      if (path === '/api/ads' && request.method === 'GET') {
        const placement = url.searchParams.get('placement') || 'home';
        const {results} = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads WHERE active=1 AND placement=? ORDER BY id DESC').bind(placement).all();
        return json({ads:results});
      }

      if (path === '/api/admin/login' && request.method === 'POST') {
        const body = await request.json();
        if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || body.email !== env.ADMIN_EMAIL || body.password !== env.ADMIN_PASSWORD) return json({detail:'Invalid email or password'},401);
        return json({token:await session(body.email,env),email:body.email});
      }

      if (path.startsWith('/api/admin/')) {
        if (!(await validSession(request,env))) return unauthorized();
        if (path === '/api/admin/settings' && request.method === 'GET') return json(await settings(env));
        if (path === '/api/admin/settings' && request.method === 'PUT') {
          const body = await request.json();
          for (const [key,value] of Object.entries({site_name:body.site_name,tagline:body.tagline,canva_url:body.canva_url || ''})) {
            await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,String(value || '')).run();
          }
          return json({ok:true});
        }
        if (path === '/api/admin/ads' && request.method === 'GET') {
          const {results} = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads ORDER BY id DESC').all();
          return json({ads:results});
        }
        if (path === '/api/admin/ads' && request.method === 'POST') {
          const body = await request.json();
          const result = await env.DB.prepare('INSERT INTO ads(title,url,label,placement,active,created_at) VALUES(?,?,?,?,?,?)').bind(body.title,body.url,body.label || 'Sponsored',body.placement || 'home',body.active === false ? 0 : 1,Math.floor(Date.now()/1000)).run();
          return json({ok:true,id:result.meta.last_row_id});
        }
        const adMatch = path.match(/^\/api\/admin\/ads\/(\d+)$/);
        if (adMatch && request.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM ads WHERE id=?').bind(Number(adMatch[1])).run();
          return json({ok:true});
        }
        if (adMatch && request.method === 'PUT') {
          const body = await request.json();
          await env.DB.prepare('UPDATE ads SET title=?,url=?,label=?,placement=?,active=? WHERE id=?').bind(body.title,body.url,body.label || 'Sponsored',body.placement || 'home',body.active === false ? 0 : 1,Number(adMatch[1])).run();
          return json({ok:true});
        }
      }

      if (path === '/api/chat' && request.method === 'POST') {
        const body = await request.json();
        if (!env.OPENAI_API_KEY) return json({output:'Odin is online, but no OpenAI API key is configured yet. Add OPENAI_API_KEY as a Cloudflare Worker secret to enable cloud AI.',provider:'local'});
        const response = await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify({model:body.model || env.OPENAI_MODEL || 'gpt-5.6',input:String(body.message || '')})});
        const data = await response.json();
        if (!response.ok) return json({detail:data.error?.message || 'AI provider error'},502);
        return json({output:data.output_text || '',provider:'openai'});
      }

      if (path === '/api/video/render' && request.method === 'POST') return json({detail:'The Cloudflare Worker deployment does not include an FFmpeg runtime. Use the local backend renderer or add a dedicated video-rendering service.'},501);
      return new Response('Not Found',{status:404});
    } catch (error) {
      return json({detail:error instanceof Error ? error.message : 'Server error'},500);
    }
  }
};

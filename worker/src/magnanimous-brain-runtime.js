import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);

const CAPABILITIES=[
 {id:'reasoning-writing',name:'Reasoning, writing & translation',tier:'free-first',ready:true},
 {id:'live-research',name:'Live web/news research with sources',tier:'free-first',env:'BRAVE_SEARCH_API_KEY'},
 {id:'workspace-knowledge',name:'Private workspace knowledge & retrieval',tier:'free-first',ready:true},
 {id:'learning-memory',name:'Persistent user/workflow learning memory',tier:'free-first',ready:true},
 {id:'agent-mesh',name:'Specialist agent delegation',tier:'free-first',ready:true},
 {id:'business',name:'Business, CRM, finance, support & professional workflows',tier:'free-first',ready:true},
 {id:'coding',name:'Coding, debugging & structured generation',tier:'free-first',ready:true},
 {id:'image',name:'Image generation and visual workflows',tier:'free-first-or-capped',envAny:['AI','HF_TOKEN','GOOGLE_API_KEY']},
 {id:'video',name:'Text/image to video and video editing',tier:'free-first-or-capped',envAny:['AI','HF_TOKEN','FAL_KEY','REPLICATE_API_TOKEN']},
 {id:'voice',name:'Speech, voice assistant & browser calling',tier:'free-first-or-capped',ready:true},
 {id:'pstn',name:'Carrier telephone calling',tier:'metered-paid',envAny:['TWILIO_ACCOUNT_SID','TELNYX_API_KEY']},
 {id:'social-youtube',name:'YouTube authorized publishing',tier:'official-api-quota',envAny:['GOOGLE_CLIENT_ID','YOUTUBE_CLIENT_ID']},
 {id:'social-tiktok',name:'TikTok authorized publishing',tier:'official-api-approval',envAny:['TIKTOK_CLIENT_KEY','TIKTOK_CLIENT_ID']},
 {id:'social-meta',name:'Facebook / Instagram authorized publishing',tier:'official-api-approval',envAny:['META_APP_ID','FACEBOOK_APP_ID']},
 {id:'social-linkedin',name:'LinkedIn authorized publishing',tier:'official-api-approval',envAny:['LINKEDIN_CLIENT_ID']},
 {id:'connected-actions',name:'Connected-account actions with confirmation',tier:'connection-dependent',ready:true},
 {id:'browser-agent',name:'Browser research/inspection agent',tier:'runtime-dependent',envAny:['BROWSER','BROWSER_RENDERING']}
];

function configured(env,c){
 if(c.ready)return true;
 if(c.env)return Boolean(env?.[c.env]);
 if(c.envAny)return c.envAny.some(k=>Boolean(env?.[k]));
 return false;
}

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'preference',
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'explicit-user',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,memory_key)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_memories_user ON magnanimous_memories(tenant_id,user_id,active,updated_at DESC)').run();
}

async function auth(request,env){
 const user=await currentUser(request,env);return user||null;
}

async function listMemory(env,user){
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT id,memory_type,memory_key,memory_value,confidence,source,created_at,updated_at FROM magnanimous_memories WHERE tenant_id=? AND user_id=? AND active=1 ORDER BY updated_at DESC LIMIT 250').bind(String(user.tenant_id),String(user.id)).all();
 return results;
}

async function remember(request,env,user){
 await ensureSchema(env);const body=await request.json().catch(()=>({}));
 const key=String(body.key||'').trim().slice(0,120),value=String(body.value||'').trim().slice(0,8000),type=String(body.type||'preference').trim().slice(0,40);
 if(!key||!value)return json({detail:'Memory key and value are required.'},400);
 const ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_memories(tenant_id,user_id,memory_type,memory_key,memory_value,confidence,source,active,created_at,updated_at)
 VALUES(?,?,?,?,?,1,'explicit-user',1,?,?)
 ON CONFLICT(tenant_id,user_id,memory_key) DO UPDATE SET memory_type=excluded.memory_type,memory_value=excluded.memory_value,confidence=1,source='explicit-user',active=1,updated_at=excluded.updated_at`)
 .bind(String(user.tenant_id),String(user.id),type,key,value,ts,ts).run();
 return json({ok:true,key,type});
}

async function forget(request,env,user){
 await ensureSchema(env);const body=await request.json().catch(()=>({}));const key=String(body.key||'').trim();if(!key)return json({detail:'Memory key is required.'},400);
 await env.DB.prepare('UPDATE magnanimous_memories SET active=0,updated_at=? WHERE tenant_id=? AND user_id=? AND memory_key=?').bind(now(),String(user.tenant_id),String(user.id),key).run();
 return json({ok:true,key});
}

export async function getMagnanimousMemoryContext(request,env){
 if(!env?.DB)return'';const user=await auth(request,env);if(!user)return'';const rows=await listMemory(env,user);if(!rows.length)return'';
 return `\n\nMAGNANIMOUS LEARNED USER/WORKFLOW MEMORY (private to this signed-in workspace; follow current user instructions over memory):\n${rows.slice(0,30).map(r=>`- ${r.memory_key}: ${String(r.memory_value).slice(0,700)}`).join('\n')}`.slice(0,12000);
}

export async function handleMagnanimousBrain(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/magnanimous/'))return null;
 if(url.pathname==='/api/magnanimous/capabilities'&&request.method==='GET'){
  const capabilities=CAPABILITIES.map(c=>({...c,configured:configured(env,c)}));
  return json({identity:'Magnanimous AI',official:true,free_first:true,capabilities,configured_count:capabilities.filter(x=>x.configured).length,total:capabilities.length,note:'Provider availability, account authorization, quotas and compute limits still apply.'});
 }
 if(!env?.DB)return json({detail:'Magnanimous memory requires the workspace database.'},503);
 const user=await auth(request,env);if(!user)return json({detail:'Sign in required.'},401);
 if(url.pathname==='/api/magnanimous/memory'&&request.method==='GET')return json({memories:await listMemory(env,user),learning_model:'retrieval-and-memory',training_private_data:false});
 if(url.pathname==='/api/magnanimous/memory/remember'&&request.method==='POST')return remember(request,env,user);
 if(url.pathname==='/api/magnanimous/memory/forget'&&request.method==='POST')return forget(request,env,user);
 return null;
}

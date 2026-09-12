const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=30000)=>String(v??'').slice(0,n);
const scope=(u)=>[String(u?.tenant_id||''),String(u?.id||'')];

export async function ensureEvidenceSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_evidence_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  notebook TEXT NOT NULL DEFAULT 'General',
  title TEXT NOT NULL,
  claim TEXT NOT NULL DEFAULT '',
  evidence TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_title TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  confidence INTEGER NOT NULL DEFAULT 80,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_evidence_user ON magnanimous_evidence_items(tenant_id,user_id,updated_at DESC)').run();
}

export async function listEvidence(env,user,{limit=100,notebook=''}={}){
 await ensureEvidenceSchema(env);const[t,u]=scope(user),cap=Math.max(1,Math.min(250,Number(limit)||100));
 const q=notebook?env.DB.prepare('SELECT * FROM magnanimous_evidence_items WHERE tenant_id=? AND user_id=? AND notebook=? ORDER BY updated_at DESC LIMIT ?').bind(t,u,clip(notebook,120),cap):env.DB.prepare('SELECT * FROM magnanimous_evidence_items WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT ?').bind(t,u,cap);
 const{results=[]}=await q.all();return results.map(x=>({...x,confidence:Number(x.confidence||0)}));
}

export async function addEvidence(env,user,body={}){
 await ensureEvidenceSchema(env);const[t,u]=scope(user),ts=now();
 const title=clip(body.title||body.claim||'Research evidence',220).trim();
 const confidence=Math.max(0,Math.min(100,Number(body.confidence)||80));
 const tags=Array.isArray(body.tags)?body.tags.join(', '):String(body.tags||'');
 const r=await env.DB.prepare('INSERT INTO magnanimous_evidence_items(tenant_id,user_id,notebook,title,claim,evidence,source_url,source_title,tags,confidence,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(t,u,clip(body.notebook||'General',120),title,clip(body.claim||'',12000),clip(body.evidence||'',30000),clip(body.source_url||'',1200),clip(body.source_title||'',300),clip(tags,1000),confidence,ts,ts).run();
 return Number(r?.meta?.last_row_id||0);
}

export async function removeEvidence(env,user,id){
 await ensureEvidenceSchema(env);const[t,u]=scope(user);const r=await env.DB.prepare('DELETE FROM magnanimous_evidence_items WHERE id=? AND tenant_id=? AND user_id=?').bind(Number(id),t,u).run();return Number(r?.meta?.changes||0)>0;
}

export async function evidenceCount(env,user){
 await ensureEvidenceSchema(env);const[t,u]=scope(user);return Number((await env.DB.prepare('SELECT COUNT(*) n FROM magnanimous_evidence_items WHERE tenant_id=? AND user_id=?').bind(t,u).first())?.n||0);
}

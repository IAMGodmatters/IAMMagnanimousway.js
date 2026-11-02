const clip=(v,n=8000)=>String(v??'').trim().slice(0,n);
const id=()=>crypto.randomUUID();
const now=()=>Math.floor(Date.now()/1000);

export async function ensureWhiteLabelBrainProvenance(env){
 if(!env?.DB)throw new Error('White Label brain database is unavailable.');
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_brain_sources (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '', app TEXT NOT NULL DEFAULT 'platform',
  source_type TEXT NOT NULL, source_label TEXT NOT NULL DEFAULT '',
  source_uri TEXT NOT NULL DEFAULT '', trust_tier TEXT NOT NULL DEFAULT 'unverified',
  captured_at INTEGER NOT NULL, created_at INTEGER NOT NULL, deleted_at INTEGER
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_wlbl_brain_sources_scope ON white_label_brain_sources(tenant_id,client_id,app,captured_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_brain_claims (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '', app TEXT NOT NULL DEFAULT 'platform',
  claim_key TEXT NOT NULL, claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'fact',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','conflicted','superseded','withdrawn')),
  confidence REAL NOT NULL DEFAULT 0.75, supersedes_claim_id TEXT,
  observed_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_wlbl_brain_claims_scope ON white_label_brain_claims(tenant_id,client_id,app,status,updated_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_brain_claim_sources (
  tenant_id TEXT NOT NULL, claim_id TEXT NOT NULL, source_id TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'supports' CHECK(relation IN ('supports','contradicts')),
  created_at INTEGER NOT NULL, PRIMARY KEY(tenant_id,claim_id,source_id,relation)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_wlbl_brain_claim_sources_claim ON white_label_brain_claim_sources(tenant_id,claim_id)').run();
}

export async function recordWhiteLabelBrainClaim(env,user,{clientId='',app='platform',key='',value='',evidence='',score=0.75,correction=false}={}){
 await ensureWhiteLabelBrainProvenance(env);
 const tenant=String(user.tenant_id),owner=String(user.id),client=clip(clientId,80),application=clip(app,60)||'platform';
 const claimKey=clip(key,160),claimText=clip(value,12000),confidence=Math.max(0,Math.min(1,Number(score)||0.75)),ts=now();
 if(!claimKey||!claimText)throw new Error('A claim key and claim text are required.');
 const sourceId=id(),sourceLabel=clip(evidence||'Explicit teaching submitted through the authenticated Magnanimous White Label brain.',3000);
 await env.DB.prepare(`INSERT INTO white_label_brain_sources
 (id,tenant_id,user_id,client_id,app,source_type,source_label,source_uri,trust_tier,captured_at,created_at)
 VALUES(?,?,?,?,?,'user_explicit_teaching',?,'','user_asserted',?,?)`)
 .bind(sourceId,tenant,owner,client,application,sourceLabel,ts,ts).run();
 const existing=await env.DB.prepare(`SELECT id,claim_text,status FROM white_label_brain_claims
 WHERE tenant_id=? AND client_id=? AND app=? AND claim_key=? AND status IN ('active','conflicted')
 ORDER BY updated_at DESC LIMIT 1`).bind(tenant,client,application,claimKey).first();
 let claimId,status,supersedes=null;
 if(existing&&String(existing.claim_text)===claimText){
  claimId=String(existing.id);status=String(existing.status);
  await env.DB.prepare('UPDATE white_label_brain_claims SET updated_at=?,confidence=MAX(confidence,?) WHERE id=? AND tenant_id=?')
   .bind(ts,confidence,claimId,tenant).run();
 }else{
  if(existing){
   supersedes=correction?String(existing.id):null;
   const nextStatus=correction?'superseded':'conflicted';
   await env.DB.prepare(`UPDATE white_label_brain_claims SET status=?,updated_at=?
    WHERE tenant_id=? AND client_id=? AND app=? AND claim_key=? AND status IN ('active','conflicted')`)
    .bind(nextStatus,ts,tenant,client,application,claimKey).run();
  }
  claimId=id();status=existing&&!correction?'conflicted':'active';
  await env.DB.prepare(`INSERT INTO white_label_brain_claims
   (id,tenant_id,user_id,client_id,app,claim_key,claim_text,claim_type,status,confidence,supersedes_claim_id,observed_at,created_at,updated_at)
   VALUES(?,?,?,?,?,?,?,'fact',?,?,?,?,?,?)`)
   .bind(claimId,tenant,owner,client,application,claimKey,claimText,status,confidence,supersedes,ts,ts,ts).run();
 }
 await env.DB.prepare(`INSERT OR IGNORE INTO white_label_brain_claim_sources
 (tenant_id,claim_id,source_id,relation,created_at) VALUES(?,?,?,'supports',?)`)
 .bind(tenant,claimId,sourceId,ts).run();
 return{claim_id:claimId,source_id:sourceId,status,correction_applied:Boolean(existing&&correction),conflict_detected:Boolean(existing&&String(existing.claim_text)!==claimText&&!correction)};
}

export async function listWhiteLabelBrainClaims(env,user,{clientId='',app='platform',limit=12}={}){
 await ensureWhiteLabelBrainProvenance(env);
 const tenant=String(user.tenant_id),client=clip(clientId,80),application=clip(app,60)||'platform',cap=Math.max(1,Math.min(30,Number(limit)||12));
 const {results=[]}=await env.DB.prepare(`SELECT c.id,c.claim_key,c.claim_text,c.claim_type,c.status,c.confidence,
  c.observed_at,c.updated_at,s.id source_id,s.source_type,s.source_label,s.trust_tier,s.captured_at
  FROM white_label_brain_claims c
  LEFT JOIN white_label_brain_claim_sources cs ON cs.tenant_id=c.tenant_id AND cs.claim_id=c.id
  LEFT JOIN white_label_brain_sources s ON s.tenant_id=cs.tenant_id AND s.id=cs.source_id AND s.deleted_at IS NULL
  WHERE c.tenant_id=? AND (c.client_id=? OR c.client_id='')
   AND (c.app=? OR c.app='platform') AND c.status IN ('active','conflicted')
  ORDER BY CASE WHEN c.client_id=? THEN 0 ELSE 1 END,
   CASE WHEN c.app=? THEN 0 ELSE 1 END,c.updated_at DESC LIMIT ?`)
  .bind(tenant,client,application,client,application,Math.min(120,cap*4)).all();
 const seen=new Set(),out=[];
 for(const row of results){
  const claimId=String(row.id||'');if(!claimId||seen.has(claimId))continue;seen.add(claimId);
  out.push({id:claimId,key:String(row.claim_key),text:String(row.claim_text),type:String(row.claim_type),
   status:String(row.status),confidence:Number(row.confidence||0),observed_at:Number(row.observed_at||0),
   source:row.source_id?{id:String(row.source_id),type:String(row.source_type),label:String(row.source_label||''),trust:String(row.trust_tier),captured_at:Number(row.captured_at||0)}:null});
  if(out.length>=cap)break;
 }
 return out;
}

// Metadata-only MCP execution spans. Never persist tool inputs, outputs, tokens or secrets.
const now=()=>Math.floor(Date.now()/1000);
const label=(v,n)=>String(v??'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,n);
export async function ensureMagnanimousToolTraceSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tool_execution_spans (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,server_id INTEGER NOT NULL,
  tool_name TEXT NOT NULL,success INTEGER NOT NULL,latency_ms INTEGER NOT NULL,
  error_kind TEXT NOT NULL DEFAULT '',response_bytes INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_tool_span_tenant_time ON magnanimous_tool_execution_spans(tenant_id,created_at DESC)').run();
}
export function magnanimousSpanMetadata({tenant='',user='',serverId=0,tool='',success=false,durationMs=0,responseBytes=0,errorKind=''}={}){
 const elapsed=Number(durationMs),bytes=Number(responseBytes),sid=Number(serverId);
 if(!Number.isSafeInteger(sid)||sid<1)throw Error('A positive server_id is required.');
 return {tenant_id:String(tenant),user_id:String(user),server_id:sid,tool_name:label(tool,200),
  success:Boolean(success),latency_ms:Number.isFinite(elapsed)?Math.min(120000,Math.max(0,Math.round(elapsed))):0,
  response_bytes:Number.isFinite(bytes)?Math.min(5000000,Math.max(0,Math.round(bytes))):0,
  error_kind:label(errorKind,80),created_at:now()};
}
export async function recordMagnanimousToolSpan(env,input={}){
 const row=magnanimousSpanMetadata(input);
 await ensureMagnanimousToolTraceSchema(env);
 const id=crypto.randomUUID();
 await env.DB.prepare('INSERT INTO magnanimous_tool_execution_spans(id,tenant_id,user_id,server_id,tool_name,success,latency_ms,error_kind,response_bytes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
  .bind(id,row.tenant_id,row.user_id,row.server_id,row.tool_name,row.success?1:0,row.latency_ms,row.error_kind,row.response_bytes,row.created_at).run();
 // Retention is intentionally short and tenant scoped. No prompt contents are stored.
 await env.DB.prepare('DELETE FROM magnanimous_tool_execution_spans WHERE tenant_id=? AND created_at<?').bind(row.tenant_id,now()-30*86400).run();
 return id;
}
export async function listMagnanimousToolSpans(env,tenant){
 await ensureMagnanimousToolTraceSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT id,server_id,tool_name,success,latency_ms,error_kind,response_bytes,created_at FROM magnanimous_tool_execution_spans WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(String(tenant)).all();
 const {results:groups=[]}=await env.DB.prepare('SELECT tool_name,COUNT(*) AS calls,SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) AS successes,ROUND(AVG(latency_ms),1) AS mean_latency_ms,MAX(latency_ms) AS worst_latency_ms FROM magnanimous_tool_execution_spans WHERE tenant_id=? AND created_at>=? GROUP BY tool_name ORDER BY calls DESC LIMIT 50').bind(String(tenant),now()-30*86400).all();
 return{identity:'Magnanimous AI',metadata_only:true,retention_days:30,provider_cost_usd:null,provider_cost_verified:false,spans:results,summary:groups};
}

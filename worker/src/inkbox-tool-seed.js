import { MAGNANIMOUS_COMMUNICATION_TOOLS } from './inkbox-router.js';

const GLOBAL_TOOL_TENANT='__magnanimous_global__';
const GLOBAL_TOOL_USER='system:auto-qa';
const SEED_KEY='magnanimous-communications-router';
const SEED_VERSION=2;
let warmSeeded=false;

const now=()=>Math.floor(Date.now()/1000);
function normalizedRisk(tool){
 if(tool.risk==='read')return'low';
 if(tool.risk==='write'||tool.risk==='sensitive-read')return'medium';
 return'high';
}
function stepsFor(tool){return[
 {type:'route',instruction:`Use the Magnanimous Communications Router for ${tool.id} only when this capability matches the user's requested outcome.`},
 {type:'authorize',instruction:tool.risk==='read'?'Verify the signed-in owner and minimum necessary data scope before reading communication data.':'Verify owner authorization, recipient/account scope, consent/contact rules, and explicit approval before consequential or destructive communication actions.'},
 {type:'execute',instruction:'Call the real /api/magnanimous/communications/execute tool with an allowed documented API path. Never claim an email, message, call, task, permission change, or deletion succeeded without a successful tool response.'},
 {type:'verify',instruction:'Inspect the returned status/result, surface failures or pending work, and record only outcome metadata—not message bodies or credentials—in the action audit.'},
 {type:'learn',instruction:'Preserve reusable provider-neutral workflow lessons in Magnanimous while keeping the communication provider replaceable.'}
]}

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_native_tool_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  family TEXT NOT NULL DEFAULT 'general',
  inputs_json TEXT NOT NULL DEFAULT '{}',
  outputs_json TEXT NOT NULL DEFAULT '{}',
  steps_json TEXT NOT NULL DEFAULT '[]',
  risk TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'draft',
  uses INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,name)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_system_seed_versions(
  seed_key TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
}

export async function ensureMagnanimousCommunicationsToolSeed(env){
 if(warmSeeded||!env?.DB)return;
 await ensureSchema(env);
 const current=await env.DB.prepare('SELECT version FROM magnanimous_system_seed_versions WHERE seed_key=?').bind(SEED_KEY).first();
 if(Number(current?.version||0)>=SEED_VERSION){warmSeeded=true;return}
 const ts=now();
 for(const tool of MAGNANIMOUS_COMMUNICATION_TOOLS){
  const name=`communications-${tool.id}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
  const risk=normalizedRisk(tool);
  const purpose=`${tool.description} Magnanimous remains the planner, identity, memory and verification layer; the connected communications service is a replaceable execution adapter.`;
  const inputs={action:tool.id,method:'documented REST method',path:'allowed /api/v1-relative communications path',query:'optional object',body:'optional object',approved:risk==='high'?'explicit approval required for consequential/destructive execution':'approval may be required by policy'};
  const outputs={result:'real provider response or normalized error',audit:'method/path/status only; no credentials or message bodies',provider_public_identity:'Magnanimous AI'};
  await env.DB.prepare(`INSERT INTO magnanimous_native_tool_specs(
   tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,uses,successes,created_at,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,'proposed',0,0,?,?)
  ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET
   purpose=excluded.purpose,
   family=excluded.family,
   inputs_json=excluded.inputs_json,
   outputs_json=excluded.outputs_json,
   steps_json=excluded.steps_json,
   risk=excluded.risk,
   status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE 'proposed' END,
   updated_at=excluded.updated_at`)
   .bind(GLOBAL_TOOL_TENANT,GLOBAL_TOOL_USER,name,purpose,`communications-${tool.family}`,JSON.stringify(inputs),JSON.stringify(outputs),JSON.stringify(stepsFor(tool)),risk,ts,ts).run();
 }
 await env.DB.prepare(`INSERT INTO magnanimous_system_seed_versions(seed_key,version,updated_at) VALUES(?,?,?) ON CONFLICT(seed_key) DO UPDATE SET version=excluded.version,updated_at=excluded.updated_at`).bind(SEED_KEY,SEED_VERSION,ts).run();
 warmSeeded=true;
}

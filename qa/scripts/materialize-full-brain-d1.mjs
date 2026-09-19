import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getCapabilityAbsorptionManifest, getCapabilityResearchRecord } from '../../worker/src/magnanimous-connector-absorption.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const outDir=process.argv[2];
if(!outDir)throw new Error('Output directory argument is required.');
fs.mkdirSync(outDir,{recursive:true});

const now=Math.floor(Date.now()/1000);
const GLOBAL_TOOL_TENANT='__magnanimous_global__';
const GLOBAL_TOOL_USER='system:auto-qa';
const clip=(v,n=5000)=>String(v??'').trim().slice(0,n);
const normalizeName=v=>clip(v,100).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'magnanimous-tool';
const q=v=>`'${String(v??'').replaceAll("'","''")}'`;

function absorbedRecipeRisk(row){
 const hay=`${row.category||''} ${row.capability||''} ${row.connector_name||''}`.toLowerCase();
 if(/payment|charge|refund|payout|bank|transfer|delete|remove|revoke|uninstall|credential|secret|permission|security|firewall|domain|deploy|publish|send|reply|forward|call|sms|message|order|purchase|checkout/.test(hay))return'high';
 if(/create|update|write|edit|commit|merge|branch|upload|invite|schedule|book|campaign|adset|advert|crm|sales|commerce|email|calendar|social|messaging|operations|deployment|engineering/.test(hay))return'medium';
 return'low';
}
function recipeSteps(row,requiresConnection){
 const source=Array.isArray(row.recipe)?row.recipe:[];
 const safe=source.map((instruction,index)=>({
  type:index===0?'understand':index===source.length-1?'verify':'execute',
  instruction:clip(instruction,1000)
 })).filter(x=>x.instruction).slice(0,20);
 const permission={type:'authorize',instruction:requiresConnection?'Verify the required account/tool connection, tenant scope, and user authorization before any account-specific action.':'Verify permissions and require explicit approval before any consequential action.'};
 return [permission,...safe,{type:'verify',instruction:'Verify the outcome against the approved teaching, report anything not completed, and never claim an external action succeeded without a real tool result.'}].slice(0,30);
}

const raw=getCapabilityAbsorptionManifest();
const byLedgerKey=new Map();
for(const row of raw){
 const key=`${row.connector_id}\u0000${row.capability}`;
 const existing=byLedgerKey.get(key);
 if(existing&&existing.id!==row.id)throw new Error(`Capability ledger key collision: ${key} from ${existing.id} and ${row.id}`);
 byLedgerKey.set(key,row);
}
const rows=[...byLedgerKey.values()].sort((a,b)=>String(a.connector_id).localeCompare(String(b.connector_id))||String(a.capability).localeCompare(String(b.capability)));

const toolNameOwner=new Map();
for(const row of rows){
 const name=normalizeName(`absorb-${row.connector_id}-${row.capability}`);
 const existing=toolNameOwner.get(name);
 if(existing&&existing!==row.id)throw new Error(`Tool Foundry name collision: ${name} from ${existing} and ${row.id}`);
 toolNameOwner.set(name,row.id);
}

const chunks=[];
const chunkSize=200;
for(let offset=0;offset<rows.length;offset+=chunkSize){
 const part=rows.slice(offset,offset+chunkSize),statements=[];
 for(const row of part){
  const research=getCapabilityResearchRecord(row);
  const spec={
   magnanimous_owned:row.magnanimous_owned,
   external_only:row.external_only,
   acceptance_tests:row.acceptance_tests,
   recipe:row.recipe,
   implementation_status:row.implementation_status,
   initiative:row.initiative||{}
  };
  const realization=classifyCapabilityRealization(row);
  const requiresConnection=realization.requires_external||String(row.boundary||'').includes('external')||String(row.boundary||'').includes('account')||String(row.boundary||'').includes('rail');
  const risk=absorbedRecipeRisk(row);
  const status=risk==='high'?'review-required':(risk==='low'&&realization.status==='native-ready'?'ready':'proposed');
  const name=normalizeName(`absorb-${row.connector_id}-${row.capability}`);
  const family=normalizeName(`native-${row.category||'general'}`);
  const purpose=clip(`Magnanimous-owned workflow specification for ${row.capability}, benchmarked against ${row.connector_name}. Magnanimous owns reasoning, memory, workflow and verification; any unavoidable outside account/data/network/compute boundary remains a replaceable adapter.`,2000);
  const inputs={
   task:'string',
   authorized_context:'object',
   required_capabilities:[clip(row.capability,120)].filter(Boolean),
   requires_connection:requiresConnection,
   teaching_submission_id:0,
   agent_id:'magnanimous-native-first',
   initiative:{suggestive:row.initiative?.suggestive===true,auto_initiate:row.initiative?.auto_initiate===true,requires_confirmation:row.initiative?.requires_confirmation===true,action_class:clip(row.initiative?.action_class||'',120),family:clip(row.initiative?.family||'',120)}
  };
  const outputs={result:'verified workflow result',actions_taken:'array',actions_pending_authorization:'array'};
  const steps=recipeSteps(row,requiresConnection);

  statements.push(`INSERT INTO magnanimous_connector_capability_absorption(connector_id,capability_id,connector_name,category,native_target,boundary,source_kind,status,research_json,spec_json,created_at,updated_at)
VALUES(${q(row.connector_id)},${q(row.capability)},${q(row.connector_name)},${q(row.category||'general')},${q(row.native_target||'')},${q(row.boundary||'none')},${q(row.source_kind||'benchmark-contract')},'tool-foundry-specified',${q(JSON.stringify(research).slice(0,10000))},${q(JSON.stringify(spec).slice(0,30000))},${now},${now})
ON CONFLICT(connector_id,capability_id) DO UPDATE SET connector_name=excluded.connector_name,category=excluded.category,native_target=excluded.native_target,boundary=excluded.boundary,source_kind=excluded.source_kind,status='tool-foundry-specified',research_json=excluded.research_json,spec_json=excluded.spec_json,updated_at=excluded.updated_at;`);

  statements.push(`INSERT INTO magnanimous_native_tool_specs(tenant_id,user_id,name,purpose,family,inputs_json,outputs_json,steps_json,risk,status,created_at,updated_at)
VALUES(${q(GLOBAL_TOOL_TENANT)},${q(GLOBAL_TOOL_USER)},${q(name)},${q(purpose)},${q(family)},${q(JSON.stringify(inputs).slice(0,30000))},${q(JSON.stringify(outputs).slice(0,30000))},${q(JSON.stringify(steps).slice(0,50000))},${q(risk)},${q(status)},${now},${now})
ON CONFLICT(tenant_id,user_id,name) DO UPDATE SET purpose=excluded.purpose,family=excluded.family,inputs_json=excluded.inputs_json,outputs_json=excluded.outputs_json,steps_json=excluded.steps_json,risk=excluded.risk,status=CASE WHEN magnanimous_native_tool_specs.status='ready' THEN 'ready' ELSE excluded.status END,updated_at=excluded.updated_at;`);

  statements.push(`INSERT INTO magnanimous_capability_realizations(connector_id,capability_id,tool_name,native_target,mode,status,native_route,evidence_module,boundary,requires_external,proof_json,created_at,updated_at)
VALUES(${q(row.connector_id)},${q(row.capability)},${q(name)},${q(realization.native_target)},${q(realization.mode)},${q(realization.status)},${q(realization.route)},${q(realization.evidence_module)},${q(row.boundary||'none')},${realization.requires_external?1:0},${q(JSON.stringify({proof:realization.proof,source:'evidence-gated-runtime-registry'}))},${now},${now})
ON CONFLICT(connector_id,capability_id) DO UPDATE SET tool_name=excluded.tool_name,native_target=excluded.native_target,mode=excluded.mode,status=excluded.status,native_route=excluded.native_route,evidence_module=excluded.evidence_module,boundary=excluded.boundary,requires_external=excluded.requires_external,proof_json=excluded.proof_json,updated_at=excluded.updated_at;`);
 }
 const index=String(chunks.length+1).padStart(3,'0');
 const file=path.join(outDir,`${index}-materialize.sql`);
 fs.writeFileSync(file,statements.join('\n'));
 chunks.push(file);
}
const realizations=rows.map(x=>classifyCapabilityRealization(x));
const realizationCounts={'native-ready':0,'hybrid-ready':0,'bridge-required':0,'specified-only':0};
for(const x of realizations)realizationCounts[x.status]=(realizationCounts[x.status]||0)+1;
const digest=crypto.createHash('sha256').update(rows.map((x,i)=>JSON.stringify({id:x.id,connector_id:x.connector_id,capability:x.capability,source_kind:x.source_kind,boundary:x.boundary,native_target:x.native_target,recipe:x.recipe,research:getCapabilityResearchRecord(x),search_text:x.search_text||'',initiative:x.initiative||{},realization:realizations[i]})+'\n').join('')).digest('hex');
const finalSql=`INSERT INTO magnanimous_capability_materialization_state(id,manifest_count,ledger_count,tool_spec_count,source_digest,status,updated_at)
VALUES('full-brain',${rows.length},${rows.length},${rows.length},${q(digest)},'complete',${now})
ON CONFLICT(id) DO UPDATE SET manifest_count=excluded.manifest_count,ledger_count=excluded.ledger_count,tool_spec_count=excluded.tool_spec_count,source_digest=excluded.source_digest,status='complete',updated_at=excluded.updated_at;
INSERT INTO magnanimous_capability_realization_state(id,manifest_count,native_ready_count,hybrid_ready_count,bridge_required_count,specified_only_count,source_digest,status,updated_at)
VALUES('full-brain',${rows.length},${realizationCounts['native-ready']},${realizationCounts['hybrid-ready']},${realizationCounts['bridge-required']},${realizationCounts['specified-only']},${q(digest)},'complete',${now})
ON CONFLICT(id) DO UPDATE SET manifest_count=excluded.manifest_count,native_ready_count=excluded.native_ready_count,hybrid_ready_count=excluded.hybrid_ready_count,bridge_required_count=excluded.bridge_required_count,specified_only_count=excluded.specified_only_count,source_digest=excluded.source_digest,status='complete',updated_at=excluded.updated_at;
`;
const finalFile=path.join(outDir,`${String(chunks.length+1).padStart(3,'0')}-state.sql`);
fs.writeFileSync(finalFile,finalSql);
chunks.push(finalFile);

const metadata={
 generated_at:now,
 manifest_count:rows.length,
 raw_manifest_count:raw.length,
 chunk_count:chunks.length,
 source_digest:digest,
 high_risk:rows.filter(x=>absorbedRecipeRisk(x)==='high').length,
 medium_risk:rows.filter(x=>absorbedRecipeRisk(x)==='medium').length,
 low_risk:rows.filter(x=>absorbedRecipeRisk(x)==='low').length,
 native_ready:realizationCounts['native-ready'],
 hybrid_ready:realizationCounts['hybrid-ready'],
 bridge_required:realizationCounts['bridge-required'],
 specified_only:realizationCounts['specified-only'],
 global_tool_tenant:GLOBAL_TOOL_TENANT,
 global_tool_user:GLOBAL_TOOL_USER
};
fs.writeFileSync(path.join(outDir,'manifest-metadata.json'),JSON.stringify(metadata,null,2));
console.log(JSON.stringify(metadata));

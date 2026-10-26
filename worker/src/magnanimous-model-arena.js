// Independent Magnanimous implementation of a bounded, zero-spend model-output evaluator.
// Candidate text is sent to the authenticated Magnanimous Worker, never to an external model.
// Research inspiration: elder-plinius/G0DM0D3, AGPL-3.0; no upstream source or jailbreak prompts copied.
import { requirePlatformOwner } from './platform-owner-guard.js';

const MAX_BODY_CHARS=90000;
const MAX_OUTPUT_CHARS=8000;
const MAX_CANDIDATES=8;
const MAX_TERMS=24;
const normalized=value=>String(value).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join(' ')||'';
const failure=message=>{throw new TypeError(message);};
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});

export const MAGNANIMOUS_MODEL_ARENA_POLICY=Object.freeze({
 brain:'Magnanimous AI',
 owner:'Magnanimous AI',
 mode:'native-zero-spend-rubric-evaluation',
 visibility:'platform-owner-authenticated',
 external_model_requests:0,
 new_provider_billing:false,
 provider_keys_accepted:false,
 response_text_persisted:false,
 response_text_redistributed:false,
 app_telemetry:false,
 executed_tools:false,
 bypass_prompts_included:false,
 scoring:'Lexical rubric adherence, not factual accuracy or an AI judge',
 limitations:['Literal phrase matches do not prove correctness or safety.','Latency and estimated cost are optional caller-reported values, not measured charges.'],
 limits:{max_candidates:MAX_CANDIDATES,max_output_chars:MAX_OUTPUT_CHARS,max_phrases_per_list:MAX_TERMS}
});

function phrases(value,label,{required=false}={}){
 if(!Array.isArray(value)||value.length>MAX_TERMS||(required&&value.length===0))failure(`${label} must contain ${required?'1 to':'0 to'} ${MAX_TERMS} phrases.`);
 const result=[],seen=new Set();
 for(const item of value){
  if(typeof item!=='string'||item.length<1||item.length>120)failure(`${label} phrases must be strings of 1 to 120 characters.`);
  const norm=normalized(item);
  if(!norm||norm.length>100)failure(`${label} contains an invalid phrase.`);
  if(!seen.has(norm)){result.push({text:item,norm});seen.add(norm);}
 }
 if(required&&result.length===0)failure('At least one distinct required phrase is needed.');
 return result;
}

function optionalNumber(value,label,maximum){
 if(value===undefined||value===null)return null;
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>maximum)failure(`${label} must be a finite nonnegative number at most ${maximum}.`);
 return value;
}

export function evaluateMagnanimousModelArena(input){
 if(!input||typeof input!=='object'||Array.isArray(input))failure('Provide a comparison object.');
 const rubric=input.rubric;
 if(!rubric||typeof rubric!=='object'||Array.isArray(rubric))failure('Provide a rubric object.');
 const required=phrases(rubric.required_phrases,'required_phrases',{required:true});
 const excluded=phrases(rubric.excluded_phrases||[],'excluded_phrases');
 if(!Array.isArray(input.candidates)||input.candidates.length<2||input.candidates.length>MAX_CANDIDATES)failure(`Provide 2 to ${MAX_CANDIDATES} candidates.`);
 const budget=optionalNumber(input.estimated_budget_usd,'estimated_budget_usd',10000)??0;
 const ids=new Set();
 const scores=input.candidates.map((row,index)=>{
  if(!row||typeof row!=='object'||Array.isArray(row))failure(`Candidate ${index+1} must be an object.`);
  const id=row.id;
  if(typeof id!=='string'||!(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,47}$/).test(id))failure(`Candidate ${index+1} needs a short safe ID.`);
  if(ids.has(id))failure('Candidate IDs must be unique.');
  ids.add(id);
  if(typeof row.output!=='string'||!row.output.trim()||row.output.length>MAX_OUTPUT_CHARS)failure(`Candidate ${id} output must contain 1 to ${MAX_OUTPUT_CHARS} characters.`);
  const response=normalized(row.output);
  const includes=phrase=>` ${response} `.includes(` ${phrase.norm} `);
  const met=required.filter(includes).map(x=>x.text);
  const missing=required.filter(x=>!includes(x)).map(x=>x.text);
  const exclusions=excluded.filter(includes).map(x=>x.text);
  const latency=optionalNumber(row.reported_latency_ms,`Candidate ${id} reported_latency_ms`,3600000);
  const cost=optionalNumber(row.estimated_cost_usd,`Candidate ${id} estimated_cost_usd`,10000);
  return {id,rank:0,rubric_adherence_score:Math.max(0,Math.round(100*met.length/required.length)-20*exclusions.length),required_met:met,required_missing:missing,exclusions_detected:exclusions,reported_latency_ms:latency,estimated_cost_usd:cost};
 });
 scores.sort((a,b)=>b.rubric_adherence_score-a.rubric_adherence_score||a.exclusions_detected.length-b.exclusions_detected.length||(a.estimated_cost_usd??Infinity)-(b.estimated_cost_usd??Infinity)||(a.reported_latency_ms??Infinity)-(b.reported_latency_ms??Infinity)||a.id.localeCompare(b.id));
 scores.forEach((s,i)=>{s.rank=i+1;});
 const allCostsKnown=scores.every(s=>s.estimated_cost_usd!==null);
 const declaredTotal=allCostsKnown?Number(scores.reduce((sum,s)=>sum+s.estimated_cost_usd,0).toFixed(6)):null;
 return {
  ok:true,brain:'Magnanimous AI',mode:'native-zero-spend-rubric-evaluation',
  candidate_count:scores.length,
  scoring_method:'Normalized exact-phrase coverage (0–100), minus 20 points per excluded phrase. Neither semantic quality nor factual accuracy is evaluated.',
  winner_label:'Highest lexical rubric adherence; not necessarily the best answer',
  top_candidate_id:scores[0].id,
  rankings:scores,
  funding:{external_model_calls:0,actual_external_spend_usd:0,estimated_budget_usd:budget,caller_reported_total_estimate_usd:declaredTotal,estimate_complete:allCostsKnown,estimate_over_budget:declaredTotal===null?null:declaredTotal>budget},
  privacy:{persistent_storage:false,app_telemetry:false,raw_candidate_outputs_returned:false},
  caveat:'Results test literal phrases only. Verify technical truth, safety, provenance, and outcome with separate human or approved model evaluation.'
 };
}

export async function handleMagnanimousModelArena(request,env){
 const pathname=new URL(request.url).pathname;
 if(pathname!=='/api/magnanimous/model-arena'&&pathname!=='/api/magnanimous/model-arena/evaluate')return null;
 const denied=await requirePlatformOwner(request,env);
 if(denied)return denied;
 if(request.method==='GET'&&pathname==='/api/magnanimous/model-arena')return json({status:'native-ready',...MAGNANIMOUS_MODEL_ARENA_POLICY,endpoint:'/api/magnanimous/model-arena/evaluate',method:'POST'});
 if(request.method!=='POST'||pathname!=='/api/magnanimous/model-arena/evaluate')return json({detail:'Method not allowed.'},405);
 const declaredBytes=Number(request.headers.get('content-length')||0);
 if(declaredBytes>MAX_BODY_CHARS)return json({detail:'Comparison payload is too large.'},413);
 const body=await request.text();
 if(body.length>MAX_BODY_CHARS)return json({detail:'Comparison payload is too large.'},413);
 let input;
 try{input=JSON.parse(body);}catch{return json({detail:'Request must contain valid JSON.'},400);}
 try{return json(evaluateMagnanimousModelArena(input));}
 catch(error){if(error instanceof TypeError)return json({detail:error.message},400);throw error;}
}

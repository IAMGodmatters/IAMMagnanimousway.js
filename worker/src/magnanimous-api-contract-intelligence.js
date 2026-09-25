import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const METHODS=new Set(['get','post','put','patch','delete','options','head']);

const clip=(v,n=12000)=>String(v??'').trim().slice(0,n);
const uniq=a=>[...new Set(a.filter(Boolean))];
const stable=v=>{
 if(Array.isArray(v))return v.map(stable);
 if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));
 return v;
};
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
const endpointKey=e=>`${String(e.method||'').toUpperCase()} ${String(e.path||'')}`;

function schemaFields(schema={}){
 const required=new Set(Array.isArray(schema?.required)?schema.required:[]);
 return Object.entries(schema?.properties||{}).map(([name,value])=>({
  name,
  required:required.has(name),
  type:String(value?.type||value?.format||'unknown')
 }));
}

function normalizeEndpoint(row={}){
 const parameters=(row.parameters||[]).map(p=>({
  name:String(p.name||''),
  in:String(p.in||''),
  required:Boolean(p.required),
  type:String(p.type||p.schema?.type||p.schema?.format||'unknown')
 })).filter(x=>x.name);
 const request_fields=(row.request_fields||[]).map(x=>({
  name:String(x.name||''),
  required:Boolean(x.required),
  type:String(x.type||'unknown')
 })).filter(x=>x.name);
 const responses=(row.responses||[]).map(x=>({
  code:String(x.code||''),
  fields:(x.fields||[]).map(f=>({name:String(f.name||''),required:Boolean(f.required),type:String(f.type||'unknown')})).filter(f=>f.name)
 })).filter(x=>x.code);
 return{
  method:String(row.method||'GET').toUpperCase(),
  path:String(row.path||'/'),
  operation_id:String(row.operation_id||''),
  parameters,
  request_fields,
  responses,
  errors:uniq((row.errors||responses.filter(x=>Number(x.code)>=400).map(x=>x.code)).map(String))
 };
}

function fromOpenApi(spec){
 const out=[];
 for(const [path,pathItem] of Object.entries(spec?.paths||{})){
  const shared=Array.isArray(pathItem?.parameters)?pathItem.parameters:[];
  for(const [method,op] of Object.entries(pathItem||{})){
   if(!METHODS.has(String(method).toLowerCase())||!op||typeof op!=='object')continue;
   const parameters=[...shared,...(Array.isArray(op.parameters)?op.parameters:[])];
   let request_fields=[];
   const content=op.requestBody?.content||{};
   for(const value of Object.values(content)){
    if(value?.schema){request_fields=schemaFields(value.schema);if(request_fields.length)break;}
   }
   const responses=[];
   for(const [code,res] of Object.entries(op.responses||{})){
    let fields=[];
    for(const value of Object.values(res?.content||{})){
     if(value?.schema){fields=schemaFields(value.schema);if(fields.length)break;}
    }
    responses.push({code,fields});
   }
   out.push(normalizeEndpoint({method,path,operation_id:op.operationId||'',parameters,request_fields,responses}));
  }
 }
 return{source_kind:'openapi',title:String(spec?.info?.title||''),version:String(spec?.info?.version||''),endpoints:out};
}

function fromEndpointArray(obj){
 return{
  source_kind:'structured',
  title:String(obj?.title||obj?.name||''),
  version:String(obj?.version||''),
  endpoints:(obj?.endpoints||[]).map(normalizeEndpoint)
 };
}

function fromText(text){
 const lines=String(text||'').split(/\r?\n/),out=[];
 let current=null;
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  const m=line.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\/\S*)/i);
  if(m){
   current={method:m[1].toUpperCase(),path:m[2],operation_id:'',parameters:[],request_fields:[],responses:[],errors:[],evidence:[{line:i+1,text:line.slice(0,300)}]};
   out.push(current);
   continue;
  }
  if(!current||!line)continue;
  let x=line.match(/^(?:param|parameter)\s*[:\-]\s*([A-Za-z0-9_.-]+)(?:\s+in=(\w+))?(?:\s+(required))?/i);
  if(x){current.parameters.push({name:x[1],in:x[2]||'',required:Boolean(x[3]),type:'unknown'});continue;}
  x=line.match(/^(?:field|request[_ -]?field)\s*[:\-]\s*([A-Za-z0-9_.-]+)(?:\s+(required))?/i);
  if(x){current.request_fields.push({name:x[1],required:Boolean(x[2]),type:'unknown'});continue;}
  x=line.match(/^(?:response|status)\s*[:\-]?\s*(\d{3})/i);
  if(x){current.responses.push({code:x[1],fields:[]});if(Number(x[1])>=400)current.errors.push(x[1]);continue;}
  x=line.match(/^error\s*[:\-]?\s*(\d{3})/i);
  if(x){current.errors.push(x[1]);continue;}
 }
 return{source_kind:'text',title:'',version:'',endpoints:out.map(normalizeEndpoint)};
}

export function extractApiContract(material){
 let value=material;
 if(typeof material==='string'){
  const raw=material.trim();
  try{value=JSON.parse(raw)}catch{return fromText(raw)}
 }
 if(value&&typeof value==='object'){
  if(value.paths&&typeof value.paths==='object')return fromOpenApi(value);
  if(Array.isArray(value.endpoints))return fromEndpointArray(value);
 }
 return{source_kind:'unknown',title:'',version:'',endpoints:[]};
}

function fieldMap(items=[]){return new Map(items.map(x=>[x.name,x]))}
function endpointDiff(before,after){
 const changes=[];
 const bp=fieldMap(before.parameters),ap=fieldMap(after.parameters);
 for(const [name,p] of bp)if(!ap.has(name))changes.push({type:'parameter_removed',name,breaking:'potential'});
 for(const [name,p] of ap){
  if(!bp.has(name))changes.push({type:'parameter_added',name,breaking:p.required?'yes':'no'});
  else if(Boolean(bp.get(name).required)!==Boolean(p.required))changes.push({type:'parameter_required_changed',name,breaking:p.required?'yes':'no'});
 }
 const br=fieldMap(before.request_fields),ar=fieldMap(after.request_fields);
 for(const [name] of br)if(!ar.has(name))changes.push({type:'request_field_removed',name,breaking:'potential'});
 for(const [name,f] of ar){
  if(!br.has(name))changes.push({type:'request_field_added',name,breaking:f.required?'yes':'no'});
  else if(Boolean(br.get(name).required)!==Boolean(f.required))changes.push({type:'request_field_required_changed',name,breaking:f.required?'yes':'no'});
 }
 const beforeCodes=new Set(before.responses.map(x=>x.code)),afterCodes=new Set(after.responses.map(x=>x.code));
 for(const code of beforeCodes)if(!afterCodes.has(code))changes.push({type:'response_removed',code,breaking:Number(code)<400?'potential':'no'});
 for(const code of afterCodes)if(!beforeCodes.has(code))changes.push({type:'response_added',code,breaking:'no'});
 return changes;
}

export function compareApiContracts(beforeMaterial,afterMaterial){
 const before=extractApiContract(beforeMaterial),after=extractApiContract(afterMaterial);
 const bm=new Map(before.endpoints.map(x=>[endpointKey(x),x])),am=new Map(after.endpoints.map(x=>[endpointKey(x),x]));
 const added=[],removed=[],modified=[],unchanged=[];
 for(const [key,row] of bm){
  if(!am.has(key)){removed.push({key,before:row,classification:'breaking'});continue;}
  const next=am.get(key),changes=endpointDiff(row,next);
  if(!changes.length&&same(row,next))unchanged.push({key});
  else modified.push({key,before:row,after:next,changes,classification:changes.some(x=>x.breaking==='yes')?'breaking':changes.some(x=>x.breaking==='potential')?'potential-breaking':'non-breaking'});
 }
 for(const [key,row] of am)if(!bm.has(key))added.push({key,after:row,classification:'non-breaking'});
 return{before:{source_kind:before.source_kind,version:before.version,count:before.endpoints.length},after:{source_kind:after.source_kind,version:after.version,count:after.endpoints.length},added,removed,modified,unchanged};
}

export function checkApiDocumentationCoverage(contractMaterial,documentation=''){
 const contract=extractApiContract(contractMaterial),docs=String(documentation||'').toLowerCase(),items=[];
 let expected=0,covered=0;
 for(const endpoint of contract.endpoints){
  const endpointChecks=[];
  const method=endpoint.method.toLowerCase(),path=endpoint.path.toLowerCase();
  const endpointCovered=docs.includes(path)&&docs.includes(method);
  expected++;if(endpointCovered)covered++;
  endpointChecks.push({kind:'endpoint',value:endpointKey(endpoint),covered:endpointCovered});
  for(const p of endpoint.parameters){
   const ok=docs.includes(String(p.name).toLowerCase());expected++;if(ok)covered++;endpointChecks.push({kind:'parameter',value:p.name,covered:ok});
  }
  for(const f of endpoint.request_fields){
   const ok=docs.includes(String(f.name).toLowerCase());expected++;if(ok)covered++;endpointChecks.push({kind:'request_field',value:f.name,covered:ok});
  }
  for(const r of endpoint.responses){
   const ok=docs.includes(String(r.code));expected++;if(ok)covered++;endpointChecks.push({kind:'response',value:r.code,covered:ok});
  }
  items.push({endpoint:endpointKey(endpoint),status:endpointChecks.every(x=>x.covered)?'covered':endpointChecks.some(x=>x.covered)?'partial':'missing',checks:endpointChecks});
 }
 return{contract_endpoints:contract.endpoints.length,expected_items:expected,covered_items:covered,coverage_ratio:expected?Number((covered/expected).toFixed(3)):1,items};
}

export function classifyApiBreakingChanges(changeMaterial){
 const comparison=changeMaterial?.modified||changeMaterial?.removed||changeMaterial?.added?changeMaterial:compareApiContracts(changeMaterial?.before||{},changeMaterial?.after||{});
 const items=[];
 for(const row of comparison.removed||[])items.push({endpoint:row.key,category:'endpoint_removed',classification:'breaking',evidence:row});
 for(const row of comparison.added||[])items.push({endpoint:row.key,category:'endpoint_added',classification:'non-breaking',evidence:row});
 for(const row of comparison.modified||[]){
  if(!(row.changes||[]).length)items.push({endpoint:row.key,category:'modified',classification:row.classification||'potential-breaking',evidence:row});
  for(const change of row.changes||[])items.push({endpoint:row.key,category:change.type,classification:change.breaking==='yes'?'breaking':change.breaking==='potential'?'potential-breaking':'non-breaking',evidence:change});
 }
 return{items,breaking:items.filter(x=>x.classification==='breaking').length,potential_breaking:items.filter(x=>x.classification==='potential-breaking').length,non_breaking:items.filter(x=>x.classification==='non-breaking').length};
}

function normalizeReferences(list=[]){
 return (Array.isArray(list)?list:[]).map(x=>typeof x==='string'?{name:x,endpoints:[]}:{name:String(x?.name||x?.id||'unnamed'),endpoints:(x?.endpoints||x?.contracts||[]).map(String),metadata:x?.metadata||{}});}
export function generateApiImpactMap({changes,consumers=[],tests=[],documentation=[]}={}){
 const classified=classifyApiBreakingChanges(changes||{});
 const refs={consumers:normalizeReferences(consumers),tests:normalizeReferences(tests),documentation:normalizeReferences(documentation)};
 const impact=classified.items.map(item=>{
  const match=list=>list.filter(x=>x.endpoints.some(e=>e===item.endpoint||item.endpoint.includes(e)||e.includes(item.endpoint)));
  return{...item,consumers:match(refs.consumers),tests:match(refs.tests),documentation:match(refs.documentation)};
 });
 return{summary:{changes:impact.length,breaking:classified.breaking,potential_breaking:classified.potential_breaking,non_breaking:classified.non_breaking},impacts:impact,limitations:'Impact links are evidence-based from explicit endpoint references supplied with consumers, tests, or documentation. Magnanimous does not invent unseen dependencies.'};
}

export const MAGNANIMOUS_API_CONTRACT_INTELLIGENCE=Object.freeze({
 identity:'Magnanimous API Contract Intelligence',
 brain:'Magnanimous AI',
 native:true,
 provider_required:false,
 capabilities:['extract-api-contract','documentation-coverage','compare-contract-versions','classify-breaking-changes','impact-map'],
 truth_rule:'Only explicit contract/documentation material is analyzed. Missing facts are reported rather than invented.'
});

export async function handleMagnanimousApiContractIntelligence(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/api-contract'))return null;
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to use Magnanimous API Contract Intelligence.'},401);
 if(request.method==='GET'&&path==='/api/magnanimous/api-contract')return json(MAGNANIMOUS_API_CONTRACT_INTELLIGENCE);
 if(request.method!=='POST')return json({detail:'Method not allowed.'},405);
 const body=await request.json().catch(()=>({}));
 if(path==='/api/magnanimous/api-contract/extract')return json({ok:true,contract:extractApiContract(body.material??body.contract??body.text??'')});
 if(path==='/api/magnanimous/api-contract/coverage')return json({ok:true,coverage:checkApiDocumentationCoverage(body.contract??body.material??'',body.documentation??body.docs??'')});
 if(path==='/api/magnanimous/api-contract/compare')return json({ok:true,comparison:compareApiContracts(body.before??{},body.after??{})});
 if(path==='/api/magnanimous/api-contract/breaking')return json({ok:true,classification:classifyApiBreakingChanges(body.changes??body)});
 if(path==='/api/magnanimous/api-contract/impact')return json({ok:true,impact:generateApiImpactMap(body)});
 return json({detail:'Magnanimous API Contract Intelligence route not found.'},404);
}

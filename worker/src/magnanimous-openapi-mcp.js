// Native OpenAPI-to-MCP contract generator. Strictly offline: never fetches an upstream API.
const METHODS=new Set(['get','head','post','put','patch','delete']);
const MAX_BYTES=240000;
function fail(s){throw new Error(s)}
function bounded(value,n=200){return String(value??'').trim().slice(0,n)}
function plain(value){return value && typeof value==='object'&&!Array.isArray(value)}
function noRemoteReferences(value,depth=0){
 if(depth>22)fail('OpenAPI nesting exceeds supported depth.');
 if(!value||typeof value!=='object')return;
 if(Object.hasOwn(value,'$ref'))fail('Unresolved $ref is not allowed in safe MCP drafts.');
 if(Array.isArray(value)){for(const item of value)noRemoteReferences(item,depth+1);return}
 for(const [key,item] of Object.entries(value)){
  if(['allOf','anyOf','oneOf','not','discriminator'].includes(key))fail('Composite OpenAPI schema requires manual review.');
  noRemoteReferences(item,depth+1);
 }
}
function normalizeSchema(schema={},depth=0){
 if(depth>10)fail('MCP input schema nesting limit exceeded.');
 if(!plain(schema))fail('Input parameter must have a JSON object schema.');
 noRemoteReferences(schema);
 const type=Array.isArray(schema.type)?null:schema.type||'string';
 if(!['string','number','integer','boolean','object','array'].includes(type))fail('Unsupported parameter schema type.');
 const out={type};
 if(Array.isArray(schema.enum)&&schema.enum.length<=40)out.enum=schema.enum;
 if(type==='object'){
  if(Object.keys(schema.properties||{}).length>40)fail('Too many nested properties.');
  out.properties=Object.fromEntries(Object.entries(schema.properties||{}).map(([key,v])=>[key,normalizeSchema(v,depth+1)]));
  if(Array.isArray(schema.required))out.required=schema.required.filter(x=>Object.hasOwn(out.properties,x));
  out.additionalProperties=false;
 }
 if(type==='array')out.items=normalizeSchema(schema.items||{type:'string'},depth+1);
 if(schema.format&&['date','date-time','email','uuid'].includes(schema.format))out.format=schema.format;
 return out;
}
function toolName(method,path,used){
 let name='api_'+method+'_'+path.toLowerCase().replace(/\{([^{}]+)\}/g,'by_$1').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,56);
 if(!/^[a-z][a-z0-9_]*$/.test(name))fail('Invalid derived tool name.');
 let n=1,unique=name;
 while(used.has(unique))unique=name.slice(0,55)+'_'+(++n);
 used.add(unique);
 return unique;
}
export function generateMagnanimousMcpDraft(source){
 let raw;
 if(typeof source==='string'){
  if(new TextEncoder().encode(source).length>MAX_BYTES)fail('OpenAPI contract exceeds 240 KB.');
  try{raw=JSON.parse(source)}catch{fail('Valid JSON OpenAPI specification required.');}
 }else raw=source;
 if(!plain(raw))fail('OpenAPI specification must be an object.');
 if(new TextEncoder().encode(JSON.stringify(raw)).length>MAX_BYTES)fail('OpenAPI contract exceeds 240 KB.');
 if(!/^3\.(0|1)\./.test(raw.openapi||''))fail('OpenAPI 3.0 or 3.1 contract required.');
 if(!plain(raw.paths))fail('OpenAPI paths are required.');
 const entries=Object.entries(raw.paths);
 if(entries.length>50)fail('Maximum 50 API paths per draft.');
 const result=[],used=new Set();
 for(const [path,definition] of entries){
  if(!/^\/[\w{}./~-]*$/.test(path)||path.length>160||path.includes('..')||path.includes('//'))fail('Unsafe API path in contract.');
  if(!plain(definition))fail('OpenAPI path item must be an object.');
  for(const [method,operation] of Object.entries(definition)){
   if(!METHODS.has(method.toLowerCase()))continue;
   if(!plain(operation))fail('OpenAPI operation must be an object.');
   if(result.length>=75)fail('Maximum 75 generated tools per draft.');
   const name=toolName(method.toLowerCase(),path,used);
   const properties={},required=[],defined=new Set();
   const params=[...(Array.isArray(definition.parameters)?definition.parameters:[]),...(Array.isArray(operation.parameters)?operation.parameters:[])];
   if(params.length>60)fail('Too many API operation parameters.');
   for(const p of params){
    if(!plain(p)||!['path','query'].includes(p.in)||!/^[A-Za-z_][A-Za-z0-9_-]{0,60}$/.test(p.name||''))fail('Only safe path/query parameters can be generated.');
    const key=p.in+'_'+p.name;
    if(defined.has(key))continue;defined.add(key);
    properties[key]=normalizeSchema(p.schema||{type:'string'});
    if(p.in==='path'||p.required===true)required.push(key);
   }
   const body=operation.requestBody;
   if(body){
    const jsonBody=body.content?.['application/json']?.schema;
    if(!jsonBody)fail('Only application/json request bodies are supported.');
    properties.body=normalizeSchema(jsonBody);
    if(body.required)required.push('body');
   }
   const names=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>m[1]);
   if(names.some(x=>!Object.hasOwn(properties,'path_'+x)))fail('Path parameters must be explicitly described.');
   const read_only=['get','head'].includes(method.toLowerCase());
   result.push({
    name,description:bounded(operation.summary||operation.description||`${method.toUpperCase()} ${path}`,350),
    inputSchema:{type:'object',properties,required:[...new Set(required)],additionalProperties:false},
    metadata:{method:method.toUpperCase(),path,operation_id:bounded(operation.operationId,160),
      risk:read_only?'read':'external-write',scopes_required:Array.isArray(operation.security)?'review':(Array.isArray(raw.security)?'review':'unknown'),
      provider_connection:'not-connected',approved:false,enabled:false,executable:false,
      permission:'owner-review-required',cost_estimate_usd:null}
   });
  }
 }
 if(!result.length)fail('No supported API operations were found.');
 return{identity:'Magnanimous AI',mode:'openapi-to-mcp-draft',contract:bounded(raw.info?.title||'Untitled API',140),
  version:bounded(raw.info?.version||'',80),mcp_protocol:'tools/list-compatible',
  source_kind:'openapi',generated_tools:result.length,read_only:result.filter(t=>t.metadata.risk==='read').length,
  external_writes:result.filter(t=>t.metadata.risk!=='read').length,
  tools:result,executable:false,remote_requests_performed:0,paid_calls_performed:0,
  note:'Draft only. A provider must be registered and authenticated separately; no remote method becomes executable without Magnanimous authorization, consent and billing checks.'};
}

// Provider-neutral, bounded MCP invocation validator. No external dependency.
// A tool definition from a remote server is untrusted and must not expand a grant.
const MAX_INPUT_BYTES=65536, MAX_DEPTH=24, MAX_FIELDS=512;
function invalid(message){throw new Error(message)}
function object(value){return value!==null && typeof value==='object' && !Array.isArray(value)}
function unsafeKey(key){return key==='__proto__'||key==='prototype'||key==='constructor'}
function inspectJson(value,depth=0,count={n:0}){
 if(depth>MAX_DEPTH)invalid('MCP invocation exceeds nesting safety limit.');
 if(value===null||typeof value==='boolean'||typeof value==='string')return;
 if(typeof value==='number'){if(!Number.isFinite(value))invalid('MCP invocation contains an invalid number.');return}
 if(Array.isArray(value)){if(value.length>MAX_FIELDS)invalid('MCP invocation contains too many entries.');for(const entry of value)inspectJson(entry,depth+1,count);return}
 if(!object(value))invalid('MCP invocation contains a non-JSON value.');
 for(const [key,entry] of Object.entries(value)){
  if(unsafeKey(key))invalid('MCP invocation contains a reserved object key.');
  if(++count.n>MAX_FIELDS)invalid('MCP invocation contains too many fields.');
  inspectJson(entry,depth+1,count);
 }
}
function typed(value,kind){
 if(kind==='null')return value===null;
 if(kind==='object')return object(value);
 if(kind==='array')return Array.isArray(value);
 if(kind==='integer')return Number.isSafeInteger(value);
 if(kind==='number')return typeof value==='number'&&Number.isFinite(value);
 return typeof value===kind;
}
function verifySchema(value,schema,depth=0){
 if(depth>MAX_DEPTH)invalid('MCP input schema validation exceeded safe depth.');
 if(!object(schema))return;
 const kinds=Array.isArray(schema.type)?schema.type:[schema.type];
 if(kinds[0]&&kinds.every(t=>!typed(value,t)))invalid('MCP invocation does not match approved input schema.');
 if(Array.isArray(schema.enum)&&!schema.enum.some(x=>JSON.stringify(x)===JSON.stringify(value)))invalid('MCP invocation uses an unapproved enum value.');
 if(object(value)){
  const declared=object(schema.properties)?schema.properties:{};
  if(Array.isArray(schema.required)&&schema.required.some(key=>!Object.hasOwn(value,key)))invalid('MCP invocation is missing a required field.');
  for(const [key,item] of Object.entries(value)){
   if(Object.hasOwn(declared,key))verifySchema(item,declared[key],depth+1);
   else if(schema.additionalProperties===false)invalid('MCP invocation contains an undeclared field.');
  }
 }else if(Array.isArray(value)&&object(schema.items)){
  for(const item of value)verifySchema(item,schema.items,depth+1);
 }
}
export function validateMagnanimousToolInvocation(args,schemaJson){
 if(!object(args))invalid('MCP tool arguments must be a JSON object.');
 inspectJson(args);
 let serialized;
 try{serialized=JSON.stringify(args)}catch{invalid('MCP invocation is not serializable.')}
 if(new TextEncoder().encode(serialized).byteLength>MAX_INPUT_BYTES)invalid('MCP tool arguments exceed the 64 KB limit.');
 let schema;
 try{schema=typeof schemaJson==='string'?JSON.parse(schemaJson):schemaJson}catch{invalid('Stored approved MCP input schema is invalid.')}
 if(!object(schema))invalid('Stored approved MCP input schema must be an object.');
 verifySchema(args,schema);
 return args;
}

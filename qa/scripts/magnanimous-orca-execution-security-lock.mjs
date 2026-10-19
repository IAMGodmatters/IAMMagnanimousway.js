import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMagnanimousToolInvocation } from '../../worker/src/magnanimous-mcp-invocation-guard.js';
import { callMagnanimousApprovedMcpTool } from '../../worker/src/magnanimous-tool-gateway.js';

const schema={type:'object',properties:{id:{type:'integer'},action:{type:'string',enum:['read','write']}},required:['id'],additionalProperties:false};
assert.deepEqual(validateMagnanimousToolInvocation({id:5,action:'read'},JSON.stringify(schema)),{id:5,action:'read'});
assert.throws(()=>validateMagnanimousToolInvocation({id:'5'},schema),/approved input schema/);
assert.throws(()=>validateMagnanimousToolInvocation({id:1,extraneous:true},schema),/undeclared/);
assert.throws(()=>validateMagnanimousToolInvocation({action:'read'},schema),/required/);
assert.throws(()=>validateMagnanimousToolInvocation({id:1,action:'erase'},schema),/enum/);
assert.throws(()=>validateMagnanimousToolInvocation([1,2],schema),/object/);
assert.throws(()=>validateMagnanimousToolInvocation({id:1,text:'A'.repeat(66000)},{}),/64 KB/);
assert.throws(()=>validateMagnanimousToolInvocation(JSON.parse('{"__proto__":{"polluted":true}}'),{}),/reserved/);
assert.throws(()=>validateMagnanimousToolInvocation({id:1},'{bad'),/invalid/);
const tool={name:'update_record',description:'One remote request',inputSchema:schema};
const known={tool_name:tool.name,description:tool.description,input_schema_json:JSON.stringify(schema)};
const server={server_url:'https://service.example/mcp',auth_type:'none',auth_secret:''};
let calls=[],mode='success';
const originalFetch=globalThis.fetch;
globalThis.fetch=async(_url,options={})=>{
 const body=JSON.parse(options.body),protocol=options.headers['MCP-Protocol-Version'];
 calls.push({method:body.method,protocol});
 const json=(result,error)=>Response.json({jsonrpc:'2.0',id:body.id,...(error?{error}:{result})});
 if(body.method==='tools/list'){
  if(mode==='legacy'&&protocol==='2026-07-28')return json(undefined,{code:-32601,message:'Unsupported version'});
  return json({tools:mode==='drift'?[{...tool,description:'Now deletes all customer records'}]:[tool]});
 }
 if(body.method==='tools/call'){
  if(mode==='failed-write')return json(undefined,{code:-32000,message:'Remote call completed but response was lost'});
  return json({content:[{type:'text',text:'ok'}]});
 }
 return json({tools:[tool]});
};
try{
 const result=await callMagnanimousApprovedMcpTool(server,'update_record',{id:5,action:'write'}, {},known);
 assert.equal(result.content[0].text,'ok');
 assert.equal(calls.filter(c=>c.method==='tools/call').length,1,'Perform only a single remote write.');
 assert.equal(calls.find(c=>c.method==='tools/call').protocol,'2026-07-28');
 calls=[];mode='failed-write';
 await assert.rejects(()=>callMagnanimousApprovedMcpTool(server,'update_record',{id:5},{},known),/Remote call completed/);
 assert.equal(calls.filter(c=>c.method==='tools/call').length,1,'Ambiguous remote failure MUST NOT retry an external write.');
 calls=[];mode='legacy';
 const legacy=await callMagnanimousApprovedMcpTool(server,'update_record',{id:5},{},known);
 assert.ok(legacy.content?.length);
 assert.equal(calls.filter(c=>c.method==='tools/call').length,1,'Legacy write invoked exactly once.');
 assert.equal(calls.find(c=>c.method==='tools/call').protocol,'2025-06-18');
 calls=[];mode='drift';
 await assert.rejects(()=>callMagnanimousApprovedMcpTool(server,'update_record',{id:5},{},known),/MCP_TOOL_CATALOG_DRIFT/);
 assert.equal(calls.filter(c=>c.method==='tools/call').length,0,'Changed manifest must never be executed.');
}finally{globalThis.fetch=originalFetch;}
const gateway=fs.readFileSync('worker/src/magnanimous-tool-gateway.js','utf8');
const ui=fs.readFileSync('frontend/app/orca-workbench/live-operations.tsx','utf8');
assert.ok(gateway.includes('MCP_CONSENT_REQUIRED'));
assert.ok(gateway.includes('MCP_OWNER_APPROVAL_REQUIRED'),'Raw external tool calls must be owner/admin only.');
assert.ok(gateway.includes('if(!isManager(user))return json({detail:\'Owner or tenant admin approval'),'Enforce tenant-manager permission before executing unmetered tools.');
for(const term of ['confirm_live_call','acknowledge_external_effects','acknowledge_provider_charges'])assert.ok(gateway.includes(term)&&ui.includes(term),'Both server and UI must enforce '+term);
assert.ok(gateway.includes('MCP_MANIFEST_CHANGED'));
assert.ok(gateway.includes("enabled=0,updated_at=? WHERE tenant_id=? AND server_id=? AND tool_name=?"),'Mismatch must disable old permission.');
assert.ok(gateway.includes('validateMagnanimousToolInvocation'));
console.log('Orca MCP execution security PASS: 1 write per call, legacy protocol negotiation, no drift execution, server consent, bounded schema inputs.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 normalizeMagnanimousMcpManifest,
 sameMagnanimousMcpManifest,
 fingerprintMagnanimousMcpManifest
} from '../../worker/src/magnanimous-mcp-manifest-guard.js';

const initial=normalizeMagnanimousMcpManifest({
 name:'manage_record',description:'Read record',
 inputSchema:{type:'object',properties:{account:{type:'string'},id:{type:'integer'}},required:['id']}
});
const reordered=normalizeMagnanimousMcpManifest({
 name:'manage_record',description:'Read record',
 inputSchema:{required:['id'],properties:{id:{type:'integer'},account:{type:'string'}},type:'object'}
});
assert.equal(initial.schemaJson,reordered.schemaJson,'Equivalent schema key ordering should not trigger drift.');
assert.equal(await fingerprintMagnanimousMcpManifest(initial),await fingerprintMagnanimousMcpManifest(reordered));
assert.match(await fingerprintMagnanimousMcpManifest(initial),/^[a-f0-9]{64}$/);

const stored={tool_name:initial.name,description:initial.description,input_schema_json:initial.schemaJson};
assert.equal(sameMagnanimousMcpManifest(stored,reordered),true);
assert.equal(sameMagnanimousMcpManifest(stored,{...initial,description:'Delete all records'}),false,'Changed semantics must require review.');
assert.equal(sameMagnanimousMcpManifest(stored,normalizeMagnanimousMcpManifest({name:'manage_record',description:'Read record',inputSchema:{type:'object',properties:{id:{type:'string'}}}})),false,'Altered input schema must require review.');
assert.throws(()=>normalizeMagnanimousMcpManifest({name:'',inputSchema:{}}),/name/);
assert.throws(()=>normalizeMagnanimousMcpManifest({name:'x'.repeat(201),inputSchema:{}}),/name/);
assert.throws(()=>normalizeMagnanimousMcpManifest({name:'x',description:'x'.repeat(3001),inputSchema:{}}),/description/);
assert.throws(()=>normalizeMagnanimousMcpManifest({name:'x',inputSchema:[]}),/object/);
assert.throws(()=>normalizeMagnanimousMcpManifest({name:'x',inputSchema:{x:'x'.repeat(40000)}}),/30000/);
const deeplyNested={};let pointer=deeplyNested;for(let i=0;i<35;i++){pointer.child={};pointer=pointer.child;}
assert.throws(()=>normalizeMagnanimousMcpManifest({name:'x',inputSchema:deeplyNested}),/nesting/);

const gateway=fs.readFileSync('worker/src/magnanimous-tool-gateway.js','utf8');
assert.ok(!gateway.includes("DELETE FROM magnanimous_discovered_tools WHERE tenant_id=? AND server_id=?"),'Discovery must not erase approved manifests and permission states.');
for(const part of [
 'manifest-review-required','manifest-withdrawn','magnanimous_tool_manifest_reviews',
 "decision==='approve'","decision==='reject'","enabled=0",
 "NOT EXISTS (SELECT 1 FROM magnanimous_tool_manifest_reviews",
 'if(!isManager(user))'
])assert.ok(gateway.includes(part),'Missing MCP safety invariant: '+part);
assert.ok(gateway.includes('new Set(manifests.map(m=>m.name))'),'Duplicate names must be rejected.');
assert.ok(gateway.includes('known.size===0'),'Initial manager registration and refresh must be distinct.');
console.log('Magnanimous MCP manifest drift and owner-review lock passed.');

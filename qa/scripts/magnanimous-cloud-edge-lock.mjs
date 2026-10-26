import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { magnanimousCloudEdgeControl, magnanimousCloudEdgeReady } from '../../worker/src/magnanimous-cloud-edge-control.js';

const sql=fs.readFileSync('worker/migrations/0110_magnanimous_cloud_edge_control.sql','utf8');
const sqlite=new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON;');

const db={
 prepare(source){
  const stmt=sqlite.prepare(source);
  let params=[];
  return{
   bind(...values){params=values;return this},
   async first(){return stmt.get(...params)||null},
   async all(){return{results:stmt.all(...params)}},
   async run(){return stmt.run(...params)}
  };
 }
};

assert.equal(await magnanimousCloudEdgeReady({DB:db}),false,'Readiness must fail closed before migration');
sqlite.exec(sql);
assert.equal(await magnanimousCloudEdgeReady({DB:db}),true,'Real migrated D1-compatible table must be detected');
const cloud=magnanimousCloudEdgeControl({DB:db});
assert.equal((await cloud.summary()).projects,1,'One default project must be present');
assert.equal((await cloud.summary()).paid_provider_calls,0,'No provider charge or call is permitted');

const project=await cloud.createProject({name:'QA Owner Project'});
assert.equal(project.slug,'qa-owner-project');
await assert.rejects(cloud.createProject({name:'QA Owner Project'}),/already exists/);
await assert.rejects(cloud.createProject({name:'Bad',slug:'Not Valid!!'}),/Valid project/);

const service=await cloud.createResource({project_id:project.id,kind:'service',name:'Planned service',spec:{runtime:'native-later'}});
assert.equal(service.state,'defined-awaiting-capacity','Paid host capacity must never be inferred');
assert.equal(service.status.execution,'not-executed');
const flag=await cloud.createResource({project_id:project.id,kind:'feature-flag',name:'No-cost feature'});
assert.equal(flag.state,'defined-native-control');
assert.equal((await cloud.listResources({project_id:project.id})).length,2);
await assert.rejects(cloud.createResource({kind:'service',name:'Unsafe',spec:{api_key:'leak'}}),/credentials or secrets/);
await assert.rejects(cloud.createResource({kind:'unavailable-provider',name:'Unknown'}),/Unsupported/);

const deleteStage=await cloud.stageAction(service.id,'delete',{reason:'Review only'});
assert.equal(deleteStage.status,'staged-requires-explicit-approval');
assert.equal(deleteStage.result.executed,false,'Deletion must not execute');
assert.equal(deleteStage.result.provider_calls,0);
await assert.rejects(cloud.stageAction(service.id,'execute_shell_command',{}),/Unsupported/);
await assert.rejects(cloud.stageAction(service.id,'plan',{secret:'must not persist'}),/credentials or secrets/);
assert.equal((await cloud.listActions(service.id)).length,1);
assert.equal((await cloud.summary()).resources,2);
assert.equal((await cloud.summary()).actions,1);

const core=fs.readFileSync('worker/src/magnanimous-cloud-provider-core.js','utf8');
const mesh=fs.readFileSync('worker/src/magnanimous-capability-mesh.js','utf8');
assert(core.includes('requirePlatformOwner(request, env)'),'All cloud read/write routes must retain owner authorization');
assert(core.includes('await magnanimousCloudEdgeReady(env)'),'Fallback must require actual migrated D1 state');
assert(mesh.includes('required_ready_count:')&&mesh.includes('optional_ready_count:'),'Report must distinguish core from optional readiness');
assert(mesh.includes('control_plane_only:edge'),'D1 control cannot claim real infrastructure capacity');

sqlite.close();
console.log('Magnanimous Cloud Edge D1 lock passed — real SQL, owner-only route, staged actions, secret rejection, and zero-provider-capacity truth verified.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/magnanimous-local-bridge-runtime.js');
const agent=read('local-bridge/bridge_agent.py');
const mesh=read('worker/src/magnanimous-capability-mesh.js');
const actions=['storage_status','storage_remotes','storage_about','storage_list','storage_size','storage_check','storage_copy','storage_mkdir','storage_sync','storage_move','storage_link','storage_bisync'];
for(const action of actions){
 assert(runtime.includes(action),`Local Bridge server allowlist missing ${action}`);
 assert(agent.includes('"'+action+'"'),`Local Bridge agent missing ${action}`);
}
for(const readAction of ['storage_status','storage_remotes','storage_about','storage_list','storage_size'])assert(runtime.includes(`${readAction}:{risk:'low',auto:true,confirmation:false`),`${readAction} must remain read-only/autonomous`);
assert(runtime.includes("storage_check:{risk:'medium',auto:true,confirmation:false"),'storage_check must remain non-mutating');
for(const writeAction of ['storage_copy','storage_mkdir','storage_sync','storage_move','storage_link','storage_bisync'])assert(runtime.includes(`${writeAction}:{risk:`)&&runtime.includes(`${writeAction}`),`missing ${writeAction}`);
for(const high of ['storage_sync','storage_move','storage_link','storage_bisync'])assert(runtime.includes(`${high}:{risk:'high',auto:false,confirmation:true`),`${high} must require confirmation`);
assert(runtime.includes("storage_copy:{risk:'medium',auto:false,confirmation:true"),'storage_copy must require confirmation');
assert(runtime.includes("storage_mkdir:{risk:'medium',auto:false,confirmation:true"),'storage_mkdir must require confirmation');
assert(runtime.includes("Cloud storage credentials must remain local to the paired bridge."),'server must reject credential-bearing storage payloads');
assert(agent.includes('def _detect_rclone(config):'),'agent must detect replaceable rclone-compatible engine');
assert(agent.includes('D:/Tools/rclone/rclone.exe'),'agent must support current free-first Windows installation');
assert(agent.includes('credentials_local_only'),'agent must report local-only credential boundary');
assert(agent.includes('[str(exe), *args]')&&agent.includes('shell=False'),'agent must execute exact argv without raw shell exposure');
assert(agent.includes('listremotes'),'agent must discover only locally configured remotes');
assert(agent.includes('Cloud storage reference must use a configured local rclone remote.'),'agent must block arbitrary backend references');
for(const route of ['storage.status','storage.remotes','storage.about','storage.list','storage.size','storage.check','storage.copy','storage.mkdir','storage.sync','storage.move','storage.link','storage.bisync'])assert(mesh.includes(`'${route}'`),`Capability Mesh missing ${route}`);
assert(mesh.includes("surface:'magnanimous-cloud-fabric'")&&mesh.includes("engine_role:'replaceable-local-storage-engine'"),'Magnanimous must remain the cloud-storage identity/orchestrator');
assert(mesh.includes('credentials_local_only:true'),'Capability Mesh must preserve local-only credentials');
console.log('Magnanimous rclone-compatible Cloud Fabric lock: PASS — provider-neutral storage orchestration, local-only credentials, bounded read operations, and confirmation-gated writes are locked.');

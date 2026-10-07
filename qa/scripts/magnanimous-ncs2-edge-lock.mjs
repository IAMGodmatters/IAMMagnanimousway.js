import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=fs.existsSync('worker/src/magnanimous-capability-mesh.js')?'.':'..';
const read=path=>fs.readFileSync(`${root}/${path}`,'utf8');
const agent=read('local-bridge/bridge_agent.py');
const edge=read('local-bridge/ncs2_edge.py');
const installer=read('local-bridge/install-ncs2-edge.ps1');
const bridge=read('worker/src/magnanimous-local-bridge-runtime.js');
const mesh=read('worker/src/magnanimous-capability-mesh.js');
const provider=read('worker/src/provider-entrypoint.js');
const universal=read('worker/src/magnanimous-universal-capabilities.js');
const docs=read('docs/MAGNANIMOUS-NCS2-EDGE-AI.md');

for(const action of ['ncs2_status','ncs2_benchmark','ncs2_detect']){
  assert(bridge.includes(action),`Local Bridge server allowlist missing ${action}`);
  assert(agent.includes(action),`Local Bridge agent missing ${action}`);
}
for(const capability of ['edge.ncs2.status','edge.ncs2.benchmark','edge.ncs2.detect']){
  assert(mesh.includes(capability),`Capability Mesh missing ${capability}`);
}
assert(edge.includes('MYRIAD'),'NCS2 runtime must target MYRIAD');
assert(edge.includes('AsyncInferQueue'),'NCS2 benchmark must exercise async inference');
assert(edge.includes('OpenVINO 2022.3.1'),'NCS2 runtime must preserve the final supported OpenVINO line');
assert(installer.includes('person-vehicle-bike-detection-2004'),'NCS2 installer must provision a useful starter vision model');
assert(installer.includes('pillow==10.4.0'),'NCS2 image runtime dependency must remain explicit');
assert(bridge.includes("edge_ai_inference_only:true"),'Local Bridge policy must preserve bounded edge inference');
assert(bridge.includes("edge_ai_inbound_listener_required:false"),'NCS2 must not open an inbound listener');
assert(agent.includes('shell=False'),'NCS2 integration must preserve shell=False bridge execution');
assert(!agent.includes('shell=True'),'NCS2 integration must not enable shell=True');
assert(provider.includes("['edge-ai','Edge AI Coprocessor'"),'Magnanimous tool inventory must expose Edge AI');
assert(provider.includes('NCS2 / MYRIAD'),'Commander protocol must know when to prefer local NCS2 preprocessing');
assert(universal.includes('edge-ai-local-accelerator'),'Universal capability registry must include the local edge accelerator');
assert(docs.includes('phone can therefore use the NCS2 indirectly'),'Documentation must explain remote phone-to-PC NCS2 routing');
assert(docs.includes('cannot accelerate the ChatGPT cloud model'),'Documentation must preserve the cloud-model boundary');

console.log('Magnanimous NCS2 Edge AI lock passed.');

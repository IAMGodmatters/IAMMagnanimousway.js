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
const security=read('worker/src/security-entrypoint.js');
const docs=read('docs/MAGNANIMOUS-NCS2-EDGE-AI.md');

const actions=['ncs2_status','ncs2_benchmark','ncs2_detect','ncs2_media_triage','ncs2_batch_scan','ncs2_video_scan','ncs2_face_detect','ncs2_text_regions'];
for(const action of actions){
  assert(bridge.includes(action),`Local Bridge server allowlist missing ${action}`);
  assert(agent.includes(action),`Local Bridge agent missing ${action}`);
}
const capabilities=['edge.ncs2.status','edge.ncs2.benchmark','edge.ncs2.detect','edge.ncs2.triage','edge.ncs2.batch_scan','edge.ncs2.video_scan','edge.ncs2.face_detect','edge.ncs2.text_regions'];
for(const capability of capabilities) assert(mesh.includes(capability),`Capability Mesh missing ${capability}`);
assert(edge.includes('MYRIAD'),'NCS2 runtime must target MYRIAD');
assert(edge.includes('AsyncInferQueue'),'NCS2 benchmark must exercise async inference');
assert(edge.includes('get_version'),'NCS2 status must report the loaded OpenVINO build truthfully');
assert(installer.includes('openvino==2022.3.2'),'NCS2 installer must pin the tested 2022.3.2 maintenance release');
assert(installer.includes('imageio-ffmpeg==0.6.0'),'Sampled video scan must use a pinned portable FFmpeg dependency');
assert(installer.includes('face-detection-retail-0004'),'Installer must provision face-presence detection');
assert(installer.includes('horizontal-text-detection-0001'),'Installer must provision text-region detection');
assert(agent.includes('venv232'),'NCS2 bridge must prefer the isolated 2022.3.2 Python environment');
assert(agent.includes('openvino_2022.3.2'),'NCS2 bridge must prefer the 2022.3.2 setupvars runtime');
assert(agent.includes('NamedTemporaryFile')&&agent.includes('suffix=".cmd"'),'NCS2 bridge must use a temp command launcher to avoid Windows cmd quoting regressions');
assert(edge.includes('arr.shape[-1] == 7'),'NCS2 runtime must support SSD DetectionOutput models used by MYRIAD');
assert(edge.includes('max_frames = max(1, min(60'),'Video edge scan must stay bounded');
assert(agent.includes('4_000_000_000'),'Bridge video scan must keep the 4 GB bounded scan limit');
assert(agent.includes('presence-and-boxes-only'),'Face mode must explicitly exclude identity/demographic inference');
assert(security.includes("url.pathname.startsWith('/api/magnanimous/local-bridge')"),'Local Bridge API must remain on the Worker instead of being proxied to standalone Railway');
assert(security.includes("url.pathname.startsWith('/api/magnanimous/capability-mesh')"),'Capability Mesh must remain on the Worker so NCS2 orchestration stays available when standalone Railway is unavailable');
assert(bridge.includes('edge_ai_inference_only:true'),'Local Bridge policy must preserve bounded edge inference');
assert(bridge.includes('edge_ai_inbound_listener_required:false'),'NCS2 must not open an inbound listener');
assert(agent.includes('shell=False'),'NCS2 integration must preserve shell=False bridge execution');
assert(!agent.includes('shell=True'),'NCS2 integration must not enable shell=True');
assert(provider.includes("['edge-ai','Edge AI Coprocessor'"),'Magnanimous tool inventory must expose Edge AI');
assert(provider.includes('NCS2 / MYRIAD'),'Commander protocol must know when to prefer local NCS2 preprocessing');
assert(universal.includes('edge-media-triage'),'Universal capability registry must include expanded edge preprocessing');
assert(docs.includes('phone can therefore use the NCS2 indirectly'),'Documentation must explain remote phone-to-PC NCS2 routing');
assert(docs.includes('cannot accelerate the ChatGPT cloud model'),'Documentation must preserve the cloud-model boundary');
assert(docs.includes('OpenVINO 2022.3.2 LTS'),'Documentation must record the tested supported maintenance runtime');

console.log('Magnanimous NCS2 Edge AI expanded lock passed.');

import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MAGNANIMOUS_DESKTOP_RUNTIME_ACTIONS, getDesktopCapabilityAbsorptionSummary } from '../../worker/src/magnanimous-desktop-capability-registry.js';

const bridge=fs.readFileSync(new URL('../../local-bridge/bridge_agent.py',import.meta.url),'utf8');
const summary=getDesktopCapabilityAbsorptionSummary();
const runtime=fs.readFileSync(new URL('../../worker/src/magnanimous-local-bridge-runtime.js',import.meta.url),'utf8');
const mesh=fs.readFileSync(new URL('../../worker/src/magnanimous-capability-mesh.js',import.meta.url),'utf8');
const ownerPage=fs.readFileSync(new URL('../../frontend/app/owner-capability-mesh/page.tsx',import.meta.url),'utf8');
const ids=MAGNANIMOUS_DESKTOP_RUNTIME_ACTIONS.map(x=>x[0]);

for(const id of [
  'desktop_tools_status','media_probe','media_catalog','media_transcode_mp4','media_thumbnail',
  'archive_list','archive_test','android_device_status'
]){
  assert.ok(ids.includes(id),`desktop runtime action catalog missing ${id}`);
  assert.match(bridge,new RegExp(`"${id}"`),`bridge missing ${id}`);
}

assert.equal(summary.local_runtime_actions,8);
assert.deepEqual(summary.local_runtime_action_ids,ids);
assert.equal(summary.local_runtime_policy,'non-destructive-source-preserving-actions-first');

assert.match(bridge,/def _bounded_workspace_file/);
assert.match(bridge,/Requested path escapes the selected workspace/);
assert.match(bridge,/source_preserved": True/);
assert.match(bridge,/Output already exists; Magnanimous will not overwrite it/);
assert.match(bridge,/"-n", "-i"/);
assert.match(bridge,/"libx264"/);
assert.match(bridge,/"yuv420p"/);
assert.match(bridge,/"\+faststart"/);
assert.match(bridge,/"aac"/);
assert.match(bridge,/transcode-to-h264-aac-mp4/);
assert.match(bridge,/def action_archive_list/);
assert.match(bridge,/def action_archive_test/);
assert.doesNotMatch(bridge,/def action_archive_extract/);
assert.match(bridge,/"l", "-slt"/);
assert.match(bridge,/"t", "-bd", "-y"/);
assert.match(bridge,/def action_android_device_status/);
assert.doesNotMatch(bridge,/"serial":/);
assert.match(bridge,/shell=False/);
assert.doesNotMatch(bridge,/shell=True/);

for(const action of ids){
  assert.match(runtime,new RegExp(`${action}:\\{`),`worker local bridge allowlist missing ${action}`);
}
for(const capability of ['local-tools.status','local-media.probe','local-media.catalog','local-media.transcode_mp4','local-media.thumbnail','local-archive.list','local-archive.test','local-device.android_status']){
  assert.match(mesh,new RegExp(capability.replace(/[.]/g,'\\.')));
}
assert.match(mesh,/archive_extraction_exposed:false/);
assert.match(mesh,/device_serials_exposed:false/);
assert.match(mesh,/source_preserving:true/);
assert.match(mesh,/owner-local-tool-runtime/);
assert.match(mesh,/local_tools:localTools/);
assert.match(ownerPage,/LOCAL TOOL RUNTIME/);
assert.match(ownerPage,/media_convert_ready/);
assert.match(ownerPage,/archive_ready/);

console.log('Magnanimous local tool runtime lock PASS:',{
  runtime_actions:ids.length,
  source_preserving:true,
  archive_execution:false,
  android_serial_exposed:false
});

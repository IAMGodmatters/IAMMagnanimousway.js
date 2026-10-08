import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH,
  getDesktopCapabilityManifest,
  getDesktopCapabilityAbsorptionSummary
} from '../../worker/src/magnanimous-desktop-capability-registry.js';
import { getMagnanimousSingleBrainSummary } from '../../worker/src/magnanimous-single-brain-contract.js';

const rows=getDesktopCapabilityManifest();
const summary=getDesktopCapabilityAbsorptionSummary();
const singleBrainSource=fs.readFileSync(new URL('../../worker/src/magnanimous-single-brain-contract.js',import.meta.url),'utf8');
const bridgeSource=fs.readFileSync(new URL('../../local-bridge/bridge_agent.py',import.meta.url),'utf8');

assert.ok(rows.length>=30,'Desktop intake must preserve a substantial clean-room capability surface.');
for(const capability of [
  'desktop-archive-compress-extract','desktop-media-probe-transcode','desktop-screen-record-live-compose',
  'desktop-3d-scene-render-export','desktop-image-batch-transform','desktop-audio-edit-cleanup',
  'desktop-device-mirror-control','desktop-storage-analysis','desktop-virtual-machine-sandbox',
  'desktop-sip-softphone-workflow','desktop-video-timeline-editing','desktop-background-removal-segmentation',
  'desktop-system-recovery-diagnostics','desktop-game-state-machine','desktop-quest-workflow-engine',
  'desktop-progression-achievements','desktop-inventory-resource-system','desktop-checkpoint-save-restore',
  'desktop-pathfinding-navigation','desktop-multiplayer-session-model','desktop-sandbox-simulation-loop',
  'desktop-plugin-mod-extension-contract','desktop-performance-telemetry-loop'
])assert.ok(rows.some(x=>x.capability===capability),'Missing desktop capability: '+capability);

assert.ok(MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH.official_tool_targets.length>=10);
assert.match(MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH.boundary,/does not copy proprietary game or application source/i);
assert.ok(MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH.blocked_binary_classes.some(x=>/KMS/i.test(x)));
assert.ok(MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH.blocked_binary_classes.some(x=>/mod/i.test(x)));

for(const row of rows){
  assert.equal(row.connector_id,'desktop-intake');
  assert.equal(row.direct_connector,false);
  assert.equal(row.authorization_state,'not-assumed');
  assert.ok(row.native_target);
  assert.equal(row.research?.proprietary_implementation_copied,false);
  assert.equal(row.research?.cracked_or_modded_binary_reused,false);
  assert.equal(row.research?.license_bypass_allowed,false);
  assert.ok(row.acceptance_tests.some(x=>/Cracked, modded, repacked/i.test(x)));
}

for(const sensitive of ['desktop-system-recovery-diagnostics','desktop-sip-softphone-workflow']){
  const row=rows.find(x=>x.capability===sensitive);
  assert.ok(row,'Missing sensitive capability '+sensitive);
  assert.equal(row.initiative.requires_confirmation,true);
  assert.equal(row.initiative.action_class,'sensitive-local-or-telecom-action');
}

assert.equal(summary.shared_archive_runtime_required,false);
assert.equal(summary.cracked_or_modded_binary_reused,false);
assert.equal(summary.license_bypass_allowed,false);
assert.equal(summary.proprietary_implementation_copied,false);
assert.equal(summary.clean_room,true);
assert.equal(summary.free_and_open_source_first,true);
assert.ok(summary.explicit_truth_gaps.some(x=>/does not grant source/i.test(x)));
assert.ok(summary.explicit_truth_gaps.some(x=>/malware safety/i.test(x)));

assert.match(singleBrainSource,/getDesktopCapabilityManifest/);
assert.match(singleBrainSource,/desktop_capability_contracts/);
assert.match(singleBrainSource,/desktop_capabilities/);
assert.match(singleBrainSource,/desktop_capability_benchmark/);
assert.match(bridgeSource,/desktop_tools_status/);
assert.match(bridgeSource,/APPROVED_DESKTOP_TOOLS/);
assert.match(bridgeSource,/shared cracked\/modded\/unknown archives are never executed/);
assert.match(bridgeSource,/shell=False/);
const brain=getMagnanimousSingleBrainSummary();
assert.equal(brain.desktop_capability_contracts,rows.length);
assert.equal(brain.desktop_capabilities.length,rows.length);
assert.equal(brain.desktop_capability_benchmark.clean_room,true);
assert.ok(brain.absorbed_capability_contracts>=rows.length);

console.log('Magnanimous desktop capability lock PASS:',{
  capabilities:rows.length,
  official_tool_targets:summary.official_tool_targets,
  native_targets:summary.native_targets,
  status:summary.status
});



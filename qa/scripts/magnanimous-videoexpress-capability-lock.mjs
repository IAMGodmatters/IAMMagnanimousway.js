import fs from 'node:fs';
import assert from 'node:assert/strict';
import { VIDEOEXPRESS_PUBLIC_RESEARCH, getVideoExpressCapabilityManifest, getVideoExpressAbsorptionSummary } from '../../worker/src/magnanimous-videoexpress-capability-registry.js';
import { MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS, buildMagnanimousVideoDirectorPlan, getMagnanimousVideoDirectorSummary } from '../../worker/src/magnanimous-video-director.js';

const rows=getVideoExpressCapabilityManifest();
const summary=getVideoExpressAbsorptionSummary();
const singleBrain=fs.readFileSync(new URL('../../worker/src/magnanimous-single-brain-contract.js',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../../frontend/app/video-director/page.tsx',import.meta.url),'utf8');

assert.ok(rows.length>=56,'VideoExpress public benchmark must cover the verified generation, editing, audio, avatar, workflow, capture and delivery surface.');
for(const capability of [
  'videoexpress-text-to-video','videoexpress-image-to-video','videoexpress-consistent-character','videoexpress-multi-character-consistency',
  'videoexpress-first-last-frame-control','videoexpress-camera-direction-from-prompt','videoexpress-motion-brush',
  'videoexpress-video-inpainting','videoexpress-video-outpainting','videoexpress-object-removal','videoexpress-background-editor',
  'videoexpress-video-extension','videoexpress-multi-clip-timeline','videoexpress-transitions-effects','videoexpress-separate-audio-video',
  'videoexpress-automatic-captions','videoexpress-text-to-speech-narration','videoexpress-ai-sound-effects','videoexpress-lip-sync',
  'videoexpress-talking-character','videoexpress-full-body-talking-character','videoexpress-action-replication','videoexpress-face-swap','videoexpress-avatar-swap',
  'videoexpress-creative-mode','videoexpress-ai-prompt-writer','videoexpress-narrative-story-workflow','videoexpress-viral-shorts-workflow',
  'videoexpress-documentary-workflow','videoexpress-animated-short-workflow','videoexpress-product-demo-workflow','videoexpress-video-automation-workflow',
  'videoexpress-screen-recorder','videoexpress-voice-recorder','videoexpress-render-progress-tracking','videoexpress-social-format-export','videoexpress-commercial-rights-tracking'
])assert.ok(rows.some(x=>x.capability===capability),'Missing VideoExpress benchmark capability: '+capability);

assert.ok(VIDEOEXPRESS_PUBLIC_RESEARCH.sources.length>=8,'VideoExpress benchmark must retain the official public source ledger.');
assert.ok(VIDEOEXPRESS_PUBLIC_RESEARCH.sources.every(x=>/^https:\/\/videoexpress\.ai\//.test(x)),'VideoExpress research ledger must use official videoexpress.ai sources.');
assert.match(VIDEOEXPRESS_PUBLIC_RESEARCH.boundary,/does not copy VideoExpress source code/i);

for(const row of rows){
  assert.ok(row.native_target,'Every VideoExpress benchmark capability needs a Magnanimous native target.');
  assert.equal(row.authorization_state,'not-assumed');
  assert.equal(row.research?.proprietary_implementation_copied,false);
  assert.ok(Array.isArray(row.research?.sources)&&row.research.sources.length>=8,'Each capability must preserve official source provenance.');
  assert.equal(row.connector_id,'videoexpress-benchmark');
  assert.equal(row.direct_connector,false);
}

for(const sensitive of ['videoexpress-voice-clone','videoexpress-action-replication','videoexpress-face-swap','videoexpress-avatar-swap']){
  const row=rows.find(x=>x.capability===sensitive);
  assert.ok(row,'Missing identity-sensitive capability '+sensitive);
  assert.equal(row.initiative?.requires_confirmation,true);
  assert.equal(row.initiative?.action_class,'identity-sensitive-media-action');
  assert.match(row.boundary,/consent/);
}

assert.equal(summary.videoexpress_runtime_required,false);
assert.equal(summary.provider_required_for_identity,false);
assert.equal(summary.provider_required_for_memory,false);
assert.equal(summary.provider_required_for_planning,false);
assert.equal(summary.provider_required_for_orchestration,false);
assert.equal(summary.provider_required_for_verification,false);
assert.equal(summary.clean_room,true);
assert.ok(summary.identity_sensitive_contracts>=4);
assert.ok(summary.explicit_truth_gaps.some(x=>/not proof/i.test(x)));
assert.ok(summary.explicit_truth_gaps.some(x=>/deceptive impersonation/i.test(x)));

assert.ok(MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS.length>=11);
for(const id of ['creative','narrative','consistent-character','viral-short','motion-graphics','documentary','animated-short','talking-head','product-demo','first-last-transition','music-performance'])assert.ok(MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS.some(x=>x.id===id),'Missing director workflow '+id);
const plan=buildMagnanimousVideoDirectorPlan({
  title:'Continuity test',workflow:'consistent-character',seconds:36,aspect_ratio:'9:16',
  idea:'A teacher enters a village. She speaks with the children. The group gathers for a final lesson.',
  character:'same adult teacher with a blue jacket and braided hair',
  first_frame_description:'sunrise on a quiet village road',
  last_frame_description:'the group together beneath a tree at sunset'
});
assert.equal(plan.identity,'Magnanimous AI');
assert.equal(plan.product,'Magnanimous Video Director');
assert.equal(plan.aspect_ratio,'9:16');
assert.ok(plan.scenes.length>=3);
assert.ok(plan.compiled_prompt.includes('CHARACTER BIBLE:'));
assert.ok(plan.compiled_prompt.includes('FIRST FRAME:'));
assert.ok(plan.compiled_prompt.includes('LAST FRAME:'));
assert.equal(plan.execution_policy.provider_neutral,true);
assert.equal(plan.execution_policy.free_first,true);
assert.equal(plan.execution_policy.proprietary_prompt_copied,false);

const sensitivePlan=buildMagnanimousVideoDirectorPlan({idea:'Authorized likeness test',voice_clone:true});
assert.equal(sensitivePlan.rights.consent_required,true);
assert.equal(sensitivePlan.rights.deceptive_impersonation,false);
const director=getMagnanimousVideoDirectorSummary();
assert.equal(director.route,'/video-director');
assert.equal(director.free_first,true);
assert.equal(director.likeness_actions_consent_gated,true);

assert.match(singleBrain,/getVideoExpressCapabilityManifest/,'Single brain must load VideoExpress benchmark contracts.');
assert.match(singleBrain,/getMagnanimousVideoDirectorSummary/,'Single brain must expose Video Director.');
assert.match(singleBrain,/video_director_capabilities/,'Single brain must expose detailed video capability IDs.');
assert.match(page,/api\/movie-maker\/video/,'Video Director workspace must use the existing Movie Maker execution route.');
assert.match(page,/Exact execution depends on a currently verified native or replaceable render surface/,'Video Director UI must preserve truthful execution boundaries.');
assert.doesNotMatch(page,/videoexpress\.ai\/api/i,'Video Director workspace must not introduce a VideoExpress runtime dependency.');

console.log('Magnanimous VideoExpress capability lock PASS:',{
  capabilities:rows.length,
  official_sources:VIDEOEXPRESS_PUBLIC_RESEARCH.sources.length,
  native_targets:summary.native_targets,
  workflows:MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS.length
});

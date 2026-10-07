import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ARTLIST_PUBLIC_RESEARCH, getArtlistCapabilityManifest, getArtlistAbsorptionSummary } from '../../worker/src/magnanimous-artlist-capability-registry.js';
import { buildMagnanimousVideoDirectorPlan, getMagnanimousVideoDirectorSummary } from '../../worker/src/magnanimous-video-director.js';

const rows=getArtlistCapabilityManifest();
const summary=getArtlistAbsorptionSummary();
const singleBrain=fs.readFileSync(new URL('../../worker/src/magnanimous-single-brain-contract.js',import.meta.url),'utf8');

assert.ok(rows.length>=40,'Artlist clean-room benchmark should cover the public AI, Studio, media-library, cost, rights, MCP and editor workflow surface.');
for(const capability of [
  'artlist-creative-agent-mode','artlist-precision-standard-mode','artlist-creative-session-memory','artlist-prompt-enhancement',
  'artlist-automatic-model-recommendation','artlist-model-picker','artlist-text-to-image','artlist-image-to-image','artlist-targeted-image-edit',
  'artlist-text-to-video','artlist-image-to-video','artlist-video-to-video-edit','artlist-start-end-frame-control','artlist-negative-prompt-control',
  'artlist-multi-reference-conditioning','artlist-motion-control','artlist-reusable-character-library','artlist-character-casting','artlist-location-library',
  'artlist-scene-framing','artlist-shot-direction','artlist-scene-continuation','artlist-avatar-generation','artlist-lip-sync',
  'artlist-voiceover-generation','artlist-voice-cloning','artlist-ai-music-generation','artlist-stock-asset-discovery','artlist-unified-media-library',
  'artlist-generation-history-reuse','artlist-credit-budget-router','artlist-parallel-generation-controller','artlist-render-job-tracking',
  'artlist-mcp-creative-bridge','artlist-editor-panel-workflow','artlist-auto-reframe','artlist-upscale','artlist-creative-localization',
  'artlist-commercial-rights-ledger','artlist-asset-ai-use-policy'
])assert.ok(rows.some(x=>x.capability===capability),'Missing Artlist benchmark capability: '+capability);

assert.ok(ARTLIST_PUBLIC_RESEARCH.sources.length>=12,'Artlist benchmark must retain a broad official public source ledger.');
assert.ok(ARTLIST_PUBLIC_RESEARCH.sources.every(x=>/^https:\/\/(?:help\.)?artlist\.io\//.test(x)),'Artlist research ledger must use official artlist.io sources.');
assert.match(ARTLIST_PUBLIC_RESEARCH.boundary,/does not copy Artlist source code/i);
assert.match(ARTLIST_PUBLIC_RESEARCH.boundary,/not ingested into training datasets/i);
assert.ok(ARTLIST_PUBLIC_RESEARCH.public_model_examples.length>=15,'Keep representative public model examples for capability matching research.');

for(const row of rows){
  assert.ok(row.native_target,'Every Artlist benchmark capability needs a Magnanimous native target.');
  assert.equal(row.authorization_state,'not-assumed');
  assert.equal(row.research?.proprietary_implementation_copied,false);
  assert.equal(row.research?.paid_assets_copied,false);
  assert.equal(row.research?.model_weights_copied,false);
  assert.equal(row.connector_id,'artlist-benchmark');
  assert.equal(row.direct_connector,false);
  assert.ok(Array.isArray(row.research?.sources)&&row.research.sources.length>=12,'Each capability must preserve official source provenance.');
}

const clone=rows.find(x=>x.capability==='artlist-voice-cloning');
assert.ok(clone,'Voice cloning contract missing.');
assert.equal(clone.initiative?.requires_confirmation,true);
assert.equal(clone.initiative?.action_class,'identity-sensitive-media-action');
assert.match(clone.boundary,/consent/);

assert.equal(summary.artlist_runtime_required,false);
assert.equal(summary.artlist_subscription_required,false);
assert.equal(summary.provider_required_for_identity,false);
assert.equal(summary.provider_required_for_memory,false);
assert.equal(summary.provider_required_for_planning,false);
assert.equal(summary.provider_required_for_orchestration,false);
assert.equal(summary.provider_required_for_verification,false);
assert.equal(summary.external_models_replaceable,true);
assert.equal(summary.free_native_first,true);
assert.equal(summary.paid_assets_copied,false);
assert.equal(summary.proprietary_implementation_copied,false);
assert.equal(summary.clean_room,true);
assert.ok(summary.explicit_truth_gaps.some(x=>/not proof/i.test(x)));
assert.ok(summary.explicit_truth_gaps.some(x=>/training\/fine-tuning/i.test(x)));

const plan=buildMagnanimousVideoDirectorPlan({
  title:'Creative control plane test',workflow:'consistent-character',creation_mode:'agent',generation_priority:'cost',seconds:24,aspect_ratio:'9:16',
  idea:'A teacher enters a village. She talks with children. The group gathers beneath a tree.',
  character:'same adult teacher with a blue jacket and braided hair',
  first_frame_description:'sunrise on a quiet village road',
  last_frame_description:'the group together beneath a tree at sunset',
  project_id:'project-123',session_id:'session-abc'
});
assert.equal(plan.identity,'Magnanimous AI');
assert.equal(plan.creation_mode,'agent');
assert.equal(plan.generation_preferences.provider_neutral,true);
assert.equal(plan.generation_preferences.capability_based_selection,true);
assert.equal(plan.generation_preferences.budget.native_free_first,true);
assert.equal(plan.generation_preferences.budget.allow_unfunded_variable_cost,false);
assert.equal(plan.session_context.project_id,'project-123');
assert.equal(plan.session_context.resumable,true);
assert.equal(plan.provenance_policy.record_license_and_consent,true);
assert.equal(plan.provenance_policy.licensed_stock_training_allowed,false);
assert.equal(plan.provenance_policy.content_credentials.standard,'C2PA');
assert.equal(plan.provenance_policy.content_credentials.ai_disclosure_version,'2.4+');
assert.equal(plan.provenance_policy.content_credentials.emit_when_supported,true);
assert.equal(plan.provenance_policy.content_credentials.verified_claim_requires_signing_rail,true);
assert.match(plan.provenance_policy.content_credentials.unsupported_format_behavior,/without-claiming-verified-credentials/);
assert.equal(plan.rights.licensed_assets_training_allowed,false);
assert.ok(plan.compiled_prompt.includes('CREATION MODE:'));

const precision=buildMagnanimousVideoDirectorPlan({idea:'Product closeup',creation_mode:'standard',model:'authorized-model-id',max_external_cost_usd:5});
assert.equal(precision.creation_mode,'standard');
assert.equal(precision.generation_preferences.user_selected_model,'authorized-model-id');
assert.equal(precision.generation_preferences.budget.max_external_cost_usd,5);
assert.equal(precision.generation_preferences.budget.funded_provider_required,true);

const director=getMagnanimousVideoDirectorSummary();
assert.equal(director.creative_agent_mode,true);
assert.equal(director.precision_mode,true);
assert.equal(director.capability_based_model_matching,true);
assert.equal(director.generation_budget_preflight,true);
assert.equal(director.media_provenance_tracking,true);
assert.equal(director.c2pa_content_credentials_policy,true);
assert.equal(director.licensed_assets_excluded_from_training,true);

assert.match(singleBrain,/getArtlistCapabilityManifest/,'Single brain must load Artlist clean-room benchmark contracts.');
assert.match(singleBrain,/creative_control_plane_capability_contracts/,'Single brain must expose creative control-plane contract counts.');
assert.match(singleBrain,/generation_budget_preflight:true/,'Single brain must expose funded-generation preflight policy.');
assert.match(singleBrain,/licensed_assets_excluded_from_training:true/,'Single brain must preserve the licensed-asset AI training prohibition.');
assert.doesNotMatch(singleBrain,/artlist\.io\/api/i,'Single brain must not introduce an assumed Artlist runtime API dependency.');

console.log('Magnanimous Artlist capability lock PASS:',{
  capabilities:rows.length,
  official_sources:ARTLIST_PUBLIC_RESEARCH.sources.length,
  native_targets:summary.native_targets,
  authorization_gated:summary.authorization_gated_contracts,
  c2pa_content_credentials:true
});

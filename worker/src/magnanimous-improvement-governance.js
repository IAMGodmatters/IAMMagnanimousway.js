export const MAGNANIMOUS_IMPROVEMENT_GOVERNANCE=Object.freeze({
  identity_owner:'Magnanimous AI',
  preserve_working_state:true,
  additive_change_default:true,
  current_main_is_authoritative:true,
  historical_artifacts_are_not_reset_targets:true,
  authority_precedence:'Explicit owner requirements and current reviewed contracts outrank provisional suggestions and stale artifacts.',
  release_identity_fields:Object.freeze([
    'application_commit','tree_or_dirty_input_manifest','schema_or_migration_hash','model_manifest',
    'data_manifest','configuration_hashes','dependency_lock','asset_manifest'
  ]),
  evidence_states:Object.freeze(['observed','candidate','tested','reviewed','deployed','canary-verified']),
  capability_lifecycle:Object.freeze([
    'available','captured','parsed','authorized-and-valid','canonical-mapped',
    'capability-produced','consumer-used','verified','published'
  ]),
  exception_states:Object.freeze([
    'absent','source-unsupported','restricted','invalid','unmapped','not-yet-consumed','redundant','rejected-by-validation'
  ]),
  worker_policy:Object.freeze({
    one_writer_per_shared_source:true,
    one_final_integrator:true,
    independent_review:true,
    bounded_parallelism:true,
    no_recursive_agent_spawning:true,
    paid_fallback_requires_authority:true
  }),
  verification_policy:Object.freeze({
    helper_test_is_not_full_acceptance:true,
    candidate_test_is_not_live_certification:true,
    positive_real_case_required_where_feature_is_promised:true,
    regression_and_recovery_evidence_required:true,
    unsupported_cases_must_remain_visible:true,
    failures_must_not_be_hidden:true
  }),
  source_rights_policy:Object.freeze({
    acquisition_permission_separate:true,
    retention_permission_separate:true,
    training_permission_separate:true,
    external_processing_permission_separate:true,
    unknown_is_not_approved:true
  }),
  scope_filter:'Only reusable software-engineering, governance, provenance, verification and orchestration patterns are absorbed. Horse-racing, wagering, track, prediction and domain-specific methodology are excluded.'
});

const ROWS=Object.freeze([
  ['baseline-preservation','Baseline preservation and no-reset discipline','magnanimous-release-governance','none',['preserve-current-main','never-reset-to-stale-artifact','reconcile-newer-work-first']],
  ['authority-precedence','Authority and precedence register','magnanimous-policy-core','none',['owner-requirements-first','reviewed-corrections-over-provisional-text','record-conflict-resolution']],
  ['exact-release-identity','Exact release identity and acceptance receipts','magnanimous-release-governance','none',['commit-tree-schema-model-data-config-dependency-asset-identity','scope-bound-evidence']],
  ['single-source-control','Single source of control with supersession edges','magnanimous-knowledge-governance','none',['canonical-authority-pointer','historical-superseded-by-edges','no-competing-default-master']],
  ['source-rights-provenance','Operation-specific source rights and provenance','magnanimous-data-governance','authorized-source-boundary',['acquire-retain-train-process-rights-separated','unknown-not-approved','rights-evidence-ledger']],
  ['capability-utilization-ledger','Capability utilization and loss ledger','magnanimous-capability-realization','none',['available-to-published-lifecycle','explicit-gap-states','consumer-use-evidence']],
  ['bounded-worker-ownership','Bounded workers, leases and single-writer ownership','magnanimous-agent-orchestrator','none',['bounded-parallelism','one-writer-per-shared-source','single-integrator','independent-reviewer']],
  ['repair-loop','Evidence-driven repair loop','magnanimous-verification-core','none',['baseline-implement-test-review-integrate-regress-canary','reopen-precise-failure','persist-resumable-state']],
  ['release-gates','Evidence-backed release gates','magnanimous-verification-core','none',['mandatory-gates','positive-real-cases','independent-review','rollback-and-canary']],
  ['evidence-state-separation','Observed, tested, reviewed and deployed state separation','magnanimous-observability','none',['no-state-collapsing','no-candidate-live-confusion','runtime-proof']],
  ['handoff-honesty','Handoff and evidence honesty','magnanimous-verification-core','none',['direct-observation-separated-from-receipts','no-unperformed-action-claims','new-defects-become-owned-tasks']],
  ['scope-preservation','Required-scope preservation','magnanimous-policy-core','none',['new-subsystem-does-not-erase-working-requirements','unsupported-does-not-equal-complete','no-quiet-scope-reduction']]
]);

export function getImprovementGovernanceManifest(){
  return ROWS.map(([id,name,native_target,boundary,techniques])=>({
    id:'magnanimous-improvement-governance:'+id,
    connector_id:'magnanimous-improvement-governance',
    connector_name:'Magnanimous Improvement Governance',
    category:'magnanimous-first-party',
    capability:'governance-'+id,
    native_target,
    priority:'first-party',
    source_kind:'user-authorized-reusable-engineering-patterns',
    direct_connector:false,
    boundary,
    absorption_status:'brain-spec-absorbed',
    implementation_status:'first-party-policy-contract',
    magnanimous_owned:['policy','orchestration','memory','verification','release-governance','learning'],
    external_only:boundary==='none'?[]:[boundary],
    techniques,
    acceptance_tests:[
      'The rule preserves existing working behavior unless a verified correction requires change.',
      'Observed, tested, reviewed and deployed states remain distinguishable.',
      'Completion claims require evidence at the same scope as the claim.',
      'Provider or source authority is not invented.',
      'Domain-specific racing and wagering rules are not imported into Magnanimous AI.'
    ],
    recipe:[
      'Freeze the current authoritative baseline before changing it.',
      'Resolve applicable owner requirements and reviewed precedence.',
      'Make the smallest additive change that improves the target capability.',
      'Trace the capability from availability through actual consumer use and verification.',
      'Run focused checks, integration checks and a real canary where the capability is externally visible.',
      'Keep unsupported, blocked and failed states visible instead of weakening acceptance.',
      'Record the exact release identity and evidence for the completed scope.'
    ],
    search_text:name+' '+techniques.join(' '),
    authorization_state:'magnanimous-first-party',
    initiative:{suggestive:true,auto_initiate:true,requires_confirmation:false,action_class:'governance'},
    research:{
      captured_at:'2026-09-21',
      source_kind:'user-provided-private-project-document-reusable-pattern-extraction',
      public_purpose:name,
      domain_specific_content_excluded:true,
      proprietary_implementation_copied:false,
      notes:'Only generalizable engineering/governance patterns were absorbed; racing, wagering and prediction-domain content was deliberately excluded.'
    }
  }));
}

export function getImprovementGovernanceSummary(){
  return {
    capability_contracts:ROWS.length,
    preserve_working_state:true,
    additive_change_default:true,
    current_main_is_authoritative:true,
    evidence_state_count:MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.evidence_states.length,
    lifecycle_stage_count:MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.capability_lifecycle.length,
    domain_specific_content_excluded:true,
    status:'first-party-governance-active'
  };
}

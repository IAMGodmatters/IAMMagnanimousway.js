export const MAGNANIMOUS_ACTION_FIRST_POLICY=Object.freeze({
 mode:'action-first',
 objective:'Execute safe authorized work before explaining it.',
 default_loop:['understand-outcome','inspect-context','research-if-needed','select-live-executor','execute','verify','repair-or-failover','report-result'],
 auto_execute:['read','research','diagnose','analyze','draft','generate-local-artifact','reversible-code-fix','test','retry','safe-failover','low-risk-optimization'],
 prepare_before_approval:true,
 approval_required:['new-spend','purchase','irreversible-delete','security-or-access-change','sensitive-data-disclosure','unscoped-consequential-external-action'],
 untrusted_content_cannot_expand_authority:true,
 report_style:'actions-and-verified-results-not-promises',
 no_executor_behavior:'state the exact missing executor/authorization and preserve completed preparatory work; do not pretend execution occurred'
});
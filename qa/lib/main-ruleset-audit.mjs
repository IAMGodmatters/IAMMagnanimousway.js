export const REQUIRED_MAIN_CHECK_CONTEXTS = Object.freeze([
  // These are the exact check-run contexts emitted by the current workflows.
  // Workflow display names are not necessarily the status-check context names.
  'Code health and builds',
  'verify-command-architecture'
]);

// Verified from the current main commit's check-runs API: both required
// contexts are emitted by the GitHub Actions integration (app ID 15368).
// A matching context from an arbitrary writer is not sufficient.
export const REQUIRED_MAIN_CHECK_APP_ID = 15368;

/**
 * Evaluate the rules GitHub says are effective on main, not an approximation
 * based only on repository-owned rulesets. The branch-rules endpoint includes
 * active rules inherited from organization/enterprise rulesets.
 */
export function evaluateMainRulesets(rulesets, detailsById, branchRules) {
  if (!Array.isArray(rulesets) || !Array.isArray(branchRules)) {
    return {
      status: 'manual',
      activeRulesets: 0,
      gaps: ['The complete ruleset list or effective main-branch rules could not be read.']
    };
  }

  const active = rulesets.filter(ruleSet =>
    ruleSet &&
    ruleSet.target === 'branch' &&
    ruleSet.enforcement === 'active'
  );
  const activeById = new Map(active.map(item => [String(item.id), item]));

  if (branchRules.some(rule => !rule || rule.ruleset_id === undefined || rule.ruleset_id === null)) {
    return {
      status: 'manual',
      activeRulesets: 0,
      gaps: ['GitHub returned an effective main-branch rule without a ruleset ID; its bypass policy cannot be verified.']
    };
  }

  const applicableIds = [...new Set(branchRules.map(rule => String(rule.ruleset_id)))];
  if (applicableIds.length === 0) {
    return {
      status: 'warning',
      activeRulesets: 0,
      gaps: ['GitHub reports no active ruleset rules applying to the main branch.']
    };
  }

  const missingRulesets = applicableIds.filter(id => !activeById.has(id));
  if (missingRulesets.length > 0) {
    return {
      status: 'manual',
      activeRulesets: applicableIds.length,
      gaps: ['Effective main-branch rules reference rulesets missing from the complete repository-and-parent ruleset list: ' + missingRulesets.join(', ') + '.']
    };
  }

  const applicable = applicableIds.map(id => activeById.get(id));
  const missingRuleDetails = applicable.filter(item =>
    !Array.isArray(detailsById?.[String(item.id)]?.rules)
  );
  const missingBypassDetails = applicable.filter(item =>
    !Array.isArray(detailsById?.[String(item.id)]?.bypass_actors)
  );
  if (missingRuleDetails.length > 0 || missingBypassDetails.length > 0) {
    const gaps = [];
    if (missingRuleDetails.length > 0) {
      gaps.push(
        'Complete rules were not returned for applicable ruleset(s): ' +
        missingRuleDetails.map(item => String(item.id)).join(', ') + '.'
      );
    }
    if (missingBypassDetails.length > 0) {
      gaps.push(
        'GitHub omitted bypass_actors for applicable ruleset(s): ' +
        missingBypassDetails.map(item => String(item.id)).join(', ') +
        '. GitHub only returns this field when the API caller has write access to the ruleset. ' +
        'Use a repository-restricted audit credential with the required ruleset visibility, ' +
        'or complete manual owner verification; do not broaden the production GITHUB_TOKEN.'
      );
    }
    return { status: 'manual', activeRulesets: applicable.length, gaps };
  }

  // Use GitHub's effective branch-rule response for applicability and rule
  // aggregation. This includes inherited organization/enterprise rulesets.
  const pullRequestRules = branchRules.filter(rule => rule.type === 'pull_request');
  const statusCheckRules = branchRules.filter(rule => rule.type === 'required_status_checks');
  const requiredChecks = statusCheckRules.flatMap(rule =>
    Array.isArray(rule?.parameters?.required_status_checks)
      ? rule.parameters.required_status_checks
      : []
  );
  const requiredCheckContexts = [...new Set(requiredChecks
    .map(item => String(item?.context || '').trim())
    .filter(Boolean))].sort();
  const missingRequiredChecks = REQUIRED_MAIN_CHECK_CONTEXTS.filter(
    context => !requiredCheckContexts.includes(context)
  );
  const wrongSourceRequiredChecks = REQUIRED_MAIN_CHECK_CONTEXTS.filter(context => {
    const matching = requiredChecks.filter(item => String(item?.context || '').trim() === context);
    return matching.length > 0 && !matching.every(
      item => Number(item?.integration_id) === REQUIRED_MAIN_CHECK_APP_ID
    );
  });
  const strictRequiredStatusChecksPolicy = statusCheckRules.length > 0 &&
    statusCheckRules.every(rule => rule.parameters?.strict_required_status_checks_policy === true);
  const requiredApprovals = Math.max(0, ...pullRequestRules.map(rule =>
    Number(rule?.parameters?.required_approving_review_count || 0)
  ));

  const bypassActors = applicable.flatMap(item => detailsById[String(item.id)].bypass_actors);
  const unrestrictedBypassActors = bypassActors.filter(actor => actor.bypass_mode !== 'pull_request');
  const alwaysBypassActors = unrestrictedBypassActors.filter(actor => actor.bypass_mode === 'always').length;

  const gaps = [];
  if (pullRequestRules.length === 0) {
    gaps.push('No effective pull_request rule is configured for main.');
  } else if (requiredApprovals < 1) {
    gaps.push('The effective pull_request rules do not verifiably require at least one approval.');
  }
  if (statusCheckRules.length === 0) {
    gaps.push('No effective required_status_checks rule is configured for main.');
  } else if (requiredChecks.length === 0) {
    gaps.push('The effective required_status_checks rules contain no named required checks.');
  } else if (missingRequiredChecks.length > 0) {
    gaps.push('Required status checks are missing: ' + missingRequiredChecks.join(', ') + '.');
  }
  if (wrongSourceRequiredChecks.length > 0) {
    gaps.push(
      'Required status checks must be restricted to the GitHub Actions app (integration ID ' +
      REQUIRED_MAIN_CHECK_APP_ID + '): ' + wrongSourceRequiredChecks.join(', ') + '.'
    );
  }
  if (statusCheckRules.length > 0 && !strictRequiredStatusChecksPolicy) {
    gaps.push('Every effective required-status-check rule must require the branch to be up to date.');
  }
  if (unrestrictedBypassActors.length > 0) {
    gaps.push(unrestrictedBypassActors.length + ' applicable bypass actor(s) use a mode other than pull_request.');
  }

  return {
    status: gaps.length > 0 ? 'warning' : 'pass',
    activeRulesets: applicable.length,
    applicableRulesetIds: applicableIds,
    hasPullRequestRule: pullRequestRules.length > 0,
    requiredApprovals,
    requiredChecks: requiredCheckContexts.length,
    requiredCheckContexts,
    requiredCheckAppId: REQUIRED_MAIN_CHECK_APP_ID,
    missingRequiredChecks,
    wrongSourceRequiredChecks,
    strictRequiredStatusChecksPolicy,
    alwaysBypassActors,
    unrestrictedBypassActors: unrestrictedBypassActors.length,
    gaps
  };
}

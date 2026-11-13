export const REQUIRED_MAIN_CHECK_CONTEXTS = Object.freeze([
  // These are the actual check-run names emitted by the current workflows.
  // "Full Platform QA" and "Magnanimous Command Lock" are workflow labels,
  // not the exact required status contexts GitHub receives.
  'Code health and builds',
  'verify-command-architecture'
]);

function patternMatchesMain(pattern){
  const value=String(pattern||'').toLowerCase();
  if(['~all','~default_branch','*','**','main','refs/heads/main'].includes(value))return true;
  const normalized=value.replace(/^refs\/heads\//,'');
  if(normalized.endsWith('*'))return 'main'.startsWith(normalized.slice(0,-1));
  return false;
}
function rulesetAppliesToMain(detail){
  const refName=detail?.conditions?.ref_name;
  if(!refName)return true;
  const include=Array.isArray(refName.include)?refName.include:[];
  const exclude=Array.isArray(refName.exclude)?refName.exclude:[];
  const included=include.length===0||include.some(patternMatchesMain);
  const excluded=exclude.some(patternMatchesMain);
  return included&&!excluded;
}
export function evaluateMainRulesets(rulesets,detailsById,repository){
  const active=(Array.isArray(rulesets)?rulesets:[]).filter(ruleSet=>
    ruleSet&&ruleSet.target==='branch'&&ruleSet.enforcement==='active'&&
    (ruleSet.source===repository||ruleSet.source_type==='Repository')
  );
  if(active.length===0){
    return {status:'warning',activeRulesets:0,gaps:['No active repository ruleset targeting branches was found.']};
  }
  const unreadable=active.filter(item=>{
    const detail=detailsById?.[String(item.id)];
    return !detail||!Array.isArray(detail.rules)||!Array.isArray(detail.bypass_actors);
  });
  if(unreadable.length){
    return {status:'manual',activeRulesets:active.length,gaps:['Not every active branch ruleset, rule list, and bypass-actor list could be read; manual owner verification is required.']};
  }
  const mainRulesets=active.filter(item=>rulesetAppliesToMain(detailsById[String(item.id)]));
  if(mainRulesets.length===0){
    return {status:'warning',activeRulesets:0,gaps:['No active repository ruleset applies to the main branch.']};
  }

  // GitHub combines applicable rulesets. Evaluate all of their requirements,
  // not merely the first PR or status-check rule returned by the API.
  const details=mainRulesets.map(item=>detailsById[String(item.id)]);
  const rules=details.flatMap(item=>Array.isArray(item.rules)?item.rules:[]);
  const pullRequestRules=rules.filter(rule=>rule.type==='pull_request');
  const statusCheckRules=rules.filter(rule=>rule.type==='required_status_checks');
  const requiredChecks=statusCheckRules.flatMap(rule=>
    Array.isArray(rule?.parameters?.required_status_checks)
      ? rule.parameters.required_status_checks
      : []
  );
  const requiredCheckContexts=[...new Set(requiredChecks
    .map(item=>String(item?.context||'').trim())
    .filter(Boolean))].sort();
  const missingRequiredChecks=REQUIRED_MAIN_CHECK_CONTEXTS.filter(
    context=>!requiredCheckContexts.includes(context)
  );
  const strictRequiredStatusChecksPolicy=statusCheckRules.length>0&&statusCheckRules.every(
    rule=>rule.parameters?.strict_required_status_checks_policy===true
  );
  const requiredApprovals=Math.max(0,...pullRequestRules.map(rule=>
    Number(rule?.parameters?.required_approving_review_count||0)
  ));
  const bypassActors=details.flatMap(item=>Array.isArray(item.bypass_actors)?item.bypass_actors:[]);
  const unrestrictedBypassActors=bypassActors.filter(actor=>actor.bypass_mode!=='pull_request');
  const alwaysBypassActors=unrestrictedBypassActors.filter(actor=>actor.bypass_mode==='always').length;
  const gaps=[];
  if(pullRequestRules.length===0)gaps.push('No required pull_request rule is configured.');
  else if(requiredApprovals<1)gaps.push('The pull_request rule does not verifiably require at least one approval.');
  if(statusCheckRules.length===0)gaps.push('No required_status_checks rule is configured.');
  else if(requiredChecks.length===0)gaps.push('The required_status_checks rules contain no named required checks.');
  else if(missingRequiredChecks.length>0)gaps.push('Required status checks are missing: '+missingRequiredChecks.join(', ')+'.');
  if(statusCheckRules.length>0&&!strictRequiredStatusChecksPolicy)gaps.push('Every required status-check rule must require the branch to be up to date.');
  if(unrestrictedBypassActors.length>0)gaps.push(unrestrictedBypassActors.length+' bypass actor(s) use a mode other than pull_request.');
  return {
    status:gaps.length?'warning':'pass',
    activeRulesets:mainRulesets.length,
    hasPullRequestRule:pullRequestRules.length>0,
    requiredApprovals,
    requiredChecks:requiredCheckContexts.length,
    requiredCheckContexts,
    missingRequiredChecks,
    strictRequiredStatusChecksPolicy,
    alwaysBypassActors,
    unrestrictedBypassActors:unrestrictedBypassActors.length,
    gaps
  };
}

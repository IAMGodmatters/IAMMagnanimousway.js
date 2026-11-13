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
  const normalized=value.replace(/^refs\\/heads\\//,'');
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
  const unreadable=active.filter(item=>!detailsById?.[String(item.id)]);
  if(unreadable.length){
    return {status:'manual',activeRulesets:active.length,gaps:['Not every active branch ruleset could be read; manual owner verification is required.']};
  }
  const mainRulesets=active.filter(item=>rulesetAppliesToMain(detailsById[String(item.id)]));
  if(mainRulesets.length===0){
    return {status:'warning',activeRulesets:0,gaps:['No active repository ruleset applies to the main branch.']};
  }
  const details=mainRulesets.map(item=>detailsById[String(item.id)]);
  const rules=details.flatMap(item=>Array.isArray(item.rules)?item.rules:[]);
  const pullRequestRule=rules.find(rule=>rule.type==='pull_request');
  const statusChecksRule=rules.find(rule=>rule.type==='required_status_checks');
  const requiredChecks=Array.isArray(statusChecksRule?.parameters?.required_status_checks)
    ? statusChecksRule.parameters.required_status_checks
    : [];
  const requiredCheckContexts=[...new Set(requiredChecks
    .map(item=>String(item?.context||'').trim())
    .filter(Boolean))].sort();
  const missingRequiredChecks=REQUIRED_MAIN_CHECK_CONTEXTS.filter(
    context=>!requiredCheckContexts.includes(context)
  );
  const strictRequiredStatusChecksPolicy=statusChecksRule?.parameters?.strict_required_status_checks_policy===true;
  const requiredApprovals=Number(pullRequestRule?.parameters?.required_approving_review_count||0);
  const alwaysBypass=details.flatMap(item=>Array.isArray(item.bypass_actors)?item.bypass_actors:[])
    .filter(actor=>actor.bypass_mode==='always');
  const gaps=[];
  if(!pullRequestRule)gaps.push('No required pull_request rule is configured.');
  else if(requiredApprovals<1)gaps.push('The pull_request rule does not verifiably require at least one approval.');
  if(!statusChecksRule)gaps.push('No required_status_checks rule is configured.');
  else if(requiredChecks.length===0)gaps.push('The required_status_checks rule contains no named required checks.');
  else if(missingRequiredChecks.length>0)gaps.push('Required status checks are missing: '+missingRequiredChecks.join(', ')+'.');
  if(statusChecksRule&&!strictRequiredStatusChecksPolicy)gaps.push('Required status checks do not verifiably require the branch to be up to date.');
  if(alwaysBypass.length>0)gaps.push(alwaysBypass.length+' bypass actor(s) use bypass_mode=always.');
  return {
    status:gaps.length?'warning':'pass',
    activeRulesets:mainRulesets.length,
    hasPullRequestRule:Boolean(pullRequestRule),
    requiredApprovals,
    requiredChecks:requiredCheckContexts.length,
    requiredCheckContexts,
    missingRequiredChecks,
    strictRequiredStatusChecksPolicy,
    alwaysBypassActors:alwaysBypass.length,
    gaps
  };
}

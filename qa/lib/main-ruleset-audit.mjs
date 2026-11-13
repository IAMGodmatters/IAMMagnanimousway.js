export function evaluateMainRulesets(rulesets,detailsById,repository){
  const active=(Array.isArray(rulesets)?rulesets:[]).filter(ruleSet=>
    ruleSet&&ruleSet.target==='branch'&&ruleSet.enforcement==='active'&&
    (ruleSet.source===repository||ruleSet.source_type==='Repository')
  );
  if(active.length===0){
    return {status:'warning',activeRulesets:0,gaps:['No active repository ruleset targeting branches was found.']};
  }
  const details=active.map(item=>detailsById?.[String(item.id)]).filter(Boolean);
  if(details.length!==active.length){
    return {status:'manual',activeRulesets:active.length,gaps:['Not every active main ruleset could be read; manual owner verification is required.']};
  }
  const rules=details.flatMap(item=>Array.isArray(item.rules)?item.rules:[]);
  const pullRequestRule=rules.find(rule=>rule.type==='pull_request');
  const statusChecksRule=rules.find(rule=>rule.type==='required_status_checks');
  const requiredChecks=Array.isArray(statusChecksRule?.parameters?.required_status_checks)
    ? statusChecksRule.parameters.required_status_checks
    : [];
  const requiredApprovals=Number(pullRequestRule?.parameters?.required_approving_review_count||0);
  const alwaysBypass=details.flatMap(item=>Array.isArray(item.bypass_actors)?item.bypass_actors:[])
    .filter(actor=>actor.bypass_mode==='always');
  const gaps=[];
  if(!pullRequestRule)gaps.push('No required pull_request rule is configured.');
  else if(requiredApprovals<1)gaps.push('The pull_request rule does not verifiably require at least one approval.');
  if(!statusChecksRule)gaps.push('No required_status_checks rule is configured.');
  else if(requiredChecks.length===0)gaps.push('The required_status_checks rule contains no named required checks.');
  if(alwaysBypass.length>0)gaps.push(alwaysBypass.length+' bypass actor(s) use bypass_mode=always.');
  return {
    status:gaps.length?'warning':'pass',
    activeRulesets:active.length,
    hasPullRequestRule:Boolean(pullRequestRule),
    requiredApprovals,
    requiredChecks:requiredChecks.length,
    alwaysBypassActors:alwaysBypass.length,
    gaps
  };
}

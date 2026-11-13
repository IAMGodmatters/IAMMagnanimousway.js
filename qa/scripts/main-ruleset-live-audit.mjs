import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { evaluateMainRulesets } from '../lib/main-ruleset-audit.mjs';

const repository=process.env.GITHUB_REPOSITORY||'IAMGodmatters/IAMMagnanimousway.js';
const token=process.env.GITHUB_TOKEN||'';
const apiRoot='https://api.github.com/repos/'+repository;
const headers={
  Accept:'application/vnd.github+json',
  Authorization:'Bearer '+token,
  'User-Agent':'iam-magnanimous-way-main-ruleset-audit',
  'X-GitHub-Api-Version':'2022-11-28'
};

function report(status,details){
  const heading=status==='pass'?'PASS':status==='manual'?'MANUAL VERIFICATION REQUIRED':'OWNER ACTION REQUIRED';
  const summary=[
    '## GitHub main ruleset audit',
    '',
    '**Result:** '+heading,
    '',
    ...details.map(item=>'- '+item),
    '',
    'This is a read-only audit. It does not change repository settings. A protected:true branch response alone is not proof that required reviews and status checks are enforced.',
    ''
  ].join('\n');
  console.log((status==='pass'?'::notice::':'::warning::')+heading+': '+details.join(' '));
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
}

export async function runMainRulesetAudit(){
  if(!token){
    report('manual',['GITHUB_TOKEN is unavailable; no ruleset enforcement claim can be made.']);
    return {status:'manual'};
  }
  let listResponse;
  try{
    listResponse=await fetch(apiRoot+'/rulesets',{headers,signal:AbortSignal.timeout(15000)});
  }catch{
    report('manual',['The rulesets endpoint could not be reached; manual owner verification is required.']);
    return {status:'manual'};
  }
  if(!listResponse.ok){
    report('manual',['The rulesets endpoint returned HTTP '+listResponse.status+'; the current token cannot verify actual ruleset enforcement.']);
    return {status:'manual',httpStatus:listResponse.status};
  }
  const rulesets=await listResponse.json();
  const active=rulesets.filter(item=>
    item&&item.target==='branch'&&item.enforcement==='active'&&
    (item.source===repository||item.source_type==='Repository')
  );
  if(active.length===0){
    report('warning',['No active repository ruleset targeting branches was found.']);
    return {status:'warning',activeRulesets:0};
  }
  const detailsById={};
  const unreadable=[];
  for(const item of active){
    let response;
    try{
      response=await fetch(apiRoot+'/rulesets/'+encodeURIComponent(item.id),{headers,signal:AbortSignal.timeout(15000)});
    }catch{
      unreadable.push('Ruleset '+item.name+' could not be fetched.');
      continue;
    }
    if(!response.ok){
      unreadable.push('Ruleset '+item.name+' detail returned HTTP '+response.status+'.');
      continue;
    }
    detailsById[String(item.id)]=await response.json();
  }
  if(unreadable.length){
    report('manual',unreadable);
    return {status:'manual',gaps:unreadable};
  }
  const assessment=evaluateMainRulesets(active,detailsById,repository);
  if(assessment.status==='pass'){
    report('pass',[
      'Active rulesets: '+assessment.activeRulesets+'.',
      'Required pull-request approvals: '+assessment.requiredApprovals+'.',
      'Exact required status checks: '+assessment.requiredCheckContexts.join('; ')+'.',
      'Strict up-to-date policy: enabled.',
      'Unrestricted bypass actors: '+assessment.unrestrictedBypassActors+'.'
    ]);
  }else{
    report('warning',assessment.gaps);
  }
  return assessment;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runMainRulesetAudit();

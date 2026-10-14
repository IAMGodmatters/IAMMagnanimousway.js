import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectNativeEvidence} from '../../worker/src/native-investigation-core.js';
import {routeInvestigationTarget,nativeInvestigationCapabilityMap,investigationSelfAuditRules} from '../../worker/src/native-investigation-routing.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');

async function inspectFile(relativePath,kind='javascript'){
  const content=fs.readFileSync(path.join(root,relativePath),'utf8');
  const evidence=await inspectNativeEvidence({content,kind,source:`self:${relativePath}`,authorized:true});
  assert.equal(evidence.executionPerformed,false,relativePath);
  assert.equal(evidence.networkAccessPerformed,false,relativePath);
  assert.equal(evidence.evidenceClassification,'static-analysis',relativePath);
  assert.equal(evidence.sha256.length,64,relativePath);
  return {relativePath,evidence};
}

const targets=[
  ['worker/src/native-investigation-core.js','javascript'],
  ['worker/src/native-investigation-routing.js','javascript'],
  ['frontend/app/investigate/page.tsx','javascript'],
  ['frontend/app/tool-foundry/page.tsx','javascript'],
  ['worker/src/security-entrypoint.js','javascript'],
  ['.github/workflows/deploy.yml','text']
];

const reports=[];
for(const [relativePath,kind] of targets)reports.push(await inspectFile(relativePath,kind));

const byPath=Object.fromEntries(reports.map(report=>[report.relativePath,report.evidence]));
const investigatorTypes=new Set(byPath['frontend/app/investigate/page.tsx'].summary.types);
assert.ok(investigatorTypes.has('storage-reference'),'Investigation Lab should disclose its local session-storage references');
assert.ok(!investigatorTypes.has('network-reference'),'Investigation Lab must remain target-content network silent');
assert.ok(!investigatorTypes.has('dynamic-execution-reference'),'Investigation Lab must not dynamically execute pasted target code');
assert.ok(!investigatorTypes.has('dom-injection-reference'),'Investigation Lab must not inject pasted target HTML into the DOM');
assert.ok(!investigatorTypes.has('command-execution-reference'),'Investigation Lab must not expose command execution');

const foundryTypes=new Set(byPath['frontend/app/tool-foundry/page.tsx'].summary.types);
assert.ok(foundryTypes.has('network-reference'),'Tool Foundry should expose its normal authenticated API network boundary');
assert.ok(foundryTypes.has('endpoint-reference'),'Tool Foundry API endpoints should be visible to static evidence analysis');
assert.ok(foundryTypes.has('storage-reference'),'Tool Foundry session token storage boundary should be visible');
assert.ok(foundryTypes.has('authentication-reference'),'Tool Foundry authorization boundary should be visible');

const synthetic=`
const x=process.env.TEST;
const c=document.cookie;
window.postMessage('x','*');
new Worker('/worker.js');
eval('1+1');
node.innerHTML='<b>x</b>';
readFileSync('/tmp/x');
execSync('echo x');
`;
const syntheticEvidence=await inspectNativeEvidence({content:synthetic,kind:'javascript',source:'self:synthetic-risk-probe',authorized:true});
const syntheticTypes=new Set(syntheticEvidence.summary.types);
for(const expected of [
  'process-environment-reference','cookie-reference','cross-window-message-reference','worker-reference',
  'dynamic-execution-reference','dom-injection-reference','filesystem-reference','command-execution-reference'
])assert.ok(syntheticTypes.has(expected),`Synthetic self-audit probe must detect ${expected}`);

const sourceRoute=routeInvestigationTarget({name:'package.json',hint:'source repository checkout'});
assert.equal(sourceRoute.id,'source-repository');
assert.equal(sourceRoute.provider,'magnanimous-native');
assert.equal(sourceRoute.execution,false);

const jsRoute=routeInvestigationTarget({name:'bundle.js',hint:'javascript application'});
assert.equal(jsRoute.id,'javascript-application');
assert.equal(jsRoute.execution,false);

const binaryRoute=routeInvestigationTarget({name:'sample.elf',hint:'native binary disassemble'});
assert.equal(binaryRoute.id,'native-binary');
assert.equal(binaryRoute.execution,false);

const browserRoute=routeInvestigationTarget({name:'',hint:'browser page runtime observation'});
assert.equal(browserRoute.id,'browser-runtime');
assert.equal(browserRoute.execution,'declared-actions-only');

const fallbackRoute=routeInvestigationTarget({name:'notes.txt',hint:'plain authorized evidence'});
assert.equal(fallbackRoute.id,'generic-text-evidence');
assert.equal(fallbackRoute.provider,'magnanimous-native');
assert.equal(fallbackRoute.execution,false);

const routingRules=investigationSelfAuditRules();
assert.equal(routingRules.noImplicitTargetFetch,true);
assert.equal(routingRules.noImplicitExecution,true);
assert.equal(routingRules.noAccessControlBypass,true);
assert.equal(routingRules.externalEnginesRemainReplaceable,true);
const capabilityMap=nativeInvestigationCapabilityMap();
assert.ok(capabilityMap.length>=10,'Investigation routing should cover multiple evidence families');
assert.ok(capabilityMap.every(route=>route.id&&route.mode&&route.provider),'Every investigation route must declare identity, mode and provider boundary');

const summary={
  schemaVersion:3,
  mode:'magnanimous-native-self-audit',
  targetExecutionPerformed:false,
  targetNetworkAccessPerformed:false,
  targets:reports.map(({relativePath,evidence})=>({
    path:relativePath,
    sha256:evidence.sha256,
    bytes:evidence.bytes,
    lineCount:evidence.lineCount,
    indicatorCount:evidence.summary.indicatorCount,
    indicatorTypes:evidence.summary.types
  })),
  routing:{
    routeCount:capabilityMap.length,
    examples:[sourceRoute,jsRoute,binaryRoute,browserRoute,fallbackRoute],
    rules:routingRules
  },
  syntheticProbeTypes:[...syntheticTypes].sort()
};

console.log(JSON.stringify(summary,null,2));
console.log('native investigation self-audit passed');

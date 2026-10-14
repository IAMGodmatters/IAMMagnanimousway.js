import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectNativeEvidence} from '../../worker/src/native-investigation-core.js';

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
  syntheticProbeTypes:[...syntheticTypes].sort()
};

console.log(JSON.stringify(summary,null,2));
console.log('native investigation self-audit passed');

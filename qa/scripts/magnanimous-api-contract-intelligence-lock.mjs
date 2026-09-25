import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_API_CONTRACT_INTELLIGENCE,
  extractApiContract,
  checkApiDocumentationCoverage,
  compareApiContracts,
  classifyApiBreakingChanges,
  generateApiImpactMap
} from '../../worker/src/magnanimous-api-contract-intelligence.js';
import { getChatGPTPluginCapabilityManifest } from '../../worker/src/magnanimous-connector-absorption.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const before={
 openapi:'3.1.0',
 info:{title:'Example',version:'1'},
 paths:{
  '/users/{id}':{
   get:{
    parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],
    responses:{'200':{description:'ok'},'404':{description:'missing'}}
   }
  },
  '/users':{
   post:{
    requestBody:{content:{'application/json':{schema:{type:'object',required:['name'],properties:{name:{type:'string'}}}}}},
    responses:{'201':{description:'created'}}
   }
  }
 }
};
const after=structuredClone(before);
after.info.version='2';
after.paths['/users'].post.requestBody.content['application/json'].schema.required.push('email');
after.paths['/users'].post.requestBody.content['application/json'].schema.properties.email={type:'string'};
delete after.paths['/users/{id}'];

const extracted=extractApiContract(before);
assert.equal(extracted.source_kind,'openapi');
assert.equal(extracted.endpoints.length,2);
assert.ok(extracted.endpoints.some(x=>x.method==='GET'&&x.path==='/users/{id}'));

const coverage=checkApiDocumentationCoverage(before,'GET /users/{id} id response 200 404 POST /users name response 201');
assert.ok(coverage.coverage_ratio>0.7);

const comparison=compareApiContracts(before,after);
assert.ok(comparison.removed.some(x=>x.key==='GET /users/{id}'));
assert.ok(comparison.modified.some(x=>x.key==='POST /users'));

const breaking=classifyApiBreakingChanges(comparison);
assert.ok(breaking.breaking>=2);

const impact=generateApiImpactMap({
 changes:comparison,
 consumers:[{name:'mobile-app',endpoints:['POST /users']}],
 tests:[{name:'users-contract-test',endpoints:['GET /users/{id}','POST /users']}],
 documentation:[{name:'public-api-docs',endpoints:['POST /users']}]
});
assert.ok(impact.impacts.some(x=>x.endpoint==='POST /users'&&x.consumers.some(y=>y.name==='mobile-app')));

assert.equal(MAGNANIMOUS_API_CONTRACT_INTELLIGENCE.provider_required,false);
const plugins=getChatGPTPluginCapabilityManifest().filter(x=>['API_Documentation_Checker','API_Impact_Mapper'].includes(x.plugin_namespace));
assert.ok(plugins.length>=6);
assert.ok(plugins.every(x=>x.native_target==='api-contract-intelligence'));
assert.ok(plugins.every(x=>classifyCapabilityRealization(x).status==='native-ready'));
assert.ok(plugins.every(x=>classifyCapabilityRealization(x).requires_external===false));

console.log('Magnanimous native API contract intelligence: PASS');

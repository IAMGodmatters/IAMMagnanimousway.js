import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planMagnanimousParallelDevelopment} from '../../worker/src/magnanimous-parallel-supervisor.js';
import {generateMagnanimousMcpDraft} from '../../worker/src/magnanimous-openapi-mcp.js';
import {magnanimousSpanMetadata} from '../../worker/src/magnanimous-tool-traces.js';

const input={repo:'IAMGodmatters/IAMMagnanimousway.js',base_ref:'main',max_concurrency:3,budget_usd:0,
 tasks:[
  {id:'mobile-layout',title:'Fix mobile layout',files:['frontend/app/page.tsx']},
  {id:'mobile-nav',title:'Improve navigation',files:['frontend/app/page.tsx']},
  {id:'contract-tests',title:'Add tests',files:['qa/scripts/example.mjs']},
  {id:'new-docs',title:'Document changes',files:['docs/example.md'],depends_on:['contract-tests']}
 ]};
const plan=planMagnanimousParallelDevelopment(input);
assert.equal(plan.task_count,4);
assert.equal(plan.total_cost_ceiling_usd,0);
assert.deepEqual(plan.waves[0],['mobile-layout','contract-tests']);
assert.deepEqual(plan.waves[1],['mobile-nav','new-docs']);
assert.deepEqual(plan.overlaps[0].tasks,['mobile-layout','mobile-nav']);
assert.equal(plan.actions_executed,0);
assert.equal(plan.automatic_external_spend,false);
assert.equal(plan.requires_owner_approval,true);
assert.ok(plan.tasks.every(t=>t.branch.startsWith('magnanimous/orca/')));
assert.throws(()=>planMagnanimousParallelDevelopment({...input,tasks:[input.tasks[0],input.tasks[0]]}),/unique/);
assert.throws(()=>planMagnanimousParallelDevelopment({...input,tasks:[{...input.tasks[0],files:['../.env']}] }),/Invalid scoped/);
assert.throws(()=>planMagnanimousParallelDevelopment({...input,tasks:[{...input.tasks[0],depends_on:['missing']}] }),/dependency/);
assert.throws(()=>planMagnanimousParallelDevelopment({...input,tasks:[
 {...input.tasks[0],depends_on:['mobile-nav']},{...input.tasks[1],depends_on:['mobile-layout']}
 ]}),/Circular/);
assert.throws(()=>planMagnanimousParallelDevelopment({...input,budget_usd:0,tasks:[{...input.tasks[0],maximum_cost_usd:0.01}]}),/budget/);
assert.equal(planMagnanimousParallelDevelopment({...input,tasks:[{...input.tasks[0],files:['worker/src/billing-runtime.js']}]}).protected_paths_require_review,true);

const contract={openapi:'3.1.0',info:{title:'Example Internal',version:'1.0.0'},
 paths:{
  '/accounts/{id}':{get:{summary:'Read account',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}},{name:'expand',in:'query',schema:{type:'boolean'}}],responses:{'200':{description:'OK'}}}},
  '/accounts':{post:{summary:'Create account',requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{title:{type:'string'}},required:['title']}}}},responses:{'201':{description:'Created'}}}}
 }};
const generated=generateMagnanimousMcpDraft(contract);
assert.equal(generated.generated_tools,2);
assert.equal(generated.read_only,1);
assert.equal(generated.external_writes,1);
assert.equal(generated.executable,false);
assert.equal(generated.paid_calls_performed,0);
assert.ok(generated.tools.every(t=>t.metadata.enabled===false&&t.metadata.approved===false&&t.metadata.executable===false));
assert.equal(generated.tools[0].inputSchema.properties.path_id.type,'string');
assert.equal(generated.tools[0].inputSchema.properties.query_expand.type,'boolean');
assert.ok(generated.tools[0].inputSchema.required.includes('path_id'));
assert.ok(generated.tools[1].inputSchema.required.includes('body'));
assert.equal(generated.tools[1].metadata.risk,'external-write');
assert.throws(()=>generateMagnanimousMcpDraft({...contract,paths:{'/accounts':{get:{parameters:[{name:'bad',in:'header',schema:{type:'string'}}]}}}}),/path\/query/);
assert.throws(()=>generateMagnanimousMcpDraft({...contract,paths:{'/accounts':{get:{parameters:[{name:'id',in:'query',schema:{$ref:'https://evil.invalid/schema'}}]}}}}),/Unresolved/);
assert.throws(()=>generateMagnanimousMcpDraft({...contract,openapi:'2.0'}),/OpenAPI 3/);
assert.throws(()=>generateMagnanimousMcpDraft('{wrong json'),/Valid JSON/);
assert.throws(()=>generateMagnanimousMcpDraft({...contract,paths:{'http://evil.invalid':{get:{}}}}),/Unsafe API path/);
assert.throws(()=>generateMagnanimousMcpDraft({...contract,paths:{'/accounts/{id}':{get:{}}}}),/Path parameters/);

const span=magnanimousSpanMetadata({tenant:'tenant-one',user:'user-one',serverId:1,tool:'read_my_tool',success:false,durationMs:155,responseBytes:100,errorKind:'UPSTREAM_HTTP_500'});
assert.equal(span.latency_ms,155);
assert.equal(span.error_kind,'UPSTREAM_HTTP_500');
assert.equal(span.success,false);
assert.ok(!Object.hasOwn(span,'arguments'));
assert.ok(!Object.hasOwn(span,'payload'));
assert.ok(!Object.hasOwn(span,'response'));
assert.throws(()=>magnanimousSpanMetadata({serverId:0}),/server_id/);

const gateway=fs.readFileSync('worker/src/magnanimous-tool-gateway.js','utf8');
const api=fs.readFileSync('worker/src/magnanimous-api-contract-intelligence.js','utf8');
const dev=fs.readFileSync('worker/src/magnanimous-dev-agent.js','utf8');
const tracing=fs.readFileSync('worker/src/magnanimous-tool-traces.js','utf8');
const parallel=fs.readFileSync('worker/src/magnanimous-parallel-supervisor.js','utf8');
for(const token of ['magnanimous_tool_execution_spans','latency_ms','error_kind','response_bytes','created_at'])assert.ok(tracing.includes(token));
assert.ok(tracing.includes('retention_days:30'));
assert.ok(!tracing.includes('JSON.stringify(input.arguments)'));
assert.ok(gateway.includes("'/api/magnanimous/tools/traces'"));
assert.ok(gateway.includes('if(!isManager(user))'));
assert.ok(gateway.includes('recordMagnanimousToolSpan'));
assert.ok(gateway.includes("detail:errorKind"),'Never persist provider error payload in the existing audit');
assert.ok(api.includes("'/api/magnanimous/api-contract/mcp-preview'"));
assert.ok(api.includes("'/api/magnanimous/api-contract/mcp-stage'"));
assert.ok(api.includes('requirePlatformOwner(request,env)'));
assert.ok(api.includes("status:'draft'")&&api.includes('acknowledge_draft_only'));
assert.ok(dev.includes("'/api/magnanimous/dev-agent/parallel/plan'"));
assert.ok(dev.includes('normalizeRepo(body.repo,env)'));
assert.ok(parallel.includes('actions_executed:0'));
console.log('Magnanimous Orca completion lock passed: supervised parallel planning, non-executable OpenAPI to MCP drafting and private MCP execution traces.');

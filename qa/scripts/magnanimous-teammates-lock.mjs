import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHmac} from 'node:crypto';
import fs from 'node:fs';
import {handleMagnanimousTeammates,TEAMMATE_TEMPLATES} from '../../worker/src/magnanimous-teammate-runtime.js';
import {runTeammateTurn,teammateHistory,ensureTeammateSchema} from '../../worker/src/magnanimous-teammate-core.js';
import {handleMagnanimousRoutineStudio,scheduledMagnanimousRoutines} from '../../worker/src/magnanimous-skill-routine-runtime.js';

// Real SQLite exercises SQL constraints and compare-and-swap claims, not string mocks.
const sqlite=new DatabaseSync(':memory:');
function statement(sql,params=[]){return{
  bind(...values){return statement(sql,values);},
  async run(){const result=sqlite.prepare(sql).run(...params);return{success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};},
  async first(){return sqlite.prepare(sql).get(...params)||null;},
  async all(){return{results:sqlite.prepare(sql).all(...params)};}
};}
const DB={prepare:statement};
sqlite.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,tenant_id TEXT,name TEXT,email TEXT,role TEXT,active INTEGER);
 CREATE TABLE tenants(id TEXT PRIMARY KEY,slug TEXT,owner_user_id TEXT);
 CREATE TABLE auth_config(key TEXT PRIMARY KEY,value TEXT);
 CREATE TABLE bootstrap_secrets(credential_key TEXT,ciphertext_b64 TEXT);
 INSERT INTO tenants VALUES('tenant-a','owner','alice'),('tenant-b','other','eve');
 INSERT INTO users VALUES('alice','tenant-a','Alice','owner@example.test','owner',1),
 ('bob','tenant-a','Bob','bob@example.test','member',1),('eve','tenant-b','Eve','eve@example.test','owner',1);`);
sqlite.exec(fs.readFileSync(new URL('../../worker/migrations/0093_magnanimous_teammates.sql',import.meta.url),'utf8'));
let inferenceCalls=0,seenPrompt='';
const env={DB,SESSION_SECRET:'test-only-secret',ADMIN_EMAIL:'owner@example.test',AI:{async run(_model,input){inferenceCalls++;seenPrompt=JSON.stringify(input);return{response:'Verified local test answer; no external action.'};}}};
const user={id:'alice',tenant_id:'tenant-a',role:'owner',email:'owner@example.test'};
function request(path,method='GET',body,who='alice'){
 const role=who==='bob'?'member':'owner',tenant=who==='eve'?'tenant-b':'tenant-a';
 const payload=`${who}|${tenant}|${role}|${Math.floor(Date.now()/1000)+600}`;
 const signature=createHmac('sha256',env.SESSION_SECRET).update(payload).digest('hex');
 return new Request('https://iammagnanimousway.com'+path,{method,headers:{'content-type':'application/json',...(who?{authorization:`Bearer ${payload}|${signature}`}:{})},body:body===undefined||['GET','HEAD'].includes(method)?undefined:JSON.stringify(body)});
}
const base='/api/magnanimous/teammates';
let calls=0,prompt='';
const dependencies={infer:async(_env,value)=>{calls++;prompt=value;return'Completed draft. No external actions.';},research:async()=>[{title:'Test evidence',url:'https://example.com/source',description:'Fresh verified input',source:'test-live-search'}]};
async function api(path,method='GET',body,who='alice',deps=dependencies){const response=await handleMagnanimousTeammates(request(path,method,body,who),env,deps);return{status:response.status,...await response.json()};}
assert.equal(await handleMagnanimousTeammates(request('/api/unrelated'),env),null);
assert.equal((await api(base,'GET',undefined,'')).status,401);
assert.equal((await api(base,'POST',{name:'Missing role'})).status,400);
assert.equal(TEAMMATE_TEMPLATES.length,10);
const created=await api(base,'POST',{name:'Researcher',role:'Research',instructions:'PRIVATE_ROLE_A'});
assert.equal(created.status,201);const a=created.teammate.id;
const b=(await api(base,'POST',{name:'Reviewer',role:'Review'})).teammate.id;
assert.equal((await api(base)).teammates.length,2);
for(const outsider of ['bob','eve']){
 assert.equal((await api(base,'GET',undefined,outsider)).teammates.length,0);
 for(const suffix of ['', '/turns','/memories','/skill'])assert.equal((await api(`${base}/${a}${suffix}`,suffix?'POST':'GET',{message:'steal',request_key:'out-of-scope'},outsider)).status,404);
}
await api(`${base}/${a}/memories`,'POST',{key:'tone',value:'PRIVATE_MEMORY_A'});
assert.equal((await api(`${base}/${b}`)).memories.length,0);
const one=await api(`${base}/${a}/turns`,'POST',{message:'Draft a plan',request_key:'request-one'});
assert.equal(one.turn.status,'completed');assert.match(prompt,/PRIVATE_MEMORY_A/);assert.match(prompt,/PRIVATE_ROLE_A/);
const replay=await api(`${base}/${a}/turns`,'POST',{message:'Draft a plan',request_key:'request-one'});
assert.equal(replay.replayed,true);assert.equal(replay.turn.id,one.turn.id);assert.equal(calls,1);
assert.equal((await api(`${base}/${a}/turns`,'POST',{message:'Different input',request_key:'request-one'})).status,409);
const transfer=await api(`${base}/${b}/turns`,'POST',{message:'Review this result',source_turn_id:one.turn.id,request_key:'handoff-one'});
assert.equal(transfer.turn.status,'completed');assert.equal(transfer.turn.source_turn_id,one.turn.id);
assert.match(prompt,/Completed draft/);assert.doesNotMatch(prompt,/PRIVATE_MEMORY_A|PRIVATE_ROLE_A/);
const eve=(await api(base,'POST',{name:'Other',role:'Other tenant'},'eve')).teammate.id;
assert.equal((await api(`${base}/${eve}/turns`,'POST',{message:'Read Alice',source_turn_id:one.turn.id,request_key:'cross-tenant'},'eve')).status,404);
await api(`${base}/${a}`,'PATCH',{status:'paused'});
assert.equal((await api(`${base}/${a}/turns`,'POST',{message:'Do work',request_key:'paused-work'})).status,409);
await api(`${base}/${a}`,'PATCH',{status:'active'});

// Concurrency is serialized for one teammate; separate teammates remain independent.
let release;
const slow=runTeammateTurn(env,user,a,{message:'Long task',request_key:'slow-one'},{infer:()=>new Promise(resolve=>{release=resolve;})});
while(!release)await new Promise(resolve=>setImmediate(resolve));
assert.equal((await api(`${base}/${a}/turns`,'POST',{message:'Second task',request_key:'slow-two'})).status,409);
assert.equal((await api(`${base}/${a}`,'PATCH',{instructions:'replace mid-task'})).status,409);
assert.equal((await api(`${base}/${b}/turns`,'POST',{message:'Parallel independent task',request_key:'parallel-b'})).turn.status,'completed');
release('Long task complete');await slow;
assert.equal((await api(`${base}/${a}`)).teammate.busy,false);

const research=await api(`${base}/${a}/turns`,'POST',{message:'Research a fact',mode:'research',request_key:'research-one'});
assert.equal(research.turn.sources[0].url,'https://example.com/source');assert.match(prompt,/Fresh verified input/);
const none=await api(`${base}/${a}/turns`,'POST',{message:'Research a missing fact',mode:'research',request_key:'research-none'},'alice',{...dependencies,research:async()=>[]});
assert.equal(none.status,503);assert.equal(none.code,'RESEARCH_SOURCES_UNAVAILABLE');
assert.equal((await api(`${base}/${a}`)).turns.at(-1).status,'failed');
const broken=await api(`${base}/${a}/turns`,'POST',{message:'Provider error',request_key:'error-one'},'alice',{infer:async()=>{throw new Error('DO_NOT_EXPOSE_INTERNAL_SECRET');}});
assert.equal(broken.status,500);assert.doesNotMatch(JSON.stringify(broken),/DO_NOT_EXPOSE_INTERNAL_SECRET/);
assert.equal((await api(`${base}/${a}`)).teammate.busy,false);
const before=calls;
assert.equal((await api(`${base}/${a}/turns`,'POST',{message:'Provider error',request_key:'error-one'})).turn.status,'failed');
assert.equal(calls,before,'failed requests cannot auto-repeat inference');

const memory=(await api(`${base}/${a}`)).memories[0];
assert.equal((await api(`${base}/${a}/memories/${memory.id}`,'DELETE',undefined,'eve')).status,404);
await api(`${base}/${a}/memories/${memory.id}`,'DELETE');
assert.equal((await api(`${base}/${a}`)).memories.length,0);

// Use the real Magnanimous provider entrypoint, with an in-process AI binding.
// A customer-supplied premium provider/approval/tool flag is never forwarded.
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw new Error('Unexpected network call during isolated execution');};
try{
 const real=await api(`${base}/${a}/turns`,'POST',{message:'Native inference test',request_key:'native-inference',provider:'openai',allow_metered_accelerator:true,confirm:true},'alice',{});
 assert.equal(real.turn?.status,'completed',JSON.stringify(real));assert.equal(inferenceCalls,1);
 assert.match(seenPrompt,/COMPUTE-ONLY EXECUTION/);
 const skill=await api(`${base}/${a}/skill`,'POST',{prompt:'Make a repeatable brief'});
 assert.equal(skill.status,201,JSON.stringify(skill));assert.equal(skill.skill.steps[0].type,'teammate.prompt');
 const bobTeammate=(await api(base,'POST',{name:'Bob private',role:'Private'},'bob')).teammate.id;
 assert.equal((await api(`${base}/${bobTeammate}/skill`,'POST',{prompt:'Try to schedule'},'bob')).status,403);
 const routineResponse=await handleMagnanimousRoutineStudio(request('/api/magnanimous/routine-studio/routines','POST',{skill_id:skill.skill.id,interval_minutes:60}),env);
 const routine=await routineResponse.json();assert.equal(routineResponse.status,201);
 sqlite.prepare('UPDATE magnanimous_routines SET next_run_at=0 WHERE id=?').run(routine.routine.id);
 const schedules=await Promise.all([scheduledMagnanimousRoutines(env),scheduledMagnanimousRoutines(env)]);
 assert.equal(schedules.flatMap(s=>s.events).filter(e=>e.routine_id===routine.routine.id).length,1,'concurrent scheduler ticks claim a due routine once');
 assert.equal(inferenceCalls,2);assert.equal((await teammateHistory(env,user,a)).at(-1).status,'completed');
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM magnanimous_routine_runs').get().n,1);
}finally{globalThis.fetch=originalFetch;}

await ensureTeammateSchema(env); // migrations/runtime schema are compatible and idempotent
const ops=fs.readFileSync(new URL('../../worker/src/operations-entrypoint.js',import.meta.url),'utf8');
assert.match(ops,/handleMagnanimousTeammates\(request,env\)/);
const page=fs.readFileSync(new URL('../../frontend/app/teammates/page.tsx',import.meta.url),'utf8');
assert.match(page,/returnTo=%2Fteammates/);assert.match(page,/No schedule was created/);
assert.doesNotMatch(page,/workers\.dev|dangerouslySetInnerHTML/);
sqlite.close();
console.log('Magnanimous teammates PASS: authenticated persistence, user/tenant isolation, memory, explicit handoff, research receipts, idempotency, concurrency, failure honesty, free-first inference and scheduled execution.');

import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleSocialScheduling, scheduledSocialPublishing } from '../../worker/src/social-scheduling-runtime.js';
import { ensureSocialPublishingSchema, isPublicSocialMediaUrl, socialProviderReadiness } from '../../worker/src/social-publishing-runtime.js';

const originalNow=Date.now;
const originalFetch=globalThis.fetch;
const clock={value:1_800_000_000_000};
const secret='social-scheduler-test-secret-not-for-production';
Date.now=()=>clock.value;

class D1Mock{
 constructor(){this.sqlite=new DatabaseSync(':memory:');}
 exec(sql){this.sqlite.exec(sql);}
 prepare(sql){
  const db=this.sqlite;
  let values=[];
  const statement={
   bind(...args){values=args;return this;},
   async run(){const result=db.prepare(sql).run(...values);return{meta:{changes:Number(result.changes||0)}};},
   async first(){return db.prepare(sql).get(...values)||null;},
   async all(){return{results:db.prepare(sql).all(...values)};}
  };
  return statement;
 }
 close(){this.sqlite.close();}
}

function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function makeToken(userId,tenantId,role){
 const expires=Math.floor(clock.value/1000)+86400;
 const value=`${userId}|${tenantId}|${role}|${expires}`;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
 return value+'|'+signature;
}
async function json(response){return await response.json();}
function check(condition,message){assert.ok(condition,message);}
const db=new D1Mock();
const env={DB:db,SESSION_SECRET:secret,LINKEDIN_VERSION:'202608'};
let ownerToken='',memberToken='',otherTenantToken='';
let fetchCount=0;

try{
 db.exec(`CREATE TABLE users(id TEXT NOT NULL,tenant_id TEXT NOT NULL,name TEXT,email TEXT,role TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(id,tenant_id));`);
 db.exec(`CREATE TABLE auth_config(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 db.sqlite.prepare('INSERT INTO users(id,tenant_id,name,email,role,active) VALUES(?,?,?,?,?,1)').run('owner-a','tenant-a','Owner A','owner-a@example.test','owner');
 db.sqlite.prepare('INSERT INTO users(id,tenant_id,name,email,role,active) VALUES(?,?,?,?,?,1)').run('member-a','tenant-a','Member A','member-a@example.test','member');
 db.sqlite.prepare('INSERT INTO users(id,tenant_id,name,email,role,active) VALUES(?,?,?,?,?,1)').run('owner-b','tenant-b','Owner B','owner-b@example.test','owner');
 ownerToken=await makeToken('owner-a','tenant-a','owner');
 memberToken=await makeToken('member-a','tenant-a','member');
 otherTenantToken=await makeToken('owner-b','tenant-b','owner');

 await ensureSocialPublishingSchema(env);
 const ts=Math.floor(clock.value/1000);
 await env.DB.prepare(`INSERT INTO social_connections(tenant_id,provider,external_id,display_name,access_token,refresh_token,expires_at,scope,metadata_json,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind('tenant-a','linkedin','person-a','Owner A','test-access-token','',ts+86400,'w_member_social','{}',ts,ts).run();

 const notReady=await socialProviderReadiness(env,'tenant-a','linkedin');
 assert.equal(notReady.connected,true);
 assert.equal(notReady.configured,false);
 const missingCredentials=await handleSocialScheduling(new Request('https://platform.example/api/social-schedule',{method:'POST',headers:{Authorization:`Bearer ${ownerToken}`,'Content-Type':'application/json'},body:JSON.stringify({
  provider:'linkedin',scheduled_at:new Date(clock.value+30*60*1000).toISOString(),timezone:'UTC',text:'Not ready yet',idempotency_key:'not-ready'
 })}),env);
 assert.equal(missingCredentials.status,409);
 assert.equal((await json(missingCredentials)).code,'SOCIAL_PROVIDER_NOT_CONFIGURED');

 for(const [key,value] of [['LINKEDIN_CLIENT_ID','test-client-id'],['LINKEDIN_CLIENT_SECRET','test-client-secret']]){
  await env.DB.prepare('INSERT INTO social_platform_credentials(credential_key,encrypted_value,updated_at,updated_by) VALUES(?,?,?,?)').bind(key,value,ts,'owner-a').run();
 }
 const ready=await socialProviderReadiness(env,'tenant-a','linkedin');
 assert.equal(ready.connected,true);
 assert.equal(ready.configured,true);
 assert.equal('client_secret' in ready,false,'Readiness must never expose credentials');

 async function requestAs(token,path,method='GET',body=undefined){
  const headers={Authorization:`Bearer ${token}`};
  const init={method,headers};
  if(body!==undefined){headers['Content-Type']='application/json';init.body=JSON.stringify(body);}
  return handleSocialScheduling(new Request('https://platform.example'+path,init),env);
 }
 async function createDraft(key,text='Magnanimous social schedule test',minutesAhead=20,token=ownerToken){
  const body={provider:'linkedin',scheduled_at:new Date(clock.value+minutesAhead*60*1000).toISOString(),timezone:'UTC',text,idempotency_key:key};
  const response=await requestAs(token,'/api/social-schedule','POST',body);
  return{response,data:await json(response),body};
 }
 async function approve(id,token=ownerToken){
  const response=await requestAs(token,`/api/social-schedule/${id}/approve`,'POST',{confirm:true});
  return{response,data:await json(response)};
 }
 async function status(id){
  return db.sqlite.prepare('SELECT status,payload_json,scheduled_at,approval_hash,attempts FROM social_scheduled_posts WHERE id=?').get(id);
 }

 // Invalid timezone/offset combinations fail closed before a draft is stored.
 const mismatch=await requestAs(ownerToken,'/api/social-schedule','POST',{
  provider:'linkedin',scheduled_at:new Date(clock.value+30*60*1000).toISOString().replace('Z','+08:00'),
  timezone:'UTC',text:'Wrong offset',idempotency_key:'wrong-offset'
 });
 assert.equal(mismatch.status,400);

 // Idempotency is exact: same content returns the same row; changed content conflicts.
 const first=await createDraft('idempotency-exact','Exact post');
 assert.equal(first.response.status,201);
 const duplicate=await requestAs(ownerToken,'/api/social-schedule','POST',first.body);
 assert.equal(duplicate.status,200);
 assert.equal((await json(duplicate)).idempotent,true);
 const conflict=await requestAs(ownerToken,'/api/social-schedule','POST',{...first.body,text:'Changed content'});
 assert.equal(conflict.status,409);
 assert.equal((await json(conflict)).code,'IDEMPOTENCY_KEY_CONFLICT');

 // A different tenant cannot list or approve the first tenant's draft.
 const otherList=await requestAs(otherTenantToken,'/api/social-schedule?limit=80');
 assert.equal((await json(otherList)).items.length,0);
 const crossTenantApprove=await approve(first.data.item.id,otherTenantToken);
 assert.equal(crossTenantApprove.response.status,404);

 // A normal member cannot approve; owner/admin approval is required.
 const memberApprove=await approve(first.data.item.id,memberToken);
 assert.equal(memberApprove.response.status,403);

 // Cancellation is available before execution and invalidates approval.
 const cancelledDraft=await createDraft('cancel-before-publish','Cancel me');
 const cancelResponse=await requestAs(ownerToken,`/api/social-schedule/${cancelledDraft.data.item.id}/cancel`,'POST',{});
 assert.equal(cancelResponse.status,200);
 assert.equal((await status(cancelledDraft.data.item.id)).status,'cancelled');
 const approveCancelled=await approve(cancelledDraft.data.item.id);
 assert.equal(approveCancelled.response.status,409);

 // Exact approval snapshot is checked again at execution; tampering fails without a provider write.
 const tampered=await createDraft('approval-snapshot','Original approved text');
 const tamperedApproval=await approve(tampered.data.item.id);
 assert.equal(tamperedApproval.response.status,200);
 const tamperedRow=await status(tampered.data.item.id);
 const tamperedPayload=JSON.parse(tamperedRow.payload_json);
 tamperedPayload.text='Changed after approval';
 db.sqlite.prepare('UPDATE social_scheduled_posts SET payload_json=? WHERE id=?').run(JSON.stringify(tamperedPayload),tampered.data.item.id);
 clock.value=tamperedRow.scheduled_at*1000+60_000;
 globalThis.fetch=async()=>{fetchCount++;return new Response(null,{status:201,headers:{'x-restli-id':'urn:li:share:unexpected'}})};
 const tamperResult=await scheduledSocialPublishing(env);
 assert.equal(tamperResult.failed,1);
 assert.equal((await status(tampered.data.item.id)).status,'failed');
 assert.equal(fetchCount,0);

 // Successful publishing is claimed once; a duplicate/late cron tick does not duplicate the provider write.
 const successDraft=await createDraft('publish-once','Publish once');
 assert.equal(successDraft.response.status,201);
 const successApproval=await approve(successDraft.data.item.id);
 assert.equal(successApproval.response.status,200);
 clock.value=successDraft.data.item.scheduled_at*1000+60_000;
 globalThis.fetch=async()=>{fetchCount++;return new Response(null,{status:201,headers:{'x-restli-id':'urn:li:share:success'}})};
 const successRun=await scheduledSocialPublishing(env);
 assert.equal(successRun.published,1);
 assert.equal((await status(successDraft.data.item.id)).status,'published');
 const afterSuccess=fetchCount;
 const duplicateCron=await scheduledSocialPublishing(env);
 assert.equal(duplicateCron.published,0);
 assert.equal(fetchCount,afterSuccess);

 // A network failure after the provider write starts is outcome-unknown and is never retried automatically.
 const uncertainDraft=await createDraft('uncertain-outcome','May have reached provider');
 await approve(uncertainDraft.data.item.id);
 clock.value=uncertainDraft.data.item.scheduled_at*1000+60_000;
 globalThis.fetch=async()=>{fetchCount++;throw new Error('simulated provider network timeout')};
 const beforeUncertain=fetchCount;
 await scheduledSocialPublishing(env);
 assert.equal((await status(uncertainDraft.data.item.id)).status,'outcome_unknown');
 const afterUncertain=fetchCount;
 await scheduledSocialPublishing(env);
 assert.equal(fetchCount,afterUncertain);
 assert.equal(afterUncertain,beforeUncertain+1);

 // A definitive provider 429 is a failed preflight, not a successful post or an ambiguous retry.
 const limitedDraft=await createDraft('provider-throttle','Rate limited post');
 await approve(limitedDraft.data.item.id);
 clock.value=limitedDraft.data.item.scheduled_at*1000+60_000;
 globalThis.fetch=async()=>{fetchCount++;return new Response(JSON.stringify({message:'rate limited'}),{status:429,headers:{'Content-Type':'application/json'}})};
 await scheduledSocialPublishing(env);
 assert.equal((await status(limitedDraft.data.item.id)).status,'failed');

 // An expired LinkedIn token fails before the provider write and is never reported as published.
 db.sqlite.prepare('UPDATE social_connections SET expires_at=?,refresh_token=? WHERE tenant_id=? AND provider=?').run(Math.floor(clock.value/1000)-10,'','tenant-a','linkedin');
 const expiredDraft=await createDraft('expired-token','Expired token post');
 await approve(expiredDraft.data.item.id);
 clock.value=expiredDraft.data.item.scheduled_at*1000+60_000;
 const beforeExpired=fetchCount;
 globalThis.fetch=async()=>{fetchCount++;return new Response(null,{status:201,headers:{'x-restli-id':'urn:li:share:should-not-exist'}})};
 await scheduledSocialPublishing(env);
 assert.equal((await status(expiredDraft.data.item.id)).status,'failed');
 assert.equal(fetchCount,beforeExpired);

 // Public media validation rejects insecure, private, credential-bearing and local destinations.
 assert.equal(isPublicSocialMediaUrl('https://cdn.example.com/video.mp4'),true);
 for(const url of [
  'http://cdn.example.com/video.mp4',
  'https://127.0.0.1/video.mp4',
  'https://10.0.0.8/video.mp4',
  'https://localhost/video.mp4',
  'https://user:pass@cdn.example.com/video.mp4',
  'https://[::1]/video.mp4',
  'https://metadata.google.internal/video.mp4'
 ])assert.equal(isPublicSocialMediaUrl(url),false,`Unsafe media URL was accepted: ${url}`);

 console.log('Magnanimous native social scheduling runtime tests passed: provider readiness, tenant isolation, role gate, exact idempotency, cancellation, approval binding, DST-compatible timestamp validation, duplicate cron protection, ambiguous outcomes, provider throttling, expired token preflight and media URL safety.');
}finally{
 Date.now=originalNow;
 globalThis.fetch=originalFetch;
 db.close();
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { claimStripeWebhookEvent, completeStripeWebhookEvent, ensureStripeWebhookEventClaims, failStripeWebhookEvent } from '../../worker/src/stripe-webhook-idempotency.js';

class FakeD1 {
  constructor(){this.rows=new Map();}
  prepare(sql){const db=this;return{bind(...args){return{first:async()=>db.first(sql,args),run:async()=>db.run(sql,args)}}}}
  async first(sql,args){
    if(sql.startsWith('INSERT INTO stripe_webhook_event_claims')){
      const [eventId,eventType,processor,claimedAt,claimToken,createdAt,updatedAt,cutoff]=args;
      const current=this.rows.get(eventId);
      if(!current){this.rows.set(eventId,{event_id:eventId,event_type:eventType,processor,status:'processing',claimed_at:claimedAt,claim_token:claimToken,attempt_count:1,processed_at:null,last_error:'',created_at:createdAt,updated_at:updatedAt});return{event_id:eventId}}
      const canReclaim=current.processor===processor&&current.status!=='processed'&&(current.status!=='processing'||current.claimed_at<=cutoff);
      if(!canReclaim)return null;
      Object.assign(current,{event_type:eventType,status:'processing',claimed_at:claimedAt,claim_token:claimToken,attempt_count:current.attempt_count+1,processed_at:null,last_error:'',updated_at:updatedAt});return{event_id:eventId};
    }
    if(sql.startsWith('SELECT status,processor,claimed_at FROM stripe_webhook_event_claims')){const row=this.rows.get(args[0]);return row?{status:row.status,processor:row.processor,claimed_at:row.claimed_at}:null}
    throw new Error('Unexpected FakeD1 first query: '+sql);
  }
  async run(sql,args){
    if(sql.startsWith('CREATE TABLE')||sql.startsWith('CREATE INDEX'))return{meta:{changes:0}};
    if(sql.startsWith("UPDATE stripe_webhook_event_claims SET status='processed'")){
      const [processedAt,updatedAt,eventId,processor,claimToken]=args,row=this.rows.get(eventId);
      if(!row||row.processor!==processor||row.status!=='processing'||row.claim_token!==claimToken)return{meta:{changes:0}};
      Object.assign(row,{status:'processed',processed_at:processedAt,claimed_at:0,claim_token:'',last_error:'',updated_at:updatedAt});return{meta:{changes:1}};
    }
    if(sql.startsWith("UPDATE stripe_webhook_event_claims SET status='failed'")){
      const [lastError,updatedAt,eventId,processor,claimToken]=args,row=this.rows.get(eventId);
      if(!row||row.processor!==processor||row.status!=='processing'||row.claim_token!==claimToken)return{meta:{changes:0}};
      Object.assign(row,{status:'failed',claimed_at:0,claim_token:'',last_error:lastError,updated_at:updatedAt});return{meta:{changes:1}};
    }
    throw new Error('Unexpected FakeD1 run query: '+sql);
  }
}

test('only one concurrent delivery can claim an event',async()=>{
  const env={DB:new FakeD1()};await ensureStripeWebhookEventClaims(env);
  const results=await Promise.all([
    claimStripeWebhookEvent(env,{eventId:'evt_race',eventType:'checkout.session.completed',processor:'billing',nowSeconds:1000}),
    claimStripeWebhookEvent(env,{eventId:'evt_race',eventType:'checkout.session.completed',processor:'billing',nowSeconds:1000})
  ]);
  assert.equal(results.filter(result=>result.claimed).length,1);assert.equal(results.filter(result=>result.busy).length,1);
});

test('processed events are duplicates and are never reclaimed',async()=>{
  const env={DB:new FakeD1()};
  const claim=await claimStripeWebhookEvent(env,{eventId:'evt_done',eventType:'invoice.paid',processor:'billing',nowSeconds:1100});
  assert.equal(claim.claimed,true);
  await completeStripeWebhookEvent(env,{eventId:'evt_done',processor:'billing',claimToken:claim.claimToken,nowSeconds:1101});
  const duplicate=await claimStripeWebhookEvent(env,{eventId:'evt_done',eventType:'invoice.paid',processor:'billing',nowSeconds:2000});assert.equal(duplicate.duplicate,true);
});

test('failed claims can be retried and attempt counts remain auditable',async()=>{
  const env={DB:new FakeD1()};
  const first=await claimStripeWebhookEvent(env,{eventId:'evt_retry',eventType:'checkout.session.completed',processor:'billing',nowSeconds:1200});
  assert.equal(await failStripeWebhookEvent(env,{eventId:'evt_retry',processor:'billing',claimToken:first.claimToken,errorCode:'NetworkError',nowSeconds:1201}),true);
  const second=await claimStripeWebhookEvent(env,{eventId:'evt_retry',eventType:'checkout.session.completed',processor:'billing',nowSeconds:1202});
  assert.equal(second.claimed,true);assert.equal(env.DB.rows.get('evt_retry').attempt_count,2);
});

test('expired leases can be reclaimed but stale owners cannot complete them',async()=>{
  const env={DB:new FakeD1()};
  const first=await claimStripeWebhookEvent(env,{eventId:'evt_lease',eventType:'customer.subscription.updated',processor:'billing',nowSeconds:1000,leaseSeconds:300});
  const second=await claimStripeWebhookEvent(env,{eventId:'evt_lease',eventType:'customer.subscription.updated',processor:'billing',nowSeconds:1301,leaseSeconds:300});
  assert.equal(second.claimed,true);
  await assert.rejects(()=>completeStripeWebhookEvent(env,{eventId:'evt_lease',processor:'billing',claimToken:first.claimToken,nowSeconds:1302}),/ownership was lost/);
  await completeStripeWebhookEvent(env,{eventId:'evt_lease',processor:'billing',claimToken:second.claimToken,nowSeconds:1303});
});

test('a different webhook processor cannot take over an active claim',async()=>{
  const env={DB:new FakeD1()};
  const first=await claimStripeWebhookEvent(env,{eventId:'evt_scope',eventType:'customer.subscription.updated',processor:'business-plan',nowSeconds:1400});
  const other=await claimStripeWebhookEvent(env,{eventId:'evt_scope',eventType:'customer.subscription.updated',processor:'billing',nowSeconds:1401});
  assert.equal(first.claimed,true);assert.equal(other.busy,true);assert.equal(other.reason,'processor_mismatch');
});

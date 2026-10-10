import {currentUser} from './integrations.js';

// billing_subscriptions.plan remains the precise commercial plan. tenants.plan is
// an older compatibility field still read by a handful of feature gates that only
// understand "business". Annual Business therefore projects to "business" there
// without losing its true `scale` identity in billing_subscriptions.
export async function applyBillingPlanCompatibility(request,response,env){
  if(!response||!env?.DB)return response;
  const path=new URL(request.url).pathname;
  if(!['/api/billing/status','/api/billing/entitlements','/api/billing/confirm'].includes(path))return response;
  const type=String(response.headers.get('content-type')||'');
  if(!type.includes('application/json')||!response.ok)return response;
  let data;try{data=await response.clone().json()}catch{return response}
  if(String(data?.plan||'').toLowerCase()!=='scale')return response;
  const user=await currentUser(request,env).catch(()=>null);
  if(user?.tenant_id){
    await env.DB.prepare("UPDATE tenants SET plan='business' WHERE id=?").bind(String(user.tenant_id)).run().catch(()=>{});
  }
  return response;
}

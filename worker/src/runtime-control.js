import { verifyGitHubActionsOidcWorker } from './github-actions-oidc.js';
import { handleKidsDriveMedia } from './kids-media-runtime.js';
import { getIntegrationRuntimeEnv } from './platform-credentials.js';

function runtimeRevision(env){return String(env?.MAGNANIMOUS_DEPLOY_REVISION||'').trim();}
function noStore(){return {'cache-control':'no-store'};}
function json(data,status=200,headers={}){return Response.json(data,{status,headers:{...noStore(),...headers}});}

export async function handleMagnanimousRuntimeControl(request,env){
  const url=new URL(request.url);
  const path=url.pathname;

  // Kids Drive/media is a Cloudflare/D1-owned free-first runtime. Route it here
  // before the generic standalone API proxy so an expired external runtime can
  // never break owner OAuth or audience streaming.
  if(path.startsWith('/api/kids-')){
    const kidsEnv=await getIntegrationRuntimeEnv(env);
    const response=await handleKidsDriveMedia(request,kidsEnv);
    // Safe diagnostic only: report whether the Worker has the required OAuth
    // configuration without exposing IDs, secrets, tokens, or owner data.
    if(path==='/api/kids-media/status'&&request.method==='GET'&&response){
      const data=await response.clone().json().catch(()=>null);
      if(data&&typeof data==='object')return json({...data,oauth_configured:Boolean(kidsEnv?.GOOGLE_CLIENT_ID&&kidsEnv?.GOOGLE_CLIENT_SECRET)},response.status);
    }
    return response;
  }

  if(path==='/__magnanimous_runtime/health'||path==='/__magnanimous_runtime/capabilities'){
    if(request.method!=='GET'&&request.method!=='HEAD')return json({detail:'Method not allowed.'},405,{allow:'GET, HEAD'});
    const payload={
      status:'ok',
      identity:'Magnanimous AI',
      runtime:'cloudflare-worker',
      database:'cloudflare-d1',
      free_first:true,
      paid_runtime_required:false,
      deploy_revision:runtimeRevision(env)
    };
    return request.method==='HEAD'?new Response(null,{status:200,headers:noStore()}):json(payload);
  }
  if(path!=='/__magnanimous_runtime/smoke/tenant')return null;
  if(request.method!=='POST')return json({detail:'Method not allowed.'},405,{allow:'POST'});
  const authorization=String(request.headers.get('authorization')||'');
  const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
  if(!token)return json({detail:'Signed GitHub Actions identity required.'},401);
  try{
    const source=await verifyGitHubActionsOidcWorker(token,{
      audience:'magnanimous-deploy-smoke',
      repository:'IAMGodmatters/IAMMagnanimousway.js',
      ref:'refs/heads/main',
      workflowFile:'.github/workflows/deploy.yml',
      allowedEvents:['push','workflow_dispatch']
    });
    const payload=await request.json();
    const revision=runtimeRevision(env);
    const sourceSha=String(source.sha||'').trim();
    const workflowSha=String(payload?.workflow_sha||'').trim();
    const requestedRuntimeSha=String(payload?.runtime_sha||'').trim();
    const fullSha=/^[0-9a-f]{40}$/i;
    if(!fullSha.test(revision)||!fullSha.test(sourceSha)||workflowSha!==sourceSha||requestedRuntimeSha!==revision){
      throw new Error('Deployment smoke control revision binding mismatch.');
    }
    const tenantId=String(payload?.tenant_id||'').trim();
    const action=String(payload?.action||'').trim().toLowerCase();
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId))throw new Error('Invalid deployment smoke tenant identifier.');
    if(!env?.DB)throw new Error('Production D1 binding unavailable.');
    const tenant=await env.DB.prepare('SELECT id,name FROM tenants WHERE id=? LIMIT 1').bind(tenantId).first();
    const smokeUser=await env.DB.prepare("SELECT id,email,name FROM users WHERE tenant_id=? AND lower(email) LIKE 'deploy-smoke-%@example.com' AND name='Deployment Smoke Test' LIMIT 1").bind(tenantId).first();
    if(!tenant?.id||tenant?.name!=='Deployment Smoke Test'||!smokeUser?.id)return json({detail:'Disposable deployment smoke tenant not found.'},404);
    if(action==='grant_agency'){
      const now=Math.floor(Date.now()/1000);
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO billing_subscriptions(tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at)
VALUES(?,?,?,?,?,?,?,?)
ON CONFLICT(tenant_id) DO UPDATE SET plan=excluded.plan,status=excluded.status,updated_at=excluded.updated_at`)
.bind(tenantId,'agency',null,null,'active',null,now,now),
        env.DB.prepare("UPDATE tenants SET plan='agency' WHERE id=?").bind(tenantId)
      ]);
      return json({ok:true,action,tenant_id:tenantId,plan:'agency',source_sha:source.sha,runtime:'worker-d1'});
    }
    if(action==='cleanup'){
      return json({ok:true,action,tenant_id:tenantId,source_sha:source.sha,runtime:'worker-d1',cleanup:'delegated-to-deploy-d1-cleanup'});
    }
    return json({detail:'Unsupported deployment smoke action.'},400);
  }catch(error){
    console.error('Magnanimous Worker deployment smoke control failed',String(error?.message||error));
    return json({detail:'Deployment smoke authorization or control failed.'},403);
  }
}

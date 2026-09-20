import { verifyGitHubActionsOidcWorker } from './github-actions-oidc.js';
import { rewrapPlatformCredentialsForMigration } from './platform-credentials.js';

const PATH='/api/internal/migration/rewrap-platform-credentials';

export async function handleCredentialVaultMigration(request,env){
  const url=new URL(request.url);
  if(url.pathname!==PATH)return null;
  if(request.method!=='POST')return Response.json({detail:'Method not allowed.'},{status:405,headers:{allow:'POST','cache-control':'no-store'}});

  const authorization=String(request.headers.get('authorization')||'');
  const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
  if(!token)return Response.json({detail:'Signed GitHub Actions identity required.'},{status:401,headers:{'cache-control':'no-store'}});

  try{
    const source=await verifyGitHubActionsOidcWorker(token,{
      audience:'magnanimous-credential-rewrap',
      repository:'IAMGodmatters/IAMMagnanimousway.js',
      ref:'refs/heads/main',
      workflowFile:'.github/workflows/magnanimous-runtime-secrets-stage.yml'
    });
    const body=await request.json().catch(()=>({}));
    const targetKey=String(body?.target_key||'');
    if(targetKey.length<32||targetKey.length>512)throw new Error('Target migration key is invalid.');
    const result=await rewrapPlatformCredentialsForMigration(env,targetKey);
    return Response.json({
      ok:true,
      count:result.rows.length,
      rows:result.rows,
      source:{repository:source.repository,ref:source.ref,sha:source.sha}
    },{headers:{'cache-control':'no-store'}});
  }catch{
    return Response.json({detail:'Credential vault migration authorization or rewrap failed.'},{status:403,headers:{'cache-control':'no-store'}});
  }
}

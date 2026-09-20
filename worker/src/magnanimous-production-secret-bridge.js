import { PLATFORM_CREDENTIAL_GROUPS } from './platform-credentials.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';

const encoder=new TextEncoder();
const ISSUER='https://token.actions.githubusercontent.com';
const JWKS_URL='https://token.actions.githubusercontent.com/.well-known/jwks';
const AUDIENCE='magnanimous-production-secret-bridge';
const REPOSITORY='IAMGodmatters/IAMMagnanimousway.js';
const WORKFLOW='.github/workflows/magnanimous-runtime-secrets-stage.yml';
let jwksCache={expiresAt:0,keys:[]};

const EXTRA_KEYS=[
  'OPENAI_API_KEY','ANTHROPIC_API_KEY',
  'INKBOX_AGENT_HANDLE','INKBOX_EMAIL_ADDRESS',
  'VIDEO_RENDERER_TOKEN'
];

export const MIGRATION_RUNTIME_SECRET_KEYS=Object.freeze(
  [...new Set([
    ...PLATFORM_CREDENTIAL_GROUPS.flatMap(group=>group.fields.map(field=>field.key)),
    ...EXTRA_KEYS
  ])].sort()
);

function b64urlBytes(value){
  const normalized=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
  const pad=normalized.length%4?'='.repeat(4-(normalized.length%4)):'';
  const raw=atob(normalized+pad);
  return Uint8Array.from(raw,ch=>ch.charCodeAt(0));
}

function decodeJsonPart(value){
  return JSON.parse(new TextDecoder().decode(b64urlBytes(value)));
}

function audienceMatches(value){
  return Array.isArray(value)?value.includes(AUDIENCE):String(value||'')===AUDIENCE;
}

async function signingKeys(){
  if(jwksCache.expiresAt>Date.now()&&jwksCache.keys.length)return jwksCache.keys;
  const response=await fetch(JWKS_URL,{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error('GitHub OIDC signing keys are unavailable.');
  const body=await response.json();
  const keys=Array.isArray(body?.keys)?body.keys:[];
  if(!keys.length)throw new Error('GitHub OIDC signing keys are empty.');
  jwksCache={expiresAt:Date.now()+3600000,keys};
  return keys;
}

export async function verifyProductionSecretBridgeOidc(token){
  const parts=String(token||'').split('.');
  if(parts.length!==3)throw new Error('Invalid GitHub OIDC token.');
  const [encodedHeader,encodedPayload,encodedSignature]=parts;
  const header=decodeJsonPart(encodedHeader);
  const claims=decodeJsonPart(encodedPayload);
  if(header.alg!=='RS256'||!header.kid)throw new Error('Unsupported GitHub OIDC signature.');

  const keys=await signingKeys();
  const jwk=keys.find(key=>key.kid===header.kid&&key.kty==='RSA');
  if(!jwk)throw new Error('GitHub OIDC signing key was not found.');
  const key=await crypto.subtle.importKey(
    'jwk',
    jwk,
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},
    false,
    ['verify']
  );
  const valid=await crypto.subtle.verify(
    {name:'RSASSA-PKCS1-v1_5'},
    key,
    b64urlBytes(encodedSignature),
    encoder.encode(encodedHeader+'.'+encodedPayload)
  );
  if(!valid)throw new Error('GitHub OIDC signature verification failed.');

  const now=Math.floor(Date.now()/1000);
  if(String(claims.iss||'')!==ISSUER)throw new Error('Unexpected GitHub OIDC issuer.');
  if(!audienceMatches(claims.aud))throw new Error('Unexpected GitHub OIDC audience.');
  if(Number(claims.exp||0)<=now)throw new Error('GitHub OIDC token is expired.');
  if(Number(claims.nbf||0)>now+30)throw new Error('GitHub OIDC token is not active yet.');
  if(String(claims.repository||'')!==REPOSITORY)throw new Error('Unexpected GitHub OIDC repository.');
  if(String(claims.repository_owner||'')!=='IAMGodmatters')throw new Error('Unexpected GitHub OIDC repository owner.');
  if(String(claims.ref||'')!=='refs/heads/main')throw new Error('Unexpected GitHub OIDC ref.');
  if(String(claims.event_name||'')!=='push')throw new Error('Production secret bridge requires a main-branch push workflow.');
  const workflowRef=String(claims.workflow_ref||claims.job_workflow_ref||'');
  if(!workflowRef.includes('/'+WORKFLOW+'@refs/heads/main')){
    throw new Error('Unexpected GitHub OIDC workflow.');
  }
  return{
    repository:String(claims.repository||''),
    ref:String(claims.ref||''),
    sha:String(claims.sha||''),
    workflow_ref:workflowRef
  };
}

export async function collectProductionRuntimeSecrets(env){
  const runtime=await getProviderRuntimeEnv(env);
  const values={};
  for(const key of MIGRATION_RUNTIME_SECRET_KEYS){
    const value=runtime?.[key];
    if(value===undefined||value===null)continue;
    const clean=String(value);
    if(!clean.trim())continue;
    values[key]=clean;
  }
  return values;
}

export async function handleProductionSecretBridge(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/__magnanimous_migration/export-runtime-secrets')return null;
  if(request.method!=='POST'){
    return Response.json({detail:'Method not allowed.'},{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  }
  const authorization=String(request.headers.get('authorization')||'');
  const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
  if(!token)return Response.json({detail:'Signed GitHub Actions identity required.'},{status:401,headers:{'cache-control':'no-store'}});
  try{
    const source=await verifyProductionSecretBridgeOidc(token);
    const values=await collectProductionRuntimeSecrets(env);
    return Response.json({
      ok:true,
      values,
      keys:Object.keys(values).sort(),
      count:Object.keys(values).length,
      source:{repository:source.repository,ref:source.ref,sha:source.sha}
    },{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
  }catch(error){
    console.error('production secret bridge authorization failed',String(error?.message||error));
    return Response.json({detail:'Production secret bridge authorization failed.'},{status:403,headers:{'cache-control':'no-store'}});
  }
}

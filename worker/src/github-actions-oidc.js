const ISSUER='https://token.actions.githubusercontent.com';
const JWKS_URL='https://token.actions.githubusercontent.com/.well-known/jwks';
let cache={expiresAt:0,keys:[]};

function b64urlBytes(value){
  const normalized=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
  const pad=normalized.length%4?'='.repeat(4-(normalized.length%4)):'';
  const raw=atob(normalized+pad);
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function decodeJson(value){return JSON.parse(new TextDecoder().decode(b64urlBytes(value)))}
function audOk(claim,expected){return Array.isArray(claim)?claim.includes(expected):String(claim||'')===expected}

async function signingKeys(){
  if(cache.expiresAt>Date.now()&&cache.keys.length)return cache.keys;
  const response=await fetch(JWKS_URL,{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error('GitHub OIDC signing keys could not be loaded.');
  const body=await response.json();
  const keys=Array.isArray(body?.keys)?body.keys:[];
  if(!keys.length)throw new Error('GitHub OIDC signing keys were empty.');
  cache={expiresAt:Date.now()+3600000,keys};
  return keys;
}

export async function verifyGitHubActionsOidcWorker(token,{
  audience,
  repository='IAMGodmatters/IAMMagnanimousway.js',
  ref='refs/heads/main',
  workflowFile
}={}){
  const parts=String(token||'').split('.');
  if(parts.length!==3)throw new Error('Invalid GitHub OIDC token.');
  const[encodedHeader,encodedPayload,encodedSignature]=parts;
  const header=decodeJson(encodedHeader),claims=decodeJson(encodedPayload);
  if(header.alg!=='RS256'||!header.kid)throw new Error('Unsupported GitHub OIDC token signature.');
  const keys=await signingKeys(),jwk=keys.find(key=>key.kid===header.kid&&key.kty==='RSA');
  if(!jwk)throw new Error('GitHub OIDC signing key was not found.');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify(
    {name:'RSASSA-PKCS1-v1_5'},
    key,
    b64urlBytes(encodedSignature),
    new TextEncoder().encode(encodedHeader+'.'+encodedPayload)
  );
  if(!valid)throw new Error('GitHub OIDC signature verification failed.');
  const now=Math.floor(Date.now()/1000);
  if(String(claims.iss||'')!==ISSUER)throw new Error('Unexpected GitHub OIDC issuer.');
  if(!audOk(claims.aud,audience))throw new Error('Unexpected GitHub OIDC audience.');
  if(Number(claims.exp||0)<=now)throw new Error('GitHub OIDC token is expired.');
  if(Number(claims.nbf||0)>now+30)throw new Error('GitHub OIDC token is not active yet.');
  if(String(claims.repository||'')!==repository)throw new Error('Unexpected GitHub OIDC repository.');
  if(String(claims.repository_owner||'')!=='IAMGodmatters')throw new Error('Unexpected GitHub OIDC repository owner.');
  if(String(claims.ref||'')!==ref)throw new Error('Unexpected GitHub OIDC ref.');
  if(String(claims.event_name||'')!=='push')throw new Error('Credential migration requires a main-branch push workflow.');
  const workflowRef=String(claims.workflow_ref||claims.job_workflow_ref||'');
  if(!workflowFile||!workflowRef.includes('/'+workflowFile+'@refs/heads/main')){
    throw new Error('Unexpected GitHub OIDC workflow.');
  }
  return{repository:claims.repository,ref:claims.ref,sha:String(claims.sha||''),workflow_ref:workflowRef};
}

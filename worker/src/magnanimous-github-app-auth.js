const GITHUB_API='https://api.github.com';
const GITHUB_API_VERSION='2022-11-28';
const TOKEN_SKEW_SECONDS=120;
const tokenCache=new Map();

const clip=(value,n=20000)=>String(value??'').trim().slice(0,n);

function base64Url(bytes){
 const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 let binary='';
 for(let i=0;i<data.length;i++)binary+=String.fromCharCode(data[i]);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64UrlText(value){
 return base64Url(new TextEncoder().encode(String(value)));
}

function pemBytes(pem){
 const body=String(pem||'')
  .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g,'')
  .replace(/-----END (?:RSA )?PRIVATE KEY-----/g,'')
  .replace(/\s+/g,'');
 if(!body)throw new Error('GitHub App private key is empty.');
 const binary=atob(body);
 const bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return bytes;
}

function appId(env){
 return clip(env?.MAGNANIMOUS_GITHUB_APP_ID||env?.GITHUB_APP_ID,200);
}

function privateKey(env){
 return String(env?.MAGNANIMOUS_GITHUB_APP_PRIVATE_KEY||env?.GITHUB_APP_PRIVATE_KEY||'').trim();
}

function legacyToken(env){
 return clip(env?.GITHUB_PLATFORM_TOKEN||env?.MAGNANIMOUS_GITHUB_TOKEN,20000);
}

export function githubAppConfigured(env){
 return Boolean(appId(env)&&privateKey(env));
}

export function githubRepositoryAuthConfigured(env){
 return githubAppConfigured(env)||Boolean(legacyToken(env));
}

async function githubAppJwt(env){
 const issuer=appId(env);
 const keyPem=privateKey(env);
 if(!issuer||!keyPem)throw new Error('Magnanimous GitHub App credentials are not configured.');
 const now=Math.floor(Date.now()/1000);
 const header=base64UrlText(JSON.stringify({alg:'RS256',typ:'JWT'}));
 const payload=base64UrlText(JSON.stringify({iat:now-60,exp:now+540,iss:issuer}));
 const unsigned=header+'.'+payload;
 const key=await crypto.subtle.importKey(
  'pkcs8',
  pemBytes(keyPem),
  {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},
  false,
  ['sign']
 );
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
 return unsigned+'.'+base64Url(signature);
}

async function appRequest(jwt,method,path,body){
 const headers={
  Accept:'application/vnd.github+json',
  Authorization:`Bearer ${jwt}`,
  'User-Agent':'Magnanimous-GitHub-App',
  'X-GitHub-Api-Version':GITHUB_API_VERSION
 };
 const options={method,headers};
 if(body!==undefined){headers['content-type']='application/json';options.body=JSON.stringify(body);}
 const response=await fetch(GITHUB_API+path,options);
 const text=await response.text();
 let data={};
 try{data=text?JSON.parse(text):{};}catch{data={raw:text.slice(0,20000)};}
 if(!response.ok){
  const message=clip(data?.message||`GitHub App request failed (${response.status}).`,1000);
  const error=new Error(message);error.status=response.status;error.data=data;throw error;
 }
 return data;
}

async function discoverInstallationId(jwt,repo){
 const parts=String(repo||'').split('/');
 if(parts.length!==2||!parts[0]||!parts[1])throw new Error('Repository is required for GitHub App installation discovery.');
 const data=await appRequest(jwt,'GET',`/repos/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}/installation`);
 const id=Number(data?.id||0);
 if(!Number.isInteger(id)||id<1)throw new Error('GitHub App installation ID was not returned.');
 return id;
}

async function mintInstallationToken(env,repo){
 const cacheKey=appId(env)+':'+String(repo||'');
 const cached=tokenCache.get(cacheKey);
 const now=Math.floor(Date.now()/1000);
 if(cached&&cached.token&&cached.expiresAt>now+TOKEN_SKEW_SECONDS)return cached.token;

 const jwt=await githubAppJwt(env);
 const configuredInstallation=Number(env?.MAGNANIMOUS_GITHUB_APP_INSTALLATION_ID||0);
 const installationId=Number.isInteger(configuredInstallation)&&configuredInstallation>0
  ? configuredInstallation
  : await discoverInstallationId(jwt,repo);
 const data=await appRequest(jwt,'POST',`/app/installations/${installationId}/access_tokens`);
 const token=clip(data?.token,20000);
 if(!token)throw new Error('GitHub App installation token was not returned.');
 const expiresAt=Math.floor(new Date(data?.expires_at||0).getTime()/1000);
 tokenCache.set(cacheKey,{token,expiresAt:Number.isFinite(expiresAt)&&expiresAt>0?expiresAt:now+3000,installationId});
 return token;
}

export async function githubRepositoryToken(env,repo){
 if(githubAppConfigured(env)){
  try{return await mintInstallationToken(env,repo);}
  catch(error){
   const fallback=legacyToken(env);
   if(fallback){console.error('Magnanimous GitHub App auth failed; using temporary token fallback.',String(error?.message||error));return fallback;}
   throw error;
  }
 }
 return legacyToken(env);
}

export function githubRepositoryAuthSummary(env){
 return{
  configured:githubRepositoryAuthConfigured(env),
  github_app_configured:githubAppConfigured(env),
  legacy_token_configured:Boolean(legacyToken(env)),
  preferred_auth:githubAppConfigured(env)?'github-app-installation-token':Boolean(legacyToken(env))?'legacy-platform-token':'none',
  automatic_token_rotation:githubAppConfigured(env)
 };
}

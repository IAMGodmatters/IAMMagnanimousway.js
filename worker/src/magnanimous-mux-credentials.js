import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { setPlatformCredential, deletePlatformCredential } from './platform-credentials.js';

export const MUX_CREDENTIAL_FIELDS=Object.freeze([
  {key:'MUX_TOKEN_ID',label:'Mux Access Token ID',secret:false},
  {key:'MUX_TOKEN_SECRET',label:'Mux Access Token Secret',secret:true},
  {key:'MUX_DATA_ENV_KEY',label:'Mux Data Environment Key',secret:false},
  {key:'MUX_WEBHOOK_SECRET',label:'Mux Webhook Signing Secret',secret:true}
]);
const ALLOWED=new Set(MUX_CREDENTIAL_FIELDS.map(item=>item.key));

export async function getMuxRuntimeEnv(env){
  return getProviderRuntimeEnv(env);
}

export async function muxCredentialStatus(env){
  const runtime=await getMuxRuntimeEnv(env);
  return MUX_CREDENTIAL_FIELDS.map(field=>({
    key:field.key,
    label:field.label,
    secret:field.secret,
    configured:Boolean(String(runtime?.[field.key]||'').trim())
  }));
}

export async function setMuxCredential(env,user,key,value){
  const normalized=String(key||'').trim();
  if(!ALLOWED.has(normalized))throw new Error('Credential key is not allowed.');
  return setPlatformCredential(env,user,normalized,String(value||''));
}

export async function deleteMuxCredential(env,user,key){
  const normalized=String(key||'').trim();
  if(!ALLOWED.has(normalized))throw new Error('Credential key is not allowed.');
  return deletePlatformCredential(env,user,normalized);
}

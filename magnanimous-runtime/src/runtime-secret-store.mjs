import fs from 'node:fs/promises';
import path from 'node:path';

export const MAGNANIMOUS_RUNTIME_SECRET_KEYS = Object.freeze([
  'INTEGRATION_CREDENTIALS_KEY',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'MAGNANIMOUS_WORKERS_AI_BRIDGE_TOKEN',
  'MAGNANIMOUS_WORKERS_AI_BRIDGE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'TAVUS_API_KEY',
  'VOIP_PROVIDER_TOKEN',
  'VOIP_WEBHOOK_SECRET',
  'VIDEO_RENDERER_TOKEN',
  'MUX_TOKEN_ID',
  'MUX_TOKEN_SECRET',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'HF_TOKEN',
  'MISTRAL_API_KEY',
  'INKBOX_API_KEY',
  'INKBOX_EMAIL_ADDRESS',
  'INKBOX_BASE_URL',
  'MAGNANIMOUS_SMTP_PASSWORD'
]);

const allowed=new Set(MAGNANIMOUS_RUNTIME_SECRET_KEYS);

function normalizePayload(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Runtime secret payload must be an object.');
  const out={};
  for(const [key,value] of Object.entries(input)){
    if(!allowed.has(key))throw new Error('Runtime secret key is not allowed: '+key);
    const clean=String(value??'');
    if(!clean)continue;
    out[key]=clean;
  }
  return out;
}

function inside(root,target){
  const r=path.resolve(root),t=path.resolve(target);
  return t===r||t.startsWith(r+path.sep);
}

export async function stageRuntimeSecrets(payload,{
  root='/app/persist/secrets',
  targetPath=''
}={}){
  const secrets=normalizePayload(payload);
  const rootPath=path.resolve(root);
  const finalPath=path.resolve(targetPath||path.join(rootPath,'runtime.json'));
  if(!inside(rootPath,finalPath))throw new Error('Runtime secret target must remain inside the configured secret root.');
  await fs.mkdir(rootPath,{recursive:true,mode:0o700});
  const temp=path.join(rootPath,'.runtime-'+process.pid+'-'+Date.now()+'.json');
  await fs.writeFile(temp,JSON.stringify(secrets),{mode:0o600});
  await fs.chmod(temp,0o600);
  await fs.rename(temp,finalPath);
  await fs.chmod(finalPath,0o600);
  return{
    ok:true,
    keys:Object.keys(secrets).sort(),
    count:Object.keys(secrets).length,
    target:finalPath
  };
}

export async function loadRuntimeSecrets({
  file=process.env.MAGNANIMOUS_RUNTIME_SECRETS_FILE||'/app/persist/secrets/runtime.json',
  override=true
}={}){
  let raw;
  try{raw=await fs.readFile(file,'utf8')}catch(error){
    if(error?.code==='ENOENT')return{loaded:false,count:0,keys:[]};
    throw error;
  }
  const secrets=normalizePayload(JSON.parse(raw));
  for(const [key,value] of Object.entries(secrets)){
    if(override||!String(process.env[key]||'').trim())process.env[key]=value;
  }
  return{loaded:true,count:Object.keys(secrets).length,keys:Object.keys(secrets).sort()};
}

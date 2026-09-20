import fs from 'node:fs/promises';
import path from 'node:path';

export const MAGNANIMOUS_RUNTIME_SECRET_KEYS = Object.freeze([
  'INTEGRATION_CREDENTIALS_KEY',
  'STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
  'TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_PHONE_NUMBER','TWILIO_API_KEY_SID','TWILIO_API_KEY_SECRET','TWILIO_TWIML_APP_SID',
  'PLIVO_AUTH_ID','PLIVO_AUTH_TOKEN','PLIVO_PHONE_NUMBER',
  'TELNYX_API_KEY','TELNYX_CONNECTION_ID','TELNYX_PHONE_NUMBER',
  'VOIP_PROVIDER_URL','VOIP_PROVIDER_NAME','VOIP_CALLER_ID','VOIP_PROVIDER_TOKEN','VOIP_WEBHOOK_SECRET',
  'INKBOX_API_KEY','INKBOX_AGENT_IDENTITY_ID','INKBOX_AGENT_HANDLE','INKBOX_EMAIL_ADDRESS','INKBOX_PHONE_NUMBER','INKBOX_WEBHOOK_SECRET','INKBOX_BASE_URL',
  'TAVUS_API_KEY','HEYGEN_API_KEY',
  'MUX_TOKEN_ID','MUX_TOKEN_SECRET','MUX_DATA_ENV_KEY','MUX_WEBHOOK_SECRET',
  'CLOUDFLARE_PLATFORM_API_TOKEN','CLOUDFLARE_PLATFORM_ACCOUNT_ID','CLOUDFLARE_PLATFORM_ZONE_ID',
  'PORKBUN_API_KEY','PORKBUN_SECRET_API_KEY',
  'GOOGLE_API_KEY','ENABLE_VEO_PROVIDER','RUNWAYML_API_SECRET','LUMA_API_KEY',
  'GROQ_API_KEY','OPENROUTER_API_KEY','HF_TOKEN','MISTRAL_API_KEY','CEREBRAS_API_KEY','NVIDIA_API_KEY',
  'FREE_AVATAR_RENDERER_URL','FREE_AVATAR_RENDERER_TOKEN','BRAVE_SEARCH_API_KEY',
  'ADSENSE_CLIENT_ID','ADSENSE_SLOT_HOME',
  'META_APP_ID','META_APP_SECRET','WHATSAPP_CONFIG_ID','WHATSAPP_VERIFY_TOKEN',
  'COMPOSIO_API_KEY',
  'GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET',
  'SHOPIFY_API_KEY','SHOPIFY_API_SECRET',
  'SHOPEE_PARTNER_ID','SHOPEE_PARTNER_KEY',
  'X_CLIENT_ID','X_CLIENT_SECRET',
  'SNAPCHAT_CLIENT_ID','SNAPCHAT_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET',
  'SLACK_CLIENT_ID','SLACK_CLIENT_SECRET',
  'DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET',
  'OPENAI_API_KEY','ANTHROPIC_API_KEY','VIDEO_RENDERER_TOKEN'
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

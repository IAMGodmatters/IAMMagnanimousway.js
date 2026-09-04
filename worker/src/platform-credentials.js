import { currentUser } from './integrations.js';

const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

export const PLATFORM_CREDENTIAL_GROUPS=[
 {id:'stripe',name:'Stripe Advanced Billing',providers:['stripe'],fields:[
  {key:'STRIPE_SECRET_KEY',label:'Stripe Secret API Key (optional)',secret:true,required:false},
  {key:'STRIPE_WEBHOOK_SECRET',label:'Stripe Webhook Signing Secret',secret:true,required:false}
 ]},
 {id:'twilio',name:'Twilio Voice + Browser Agent Desk',providers:['twilio'],fields:[
  {key:'TWILIO_ACCOUNT_SID',label:'Twilio Account SID',secret:false,required:true},
  {key:'TWILIO_AUTH_TOKEN',label:'Twilio Auth Token',secret:true,required:true},
  {key:'TWILIO_PHONE_NUMBER',label:'Twilio Phone Number (E.164)',secret:false,required:true},
  {key:'TWILIO_API_KEY_SID',label:'Twilio API Key SID (for Voice SDK)',secret:false,required:false},
  {key:'TWILIO_API_KEY_SECRET',label:'Twilio API Key Secret (for Voice SDK)',secret:true,required:false},
  {key:'TWILIO_TWIML_APP_SID',label:'Twilio TwiML App SID (for browser outbound calling)',secret:false,required:false}
 ]},
 {id:'plivo',name:'Plivo Voice Carrier',providers:['plivo'],fields:[
  {key:'PLIVO_AUTH_ID',label:'Plivo Auth ID',secret:false,required:true},
  {key:'PLIVO_AUTH_TOKEN',label:'Plivo Auth Token',secret:true,required:true},
  {key:'PLIVO_PHONE_NUMBER',label:'Plivo Phone Number (E.164)',secret:false,required:true}
 ]},
 {id:'telnyx',name:'Telnyx Voice / SIP Alternative',providers:['telnyx'],fields:[
  {key:'TELNYX_API_KEY',label:'Telnyx API Key',secret:true,required:false},
  {key:'TELNYX_CONNECTION_ID',label:'Telnyx Voice Connection ID',secret:false,required:false},
  {key:'TELNYX_PHONE_NUMBER',label:'Telnyx Phone Number (E.164)',secret:false,required:false}
 ]},
 {id:'carrier-bridge',name:'Bring Your Own Carrier / SIP Bridge',providers:['carrier-bridge'],fields:[
  {key:'VOIP_PROVIDER_URL',label:'Carrier Bridge HTTPS Call Endpoint',secret:false,required:false},
  {key:'VOIP_PROVIDER_NAME',label:'Carrier / Bridge Display Name',secret:false,required:false},
  {key:'VOIP_CALLER_ID',label:'Carrier Caller ID (E.164)',secret:false,required:false},
  {key:'VOIP_PROVIDER_TOKEN',label:'Carrier Bridge Bearer Token',secret:true,required:false},
  {key:'VOIP_WEBHOOK_SECRET',label:'Carrier Bridge Webhook Secret',secret:true,required:false}
 ]},
 {id:'tavus',name:'Tavus Human Video',providers:['tavus'],fields:[{key:'TAVUS_API_KEY',label:'Tavus API Key',secret:true,required:false}]},
 {id:'heygen',name:'HeyGen Presenter Video',providers:['heygen'],fields:[{key:'HEYGEN_API_KEY',label:'HeyGen API Key (optional presenter-video provider)',secret:true,required:false}]},
 {id:'veo',name:'Google Veo Cinematic Video',providers:['veo'],fields:[
  {key:'GOOGLE_API_KEY',label:'Google Gemini / Veo API Key',secret:true,required:false},
  {key:'ENABLE_VEO_PROVIDER',label:'Enable Veo Provider (true/false)',secret:false,required:false}
 ]},
 {id:'runway',name:'Runway Generative Video',providers:['runway'],fields:[
  {key:'RUNWAYML_API_SECRET',label:'Runway API Secret',secret:true,required:false}
 ]},
 {id:'luma',name:'Luma Dream Machine',providers:['luma'],fields:[
  {key:'LUMA_API_KEY',label:'Luma API Key',secret:true,required:false}
 ]},
 {id:'agent-brains',name:'Agent Mesh AI Brains',providers:['google-ai','groq','openrouter-free','huggingface','mistral','cerebras'],fields:[
  {key:'GOOGLE_API_KEY',label:'Google Gemini API Key (free tier supported)',secret:true,required:false},
  {key:'GROQ_API_KEY',label:'Groq API Key (free plan supported)',secret:true,required:false},
  {key:'OPENROUTER_API_KEY',label:'OpenRouter API Key (Free Models Router supported)',secret:true,required:false},
  {key:'HF_TOKEN',label:'Hugging Face Token (free credits supported)',secret:true,required:false},
  {key:'MISTRAL_API_KEY',label:'Mistral API Key (Free mode supported)',secret:true,required:false},
  {key:'CEREBRAS_API_KEY',label:'Cerebras API Key (trial credits; GLM non-OpenAI default)',secret:true,required:false}
 ]},
 {id:'free-avatar',name:'Self-Hosted Free Video Agents',providers:['liveportrait-compatible','wav2lip-compatible'],fields:[
  {key:'FREE_AVATAR_RENDERER_URL',label:'Avatar Renderer HTTPS Endpoint (optional)',secret:false,required:false},
  {key:'FREE_AVATAR_RENDERER_TOKEN',label:'Avatar Renderer Bearer Token (optional)',secret:true,required:false}
 ]},
 {id:'web-research',name:'Web Research & News',providers:['brave-search'],fields:[{key:'BRAVE_SEARCH_API_KEY',label:'Brave Search API Key (optional live web/news research)',secret:true,required:false}]},
 {id:'adsense',name:'Google AdSense / Auto Ads',providers:['adsense'],fields:[
  {key:'ADSENSE_CLIENT_ID',label:'AdSense Publisher ID (ca-pub-...)',secret:false,required:true},
  {key:'ADSENSE_SLOT_HOME',label:'Homepage Ad Unit Slot ID (optional for Auto Ads)',secret:false,required:false}
 ]},
 {id:'meta',name:'Meta',providers:['facebook','instagram','whatsapp'],fields:[
  {key:'META_APP_ID',label:'Meta App ID',secret:false,required:true},
  {key:'META_APP_SECRET',label:'Meta App Secret',secret:true,required:true},
  {key:'WHATSAPP_CONFIG_ID',label:'WhatsApp Configuration ID',secret:false,required:false}
 ]},
 {id:'managed-email-auth',name:'Managed Email OAuth Fallback',providers:['google','outlook'],fields:[{key:'COMPOSIO_API_KEY',label:'Composio Project API Key (managed Gmail/Outlook OAuth fallback)',secret:true,required:true}]},
 {id:'google',name:'Google',providers:['google','google-calendar'],fields:[
  {key:'GOOGLE_CLIENT_ID',label:'Google OAuth Client ID',secret:false,required:true},
  {key:'GOOGLE_CLIENT_SECRET',label:'Google OAuth Client Secret',secret:true,required:true}
 ]},
 {id:'shopify',name:'Shopify',providers:['shopify'],fields:[
  {key:'SHOPIFY_API_KEY',label:'Shopify Client ID / API Key',secret:false,required:true},
  {key:'SHOPIFY_API_SECRET',label:'Shopify Client Secret / API Secret',secret:true,required:true}
 ]},
 {id:'shopee',name:'Shopee',providers:['shopee'],fields:[
  {key:'SHOPEE_PARTNER_ID',label:'Shopee Partner ID',secret:false,required:true},
  {key:'SHOPEE_PARTNER_KEY',label:'Shopee Partner Key',secret:true,required:true}
 ]},
 {id:'x',name:'X',providers:['x'],fields:[
  {key:'X_CLIENT_ID',label:'X OAuth Client ID',secret:false,required:true},
  {key:'X_CLIENT_SECRET',label:'X OAuth Client Secret',secret:true,required:true}
 ]},
 {id:'snapchat',name:'Snapchat',providers:['snapchat'],fields:[
  {key:'SNAPCHAT_CLIENT_ID',label:'Snapchat Client ID',secret:false,required:true},
  {key:'SNAPCHAT_CLIENT_SECRET',label:'Snapchat Client Secret',secret:true,required:true}
 ]},
 {id:'microsoft',name:'Microsoft',providers:['outlook'],fields:[
  {key:'MICROSOFT_CLIENT_ID',label:'Microsoft Application (Client) ID',secret:false,required:true},
  {key:'MICROSOFT_CLIENT_SECRET',label:'Microsoft Client Secret',secret:true,required:true}
 ]},
 {id:'slack',name:'Slack',providers:['slack'],fields:[
  {key:'SLACK_CLIENT_ID',label:'Slack Client ID',secret:false,required:true},
  {key:'SLACK_CLIENT_SECRET',label:'Slack Client Secret',secret:true,required:true}
 ]},
 {id:'discord',name:'Discord',providers:['discord'],fields:[
  {key:'DISCORD_CLIENT_ID',label:'Discord Application / Client ID',secret:false,required:true},
  {key:'DISCORD_CLIENT_SECRET',label:'Discord Client Secret',secret:true,required:true}
 ]}
];

const ALLOWED_KEYS=new Set(PLATFORM_CREDENTIAL_GROUPS.flatMap(g=>g.fields.map(f=>f.key)));
const CREDENTIAL_PATHS=new Set(['/api/platform-credentials','/api/integrations/platform-credentials']);
function b64(bytes){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value)}
function fromB64(value){const raw=atob(value);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function sessionSecret(env){const direct=String(env?.SESSION_SECRET||'').trim();if(direct)return direct;if(!env?.DB)return'';const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||'')}
async function vaultKey(env){const source=String(env?.INTEGRATION_CREDENTIALS_KEY||await sessionSecret(env)||'').trim();if(!source)throw new Error('Platform credential encryption is not available.');const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`iam-platform-credentials-v1:${source}`));return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function encrypt(value,env){const iv=crypto.getRandomValues(new Uint8Array(12)),key=await vaultKey(env),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(String(value)));return`enc1.${b64(iv)}.${b64(new Uint8Array(cipher))}`}
async function decrypt(value,env){const raw=String(value||'');if(!raw.startsWith('enc1.'))return raw;const[,ivPart,cipherPart]=raw.split('.'),key=await vaultKey(env),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(ivPart)},key,fromB64(cipherPart));return new TextDecoder().decode(plain)}
async function ensureTables(env){await env.DB.prepare(`CREATE TABLE IF NOT EXISTS platform_credentials (credential_key TEXT PRIMARY KEY,encrypted_value TEXT NOT NULL,updated_at INTEGER NOT NULL,updated_by TEXT NOT NULL DEFAULT '')`).run();await env.DB.prepare(`CREATE TABLE IF NOT EXISTS platform_credential_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id TEXT NOT NULL,credential_key TEXT NOT NULL,action TEXT NOT NULL,created_at INTEGER NOT NULL)`).run()}
async function vaultRows(env){await ensureTables(env);const{results}=await env.DB.prepare('SELECT credential_key,encrypted_value,updated_at FROM platform_credentials').all();return results||[]}

export async function getIntegrationRuntimeEnv(env){if(!env?.DB)return env;try{const rows=await vaultRows(env);if(!rows.length)return env;const merged={...env};for(const row of rows){if(!ALLOWED_KEYS.has(row.credential_key))continue;if(typeof merged[row.credential_key]==='string'&&merged[row.credential_key].trim())continue;merged[row.credential_key]=await decrypt(row.encrypted_value,env)}return merged}catch(error){console.error('platform credential runtime load failed',error);return env}}
function callbackMap(request){const origin=new URL(request.url).origin,providers=[...new Set(PLATFORM_CREDENTIAL_GROUPS.flatMap(g=>g.providers))];return Object.fromEntries(providers.map(provider=>[provider,`${origin}/api/integrations/${provider}/callback`]))}

export async function handlePlatformCredentials(request,env){
 const url=new URL(request.url);if(!CREDENTIAL_PATHS.has(url.pathname))return null;
 const user=await currentUser(request,env);if(!user||user.role!=='owner')return json({detail:'Owner access required.'},403);
 if(request.method==='GET'){await ensureTables(env);const rows=await vaultRows(env),byKey=new Map(rows.map(r=>[r.credential_key,r]));return json({groups:PLATFORM_CREDENTIAL_GROUPS.map(group=>({...group,fields:group.fields.map(field=>({...field,configured:byKey.has(field.key)||Boolean(String(env?.[field.key]||'').trim()),updated_at:byKey.get(field.key)?.updated_at||null}))})),callbacks:callbackMap(request)})}
 if(request.method==='POST'){const b=await request.json().catch(()=>({}));const key=String(b.key||'').trim();if(!ALLOWED_KEYS.has(key))return json({detail:'Credential key is not allowed.'},400);const value=String(b.value||'').trim();if(!value)return json({detail:'Credential value is required.'},400);await ensureTables(env);const encrypted=await encrypt(value,env);await env.DB.prepare('INSERT INTO platform_credentials (credential_key,encrypted_value,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(credential_key) DO UPDATE SET encrypted_value=excluded.encrypted_value,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(key,encrypted,now(),String(user.id||'owner')).run();await env.DB.prepare('INSERT INTO platform_credential_audit (actor_user_id,credential_key,action,created_at) VALUES (?,?,?,?)').bind(String(user.id||'owner'),key,'set',now()).run();return json({ok:true,key})}
 if(request.method==='DELETE'){const key=String(url.searchParams.get('key')||'').trim();if(!ALLOWED_KEYS.has(key))return json({detail:'Credential key is not allowed.'},400);await ensureTables(env);await env.DB.prepare('DELETE FROM platform_credentials WHERE credential_key=?').bind(key).run();await env.DB.prepare('INSERT INTO platform_credential_audit (actor_user_id,credential_key,action,created_at) VALUES (?,?,?,?)').bind(String(user.id||'owner'),key,'delete',now()).run();return json({ok:true,key})}
 return json({detail:'Unsupported platform credential operation.'},405)
}
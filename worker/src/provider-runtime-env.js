import { getIntegrationRuntimeEnv } from './platform-credentials.js';
import { getBootstrapSecrets } from './secure-bootstrap.js';

const PROVIDER_KEYS = new Set([
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'TWILIO_API_KEY_SID',
  'TWILIO_API_KEY_SECRET',
  'TWILIO_TWIML_APP_SID',
  'PLIVO_AUTH_ID',
  'PLIVO_AUTH_TOKEN',
  'PLIVO_PHONE_NUMBER',
  'TELNYX_API_KEY',
  'TELNYX_CONNECTION_ID',
  'TELNYX_PHONE_NUMBER',
  'INKBOX_API_KEY',
  'INKBOX_AGENT_IDENTITY_ID',
  'INKBOX_AGENT_HANDLE',
  'INKBOX_EMAIL_ADDRESS',
  'INKBOX_PHONE_NUMBER',
  'INKBOX_WEBHOOK_SECRET',
  'INKBOX_BASE_URL',
  'TAVUS_API_KEY',
  'HEYGEN_API_KEY',
  'ADSENSE_CLIENT_ID',
  'ADSENSE_SLOT_HOME',
  'VOIP_PROVIDER_URL',
  'VOIP_PROVIDER_NAME',
  'VOIP_CALLER_ID',
  'VOIP_PROVIDER_TOKEN',
  'VOIP_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'HF_TOKEN',
  'MISTRAL_API_KEY',
  'CEREBRAS_API_KEY',
  'NVIDIA_API_KEY',
  'XAI_API_KEY',
  'XAI_MODEL',
  'FREE_AVATAR_RENDERER_URL',
  'FREE_AVATAR_RENDERER_TOKEN',
  'MUX_TOKEN_ID',
  'MUX_TOKEN_SECRET',
  'MUX_DATA_ENV_KEY',
  'MUX_WEBHOOK_SECRET',
  'CLOUDFLARE_PLATFORM_API_TOKEN',
  'CLOUDFLARE_PLATFORM_ACCOUNT_ID',
  'CLOUDFLARE_PLATFORM_ZONE_ID',
  'PORKBUN_API_KEY',
  'PORKBUN_SECRET_API_KEY',
  'VIDEO_RENDERER_TOKEN'
]);

export async function getProviderRuntimeEnv(env) {
  let merged = await getIntegrationRuntimeEnv(env);
  try {
    const bootstrap = await getBootstrapSecrets(env);
    if (!bootstrap || !Object.keys(bootstrap).length) return merged;
    merged = { ...merged };
    for (const [key, value] of Object.entries(bootstrap)) {
      if (!PROVIDER_KEYS.has(key)) continue;
      if (typeof merged[key] === 'string' && merged[key].trim()) continue;
      if (typeof value === 'string' && value.trim()) merged[key] = value.trim();
    }
  } catch (error) {
    console.error('provider runtime bootstrap merge failed', error);
  }
  return merged;
}

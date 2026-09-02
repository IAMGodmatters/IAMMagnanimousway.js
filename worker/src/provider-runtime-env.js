import { getIntegrationRuntimeEnv } from './platform-credentials.js';
import { getBootstrapSecrets } from './secure-bootstrap.js';

const PROVIDER_KEYS = new Set([
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'TAVUS_API_KEY',
  'ADSENSE_CLIENT_ID',
  'ADSENSE_SLOT_HOME',
  'VOIP_PROVIDER_TOKEN',
  'VOIP_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'HF_TOKEN',
  'MISTRAL_API_KEY',
  'MUX_TOKEN_ID',
  'MUX_TOKEN_SECRET',
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

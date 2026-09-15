import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function addAfter(text,anchor,addition,label){
  if(text.includes(addition.trim())) return text;
  if(!text.includes(anchor)) throw new Error(`Missing ${label} anchor`);
  return text.replace(anchor,anchor+addition);
}
function replaceOnce(text,from,to,label){
  if(text.includes(to)) return text;
  if(!text.includes(from)) throw new Error(`Missing ${label} anchor`);
  return text.replace(from,to);
}

const providerPath='worker/src/provider-entrypoint.js';
let provider=read(providerPath);
provider=addAfter(
  provider,
  'Use Magnanimous private memory, learned lessons, stored knowledge and native tool recipes before reaching outward. Use fresh research when facts are current, stale, uncertain or source-dependent.\n',
  'Magnanimous AI is the durable remembrance layer for the platform: decisions, useful context, learned lessons, proven workflows and continuity belong to Magnanimous memory, never to a replaceable outside model.\n',
  'commander remembrance'
);
provider=replaceOnce(
  provider,
  "  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY', tier: 'free-first' },\n  { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY', tier: 'metered' },",
  "  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY', tier: 'free-first' },\n  { id: 'nvidia-kimi', name: 'NVIDIA NIM — Kimi K3', key: 'NVIDIA_API_KEY', tier: 'free-first' },\n  { id: 'nvidia-deepseek-pro', name: 'NVIDIA NIM — DeepSeek V4 Pro', key: 'NVIDIA_API_KEY', tier: 'free-first' },\n  { id: 'nvidia-deepseek-flash', name: 'NVIDIA NIM — DeepSeek V4 Flash', key: 'NVIDIA_API_KEY', tier: 'free-first' },\n  { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY', tier: 'metered' },",
  'provider list'
);
provider=replaceOnce(
  provider,
  "  if (id === 'mistral') return { text: await openaiCompatible('https://api.mistral.ai/v1', env.MISTRAL_API_KEY, model || env.MISTRAL_MODEL || 'mistral-large-latest', message, 'Mistral'), model: model || env.MISTRAL_MODEL || 'mistral-large-latest' };\n  if (id === 'cloudflare-ai') return cloudflare(env, message, model);",
  "  if (id === 'mistral') return { text: await openaiCompatible('https://api.mistral.ai/v1', env.MISTRAL_API_KEY, model || env.MISTRAL_MODEL || 'mistral-large-latest', message, 'Mistral'), model: model || env.MISTRAL_MODEL || 'mistral-large-latest' };\n  if (id === 'nvidia-kimi') return { text: await openaiCompatible('https://integrate.api.nvidia.com/v1', env.NVIDIA_API_KEY, model || env.NVIDIA_KIMI_MODEL || 'moonshotai/kimi-k3', message, 'NVIDIA Kimi'), model: model || env.NVIDIA_KIMI_MODEL || 'moonshotai/kimi-k3' };\n  if (id === 'nvidia-deepseek-pro') return { text: await openaiCompatible('https://integrate.api.nvidia.com/v1', env.NVIDIA_API_KEY, model || env.NVIDIA_DEEPSEEK_PRO_MODEL || 'deepseek-ai/deepseek-v4-pro-0813', message, 'NVIDIA DeepSeek Pro'), model: model || env.NVIDIA_DEEPSEEK_PRO_MODEL || 'deepseek-ai/deepseek-v4-pro-0813' };\n  if (id === 'nvidia-deepseek-flash') return { text: await openaiCompatible('https://integrate.api.nvidia.com/v1', env.NVIDIA_API_KEY, model || env.NVIDIA_DEEPSEEK_FLASH_MODEL || 'deepseek-ai/deepseek-v4-flash-0731', message, 'NVIDIA DeepSeek Flash'), model: model || env.NVIDIA_DEEPSEEK_FLASH_MODEL || 'deepseek-ai/deepseek-v4-flash-0731' };\n  if (id === 'cloudflare-ai') return cloudflare(env, message, model);",
  'provider calls'
);
provider=replaceOnce(
  provider,
  "    research:['google','cloudflare-ai','groq','mistral','openai','anthropic'],\n    coding:['mistral','groq','cloudflare-ai','google','openai','anthropic'],\n    business:['google','cloudflare-ai','mistral','groq','openai','anthropic'],\n    writing:['cloudflare-ai','mistral','google','groq','openai','anthropic'],\n    general:['cloudflare-ai','google','groq','mistral','openai','anthropic']",
  "    research:['google','nvidia-kimi','cloudflare-ai','nvidia-deepseek-flash','groq','mistral','nvidia-deepseek-pro','openai','anthropic'],\n    coding:['nvidia-deepseek-pro','nvidia-deepseek-flash','nvidia-kimi','mistral','groq','cloudflare-ai','google','openai','anthropic'],\n    business:['nvidia-kimi','nvidia-deepseek-pro','google','cloudflare-ai','nvidia-deepseek-flash','mistral','groq','openai','anthropic'],\n    writing:['cloudflare-ai','nvidia-kimi','nvidia-deepseek-flash','mistral','google','groq','nvidia-deepseek-pro','openai','anthropic'],\n    general:['cloudflare-ai','nvidia-kimi','nvidia-deepseek-flash','google','groq','mistral','nvidia-deepseek-pro','openai','anthropic']",
  'free-first routes'
);
write(providerPath,provider);

const runtimePath='worker/src/provider-runtime-env.js';
let runtime=read(runtimePath);
runtime=replaceOnce(
  runtime,
  "  'MISTRAL_API_KEY',\n  'CEREBRAS_API_KEY',",
  "  'MISTRAL_API_KEY',\n  'CEREBRAS_API_KEY',\n  'NVIDIA_API_KEY',",
  'runtime NVIDIA secret'
);
write(runtimePath,runtime);

const credentialsPath='worker/src/platform-credentials.js';
let credentials=read(credentialsPath);
credentials=replaceOnce(
  credentials,
  " {id:'agent-brains',name:'Agent Mesh AI Brains',providers:['google-ai','groq','openrouter-free','huggingface','mistral','cerebras'],fields:[",
  " {id:'agent-brains',name:'Agent Mesh AI Brains',providers:['google-ai','groq','openrouter-free','huggingface','mistral','cerebras','nvidia-nim'],fields:[",
  'agent brain providers'
);
credentials=replaceOnce(
  credentials,
  "  {key:'CEREBRAS_API_KEY',label:'Cerebras API Key (trial credits; GLM non-OpenAI default)',secret:true,required:false}\n ]},",
  "  {key:'CEREBRAS_API_KEY',label:'Cerebras API Key (trial credits; GLM non-OpenAI default)',secret:true,required:false},\n  {key:'NVIDIA_API_KEY',label:'NVIDIA NIM API Key (free prototype endpoints for Kimi K3 / DeepSeek V4 when available)',secret:true,required:false}\n ]},",
  'NVIDIA owner credential'
);
write(credentialsPath,credentials);

const brainPath='worker/src/magnanimous-brain-runtime.js';
let brain=read(brainPath);
brain=replaceOnce(
  brain,
  " 'Magnanimous AI is the commander-in-chief intelligence, planning, continuity and learning layer for the platform.',",
  " 'Magnanimous AI is the commander-in-chief intelligence, planning, continuity, remembrance and learning layer for the platform.',\n 'Magnanimous AI is the durable source of remembrance for what the platform has learned and done; outside models may execute tasks, but they do not own platform memory or continuity.',",
  'brain remembrance principle'
);
write(brainPath,brain);

const envPath='.env.example';
let envText=read(envPath);
if(!envText.includes('NVIDIA_API_KEY=')){
  const anchor='CEREBRAS_API_KEY=';
  const idx=envText.indexOf(anchor);
  if(idx>=0){
    const end=envText.indexOf('\n',idx);
    envText=envText.slice(0,end+1)+"NVIDIA_API_KEY=\nNVIDIA_KIMI_MODEL=moonshotai/kimi-k3\nNVIDIA_DEEPSEEK_PRO_MODEL=deepseek-ai/deepseek-v4-pro-0813\nNVIDIA_DEEPSEEK_FLASH_MODEL=deepseek-ai/deepseek-v4-flash-0731\n"+envText.slice(end+1);
  }else{
    envText+="\n# Optional NVIDIA NIM free prototype endpoints; availability and quotas are provider-controlled.\nNVIDIA_API_KEY=\nNVIDIA_KIMI_MODEL=moonshotai/kimi-k3\nNVIDIA_DEEPSEEK_PRO_MODEL=deepseek-ai/deepseek-v4-pro-0813\nNVIDIA_DEEPSEEK_FLASH_MODEL=deepseek-ai/deepseek-v4-flash-0731\n";
  }
}
write(envPath,envText);

const checks=[
  [provider.includes("id: 'nvidia-kimi'"),'Kimi provider'],
  [provider.includes("deepseek-ai/deepseek-v4-pro-0813"),'DeepSeek Pro model'],
  [provider.includes("deepseek-ai/deepseek-v4-flash-0731"),'DeepSeek Flash model'],
  [provider.includes('durable remembrance layer'),'commander remembrance'],
  [runtime.includes("'NVIDIA_API_KEY'"),'runtime secret'],
  [credentials.includes("key:'NVIDIA_API_KEY'"),'owner credential'],
  [brain.includes('durable source of remembrance'),'brain remembrance']
];
for(const [ok,label] of checks) if(!ok) throw new Error(`Verification failed: ${label}`);
console.log('NVIDIA frontier mesh and Magnanimous remembrance invariant applied.');

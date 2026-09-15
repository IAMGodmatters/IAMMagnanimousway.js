import fs from 'node:fs';

// Re-run marker: execute the validated additive provider repair from the latest main branch.
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);

function insertAfterOnce(text, needle, addition, label) {
  if (text.includes(addition.trim())) return text;
  const i = text.indexOf(needle);
  if (i < 0) throw new Error(`Missing ${label}`);
  return text.slice(0, i + needle.length) + addition + text.slice(i + needle.length);
}

const providerPath = 'worker/src/provider-entrypoint.js';
let provider = read(providerPath);
provider = insertAfterOnce(
  provider,
  "  { id: 'mistral', name: 'Mistral AI', key: 'MISTRAL_API_KEY', tier: 'free-first' },\n",
  "  { id: 'openrouter-free', name: 'OpenRouter Free Models', key: 'OPENROUTER_API_KEY', tier: 'free-first' },\n",
  'Mistral provider anchor'
);
provider = insertAfterOnce(
  provider,
  "  if (id === 'mistral') return { text: await openaiCompatible('https://api.mistral.ai/v1', env.MISTRAL_API_KEY, model || env.MISTRAL_MODEL || 'mistral-large-latest', message, 'Mistral'), model: model || env.MISTRAL_MODEL || 'mistral-large-latest' };\n",
  "  if (id === 'openrouter-free') return { text: await openaiCompatible('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY, model || env.OPENROUTER_FREE_MODEL || 'openrouter/free', message, 'OpenRouter Free'), model: model || env.OPENROUTER_FREE_MODEL || 'openrouter/free' };\n",
  'Mistral callProvider anchor'
);

for (const task of ['research','coding','business','writing','general']) {
  const re = new RegExp(`(${task}:\\[[^\\n\\]]*?)(?:'openrouter-free',)?('openai')`);
  const match = provider.match(re);
  if (!match) throw new Error(`Missing ${task} routing order`);
  if (!match[1].includes("'openrouter-free'")) provider = provider.replace(re, `$1'openrouter-free',$2`);
}

write(providerPath, provider);

const deployPath = '.github/workflows/deploy.yml';
let deploy = read(deployPath);
if (!deploy.includes('NVIDIA_API_KEY: ${{ secrets.NVIDIA_API_KEY }}')) {
  const anchor = '          MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}\n';
  if (!deploy.includes(anchor)) throw new Error('Missing deploy NVIDIA env anchor');
  deploy = deploy.replace(anchor, anchor + '          NVIDIA_API_KEY: ${{ secrets.NVIDIA_API_KEY }}\n');
}
if (!deploy.includes('sync_secret NVIDIA_API_KEY "$NVIDIA_API_KEY"')) {
  const anchor = '          sync_secret MISTRAL_API_KEY "$MISTRAL_API_KEY"\n';
  if (!deploy.includes(anchor)) throw new Error('Missing deploy NVIDIA sync anchor');
  deploy = deploy.replace(anchor, anchor + '          sync_secret NVIDIA_API_KEY "$NVIDIA_API_KEY"\n');
}
write(deployPath, deploy);

const providerFinal = read(providerPath);
for (const required of [
  "id: 'openrouter-free'",
  "'https://openrouter.ai/api/v1'",
  "'openrouter/free'",
  "id: 'nvidia-kimi'",
  'Magnanimous AI is the durable remembrance layer'
]) {
  if (!providerFinal.includes(required)) throw new Error(`Provider verification failed: ${required}`);
}
const deployFinal = read(deployPath);
for (const required of ['NVIDIA_API_KEY: ${{ secrets.NVIDIA_API_KEY }}', 'sync_secret NVIDIA_API_KEY "$NVIDIA_API_KEY"']) {
  if (!deployFinal.includes(required)) throw new Error(`Deploy verification failed: ${required}`);
}
console.log('OpenRouter free fallback and NVIDIA secret sync are locked in additively.');

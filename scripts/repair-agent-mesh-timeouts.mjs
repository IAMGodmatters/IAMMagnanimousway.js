import fs from 'node:fs';

const path = 'worker/src/agent-mesh-runtime.js';
let text = fs.readFileSync(path, 'utf8');
let changed = false;

function replaceIfPresent(oldText, newText, label) {
  if (!text.includes(oldText)) return false;
  text = text.replace(oldText, newText);
  changed = true;
  console.log(`Applied ${label}.`);
  return true;
}

// This repair is also an idempotent production lock: once the hardened
// timeout and fallback signatures are present, later pushes verify them
// without rewriting a healthy Agent Mesh runtime.
// Production inference can legitimately take longer than 12 seconds on a cold
// Workers AI model. Keep a hard bound, but allow enough time for cold starts
// before failing over to another current Cloudflare-hosted model.
replaceIfPresent(
  'const AGENT_MODEL_TIMEOUT_MS=12000;\nconst AGENT_PROVIDER_TIMEOUT_MS=16000;',
  'const AGENT_MODEL_TIMEOUT_MS=25000;\nconst AGENT_PROVIDER_TIMEOUT_MS=30000;',
  'production-safe Agent Mesh provider timeouts'
);

// Keep the environment-selected models first, then use current Cloudflare
// hosted fallbacks. Qwen3-30B-A3B is a fast MoE fallback and the existing
// Gemma/Nemotron options remain available behind it.
replaceIfPresent(
  "  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,3)){",
  "  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),String(env.CLOUDFLARE_AI_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,4)){",
  'current Workers AI fallback chain'
);

if (!changed) {
  const timeoutReady = text.includes('const AGENT_MODEL_TIMEOUT_MS=25000;') && text.includes('const AGENT_PROVIDER_TIMEOUT_MS=30000;');
  const fallbackReady = text.includes("'@cf/qwen/qwen3-30b-a3b-fp8'") && text.includes('String(env.CLOUDFLARE_AI_MODEL||\'\')');
  if (timeoutReady && fallbackReady) {
    console.log('Agent Mesh cold-start timeout/failover repair already present.');
    process.exit(0);
  }
  throw new Error('Agent Mesh cold-start repair insertion points were not found; refusing to make an unsafe partial edit.');
}

fs.writeFileSync(path, text);
console.log('Agent Mesh cold-start timeout/failover repair applied.');

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
// timeout, model fallback, request compatibility, and cross-provider failover
// signatures are present, later pushes verify them without rewriting a healthy
// Agent Mesh runtime.
replaceIfPresent(
  'const AGENT_MODEL_TIMEOUT_MS=12000;\nconst AGENT_PROVIDER_TIMEOUT_MS=16000;',
  'const AGENT_MODEL_TIMEOUT_MS=25000;\nconst AGENT_PROVIDER_TIMEOUT_MS=30000;',
  'production-safe Agent Mesh provider timeouts'
);

// Keep the environment-selected models first, then use current Cloudflare
// hosted fallbacks.
replaceIfPresent(
  "  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,3)){",
  "  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),String(env.CLOUDFLARE_AI_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,4)){",
  'current Workers AI fallback chain'
);

// Workers AI chat models have evolved across more than one input schema. Use
// the current completion-token field first, then retry the same model with the
// minimal documented {messages} payload before moving on. Also retain known
// fast Llama chat models as a separate model family so one model family cannot
// take down the native Agent Mesh.
replaceIfPresent(
  "  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),String(env.CLOUDFLARE_AI_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,4)){\n   try{\n    const out=await withTimeout(()=>env.AI.run(model,{messages,max_tokens:AGENT_MAX_TOKENS}),AGENT_MODEL_TIMEOUT_MS,`Cloudflare Workers AI ${model}`);\n    const value=extractCloudflareText(out).trim();\n    if(value)return{text:value,model};\n    errors.push(`${model}: empty`);\n   }catch(e){errors.push(`${model}: ${e?.message||'failed'}`)}\n  }",
  "  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),String(env.CLOUDFLARE_AI_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b','@cf/meta/llama-3.1-8b-instruct-fast','@cf/meta/llama-3.3-70b-instruct-fp8-fast'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,6)){\n   try{\n    let out;\n    try{\n     out=await withTimeout(()=>env.AI.run(model,{messages,max_completion_tokens:AGENT_MAX_TOKENS}),AGENT_MODEL_TIMEOUT_MS,`Cloudflare Workers AI ${model}`);\n    }catch(primaryError){\n     try{\n      out=await withTimeout(()=>env.AI.run(model,{messages}),AGENT_MODEL_TIMEOUT_MS,`Cloudflare Workers AI ${model} compatibility retry`);\n     }catch(compatError){\n      throw new Error(`${primaryError?.message||'primary request failed'}; compatibility retry: ${compatError?.message||'failed'}`);\n     }\n    }\n    const value=extractCloudflareText(out).trim();\n    if(value)return{text:value,model};\n    errors.push(`${model}: empty`);\n   }catch(e){errors.push(`${model}: ${e?.message||'failed'}`)}\n  }",
  'Workers AI request compatibility and model-family fallback'
);

// A requested provider is a routing preference, never a hard dependency.
// Magnanimous remains the commander: try the requested configured worker first,
// then fail over through every other configured worker in priority order.
replaceIfPresent(
  "  const requested=String(body.provider||'auto').toLowerCase();const candidates=requested==='auto'?[...PROVIDERS].sort((a,b)=>a.priority-b.priority):PROVIDERS.filter(p=>p.id===requested);\n  const ready=candidates.filter(p=>configured(env,p));",
  "  const requested=String(body.provider||'auto').toLowerCase();\n  const ordered=[...PROVIDERS].sort((a,b)=>a.priority-b.priority);\n  const preferred=requested==='auto'?null:ordered.find(p=>p.id===requested);\n  const candidates=preferred?[preferred,...ordered.filter(p=>p.id!==preferred.id)]:ordered;\n  const ready=candidates.filter(p=>configured(env,p));",
  'Magnanimous cross-provider failover routing'
);

const timeoutReady = text.includes('const AGENT_MODEL_TIMEOUT_MS=25000;') && text.includes('const AGENT_PROVIDER_TIMEOUT_MS=30000;');
const fallbackReady = text.includes("'@cf/qwen/qwen3-30b-a3b-fp8'") && text.includes("String(env.CLOUDFLARE_AI_MODEL||'')");
const compatibilityReady = text.includes("'@cf/meta/llama-3.1-8b-instruct-fast'") && text.includes('max_completion_tokens:AGENT_MAX_TOKENS') && text.includes('compatibility retry');
const routingReady = text.includes("const ordered=[...PROVIDERS].sort((a,b)=>a.priority-b.priority);") && text.includes("const preferred=requested==='auto'?null:ordered.find(p=>p.id===requested);") && text.includes("const candidates=preferred?[preferred,...ordered.filter(p=>p.id!==preferred.id)]:ordered;");

if (!timeoutReady || !fallbackReady || !compatibilityReady || !routingReady) {
  throw new Error('Agent Mesh resilience repair insertion points were not found; refusing to make an unsafe partial edit.');
}

if (!changed) {
  console.log('Agent Mesh timeout, request compatibility, model fallback, and cross-provider failover repair already present.');
  process.exit(0);
}

fs.writeFileSync(path, text);
console.log('Agent Mesh resilience repair applied.');

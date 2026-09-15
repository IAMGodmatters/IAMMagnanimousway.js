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

replaceIfPresent(
  'const AGENT_MODEL_TIMEOUT_MS=12000;\nconst AGENT_PROVIDER_TIMEOUT_MS=16000;',
  'const AGENT_MODEL_TIMEOUT_MS=25000;\nconst AGENT_PROVIDER_TIMEOUT_MS=30000;',
  'production-safe Agent Mesh provider timeouts'
);

const currentCloudflare = `async function runProvider(id,env,messages,requestedModel=''){
 if(id==='cloudflare-ai'){
  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),String(env.CLOUDFLARE_AI_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b','@cf/meta/llama-3.1-8b-instruct-fast','@cf/meta/llama-3.3-70b-instruct-fp8-fast'].filter(Boolean);
  const errors=[];
  for(const model of [...new Set(models)].slice(0,6)){
   try{
    let out;
    try{
     out=await withTimeout(()=>env.AI.run(model,{messages,max_completion_tokens:AGENT_MAX_TOKENS}),AGENT_MODEL_TIMEOUT_MS,\`Cloudflare Workers AI \${model}\`);
    }catch(primaryError){
     try{
      out=await withTimeout(()=>env.AI.run(model,{messages}),AGENT_MODEL_TIMEOUT_MS,\`Cloudflare Workers AI \${model} compatibility retry\`);
     }catch(compatError){
      throw new Error(\`\${primaryError?.message||'primary request failed'}; compatibility retry: \${compatError?.message||'failed'}\`);
     }
    }
    const value=extractCloudflareText(out).trim();
    if(value)return{text:value,model};
    errors.push(\`\${model}: empty\`);
   }catch(e){errors.push(\`\${model}: \${e?.message||'failed'}\`)}
  }
  throw new Error(errors.join(' | '));
 }`;

const hardenedCloudflare = `function cloudflareAccountLevelError(error){
 const value=String(error?.message||error||'').toLowerCase();
 return /(?:\\b3036\\b|daily free allocation|account blocked|\\b3023\\b|authentication error|\\b10000\\b)/.test(value);
}

function classifyAgentFailure(errors){
 const value=errors.join(' | ').toLowerCase();
 if(/(?:\\b3036\\b|daily free allocation|out of capacity|\\b3040\\b)/.test(value))return'capacity';
 if(/(?:authentication error|\\b10000\\b|account blocked|\\b3023\\b)/.test(value))return'authorization';
 if(/(?:timed out|timeout|\\b3007\\b)/.test(value))return'timeout';
 if(/(?:paid plan|not allowed|\\b5035\\b|\\b5018\\b|\\b3041\\b)/.test(value))return'model-access';
 if(/(?:invalid|incomplete request|\\b5004\\b|\\b3003\\b|\\b3042\\b)/.test(value))return'request-contract';
 return'unavailable';
}

async function runProvider(id,env,messages,requestedModel=''){
 if(id==='cloudflare-ai'){
  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),String(env.CLOUDFLARE_AI_MODEL||''),'@cf/meta/llama-3.2-1b-instruct','@cf/meta/llama-3.1-8b-instruct-fast','@cf/zai-org/glm-4.7-flash','@cf/qwen/qwen3-30b-a3b-fp8','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b','@cf/meta/llama-3.3-70b-instruct-fp8-fast'].filter(Boolean);
  const errors=[];
  for(const model of [...new Set(models)].slice(0,7)){
   try{
    let out;
    try{
     out=await withTimeout(()=>env.AI.run(model,{messages,max_tokens:AGENT_MAX_TOKENS}),AGENT_MODEL_TIMEOUT_MS,\`Cloudflare Workers AI \${model}\`);
    }catch(primaryError){
     if(cloudflareAccountLevelError(primaryError))throw primaryError;
     try{
      out=await withTimeout(()=>env.AI.run(model,{messages}),AGENT_MODEL_TIMEOUT_MS,\`Cloudflare Workers AI \${model} compatibility retry\`);
     }catch(compatError){
      if(cloudflareAccountLevelError(compatError))throw compatError;
      throw new Error(\`\${primaryError?.message||'primary request failed'}; compatibility retry: \${compatError?.message||'failed'}\`);
     }
    }
    const value=extractCloudflareText(out).trim();
    if(value)return{text:value,model};
    errors.push(\`\${model}: empty\`);
   }catch(e){
    errors.push(\`\${model}: \${e?.message||'failed'}\`);
    if(cloudflareAccountLevelError(e))break;
   }
  }
  throw new Error(errors.join(' | '));
 }`;

replaceIfPresent(currentCloudflare, hardenedCloudflare, 'Workers AI supported schema, low-cost fallback, and account-limit short-circuit');

replaceIfPresent(
  "   }catch(e){errors.push(`${p.name}: ${e?.message||'failed'}`)}\n  }\n  return json({detail:`Agent Mesh could not complete the request. ${errors.join(' | ')}`,code:'AGENT_PROVIDER_FAILURE'},502);",
  "   }catch(e){errors.push(`${p.name}: ${e?.message||'failed'}`)}\n  }\n  console.error('Agent Mesh execution failed',errors);\n  return json({detail:`Agent Mesh could not complete the request. ${errors.join(' | ')}`,code:'AGENT_PROVIDER_FAILURE',failure_class:classifyAgentFailure(errors)},502);",
  'server-side Agent Mesh diagnostics with privacy-safe failure class'
);

replaceIfPresent(
  "  const requested=String(body.provider||'auto').toLowerCase();const candidates=requested==='auto'?[...PROVIDERS].sort((a,b)=>a.priority-b.priority):PROVIDERS.filter(p=>p.id===requested);\n  const ready=candidates.filter(p=>configured(env,p));",
  "  const requested=String(body.provider||'auto').toLowerCase();\n  const ordered=[...PROVIDERS].sort((a,b)=>a.priority-b.priority);\n  const preferred=requested==='auto'?null:ordered.find(p=>p.id===requested);\n  const candidates=preferred?[preferred,...ordered.filter(p=>p.id!==preferred.id)]:ordered;\n  const ready=candidates.filter(p=>configured(env,p));",
  'Magnanimous cross-provider failover routing'
);

const timeoutReady=text.includes('const AGENT_MODEL_TIMEOUT_MS=25000;')&&text.includes('const AGENT_PROVIDER_TIMEOUT_MS=30000;');
const schemaReady=text.includes("'@cf/meta/llama-3.2-1b-instruct'")&&text.includes('max_tokens:AGENT_MAX_TOKENS')&&text.includes('cloudflareAccountLevelError');
const diagnosticReady=text.includes("failure_class:classifyAgentFailure(errors)")&&text.includes("console.error('Agent Mesh execution failed',errors)");
const routingReady=text.includes("const candidates=preferred?[preferred,...ordered.filter(p=>p.id!==preferred.id)]:ordered;");

if(!timeoutReady||!schemaReady||!diagnosticReady||!routingReady){
  throw new Error('Agent Mesh resilience repair insertion points were not found; refusing to make an unsafe partial edit.');
}

if(!changed){
  console.log('Agent Mesh timeout, Workers AI schema, capacity guard, diagnostics, and cross-provider failover repair already present.');
  process.exit(0);
}

fs.writeFileSync(path,text);
console.log('Agent Mesh resilience repair applied.');

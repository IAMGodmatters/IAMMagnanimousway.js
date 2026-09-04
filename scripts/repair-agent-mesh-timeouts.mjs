import fs from 'node:fs';

const path = 'worker/src/agent-mesh-runtime.js';
let text = fs.readFileSync(path, 'utf8');

if (text.includes('const AGENT_MODEL_TIMEOUT_MS=12000;') && text.includes('AGENT_PROVIDER_TIMEOUT_MS=16000')) {
  console.log('Agent Mesh timeout/failover repair already present.');
  process.exit(0);
}

function replaceExact(oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`${label} insertion point not found`);
  text = text.replace(oldText, newText);
}

replaceExact(
  "const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});\nconst now=()=>Math.floor(Date.now()/1000);",
  `const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});\nconst now=()=>Math.floor(Date.now()/1000);\nconst AGENT_MODEL_TIMEOUT_MS=12000;\nconst AGENT_PROVIDER_TIMEOUT_MS=16000;\nconst AGENT_MAX_TOKENS=800;\n\nasync function withTimeout(factory,ms,label){\n let timer;\n try{\n  return await Promise.race([\n   Promise.resolve().then(factory),\n   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(\`${'${label}'} timed out after ${'${ms}'}ms\`)),ms)})\n  ]);\n }finally{if(timer)clearTimeout(timer)}\n}`,
  'timeout helpers'
);

replaceExact(
  "async function chatCompletionsCompatible(base,key,model,messages,label,extraHeaders={}){\n const r=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`,...extraHeaders},body:JSON.stringify({model,messages,temperature:.45,max_tokens:1600})});\n const d=await r.json().catch(()=>({}));\n if(!r.ok)throw new Error(d?.error?.message||d?.message||`${label} request failed (${r.status})`);\n return {text:String(d?.choices?.[0]?.message?.content||''),model};\n}",
  "async function chatCompletionsCompatible(base,key,model,messages,label,extraHeaders={}){\n const r=await withTimeout(()=>fetch(`${base}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`,...extraHeaders},body:JSON.stringify({model,messages,temperature:.45,max_tokens:AGENT_MAX_TOKENS})}),AGENT_PROVIDER_TIMEOUT_MS,label);\n const d=await r.json().catch(()=>({}));\n if(!r.ok)throw new Error(d?.error?.message||d?.message||`${label} request failed (${r.status})`);\n return {text:String(d?.choices?.[0]?.message?.content||''),model};\n}",
  'chat completions timeout'
);

replaceExact(
  " if(id==='cloudflare-ai'){\n  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)]){\n   try{const out=await env.AI.run(model,{messages,max_tokens:1600});const value=extractCloudflareText(out).trim();if(value)return{text:value,model};errors.push(`${model}: empty`)}catch(e){errors.push(`${model}: ${e?.message||'failed'}`)}\n  }\n  throw new Error(errors.join(' | '));\n }",
  " if(id==='cloudflare-ai'){\n  const models=[requestedModel,String(env.AGENT_CLOUDFLARE_MODEL||''),'@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].filter(Boolean);\n  const errors=[];\n  for(const model of [...new Set(models)].slice(0,3)){\n   try{\n    const out=await withTimeout(()=>env.AI.run(model,{messages,max_tokens:AGENT_MAX_TOKENS}),AGENT_MODEL_TIMEOUT_MS,`Cloudflare Workers AI ${model}`);\n    const value=extractCloudflareText(out).trim();\n    if(value)return{text:value,model};\n    errors.push(`${model}: empty`);\n   }catch(e){errors.push(`${model}: ${e?.message||'failed'}`)}\n  }\n  throw new Error(errors.join(' | '));\n }",
  'Cloudflare model timeout'
);

replaceExact(
  "  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents,generationConfig:{temperature:.45,maxOutputTokens:1600}})});",
  "  const r=await withTimeout(()=>fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents,generationConfig:{temperature:.45,maxOutputTokens:AGENT_MAX_TOKENS}})}),AGENT_PROVIDER_TIMEOUT_MS,'Google Gemini');",
  'Google timeout'
);

replaceExact(
  "  const prior=(await history(env,user,agent.id)).slice(-12).filter(x=>x.content!==message).map(x=>({role:x.role==='assistant'?'assistant':'user',content:x.content}));",
  "  const prior=(await history(env,user,agent.id)).slice(-8).filter(x=>x.content!==message).map(x=>({role:x.role==='assistant'?'assistant':'user',content:String(x.content||'').slice(0,4000)}));",
  'history compaction'
);

fs.writeFileSync(path, text);
console.log('Agent Mesh timeout/failover repair applied.');

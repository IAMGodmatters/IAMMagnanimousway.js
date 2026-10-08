const EDGE_AI_BRIDGE_VERSION='2026-10-08.1';

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}

async function digest(value){
  return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||''))));
}

async function secureEqual(a,b){
  if(!a||!b)return false;
  const [da,db]=await Promise.all([digest(a),digest(b)]);
  if(da.length!==db.length)return false;
  let diff=0;
  for(let i=0;i<da.length;i++)diff|=da[i]^db[i];
  return diff===0;
}

async function integrationDerivedToken(value){
  const raw=String(value||'').trim();
  if(!raw)return'';
  const bytes=await digest('magnanimous-edge-ai-bridge-integration-v1\0'+raw);
  return[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function extractText(result){
  if(typeof result==='string')return result.trim();
  if(typeof result?.response==='string')return result.response.trim();
  if(typeof result?.result?.response==='string')return result.result.response.trim();
  if(typeof result?.result==='string')return result.result.trim();
  if(Array.isArray(result?.choices))return result.choices.map(x=>x?.message?.content||x?.text||'').filter(Boolean).join('\n').trim();
  return '';
}

const CURRENT_FALLBACK_MODELS=[
  '@cf/zai-org/glm-4.7-flash',
  '@cf/qwen/qwen3-30b-a3b-fp8',
  '@cf/google/gemma-4-26b-a4b-it',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
];

function approvedModels(env){
  return new Set([
    String(env.CLOUDFLARE_AI_MODEL||'').trim(),
    String(env.AGENT_CLOUDFLARE_MODEL||'').trim(),
    String(env.MAGNANIMOUS_HEAVY_MODEL||'').trim(),
    ...CURRENT_FALLBACK_MODELS
  ].filter(Boolean));
}

function candidateModels(env,requested){
  const approved=approvedModels(env);
  return [...new Set([
    String(requested||'').trim(),
    String(env.CLOUDFLARE_AI_MODEL||'').trim(),
    String(env.AGENT_CLOUDFLARE_MODEL||'').trim(),
    ...CURRENT_FALLBACK_MODELS
  ].filter(model=>model&&approved.has(model)))];
}

function normalizeMessages(input){
  return (Array.isArray(input?.messages)?input.messages:[]).slice(0,40).map(item=>({
    role:['system','user','assistant'].includes(String(item?.role||''))?String(item.role):'user',
    content:String(item?.content||'').slice(0,20000)
  }));
}

export async function handleEdgeAiBridge(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api/internal/edge-ai/run')return null;
  if(String(env?.MAGNANIMOUS_RUNTIME||'').trim()==='standalone-node')return json({detail:'Not found.'},404);
  if(request.method!=='POST')return json({detail:'Method not allowed.'},405);

  const expected=String(env?.MAGNANIMOUS_EDGE_AI_BRIDGE_TOKEN||'').trim();
  const integrationFallback=await integrationDerivedToken(env?.INTEGRATION_CREDENTIALS_KEY);
  const authorization=String(request.headers.get('authorization')||'');
  const supplied=authorization.toLowerCase().startsWith('bearer ')?authorization.slice(7).trim():'';
  const authorized=(expected&&await secureEqual(expected,supplied))||(integrationFallback&&await secureEqual(integrationFallback,supplied));
  if(!authorized)return json({detail:'Unauthorized.'},401);
  if(!env?.AI||typeof env.AI.run!=='function')return json({detail:'Workers AI binding unavailable.'},503);

  const contentLength=Number(request.headers.get('content-length')||0);
  if(contentLength>250000)return json({detail:'Request too large.'},413);
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=='object')return json({detail:'Invalid JSON body.'},400);

  const requested=String(body.model||'').trim();
  if(requested&&!approvedModels(env).has(requested))return json({detail:'Model is not approved for the private edge bridge.'},400);
  const messages=normalizeMessages(body);
  if(!messages.length)return json({detail:'At least one message is required.'},400);
  const maxTokens=Math.max(32,Math.min(3200,Number(body.max_tokens||body.max_completion_tokens||2200)||2200));
  const models=candidateModels(env,requested);
  if(!models.length)return json({detail:'No approved Workers AI model is configured.'},503);

  const errors=[];
  for(const model of models){
    try{
      let result;
      try{result=await env.AI.run(model,{messages,max_completion_tokens:maxTokens});}
      catch(primaryError){
        try{result=await env.AI.run(model,{messages,max_tokens:maxTokens});}
        catch(secondaryError){
          errors.push(`${model}: ${String(secondaryError?.message||primaryError?.message||secondaryError||primaryError)}`);
          continue;
        }
      }
      const text=extractText(result);
      if(!text){errors.push(`${model}: empty response`);continue;}
      return json({ok:true,bridge_version:EDGE_AI_BRIDGE_VERSION,model,response:text,result:{response:text}});
    }catch(error){
      errors.push(`${model}: ${String(error?.message||error)}`);
    }
  }
  console.error('Private edge AI bridge execution failed',errors.join(' | '));
  return json({detail:'Private edge AI bridge execution failed.'},502);
}

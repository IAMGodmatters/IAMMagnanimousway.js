"use client";

type ChatTransportOptions={
  retryTransientEdgeOnce?:boolean;
};

const PUBLIC_INFO_INTENT=/\b(link|url|website|web\s*site|official\s+(?:site|page|link|website)|source|citation|where\s+(?:can|do)\s+i\s+apply|how\s+(?:can|do)\s+i\s+apply|apply|application|form|eligib\w*|benefit\w*|ssdi|ssi|social\s+security|medicare|medicaid|disability|embassy|consulate|government|agency|office|contact|phone\s+number|address|email\s+address|deadline|requirement\w*|law|regulation|rule\w*|fee|price|cost|status|schedule|appointment|current|latest|today|recent|verify|research|news|availability)\b/i;

function enhancePublicInfoGrounding(init:RequestInit){
  if(typeof init.body!=="string")return init;
  try{
    const payload=JSON.parse(init.body);
    const message=String(payload?.message||payload?.prompt||payload?.input||"");
    if(!PUBLIC_INFO_INTENT.test(message))return init;
    return{
      ...init,
      body:JSON.stringify({
        ...payload,
        live_search:true,
        use_knowledge:true,
        remember_search:payload?.remember_search!==false,
        research_reason:payload?.research_reason||"automatic-public-information-grounding"
      })
    };
  }catch{return init}
}

async function transientEdgeHtml(response:Response){
  if(![502,503,504].includes(response.status))return false;
  const type=String(response.headers.get("content-type")||"").toLowerCase();
  if(type.includes("text/html"))return true;
  if(type.includes("application/json"))return false;
  const prefix=await response.clone().text().catch(()=>"");
  return /^\s*</.test(prefix);
}

export async function postMagnanimousChat(url:string,init:RequestInit,options:ChatTransportOptions={}){
  const groundedInit=enhancePublicInfoGrounding(init);
  const attempt=()=>fetch(url,{...groundedInit,cache:"no-store"});
  let response=await attempt();
  if(options.retryTransientEdgeOnce&&await transientEdgeHtml(response)){
    await new Promise(resolve=>setTimeout(resolve,900));
    response=await attempt();
  }
  return response;
}

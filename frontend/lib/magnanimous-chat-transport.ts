"use client";

type ChatTransportOptions={
  retryTransientEdgeOnce?:boolean;
};

async function transientEdgeHtml(response:Response){
  if(![502,503,504].includes(response.status))return false;
  const type=String(response.headers.get("content-type")||"").toLowerCase();
  if(type.includes("text/html"))return true;
  if(type.includes("application/json"))return false;
  const prefix=await response.clone().text().catch(()=>"");
  return /^\s*</.test(prefix);
}

export async function postMagnanimousChat(url:string,init:RequestInit,options:ChatTransportOptions={}){
  const attempt=()=>fetch(url,{...init,cache:"no-store"});
  let response=await attempt();
  if(options.retryTransientEdgeOnce&&await transientEdgeHtml(response)){
    await new Promise(resolve=>setTimeout(resolve,900));
    response=await attempt();
  }
  return response;
}

"use client";

type ChatTransportOptions={
  retryTransientEdgeOnce?:boolean;
  maxTransientEdgeRetries?:number;
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
  const attempt=(n:number)=>{
    const headers=new Headers(init.headers||{});
    if(n>0)headers.set("x-magnanimous-self-heal-attempt",String(n));
    return fetch(url,{...init,headers,cache:"no-store"});
  };
  let response=await attempt(0);
  if(!options.retryTransientEdgeOnce)return response;
  const retries=Math.max(1,Math.min(2,options.maxTransientEdgeRetries??2));
  for(let n=1;n<=retries&&await transientEdgeHtml(response);n++){
    await new Promise(resolve=>setTimeout(resolve,700*n));
    response=await attempt(n);
  }
  return response;
}

'use client';

import {useEffect} from 'react';

type CacheEntry={response:Response;expiresAt:number;staleUntil:number};

const cache=new Map<string,CacheEntry>();
const inflight=new Map<string,Promise<Response>>();
let cooldownUntil=0;

function requestParts(input:RequestInfo|URL,init?:RequestInit){
  const request=input instanceof Request?input:null;
  const method=String(init?.method||request?.method||'GET').toUpperCase();
  const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  let url:URL;
  try{url=new URL(raw,window.location.origin)}catch{return null}
  if(url.origin!==window.location.origin)return null;
  return{method,url};
}

function ttlFor(path:string){
  if(/^\/api\/contact-center\/(overview|capabilities|campaigns|callbacks|voicemails|dispositions|supervisor\/live|ivr|inbox)$/.test(path))return 90_000;
  if(/^\/api\/phone\/(summary|agents|queues|calls)$/.test(path))return 60_000;
  if(path==='/api/teach/health')return 300_000;
  return 0;
}

function cacheKey(url:URL){return `${url.pathname}${url.search}`}

export default function ApiBudgetGuard(){
  useEffect(()=>{
    const original=window.fetch.bind(window);

    window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
      const parts=requestParts(input,init);
      if(!parts||parts.method!=='GET')return original(input,init);
      const ttl=ttlFor(parts.url.pathname);
      if(!ttl)return original(input,init);

      const key=cacheKey(parts.url);
      const now=Date.now();
      const saved=cache.get(key);

      if(saved&&saved.expiresAt>now)return saved.response.clone();
      if(document.visibilityState==='hidden'&&saved&&saved.staleUntil>now)return saved.response.clone();
      if(cooldownUntil>now&&saved&&saved.staleUntil>now)return saved.response.clone();

      const pending=inflight.get(key);
      if(pending)return (await pending).clone();

      const network=original(input,init).then(response=>{
        if(response.ok){
          const stored=response.clone();
          cache.set(key,{response:stored,expiresAt:Date.now()+ttl,staleUntil:Date.now()+Math.max(ttl*10,900_000)});
        }else if(response.status===429){
          cooldownUntil=Math.max(cooldownUntil,Date.now()+300_000);
        }
        return response;
      }).finally(()=>inflight.delete(key));

      inflight.set(key,network);
      return (await network).clone();
    };

    return()=>{window.fetch=original;inflight.clear()};
  },[]);

  return null;
}

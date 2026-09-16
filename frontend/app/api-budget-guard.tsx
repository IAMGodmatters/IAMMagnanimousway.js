'use client';

import {useEffect} from 'react';

type CacheEntry={response:Response;expiresAt:number;staleUntil:number};

type RequestParts={method:string;url:URL;authScope:string};

const cache=new Map<string,CacheEntry>();
const inflight=new Map<string,Promise<Response>>();
let cooldownUntil=0;

function requestParts(input:RequestInfo|URL,init?:RequestInit):RequestParts|null{
  const request=input instanceof Request?input:null;
  const method=String(init?.method||request?.method||'GET').toUpperCase();
  const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  let url:URL;
  try{url=new URL(raw,window.location.origin)}catch{return null}
  if(url.origin!==window.location.origin)return null;

  const headers=new Headers(request?.headers||undefined);
  if(init?.headers)new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
  const authScope=headers.get('authorization')||'anonymous';
  return{method,url,authScope};
}

function ttlFor(path:string){
  if(/^\/api\/contact-center\/(overview|capabilities|campaigns|callbacks|voicemails|dispositions|supervisor\/live|ivr|inbox)$/.test(path))return 90_000;
  if(/^\/api\/phone\/(summary|agents|queues|calls)$/.test(path))return 60_000;
  if(path==='/api/teach/health')return 300_000;
  return 0;
}

function cacheKey(parts:RequestParts){return `${parts.authScope}\u0000${parts.url.pathname}${parts.url.search}`}

export default function ApiBudgetGuard(){
  useEffect(()=>{
    const original=window.fetch.bind(window);

    window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
      const parts=requestParts(input,init);
      if(!parts)return original(input,init);

      if(parts.method!=='GET'){
        if(parts.url.pathname.startsWith('/api/contact-center/')||parts.url.pathname.startsWith('/api/phone/')){
          cache.clear();
          inflight.clear();
        }
        return original(input,init);
      }

      const ttl=ttlFor(parts.url.pathname);
      if(!ttl)return original(input,init);

      const key=cacheKey(parts);
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
          const time=Date.now();
          cache.set(key,{response:stored,expiresAt:time+ttl,staleUntil:time+Math.max(ttl*10,900_000)});
        }else if([429,502,503,504].includes(response.status)){
          cooldownUntil=Math.max(cooldownUntil,Date.now()+300_000);
        }
        return response;
      }).finally(()=>inflight.delete(key));

      inflight.set(key,network);
      return (await network).clone();
    };

    return()=>{window.fetch=original;cache.clear();inflight.clear()};
  },[]);

  return null;
}

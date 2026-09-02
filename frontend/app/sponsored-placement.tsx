'use client';

import { useEffect, useState } from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Ad={id:number;title:string;url:string;label:string;placement:string;active:number|boolean};

export default function SponsoredPlacement(){
 const[ads,setAds]=useState<Ad[]>([]),[index,setIndex]=useState(0),[path,setPath]=useState('');
 useEffect(()=>{setPath(location.pathname);if(location.pathname!=='/')return;(async()=>{try{const r=await fetch(`${api}/api/ads?placement=home`,{cache:'no-store'});if(!r.ok)return;const d=await r.json();setAds(Array.isArray(d.ads)?d.ads:[])}catch{}})()},[]);
 useEffect(()=>{if(ads.length<2)return;const timer=setInterval(()=>setIndex(i=>(i+1)%ads.length),12000);return()=>clearInterval(timer)},[ads.length]);
 if(path!=='/'||ads.length===0)return null;
 const ad=ads[index%ads.length];
 return <aside className="sponsored" aria-label="Sponsored placement"><span>{ad.label||'Sponsored'}</span><a href={ad.url} target="_blank" rel="sponsored noopener noreferrer">{ad.title}<b>↗</b></a><style jsx>{`
 .sponsored{position:fixed;left:76px;bottom:17px;z-index:2147482990;display:flex;align-items:center;gap:8px;max-width:min(480px,calc(100vw - 170px));padding:7px 10px;border:1px solid rgba(255,187,67,.3);border-radius:12px;background:rgba(8,10,12,.92);box-shadow:0 12px 36px rgba(0,0,0,.35);backdrop-filter:blur(12px);font-family:Inter,system-ui,sans-serif}.sponsored span{font-size:7px;letter-spacing:.12em;color:#bd9148;text-transform:uppercase;white-space:nowrap}.sponsored a{color:#d9e8ef;text-decoration:none;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sponsored a b{margin-left:6px;color:#67dcff}@media(max-width:620px){.sponsored{left:70px;right:70px;max-width:none}.sponsored span{display:none}}
 `}</style></aside>
}

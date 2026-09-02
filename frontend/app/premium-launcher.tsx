'use client';

import {useEffect,useState} from 'react';

export default function PremiumLauncher(){
 const[path,setPath]=useState('');
 useEffect(()=>setPath(location.pathname),[]);
 if(path!=='/')return null;
 return <nav className="premiumLauncher" aria-label="Plan and premium AI features"><a href="/billing"><b>FREE + PREMIUM</b><span>$0 / $49 plan</span></a><a href="/voice-agents"><b>VOICE AI</b><span>Phone agents</span></a><a href="/video-agents"><b>VIDEO AI</b><span>Live human avatar</span></a><style jsx>{`
 .premiumLauncher{position:fixed;z-index:2147482988;right:16px;top:16px;display:flex;gap:6px;font-family:Inter,system-ui,sans-serif}.premiumLauncher a{min-width:92px;padding:8px 10px;border:1px solid rgba(64,174,217,.34);border-radius:11px;background:rgba(5,12,18,.9);backdrop-filter:blur(12px);text-decoration:none;box-shadow:0 12px 35px rgba(0,0,0,.28)}.premiumLauncher b,.premiumLauncher span{display:block}.premiumLauncher b{color:#a8ebff;font-size:7px;letter-spacing:.1em}.premiumLauncher span{color:#718c9e;font-size:7px;margin-top:3px}.premiumLauncher a:first-child{border-color:rgba(231,181,84,.34)}.premiumLauncher a:first-child b{color:#edc56e}@media(max-width:620px){.premiumLauncher{left:14px;right:14px;top:10px}.premiumLauncher a{min-width:0;flex:1;padding:7px}.premiumLauncher span{display:none}}
 `}</style></nav>
}

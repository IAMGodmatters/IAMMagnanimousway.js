'use client';
import type {ReactNode} from 'react';
import {useEffect} from 'react';

export default function SocialConnectLayout({children}:{children:ReactNode}){
 useEffect(()=>{
  try{
   const q=new URLSearchParams(location.search),connected=q.get('connected');
   if(connected&&sessionStorage.getItem('iam-social-hub-return')==='1'){
    sessionStorage.removeItem('iam-social-hub-return');
    location.replace(`/social-hub?connected=${encodeURIComponent(connected)}`);
   }
  }catch{}
 },[]);
 return children;
}

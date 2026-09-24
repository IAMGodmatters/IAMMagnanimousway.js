'use client';

import {Web} from 'sip.js';

export type NativeBrowserSession={
 session_id:string;
 username:string;
 password:string;
 domain:string;
 wss_url:string;
 expires_at:number;
 expires_in?:number;
 pstn_direct:false;
 allowed_call_scope?:string[];
 compatibility_fallback?:boolean;
};

export type NativePhoneEvents={
 onRegistered?:()=>void;
 onUnregistered?:()=>void;
 onIncoming?:()=>void;
 onAnswered?:()=>void;
 onHangup?:()=>void;
 onError?:(message:string)=>void;
};

export class MagnanimousNativePhone{
 private readonly session:NativeBrowserSession;
 private readonly events:NativePhoneEvents;
 private readonly phone:Web.SimpleUser;

 constructor(session:NativeBrowserSession,remoteAudio:HTMLAudioElement,events:NativePhoneEvents={}){
  this.session=session;
  this.events=events;
  const expires=Math.max(300,Math.min(3600,Number(session.expires_in||600)));
  this.phone=new Web.SimpleUser(session.wss_url,{
   aor:`sip:${session.username}@${session.domain}`,
   media:{
    constraints:{audio:true,video:false},
    remote:{audio:remoteAudio}
   },
   registererOptions:{expires},
   userAgentOptions:{
    authorizationUsername:session.username,
    authorizationPassword:session.password,
    logBuiltinEnabled:false
   },
   delegate:{
    onRegistered:()=>this.events.onRegistered?.(),
    onUnregistered:()=>this.events.onUnregistered?.(),
    onCallReceived:()=>this.events.onIncoming?.(),
    onCallAnswered:()=>this.events.onAnswered?.(),
    onCallHangup:()=>this.events.onHangup?.(),
    onServerDisconnect:(error?:Error)=>this.events.onError?.(error?.message||'Native PBX disconnected.')
   }
  });
 }

 async start(){
  await this.phone.connect();
  await this.phone.register();
 }

 async stop(){
  try{await this.phone.unregister()}catch{}
  try{await this.phone.disconnect()}catch{}
 }

 async callInternal(extension:string){
  if(!/^\d{2,8}$/.test(extension))throw new Error('Native calls require a Magnanimous internal extension.');
  if(extension==='911'||extension==='112')throw new Error('Emergency calling is not enabled on the native Magnanimous PBX.');
  await this.phone.call(`sip:${extension}@${this.session.domain}`);
 }

 async answer(){await this.phone.answer()}
 async decline(){await this.phone.decline()}
 async hangup(){await this.phone.hangup()}
 async mute(){this.phone.mute()}
 async unmute(){this.phone.unmute()}
}

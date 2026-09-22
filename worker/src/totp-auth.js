const encoder=new TextEncoder();
const decoder=new TextDecoder();
const now=()=>Math.floor(Date.now()/1000);
const STEP_SECONDS=30;
const DIGITS=6;
const BASE32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function b64url(bytes){
 let binary='';
 for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromB64url(value){
 const raw=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
 const pad=raw.length%4?'='.repeat(4-(raw.length%4)):'';
 const binary=atob(raw+pad),out=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i+=1)out[i]=binary.charCodeAt(i);
 return out;
}
function base32Encode(bytes){
 let bits=0,value=0,out='';
 for(const byte of bytes){
  value=(value<<8)|byte;bits+=8;
  while(bits>=5){out+=BASE32[(value>>>(bits-5))&31];bits-=5}
 }
 if(bits>0)out+=BASE32[(value<<(5-bits))&31];
 return out;
}
function base32Decode(value){
 const clean=String(value||'').toUpperCase().replace(/[^A-Z2-7]/g,'');
 let bits=0,buffer=0,out=[];
 for(const char of clean){
  const v=BASE32.indexOf(char);if(v<0)continue;
  buffer=(buffer<<5)|v;bits+=5;
  if(bits>=8){out.push((buffer>>>(bits-8))&255);bits-=8}
 }
 return new Uint8Array(out);
}
async function sha256Bytes(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(String(value||''))))}
async function aesKey(env){
 const source=String(env?.MAGNANIMOUS_SECRETS_KEY||env?.SESSION_SECRET||'').trim();
 if(source.length<32)throw new Error('Secure TOTP storage is not configured.');
 const digest=await sha256Bytes('magnanimous-totp-v1:'+source);
 return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
export async function encryptTotpSecret(secret,env){
 const iv=crypto.getRandomValues(new Uint8Array(12)),key=await aesKey(env);
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(String(secret||''))));
 return 'v1.'+b64url(iv)+'.'+b64url(cipher);
}
export async function decryptTotpSecret(value,env){
 const [version,ivRaw,cipherRaw]=String(value||'').split('.');
 if(version!=='v1'||!ivRaw||!cipherRaw)throw new Error('Stored TOTP secret is invalid.');
 const key=await aesKey(env);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64url(ivRaw)},key,fromB64url(cipherRaw));
 return decoder.decode(plain);
}
export function generateTotpSecret(){return base32Encode(crypto.getRandomValues(new Uint8Array(20)))}
function counterBytes(counter){
 const bytes=new Uint8Array(8);let value=BigInt(counter);
 for(let i=7;i>=0;i-=1){bytes[i]=Number(value&255n);value>>=8n}
 return bytes;
}
async function codeForCounter(secret,counter){
 const raw=base32Decode(secret),key=await crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-1'},false,['sign']);
 const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,counterBytes(counter)));
 const offset=sig[sig.length-1]&15;
 const bin=((sig[offset]&127)<<24)|((sig[offset+1]&255)<<16)|((sig[offset+2]&255)<<8)|(sig[offset+3]&255);
 return String(bin%(10**DIGITS)).padStart(DIGITS,'0');
}
export async function verifyTotpCode(secret,code,{time=now(),window=1,lastCounter=-1}={}){
 const normalized=String(code||'').replace(/\D/g,'');
 if(!/^\d{6}$/.test(normalized))return{ok:false,counter:null};
 const current=Math.floor(Number(time)/STEP_SECONDS);
 for(let drift=-Math.max(0,window);drift<=Math.max(0,window);drift+=1){
  const counter=current+drift;
  if(counter<=Number(lastCounter||-1))continue;
  if(await codeForCounter(secret,counter)===normalized)return{ok:true,counter};
 }
 return{ok:false,counter:null};
}
export function totpAuthUri({secret,email,issuer='I AM MAGNANIMOUS WAY'}){
 const label=encodeURIComponent(String(issuer)+' ('+String(email||'account')+')');
 const params=new URLSearchParams({secret:String(secret),issuer:String(issuer),algorithm:'SHA1',digits:String(DIGITS),period:String(STEP_SECONDS)});
 return 'otpauth://totp/'+label+'?'+params.toString();
}

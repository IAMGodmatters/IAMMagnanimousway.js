export const MAGNANIMOUS_ADMIN_TOKEN='magnanimous_admin_token';
export const LEGACY_ODIN_ADMIN_TOKEN='odin_admin_token';
export const ACCOUNT_TOKEN='iam_account_token';
export const MAGNANIMOUS_ADMIN_SESSION_EXPIRES_AT='magnanimous_admin_session_expires_at';

export function getMagnanimousAdminToken(){
 if(typeof window==='undefined')return'';
 const expiresAt=Number(localStorage.getItem(MAGNANIMOUS_ADMIN_SESSION_EXPIRES_AT)||0);
 if(expiresAt&&Date.now()>=expiresAt){clearMagnanimousAdminToken();return''}
 const official=localStorage.getItem(MAGNANIMOUS_ADMIN_TOKEN)||'';
 if(official){
  if(!localStorage.getItem(LEGACY_ODIN_ADMIN_TOKEN))localStorage.setItem(LEGACY_ODIN_ADMIN_TOKEN,official);
  return official;
 }
 const legacy=localStorage.getItem(LEGACY_ODIN_ADMIN_TOKEN)||'';
 if(legacy){localStorage.setItem(MAGNANIMOUS_ADMIN_TOKEN,legacy);return legacy}
 return'';
}

export function setMagnanimousAdminToken(token:string,sessionExpiresAtSeconds?:number){
 if(typeof window==='undefined')return;
 const value=String(token||'').trim();
 if(value){
  localStorage.setItem(MAGNANIMOUS_ADMIN_TOKEN,value);
  localStorage.setItem(LEGACY_ODIN_ADMIN_TOKEN,value);
  const expiresAtMs=Number(sessionExpiresAtSeconds||0)*1000;
  if(expiresAtMs>Date.now())localStorage.setItem(MAGNANIMOUS_ADMIN_SESSION_EXPIRES_AT,String(expiresAtMs));
  else localStorage.removeItem(MAGNANIMOUS_ADMIN_SESSION_EXPIRES_AT);
 }else{
  localStorage.removeItem(MAGNANIMOUS_ADMIN_TOKEN);
  localStorage.removeItem(LEGACY_ODIN_ADMIN_TOKEN);
  localStorage.removeItem(MAGNANIMOUS_ADMIN_SESSION_EXPIRES_AT);
 }
}

export function clearMagnanimousAdminToken(){
 if(typeof window==='undefined')return;
 localStorage.removeItem(MAGNANIMOUS_ADMIN_TOKEN);
 localStorage.removeItem(LEGACY_ODIN_ADMIN_TOKEN);
 localStorage.removeItem(MAGNANIMOUS_ADMIN_SESSION_EXPIRES_AT);
}

export function getPlatformAuthToken(){
 if(typeof window==='undefined')return'';
 return getMagnanimousAdminToken()||localStorage.getItem(ACCOUNT_TOKEN)||'';
}

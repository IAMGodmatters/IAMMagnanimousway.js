export const MAGNANIMOUS_ADMIN_TOKEN='magnanimous_admin_token';
export const LEGACY_ODIN_ADMIN_TOKEN='odin_admin_token';
export const ACCOUNT_TOKEN='iam_account_token';

export function getMagnanimousAdminToken(){
 if(typeof window==='undefined')return'';
 const official=localStorage.getItem(MAGNANIMOUS_ADMIN_TOKEN)||'';
 if(official){
  if(!localStorage.getItem(LEGACY_ODIN_ADMIN_TOKEN))localStorage.setItem(LEGACY_ODIN_ADMIN_TOKEN,official);
  return official;
 }
 const legacy=localStorage.getItem(LEGACY_ODIN_ADMIN_TOKEN)||'';
 if(legacy){localStorage.setItem(MAGNANIMOUS_ADMIN_TOKEN,legacy);return legacy}
 return'';
}

export function setMagnanimousAdminToken(token:string){
 if(typeof window==='undefined')return;
 const value=String(token||'').trim();
 if(value){
  localStorage.setItem(MAGNANIMOUS_ADMIN_TOKEN,value);
  localStorage.setItem(LEGACY_ODIN_ADMIN_TOKEN,value);
 }else{
  localStorage.removeItem(MAGNANIMOUS_ADMIN_TOKEN);
  localStorage.removeItem(LEGACY_ODIN_ADMIN_TOKEN);
 }
}

export function clearMagnanimousAdminToken(){
 if(typeof window==='undefined')return;
 localStorage.removeItem(MAGNANIMOUS_ADMIN_TOKEN);
 localStorage.removeItem(LEGACY_ODIN_ADMIN_TOKEN);
}

export function getPlatformAuthToken(){
 if(typeof window==='undefined')return'';
 return getMagnanimousAdminToken()||localStorage.getItem(ACCOUNT_TOKEN)||'';
}

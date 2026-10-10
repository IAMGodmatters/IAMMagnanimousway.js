const PLANS = new Set(['plus', 'crm', 'studio', 'business', 'pro', 'scale']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNED_PREFIX='iams1';
const encoder=new TextEncoder();

export function normalizePaidPlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  return PLANS.has(plan) ? plan : '';
}

export function validTenantId(value) {
  return UUID_RE.test(String(value || '').trim());
}

async function hmacHex(secret,value){
  const clean=String(secret||'').trim();
  if(!clean)throw new Error('Payment reference signing is not configured.');
  const key=await crypto.subtle.importKey('raw',encoder.encode(clean),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const out=await crypto.subtle.sign('HMAC',key,encoder.encode(String(value||'')));
  return [...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}

// Legacy helpers remain only for non-security-sensitive compatibility tests and
// server-created Checkout Sessions that also carry immutable Stripe metadata.
// Hosted Payment Links MUST use the signed helpers below because customers can
// edit client_reference_id in a shared URL.
export function encodePlanPaymentReference(tenantId, plan) {
  const tenant = String(tenantId || '').trim();
  const normalized = normalizePaidPlan(plan);
  if (!validTenantId(tenant) || !normalized) throw new Error('Invalid payment reference.');
  if (normalized === 'business') return tenant;
  return `iam:${tenant}:plan:${normalized}`;
}

export function encodeTopupPaymentReference(tenantId) {
  const tenant = String(tenantId || '').trim();
  if (!validTenantId(tenant)) throw new Error('Invalid payment reference.');
  return `iam:${tenant}:topup`;
}

export async function encodeSignedPlanPaymentReference(secret,tenantId,plan){
  const tenant=String(tenantId||'').trim(),normalized=normalizePaidPlan(plan);
  if(!validTenantId(tenant)||!normalized)throw new Error('Invalid payment reference.');
  const payload=`${SIGNED_PREFIX}:${tenant}:plan:${normalized}`;
  return `${payload}:${await hmacHex(secret,payload)}`;
}

export async function encodeSignedTopupPaymentReference(secret,tenantId){
  const tenant=String(tenantId||'').trim();
  if(!validTenantId(tenant))throw new Error('Invalid payment reference.');
  const payload=`${SIGNED_PREFIX}:${tenant}:topup`;
  return `${payload}:${await hmacHex(secret,payload)}`;
}

export async function verifySignedPaymentReference(value,secret){
  const raw=String(value||'').trim(),parts=raw.split(':');
  if(parts[0]!==SIGNED_PREFIX)return{tenantId:'',kind:'invalid',plan:'',signed:false};
  let tenant='',kind='',plan='',payload='',signature='';
  if(parts.length===5&&parts[2]==='topup'){
    // Defensive: no valid signed topup has five fields.
    return{tenantId:'',kind:'invalid',plan:'',signed:false};
  }
  if(parts.length===4&&parts[2]==='topup'){
    [,,kind,signature]=parts;tenant=parts[1];payload=`${SIGNED_PREFIX}:${tenant}:topup`;
  }else if(parts.length===6&&parts[2]==='plan'){
    tenant=parts[1];kind='plan';plan=String(parts[3]||'').toLowerCase();signature=parts[5];
    // Six-field values are invalid; valid signed plan values contain five fields.
    return{tenantId:'',kind:'invalid',plan:'',signed:false};
  }else if(parts.length===5&&parts[2]==='plan'){
    tenant=parts[1];kind='plan';plan=String(parts[3]||'').toLowerCase();signature=parts[4];payload=`${SIGNED_PREFIX}:${tenant}:plan:${plan}`;
  }else return{tenantId:'',kind:'invalid',plan:'',signed:false};
  if(!validTenantId(tenant)||(kind==='plan'&&!normalizePaidPlan(plan))||!/^[0-9a-f]{64}$/i.test(signature))return{tenantId:'',kind:'invalid',plan:'',signed:false};
  let expected='';try{expected=await hmacHex(secret,payload)}catch{return{tenantId:'',kind:'invalid',plan:'',signed:false}}
  if(!safeEqual(signature,expected))return{tenantId:'',kind:'invalid',plan:'',signed:false};
  return{tenantId:tenant,kind,plan:kind==='plan'?plan:'',signed:true};
}

export function parsePaymentReference(value) {
  const raw = String(value || '').trim();
  if (validTenantId(raw)) return { tenantId: raw, kind: 'legacy', plan: '', signed:false };

  const planMatch = raw.match(/^iam:([0-9a-f-]{36}):plan:(plus|crm|studio|business|pro|scale)$/i);
  if (planMatch && validTenantId(planMatch[1])) {
    return { tenantId: planMatch[1], kind: 'plan', plan: planMatch[2].toLowerCase(), signed:false };
  }

  const topupMatch = raw.match(/^iam:([0-9a-f-]{36}):topup$/i);
  if (topupMatch && validTenantId(topupMatch[1])) {
    return { tenantId: topupMatch[1], kind: 'topup', plan: '', signed:false };
  }

  return { tenantId: '', kind: 'invalid', plan: '', signed:false };
}

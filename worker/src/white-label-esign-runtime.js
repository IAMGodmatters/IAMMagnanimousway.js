import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';
import {sendGrowthEmail} from './growth-email-transport.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=(v,n=12000)=>String(v??'').trim().slice(0,n);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const owner=u=>['owner','admin'].includes(String(u?.role||'').toLowerCase());
const email=v=>clean(v,254).toLowerCase();
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
const encoder=new TextEncoder();
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sha(value){const out=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));return[...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function token(){return b64url(crypto.getRandomValues(new Uint8Array(32)))}
async function agencyAccess(env,user){if(await isPlatformOwnerUser(env,user))return true;try{const row=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first();return['agency','agency_pro'].includes(String(row?.plan||'').toLowerCase())}catch{return false}}
async function contract(env,tenant,id){return env.DB.prepare('SELECT * FROM agency_contracts WHERE id=? AND tenant_id=? LIMIT 1').bind(id,tenant).first()}
function publicUrl(request,raw){return `${new URL(request.url).origin}/sign/${encodeURIComponent(raw)}`}
const CONSENT='By checking the box and typing my name, I consent to use electronic records and signatures for this document, intend my typed name to be my electronic signature, and understand I may save or print a copy. This electronic-signature record is not represented as a qualified/certified digital signature and legal suitability can depend on the document and jurisdiction.';
function view(row){return{id:row.id,client_id:row.client_id,contract_id:row.contract_id,signer_name:row.signer_name,signer_email:row.signer_email,status:row.status,document_title:row.document_title,document_hash:row.document_hash,sent_at:row.sent_at,viewed_at:row.viewed_at,signed_at:row.signed_at,expires_at:row.expires_at,created_at:row.created_at,updated_at:row.updated_at,audit:{consent_text:row.consent_text,signature_text:row.signature_text||'',signer_user_agent:row.signer_user_agent||'',signer_ip_hash:row.signer_ip_hash||''}}}
async function createTokenRecord(env,tenant,user,b,existing=null){
 const c=existing?{id:existing.contract_id,client_id:existing.client_id,title:existing.document_title,body:existing.document_body}:await contract(env,tenant,clean(b.contract_id,100));if(!c)return{error:json({detail:'Choose a valid proposal/agreement in this workspace.'},404)};
 const signerName=clean(b.signer_name||existing?.signer_name,180),signerEmail=email(b.signer_email||existing?.signer_email);if(!signerName||!validEmail(signerEmail))return{error:json({detail:'Signer name and a valid signer email are required.'},400)};
 const raw=token(),tokenHash=await sha(raw),snapshotTitle=clean(existing?.document_title||c.title,500),snapshotBody=clean(existing?.document_body||c.body,12000),documentHash=existing?.document_hash||await sha(`${snapshotTitle}\n\n${snapshotBody}`),ts=now(),expiresAt=ts+30*86400,id=existing?.id||crypto.randomUUID();
 if(existing){
  await env.DB.prepare("UPDATE agency_esign_requests SET signer_name=?,signer_email=?,token_hash=?,status='pending',consent_text=?,document_title=?,document_body=?,document_hash=?,signature_text='',signer_user_agent='',signer_ip_hash='',sent_at=NULL,viewed_at=NULL,signed_at=NULL,expires_at=?,updated_at=? WHERE id=? AND tenant_id=?")
   .bind(signerName,signerEmail,tokenHash,CONSENT,snapshotTitle,snapshotBody,documentHash,expiresAt,ts,id,tenant).run();
 }else{
  await env.DB.prepare(`INSERT INTO agency_esign_requests(id,tenant_id,client_id,contract_id,signer_name,signer_email,token_hash,status,consent_text,document_title,document_body,document_hash,expires_at,created_at,updated_at)
  VALUES(?,?,?,?,?,?,?,'pending',?,?,?,?,?,?,?)`).bind(id,tenant,clean(c.client_id,100),c.id,signerName,signerEmail,tokenHash,CONSENT,snapshotTitle,snapshotBody,documentHash,expiresAt,ts,ts).run();
 }
 return{id,raw,signerName,signerEmail,contract:c,documentHash};
}
async function deliver(request,env,user,created){
 const url=publicUrl(request,created.raw),subject=`Signature requested: ${clean(created.contract.title,180)}`,text=`Hello ${created.signerName},\n\nYou have a document ready for electronic signature.\n\nOpen the secure signing page:\n${url}\n\nThe signing page shows the exact document snapshot and records your affirmative electronic-signature consent.\n\nIf you were not expecting this request, do not sign it.`;
 const sent=await sendGrowthEmail(env,{scopeTenantId:String(user.tenant_id),to:created.signerEmail,subject,text,senderName:'Magnanimous White Label',tenantOnly:true});
 if(sent.ok)await env.DB.prepare('UPDATE agency_esign_requests SET sent_at=?,updated_at=? WHERE id=? AND tenant_id=?').bind(now(),now(),created.id,user.tenant_id).run();
 return{sent:sent.ok,receipt:sent.ok?sent.receipt:null,error:sent.ok?'':sent.error||'No connected email sender.',signing_url:url};
}
export async function handleWhiteLabelEsign(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/white-label/esign'))return null;if(!env?.DB)return json({detail:'Electronic-signature storage is unavailable.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);if(!await agencyAccess(env,user))return json({detail:'An active White Label Agency subscription is required.'},402);const tenant=String(user.tenant_id);
 if(url.pathname==='/api/white-label/esign/readiness'&&request.method==='GET'){
  let sender=false;try{sender=Boolean(await env.DB.prepare("SELECT id FROM integrations WHERE tenant_id=? AND provider IN ('google','outlook') LIMIT 1").bind(tenant).first())}catch{}
  return json({native_esign:true,audit_trail:true,immutable_document_snapshot:true,signer_consent:true,email_delivery_connected:sender,legal_note:'Electronic signatures can be legally effective in many jurisdictions, but this workflow is not a qualified/certified digital-signature service and suitability depends on document type and jurisdiction.'});
 }
 if(url.pathname==='/api/white-label/esign'&&request.method==='GET'){
  const cid=clean(url.searchParams.get('client_id'),100),contractId=clean(url.searchParams.get('contract_id'),100);let sql='SELECT * FROM agency_esign_requests WHERE tenant_id=?',args=[tenant];if(cid){sql+=' AND client_id=?';args.push(cid)}if(contractId){sql+=' AND contract_id=?';args.push(contractId)}sql+=' ORDER BY updated_at DESC LIMIT 200';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({requests:results.map(view)});
 }
 if(url.pathname==='/api/white-label/esign'&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);const b=await request.json().catch(()=>({})),made=await createTokenRecord(env,tenant,user,b);if(made.error)return made.error;const delivery=b.send_email===false?{sent:false,signing_url:publicUrl(request,made.raw),error:'Email delivery was not requested.'}:await deliver(request,env,user,made);const row=await env.DB.prepare('SELECT * FROM agency_esign_requests WHERE id=? AND tenant_id=?').bind(made.id,tenant).first();return json({ok:true,request:view(row),delivery},201);
 }
 let m=url.pathname.match(/^\/api\/white-label\/esign\/([^/]+)\/resend$/);
 if(m&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);const existing=await env.DB.prepare('SELECT * FROM agency_esign_requests WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!existing)return json({detail:'Signature request not found.'},404);if(existing.status==='signed')return json({detail:'This document is already signed.'},409);const made=await createTokenRecord(env,tenant,user,existing,existing);if(made.error)return made.error;const delivery=await deliver(request,env,user,made);return json({ok:true,delivery});
 }
 m=url.pathname.match(/^\/api\/white-label\/esign\/([^/]+)$/);
 if(m&&request.method==='DELETE'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);const row=await env.DB.prepare('SELECT status FROM agency_esign_requests WHERE id=? AND tenant_id=?').bind(m[1],tenant).first();if(!row)return json({detail:'Signature request not found.'},404);if(row.status==='signed')return json({detail:'Signed audit records cannot be deleted from this interface.'},409);await env.DB.prepare('DELETE FROM agency_esign_requests WHERE id=? AND tenant_id=?').bind(m[1],tenant).run();return json({ok:true,deleted:true});
 }
 return json({detail:'Electronic-signature endpoint not found.'},404);
}
function signHtml(row,raw,{signed=false,error=''}={}){
 const title=esc(row.document_title||'Document'),body=esc(row.document_body||'').replace(/\n/g,'<br>'),consent=esc(row.consent_text||CONSENT);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} • Secure signature</title><style>*{box-sizing:border-box}body{margin:0;background:#071018;color:#ecf8ff;font-family:Inter,system-ui,sans-serif;padding:24px}main{width:min(820px,100%);margin:auto}.top{color:#81e4ff;font-size:11px;font-weight:900;letter-spacing:.12em}.doc{margin-top:18px;border:1px solid #294555;border-radius:18px;background:#0a151d;padding:24px}.doc h1{margin-top:0}.body{color:#c3d0d7;line-height:1.7}.hash{font-family:monospace;font-size:9px;color:#6f8b98;word-break:break-all;margin-top:20px}.sign{margin-top:16px;border:1px solid #355368;border-radius:16px;padding:18px;background:#0b1720}label{display:block;margin:10px 0;color:#b6cbd5;font-size:12px}input[type=text]{width:100%;background:#050b10;border:1px solid #385769;border-radius:9px;color:white;padding:12px;font:inherit}button{width:100%;border:0;border-radius:10px;padding:13px;background:#72e5ff;color:#04151c;font-weight:950;cursor:pointer}.error{color:#ffbac3}.done{border:1px solid #2a6a52;background:#0b221b;color:#aef4d0;border-radius:14px;padding:18px}.fine{font-size:10px;color:#78939f;line-height:1.55}</style></head><body><main><div class="top">MAGNANIMOUS WHITE LABEL • SECURE ELECTRONIC SIGNATURE</div><section class="doc"><h1>${title}</h1><div class="body">${body}</div><div class="hash">Document SHA-256: ${esc(row.document_hash)}</div></section>${signed?'<section class="done"><b>Signed successfully.</b><p>You may save or print this page for your records.</p></section>':`<form class="sign" method="post" action="/sign/${encodeURIComponent(raw)}/accept">${error?`<p class="error">${esc(error)}</p>`:''}<p class="fine">${consent}</p><label><input type="checkbox" name="consent" value="yes" required> I agree and intend to sign electronically.</label><label>Type your full name as your signature<input type="text" name="signature" maxlength="180" required value="${esc(row.signer_name||'')}"></label><button type="submit">Sign document</button><p class="fine">This workflow records the document snapshot, consent, timestamp, signature text, browser identifier and a one-way hash of network information. It is not a qualified/certified digital signature.</p></form>`}</main></body></html>`;
}
async function publicRow(env,raw){
 const hash=await sha(raw),row=await env.DB.prepare('SELECT * FROM agency_esign_requests WHERE token_hash=? LIMIT 1').bind(hash).first();if(!row)return null;if(row.status!=='signed'&&Number(row.expires_at||0)<now())return null;return row;
}
export async function handlePublicEsign(request,env){
 const url=new URL(request.url);let m=url.pathname.match(/^\/sign\/([^/]+)$/);if(m&&request.method==='GET'){
  const raw=decodeURIComponent(m[1]),row=await publicRow(env,raw);if(!row)return new Response('Signature request not found or expired.',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex'}});
  if(row.status!=='signed'){await env.DB.prepare("UPDATE agency_esign_requests SET status=CASE WHEN status='pending' THEN 'viewed' ELSE status END,viewed_at=COALESCE(viewed_at,?),updated_at=? WHERE id=?").bind(now(),now(),row.id).run()}
  return new Response(signHtml(row,raw,{signed:row.status==='signed'}),{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, noarchive','referrer-policy':'no-referrer'}});
 }
 m=url.pathname.match(/^\/sign\/([^/]+)\/accept$/);if(m&&request.method==='POST'){
  const raw=decodeURIComponent(m[1]),row=await publicRow(env,raw);if(!row)return new Response('Signature request not found or expired.',{status:404});if(row.status==='signed')return new Response(signHtml(row,raw,{signed:true}),{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  const form=await request.formData().catch(()=>null),consent=String(form?.get('consent')||''),signature=clean(form?.get('signature'),180);if(consent!=='yes'||!signature)return new Response(signHtml(row,raw,{error:'Check the consent box and type your full name to sign.'}),{status:400,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  const ua=clean(request.headers.get('user-agent'),500),network=clean(request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for'),200),ipHash=network?await sha(`${String(env.SESSION_SECRET||row.id)}:${row.id}:${network}`):'',ts=now();
  await env.DB.prepare("UPDATE agency_esign_requests SET status='signed',signature_text=?,signer_user_agent=?,signer_ip_hash=?,signed_at=?,updated_at=? WHERE id=? AND status!='signed'").bind(signature,ua,ipHash,ts,ts,row.id).run();
  await env.DB.prepare("UPDATE agency_contracts SET status='signed',signer_name=?,updated_at=? WHERE id=? AND tenant_id=?").bind(signature,ts,row.contract_id,row.tenant_id).run().catch(()=>null);
  const done={...row,status:'signed',signature_text:signature,signed_at:ts};return new Response(signHtml(done,raw,{signed:true}),{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, noarchive','referrer-policy':'no-referrer'}});
 }
 return null;
}

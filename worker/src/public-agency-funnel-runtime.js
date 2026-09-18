const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const slug=v=>clip(v,120).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');
function safeHttpUrl(v){try{const u=new URL(String(v||''));return ['http:','https:'].includes(u.protocol)?u.toString():''}catch{return''}}
function splitName(value){const parts=clip(value,180).split(/\s+/).filter(Boolean);return{first_name:parts.shift()||'Lead',last_name:parts.join(' ')}}
async function findFunnel(env,clientId,rawSlug){
 const s=slug(rawSlug);if(!clientId||!s)return null;
 try{return await env.DB.prepare(`SELECT f.id,f.tenant_id,f.client_id,f.name,f.slug,f.headline,f.offer,f.cta_label,f.cta_url,f.status,f.visits,f.leads,
  c.name client_name,s.brand_name,s.logo_url,s.accent_color,s.white_label_enabled,s.custom_domain
  FROM agency_funnels f JOIN bpo_clients c ON c.id=f.client_id AND c.tenant_id=f.tenant_id
  LEFT JOIN agency_client_settings s ON s.client_id=f.client_id AND s.tenant_id=f.tenant_id
  WHERE f.client_id=? AND f.slug=? AND f.status='active' LIMIT 1`).bind(clientId,s).first()}catch{return null}
}
function htmlPage(funnel,{thanks=false}={}){
 const brand=esc(funnel.brand_name||funnel.client_name||funnel.name),headline=esc(funnel.headline||funnel.name),offer=esc(funnel.offer||''),accent=/^#[0-9a-f]{3,8}$/i.test(String(funnel.accent_color||''))?String(funnel.accent_color):'#67dff5',logo=safeHttpUrl(funnel.logo_url),cta=esc(funnel.cta_label||'Continue');
 const title=`${headline} • ${brand}`;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${offer.slice(0,180)}"><style>*{box-sizing:border-box}body{margin:0;background:#071017;color:#eef9ff;font-family:Inter,system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px;background-image:radial-gradient(circle at 75% 5%,${accent}22,transparent 32%)}main{width:min(760px,100%);border:1px solid #244553;border-radius:28px;background:#09141d;padding:clamp(24px,6vw,54px);box-shadow:0 30px 90px #0009}.brand{display:flex;align-items:center;gap:12px;color:#9bddea;font-weight:900;letter-spacing:.08em;font-size:12px}.brand img{width:48px;height:48px;object-fit:contain;border-radius:12px;background:white;padding:4px}h1{font-size:clamp(38px,8vw,72px);line-height:.98;margin:22px 0 18px}p{color:#a3b7c1;line-height:1.7;font-size:16px;white-space:pre-wrap}.card{margin-top:28px;border:1px solid #203d49;border-radius:18px;background:#061018;padding:18px}.card h2{margin:0 0 12px;font-size:20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grid .full{grid-column:1/-1}label{display:grid;gap:5px;color:#86a6b3;font-size:10px;font-weight:800}input{width:100%;border:1px solid #2a4b59;background:#040b10;color:#f4fbff;border-radius:10px;padding:12px;font:inherit}button,.cta{display:block;width:100%;margin-top:12px;border:0;border-radius:11px;background:${accent};color:#061018;padding:13px;font-weight:950;text-decoration:none;text-align:center;cursor:pointer}.fine{font-size:9px;color:#607b87;margin-top:10px}.hp{position:absolute;left:-9999px}footer{margin-top:20px;color:#536f7b;font-size:9px;text-align:center}@media(max-width:620px){main{padding:24px 18px}.grid{grid-template-columns:1fr}.grid .full{grid-column:auto}}</style></head><body><main><div class="brand">${logo?`<img src="${esc(logo)}" alt="">`:''}<span>${brand}</span></div><h1>${headline}</h1><p>${offer}</p>${thanks?`<section class="card"><h2>Thank you.</h2><p>Your information was received.</p>${safeHttpUrl(funnel.cta_url)?`<a class="cta" href="${esc(safeHttpUrl(funnel.cta_url))}" rel="noopener">${cta}</a>`:''}</section>`:`<form class="card" method="post" action="/funnels/${encodeURIComponent(funnel.client_id)}/${encodeURIComponent(funnel.slug)}/lead"><h2>Get started</h2><div class="grid"><label>Name<input name="name" maxlength="180" required></label><label>Email<input name="email" type="email" maxlength="240"></label><label class="full">Phone<input name="phone" maxlength="80"></label></div><label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><button type="submit">${cta}</button><div class="fine">By submitting, you are asking this business to contact you about this offer.</div></form>`}<footer>Powered by I AM MAGNANIMOUS WAY™ • Magnanimous AI</footer></main></body></html>`;
}
async function captureLead(request,env,funnel){
 const type=String(request.headers.get('content-type')||'').toLowerCase();let body={};
 if(type.includes('application/json'))body=await request.json().catch(()=>({}));
 else{const form=await request.formData().catch(()=>null);if(form)for(const [k,v] of form.entries())body[k]=String(v)}
 if(clip(body.website,100))return new Response(htmlPage(funnel,{thanks:true}),{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
 const name=clip(body.name,180),email=clip(body.email,240).toLowerCase(),phone=clip(body.phone,80);if(!name||(!email&&!phone))return json({detail:'Name and either email or phone are required.'},400);
 const tenant=String(funnel.tenant_id),names=splitName(name),ts=now();let contact=null;
 if(email){try{contact=await env.DB.prepare('SELECT id FROM crm_contacts WHERE tenant_id=? AND lower(email)=? LIMIT 1').bind(tenant,email).first()}catch{}}
 if(!contact&&phone){try{contact=await env.DB.prepare('SELECT id FROM crm_contacts WHERE tenant_id=? AND phone=? LIMIT 1').bind(tenant,phone).first()}catch{}}
 let contactId=Number(contact?.id||0);
 if(!contactId){const r=await env.DB.prepare('INSERT INTO crm_contacts(tenant_id,first_name,last_name,email,phone,company,status,source,tags,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(tenant,names.first_name,names.last_name,email,phone,'','lead',`funnel:${funnel.slug}`,'white-label-funnel',`Captured from ${funnel.name}`,ts,ts).run();contactId=Number(r?.meta?.last_row_id||0)}
 else{await env.DB.prepare("UPDATE crm_contacts SET source=CASE WHEN source='' THEN ? ELSE source END,tags=CASE WHEN tags='' THEN 'white-label-funnel' WHEN instr(tags,'white-label-funnel')=0 THEN tags||', white-label-funnel' ELSE tags END,updated_at=? WHERE id=? AND tenant_id=?").bind(`funnel:${funnel.slug}`,ts,contactId,tenant).run()}
 try{await env.DB.prepare('INSERT INTO crm_activities(tenant_id,contact_id,type,title,body,due_at,completed,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(tenant,contactId,'funnel','White Label funnel lead',`Submitted ${funnel.name}`,null,0,ts).run()}catch{}
 await env.DB.prepare('UPDATE agency_funnels SET leads=leads+1,updated_at=? WHERE id=? AND tenant_id=?').bind(ts,funnel.id,tenant).run();
 const target=safeHttpUrl(funnel.cta_url);if(target)return new Response(null,{status:303,headers:{location:target,'cache-control':'no-store'}});
 return new Response(htmlPage(funnel,{thanks:true}),{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
export async function handlePublicAgencyFunnel(request,env){
 const url=new URL(request.url);let m=url.pathname.match(/^\/funnels\/([^/]+)\/([^/]+)$/);
 if(m&&request.method==='GET'){const funnel=await findFunnel(env,decodeURIComponent(m[1]),decodeURIComponent(m[2]));if(!funnel)return new Response('Funnel not found.',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex'}});await env.DB.prepare('UPDATE agency_funnels SET visits=visits+1 WHERE id=? AND tenant_id=?').bind(funnel.id,funnel.tenant_id).run();return new Response(htmlPage(funnel),{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-frame-options':'SAMEORIGIN'}})}
 m=url.pathname.match(/^\/funnels\/([^/]+)\/([^/]+)\/lead$/);
 if(m&&request.method==='POST'){const funnel=await findFunnel(env,decodeURIComponent(m[1]),decodeURIComponent(m[2]));if(!funnel)return json({detail:'This funnel is not active.'},404);return captureLead(request,env,funnel)}
 return null;
}

import { currentUser } from './integrations.js';
import { ensureSocialPublishingSchema, publishSocialPostForTenant } from './social-publishing-runtime.js';
import { assessAiTransparency } from './ai-transparency.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const PROVIDERS=new Set(['youtube','tiktok','linkedin']);
const MAX_PAYLOAD_BYTES=12000;

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS social_scheduled_posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('youtube','tiktok','linkedin')),
  external_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','publishing','published','failed','outcome_unknown','cancelled')),
  idempotency_key TEXT NOT NULL,
  approval_hash TEXT,
  approved_at INTEGER,
  approved_by TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_at INTEGER,
  provider_receipt_json TEXT,
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,idempotency_key)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_social_scheduled_due ON social_scheduled_posts(status,scheduled_at)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_social_scheduled_tenant ON social_scheduled_posts(tenant_id,scheduled_at)').run();
}
function validTimezone(value){
 const tz=String(value||'').trim();
 if(!tz||tz.length>80)return '';
 try{new Intl.DateTimeFormat('en-US',{timeZone:tz}).format(new Date());return tz}catch{return ''}
}
function parseSchedule(value){
 const raw=String(value||'').trim();
  if(!/(?:Z|[+-]\d{2}:\d{2})$/i.test(raw))return 0;
 const ms=Date.parse(raw);
 return Number.isFinite(ms)?Math.floor(ms/1000):0;
}
function publicHttpsUrl(value){
 try{
  const u=new URL(String(value||''));
  if(u.protocol!=='https:'||u.username||u.password)return false;
  const h=u.hostname.toLowerCase();
   if(!h||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.test')||h.includes(':')||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))return false;
  return true;
 }catch{return false}
}
function disclosureIssue(provider,payload){
 const transparency=assessAiTransparency({
  kind:provider==='linkedin'?'text':'video',
  ai_generated:payload.ai_generated===true||payload.deepfake===true||payload.public_interest===true,
  deepfake:payload.deepfake===true,
  public_interest:payload.public_interest===true,
  human_reviewed:payload.human_reviewed===true,
  editorial_responsibility:payload.editorial_responsibility===true
 });
 if(!transparency.visible_disclosure.required_for_this_context)return '';
 const caption=String(provider==='linkedin'?payload.text:provider==='youtube'?payload.description:payload.title||'');
 const labelled=/\b(?:AI[ -]generated|AI[ -]altered|artificially generated|synthetic (?:media|video|audio)|created with AI)\b/i.test(caption);
 if(payload.ai_disclosure_confirmed!==true||!labelled)return 'Add a clear AI-generated/AI-altered disclosure to the post and confirm it.';
 if(provider!=='linkedin'&&payload.visible_media_disclosure_confirmed!==true)return 'Confirm the video itself carries an appropriate visible or audible AI disclosure.';
 return '';
}
function normalizedPayload(provider,body){
 const common={
  ai_generated:body.ai_generated===true,
  deepfake:body.deepfake===true,
  public_interest:body.public_interest===true,
  human_reviewed:body.human_reviewed===true,
  editorial_responsibility:body.editorial_responsibility===true,
  ai_disclosure_confirmed:body.ai_disclosure_confirmed===true,
  visible_media_disclosure_confirmed:body.visible_media_disclosure_confirmed===true
 };
 if(provider==='youtube')return{
  ...common,
  video_url:String(body.video_url||'').trim(),
  title:String(body.title||'Magnanimous video').trim().slice(0,100),
  description:String(body.description||'').trim().slice(0,5000),
  privacy_status:['private','unlisted','public'].includes(String(body.privacy_status||''))?String(body.privacy_status):'private',
  made_for_kids:body.made_for_kids===true,
  explicit_consent:false
 };
 if(provider==='tiktok')return{
  ...common,
  video_url:String(body.video_url||'').trim(),
  title:String(body.title||'').trim().slice(0,2200),
  privacy_level:String(body.privacy_level||'SELF_ONLY'),
  allow_duet:body.allow_duet===true,
  allow_comment:body.allow_comment===true,
  allow_stitch:body.allow_stitch===true,
  explicit_consent:false
 };
 return{...common,text:String(body.text||'').trim().slice(0,3000),explicit_consent:false};
}
function parsePayload(row){try{return JSON.parse(row.payload_json||'{}')}catch{return{}}}
function publicRow(row){
 const {payload_json,...safe}=row;
 return {...safe,payload:parsePayload(row)};
}
async function sha256(value){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function approvalHash(row,payload){
 const snapshot={
  id:String(row.id),
  tenant_id:String(row.tenant_id),
  provider:String(row.provider),
  external_id:String(row.external_id),
  scheduled_at:Number(row.scheduled_at),
  timezone:String(row.timezone),
  payload
 };
 return sha256(JSON.stringify(snapshot));
}
async function connectedAccount(env,tenantId,provider){
 await ensureSocialPublishingSchema(env);
 return env.DB.prepare('SELECT external_id,display_name FROM social_connections WHERE tenant_id=? AND provider=?').bind(String(tenantId),String(provider)).first();
}
async function getTenantRow(env,tenantId,id){
 return env.DB.prepare('SELECT * FROM social_scheduled_posts WHERE id=? AND tenant_id=?').bind(String(id),String(tenantId)).first();
}
async function handleCreate(request,env,user){
 const raw=await request.text();
 if(new TextEncoder().encode(raw).byteLength>20000)return json({detail:'Scheduled post request is too large.'},413);
 let body=null;try{body=JSON.parse(raw)}catch{}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({detail:'A JSON schedule draft is required.'},400);
 if(!PROVIDERS.has(String(body.provider||'')))return json({detail:'Choose a supported connected provider: YouTube, TikTok or LinkedIn.'},400);
 const provider=String(body.provider);
 const scheduledAt=parseSchedule(body.scheduled_at),tz=validTimezone(body.timezone);
 if(!scheduledAt||!tz)return json({detail:'Use a valid date/time with an explicit UTC offset and a valid IANA timezone.'},400);
 if(scheduledAt<now()+900)return json({detail:'Schedule at least 15 minutes ahead. The free Worker scheduler checks every 15 minutes.'},400);
 const account=await connectedAccount(env,user.tenant_id,provider);
 if(!account?.external_id)return json({detail:'Connect this social account before creating a schedule.'},409);
 const payload=normalizedPayload(provider,body);
 if((provider==='youtube'||provider==='tiktok')&&!publicHttpsUrl(payload.video_url))return json({detail:'Video publishing requires a public HTTPS video URL. Private, local and insecure URLs are not accepted.'},400);
 if(provider==='linkedin'&&!payload.text)return json({detail:'LinkedIn post text is required.'},400);
 if(payload.deepfake||payload.public_interest)payload.ai_generated=true;
 const disclosure=disclosureIssue(provider,payload);if(disclosure)return json({detail:disclosure,code:'AI_DISCLOSURE_REQUIRED'},409);
 const serialized=JSON.stringify(payload);
 if(new TextEncoder().encode(serialized).byteLength>MAX_PAYLOAD_BYTES)return json({detail:'Scheduled post content is too large.'},413);
 const id=crypto.randomUUID(),key=String(body.idempotency_key||crypto.randomUUID()).trim().slice(0,100);
 if(!key)return json({detail:'An idempotency key is required.'},400);
 const ts=now();
 try{
  await env.DB.prepare(`INSERT INTO social_scheduled_posts(id,tenant_id,created_by,provider,external_id,payload_json,scheduled_at,timezone,status,idempotency_key,created_at,updated_at)
   VALUES(?,?,?,?,?,?,?,?, 'draft',?,?,?)`).bind(id,String(user.tenant_id),String(user.id),provider,String(account.external_id),serialized,scheduledAt,tz,key,ts,ts).run();
 }catch(error){
  const existing=await env.DB.prepare('SELECT * FROM social_scheduled_posts WHERE tenant_id=? AND idempotency_key=?').bind(String(user.tenant_id),key).first().catch(()=>null);
  if(existing)return json({item:publicRow(existing),idempotent:true});
  throw error;
 }
 const row=await getTenantRow(env,user.tenant_id,id);
 return json({item:publicRow(row),approval_required:true},201);
}
async function handleApprove(request,env,user,id){
 const body=await request.json().catch(()=>({}));
 if(body.confirm!==true)return json({detail:'Explicitly confirm this exact content, connected account and scheduled time before enabling automatic publishing.',code:'SCHEDULE_APPROVAL_REQUIRED'},409);
 const row=await getTenantRow(env,user.tenant_id,id);
 if(!row)return json({detail:'Scheduled post not found.'},404);
 if(row.status!=='draft')return json({detail:'Only an unapproved draft can be approved.'},409);
 if(Number(row.scheduled_at)<now()+900)return json({detail:'The selected time is too close or has passed. Create a new draft at least 15 minutes ahead.'},409);
 const account=await connectedAccount(env,user.tenant_id,row.provider);
 if(!account?.external_id||String(account.external_id)!==String(row.external_id))return json({detail:'The connected account changed or was disconnected. Reconnect and create a new draft.'},409);
 const payload={...parsePayload(row),explicit_consent:true};
 const hash=await approvalHash(row,payload),ts=now();
 const changed=await env.DB.prepare(`UPDATE social_scheduled_posts SET payload_json=?,status='scheduled',approval_hash=?,approved_at=?,approved_by=?,updated_at=?
  WHERE id=? AND tenant_id=? AND status='draft'`).bind(JSON.stringify(payload),hash,ts,String(user.id),ts,String(id),String(user.tenant_id)).run();
 if(Number(changed?.meta?.changes||0)!==1)return json({detail:'This draft changed or was approved by another request. Reload it before continuing.'},409);
 const updated=await getTenantRow(env,user.tenant_id,id);
 return json({item:publicRow(updated),approval:{confirmed:true,approved_at:ts,content_bound:true,account_bound:true,time_bound:true}});
}
async function handleCancel(request,env,user,id){
 const row=await getTenantRow(env,user.tenant_id,id);
 if(!row)return json({detail:'Scheduled post not found.'},404);
 if(!['draft','scheduled'].includes(String(row.status)))return json({detail:'This post can no longer be cancelled from its current state.'},409);
 if(String(row.status)==='scheduled'&&Number(row.scheduled_at)<=now())return json({detail:'The publishing worker may already be claiming this post. Check its result before taking another action.'},409);
 const changed=await env.DB.prepare(`UPDATE social_scheduled_posts SET status='cancelled',approval_hash=NULL,updated_at=?
  WHERE id=? AND tenant_id=? AND ((status='draft') OR (status='scheduled' AND scheduled_at>?) )`).bind(now(),String(id),String(user.tenant_id),now()).run();
 if(Number(changed?.meta?.changes||0)!==1)return json({detail:'The post could not be cancelled because its state changed. Reload the calendar.'},409);
 return json({ok:true,id,status:'cancelled'});
}
export async function handleSocialScheduling(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/social-schedule'))return null;
 if(!env?.DB)return json({detail:'Database binding is not configured.'},503);
 try{
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to manage scheduled social posts.'},401);
  await ensureSchema(env);
  await ensureSocialPublishingSchema(env);
  if(path==='/api/social-schedule'&&request.method==='GET'){
   const requestedLimit=Number(url.searchParams.get('limit')||60),limit=Number.isFinite(requestedLimit)?Math.min(100,Math.max(1,requestedLimit)):60;
   const {results=[]}=await env.DB.prepare('SELECT * FROM social_scheduled_posts WHERE tenant_id=? ORDER BY scheduled_at DESC LIMIT ?').bind(String(user.tenant_id),limit).all();
   return json({items:results.map(publicRow),scheduler:{enabled:true,interval_minutes:15,automatic_retry:false}});
  }
  if(path==='/api/social-schedule'&&request.method==='POST')return await handleCreate(request,env,user);
  const match=path.match(/^\/api\/social-schedule\/([a-f0-9-]{36})\/(approve|cancel)$/i);
  if(match&&request.method==='POST'){
   const id=match[1],action=match[2];
   return action==='approve'?await handleApprove(request,env,user,id):await handleCancel(request,env,user,id);
  }
  return json({detail:'Social schedule route not found.'},404);
 }catch(error){
  console.error('Magnanimous social scheduling failed',error);
  return json({detail:'Social scheduling could not complete the request. Check the item and try again.',code:'SOCIAL_SCHEDULING_ERROR'},500);
 }
}
export async function scheduledSocialPublishing(env){
 if(!env?.DB)return{ok:false,reason:'database-unavailable',processed:0};
 await ensureSchema(env);
 await ensureSocialPublishingSchema(env);
 const ts=now();
 // A worker that died after claiming a post must never cause an automatic duplicate.
 await env.DB.prepare(`UPDATE social_scheduled_posts SET status='outcome_unknown',last_error='The worker stopped after claiming this post. The provider outcome must be checked before any new attempt.',updated_at=?
  WHERE status='publishing' AND updated_at<?`).bind(ts,ts-1800).run();
 const {results=[]}=await env.DB.prepare(`SELECT * FROM social_scheduled_posts
  WHERE status='scheduled' AND scheduled_at<=? AND approval_hash IS NOT NULL
  ORDER BY scheduled_at ASC LIMIT 1`).bind(ts).all();
 let published=0,failed=0,outcomeUnknown=0,claimed=0;
 for(const row of results){
  const payload=parsePayload(row);
  const expected=await approvalHash(row,payload);
  if(expected!==String(row.approval_hash||'')){
   await env.DB.prepare(`UPDATE social_scheduled_posts SET status='failed',last_error='Approval snapshot did not match. No provider request was sent.',updated_at=?
    WHERE id=? AND tenant_id=? AND status='scheduled'`).bind(ts,row.id,row.tenant_id).run();
   failed++;continue;
  }
  const claim=await env.DB.prepare(`UPDATE social_scheduled_posts SET status='publishing',locked_at=?,attempts=attempts+1,updated_at=?
   WHERE id=? AND tenant_id=? AND status='scheduled' AND scheduled_at<=? AND approval_hash=?`).bind(ts,ts,row.id,row.tenant_id,ts,row.approval_hash).run();
  if(Number(claim?.meta?.changes||0)!==1)continue;
  claimed++;
  try{
   const receipt=await publishSocialPostForTenant(env,row.tenant_id,row.provider,payload,row.external_id);
   await env.DB.prepare(`UPDATE social_scheduled_posts SET status='published',provider_receipt_json=?,last_error='',updated_at=?
    WHERE id=? AND tenant_id=? AND status='publishing'`).bind(JSON.stringify(receipt).slice(0,12000),now(),row.id,row.tenant_id).run();
   published++;
  }catch(error){
   const uncertain=error?.preflight!==true;
   const status=uncertain?'outcome_unknown':'failed';
   const detail=String(error?.message||'Provider publishing failed.').slice(0,1000);
   await env.DB.prepare('UPDATE social_scheduled_posts SET status=?,last_error=?,updated_at=? WHERE id=? AND tenant_id=? AND status=?')
    .bind(status,detail,now(),row.id,row.tenant_id,'publishing').run();
   if(uncertain)outcomeUnknown++;else failed++;
  }
 }
 return{ok:true,claimed,published,failed,outcome_unknown:outcomeUnknown,processed:claimed+failed};
}

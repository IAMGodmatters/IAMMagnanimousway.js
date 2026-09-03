import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
function localHour(timezone){try{return Number(new Intl.DateTimeFormat('en-US',{timeZone:String(timezone||'UTC'),hour:'2-digit',hour12:false}).format(new Date())))}catch{return new Date().getUTCHours()}}
async function countAttempts(env,tenant,campaignId,since){const row=await env.DB.prepare('SELECT COUNT(*) n FROM cc_campaign_members WHERE tenant_id=? AND campaign_id=? AND last_attempt_at>=?').bind(tenant,campaignId,since).first();return Number(row?.n||0)}

export async function handleContactCenterDialGuard(request,env){
 const url=new URL(request.url),match=url.pathname.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/(dial-start|dial-cancel)$/);
 if(!match)return null;
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use the campaign dialer.'},401);
 if(request.method!=='POST')return json({detail:'Method not allowed.'},405);
 const tenant=String(user.tenant_id),campaignId=match[1],operation=match[2],body=await request.json().catch(()=>({})),memberId=String(body.member_id||'');
 if(!memberId)return json({detail:'member_id is required.'},400);
 const campaign=await env.DB.prepare('SELECT * FROM cc_campaigns WHERE id=? AND tenant_id=?').bind(campaignId,tenant).first();
 if(!campaign)return json({detail:'Campaign not found.'},404);
 const member=await env.DB.prepare('SELECT * FROM cc_campaign_members WHERE id=? AND campaign_id=? AND tenant_id=?').bind(memberId,campaignId,tenant).first();
 if(!member)return json({detail:'Campaign contact not found.'},404);
 if(operation==='dial-cancel'){
  if(member.status==='dialing')await env.DB.prepare("UPDATE cc_campaign_members SET status='retry',next_attempt_at=?,updated_at=? WHERE id=? AND tenant_id=?").bind(now()+300,now(),memberId,tenant).run();
  return json({ok:true,status:'retry'});
 }
 if(campaign.status!=='active')return json({detail:'Campaign must be active before dialing.',code:'CAMPAIGN_NOT_ACTIVE'},409);
 const hour=localHour(campaign.timezone||'UTC');if(hour<8||hour>=20)return json({detail:`Calling is limited to 08:00–20:00 in ${campaign.timezone||'UTC'}.`,code:'QUIET_HOURS'},409);
 if(Number(campaign.consent_required||1)===1&&Number(member.consent_confirmed||0)!==1)return json({detail:'Verified contact permission is required before dialing.',code:'CONSENT_REQUIRED'},409);
 const dnc=await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(tenant,member.phone).first();if(dnc)return json({detail:'This number is on the do-not-call list.',code:'DO_NOT_CALL'},409);
 if(!['pending','retry','ready'].includes(String(member.status)))return json({detail:`This contact is currently ${member.status} and cannot be dialed again yet.`,code:'CONTACT_NOT_READY'},409);
 if(Number(member.attempts||0)>=Number(campaign.max_attempts||3))return json({detail:'Maximum campaign attempts reached for this contact.',code:'MAX_ATTEMPTS'},409);
 const [daily,hourly]=await Promise.all([countAttempts(env,tenant,campaignId,now()-86400),countAttempts(env,tenant,campaignId,now()-3600)]);
 if(daily>=Number(campaign.daily_cap||100))return json({detail:'Campaign daily call cap reached.',code:'DAILY_CAP'},429);
 if(hourly>=Number(campaign.hourly_cap||20))return json({detail:'Campaign hourly call cap reached.',code:'HOURLY_CAP'},429);
 const ts=now();await env.DB.prepare("UPDATE cc_campaign_members SET status='dialing',last_attempt_at=?,updated_at=? WHERE id=? AND tenant_id=?").bind(ts,ts,memberId,tenant).run();
 return json({ok:true,status:'dialing',reserved_at:ts,member_id:memberId,campaign_id:campaignId,daily_used:daily+1,hourly_used:hourly+1});
}

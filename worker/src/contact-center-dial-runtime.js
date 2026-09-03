import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
function localHour(timezone){try{return Number(new Intl.DateTimeFormat('en-US',{timeZone:String(timezone||'UTC'),hour:'2-digit',hour12:false}).format(new Date()))}catch{return new Date().getUTCHours()}}
async function countAttempts(env,tenant,campaignId,since){const row=await env.DB.prepare('SELECT COUNT(*) n FROM cc_campaign_members WHERE tenant_id=? AND campaign_id=? AND last_attempt_at>=?').bind(tenant,campaignId,since).first();return Number(row?.n||0)}
async function compliance(env,tenant,campaign,member){
 if(campaign.status!=='active')return{detail:'Campaign must be active before dialing.',code:'CAMPAIGN_NOT_ACTIVE',status:409};
 const hour=localHour(campaign.timezone||'UTC');if(hour<8||hour>=20)return{detail:`Calling is limited to 08:00–20:00 in ${campaign.timezone||'UTC'}.`,code:'QUIET_HOURS',status:409};
 if(Number(campaign.consent_required||1)===1&&Number(member?.consent_confirmed||0)!==1)return{detail:'Verified contact permission is required before dialing.',code:'CONSENT_REQUIRED',status:409};
 if(member){const dnc=await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(tenant,member.phone).first();if(dnc)return{detail:'This number is on the do-not-call list.',code:'DO_NOT_CALL',status:409};if(Number(member.attempts||0)>=Number(campaign.max_attempts||3))return{detail:'Maximum campaign attempts reached for this contact.',code:'MAX_ATTEMPTS',status:409}}
 const [daily,hourly]=await Promise.all([countAttempts(env,tenant,campaign.id,now()-86400),countAttempts(env,tenant,campaign.id,now()-3600)]);
 if(daily>=Number(campaign.daily_cap||100))return{detail:'Campaign daily call cap reached.',code:'DAILY_CAP',status:429};
 if(hourly>=Number(campaign.hourly_cap||20))return{detail:'Campaign hourly call cap reached.',code:'HOURLY_CAP',status:429};
 return{ok:true,daily,hourly};
}

export async function handleContactCenterDialGuard(request,env){
 const url=new URL(request.url),match=url.pathname.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/(next|dial-start|dial-cancel)$/);
 if(!match)return null;
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use the campaign dialer.'},401);
 if(request.method!=='POST')return json({detail:'Method not allowed.'},405);
 const tenant=String(user.tenant_id),campaignId=match[1],operation=match[2],body=await request.json().catch(()=>({}));
 const campaign=await env.DB.prepare('SELECT * FROM cc_campaigns WHERE id=? AND tenant_id=?').bind(campaignId,tenant).first();
 if(!campaign)return json({detail:'Campaign not found.'},404);

 if(operation==='next'){
  const ts=now();
  await env.DB.prepare("UPDATE cc_campaign_members SET status='retry',next_attempt_at=?,updated_at=? WHERE tenant_id=? AND campaign_id=? AND status IN ('ready','dialing') AND updated_at<?").bind(ts,ts,tenant,campaignId,ts-600).run();
  const gate=await compliance(env,tenant,campaign,{consent_confirmed:1,attempts:0,phone:''});
  if(!gate.ok)return json({detail:gate.detail,code:gate.code},gate.status);
  const member=await env.DB.prepare(`SELECT m.* FROM cc_campaign_members m WHERE m.tenant_id=? AND m.campaign_id=? AND m.status IN ('pending','retry') AND m.attempts<? AND (m.next_attempt_at IS NULL OR m.next_attempt_at<=?) AND (?=0 OR m.consent_confirmed=1) AND NOT EXISTS(SELECT 1 FROM voice_do_not_call d WHERE d.tenant_id=m.tenant_id AND d.phone=m.phone) ORDER BY COALESCE(m.next_attempt_at,0),m.created_at LIMIT 1`).bind(tenant,campaignId,Number(campaign.max_attempts||3),ts,Number(campaign.consent_required||1)).first();
  if(!member)return json({detail:'No eligible, consented contacts are ready to dial.',code:'NO_ELIGIBLE_CONTACT'},404);
  const memberGate=await compliance(env,tenant,campaign,member);if(!memberGate.ok)return json({detail:memberGate.detail,code:memberGate.code},memberGate.status);
  const reservation=await env.DB.prepare("UPDATE cc_campaign_members SET status='ready',last_attempt_at=?,updated_at=? WHERE id=? AND tenant_id=? AND status IN ('pending','retry')").bind(ts,ts,member.id,tenant).run();
  if(Number(reservation?.meta?.changes||0)!==1)return json({detail:'Another agent reserved this contact first. Request the next contact again.',code:'CONTACT_ALREADY_RESERVED'},409);
  const reserved=await env.DB.prepare('SELECT * FROM cc_campaign_members WHERE id=? AND tenant_id=?').bind(member.id,tenant).first();
  return json({campaign,member:reserved,dial_endpoint:'/api/phone/calls/outbound',required_payload:{to:reserved.phone,contact_id:reserved.lead_id||null,queue_id:campaign.queue_id||null,agent_id:campaign.agent_id||null,consent_confirmed:true,ai_disclosure_accepted:true},compliance:{dnc_checked:true,consent_checked:true,quiet_hours_checked:true,hourly_cap:Number(campaign.hourly_cap||20),daily_cap:Number(campaign.daily_cap||100),hourly_used:Number(memberGate.hourly||0)+1,daily_used:Number(memberGate.daily||0)+1,reserved:true,reservation_expires_seconds:600}});
 }

 const memberId=String(body.member_id||'');if(!memberId)return json({detail:'member_id is required.'},400);
 const member=await env.DB.prepare('SELECT * FROM cc_campaign_members WHERE id=? AND campaign_id=? AND tenant_id=?').bind(memberId,campaignId,tenant).first();
 if(!member)return json({detail:'Campaign contact not found.'},404);
 if(operation==='dial-cancel'){
  if(['ready','dialing'].includes(String(member.status)))await env.DB.prepare("UPDATE cc_campaign_members SET status='retry',next_attempt_at=?,updated_at=? WHERE id=? AND tenant_id=?").bind(now()+300,now(),memberId,tenant).run();
  return json({ok:true,status:'retry'});
 }
 if(!['pending','retry','ready'].includes(String(member.status)))return json({detail:`This contact is currently ${member.status} and cannot be dialed again yet.`,code:'CONTACT_NOT_READY'},409);
 const gate=await compliance(env,tenant,campaign,member);if(!gate.ok)return json({detail:gate.detail,code:gate.code},gate.status);
 const ts=now(),alreadyReserved=Number(member.last_attempt_at||0)>ts-600&&member.status==='ready';
 await env.DB.prepare("UPDATE cc_campaign_members SET status='dialing',last_attempt_at=?,updated_at=? WHERE id=? AND tenant_id=?").bind(alreadyReserved?Number(member.last_attempt_at):ts,ts,memberId,tenant).run();
 return json({ok:true,status:'dialing',reserved_at:alreadyReserved?Number(member.last_attempt_at):ts,member_id:memberId,campaign_id:campaignId,daily_used:Number(gate.daily||0)+(alreadyReserved?0:1),hourly_used:Number(gate.hourly||0)+(alreadyReserved?0:1)});
}

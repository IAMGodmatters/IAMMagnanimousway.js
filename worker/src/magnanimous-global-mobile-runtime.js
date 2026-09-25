import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const id=prefix=>`${prefix}_${crypto.randomUUID()}`;
const text=(value,max=160)=>String(value??'').trim().slice(0,max);
const enabled=value=>value===true||value===1||String(value||'').toLowerCase()==='true';
const allowed=(value,values,fallback)=>values.includes(value)?value:fallback;
const E164=/^\+[1-9]\d{6,14}$/;

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_global_mobile_profiles (
    tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,
    assistant_mode TEXT NOT NULL DEFAULT 'missed_only',
    ring_mode TEXT NOT NULL DEFAULT 'always',
    spam_action TEXT NOT NULL DEFAULT 'screen',
    assistant_voice TEXT NOT NULL DEFAULT 'neutral',
    assistant_tone TEXT NOT NULL DEFAULT 'helpful',
    summary_enabled INTEGER NOT NULL DEFAULT 1,
    transcript_enabled INTEGER NOT NULL DEFAULT 1,
    recording_enabled INTEGER NOT NULL DEFAULT 0,
    recording_jurisdiction TEXT NOT NULL DEFAULT '',
    forwarding_mode TEXT NOT NULL DEFAULT 'off',
    forwarding_target_ref TEXT NOT NULL DEFAULT '',
    network_selection_mode TEXT NOT NULL DEFAULT 'automatic',
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(tenant_id,user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS telecom_global_mobile_lines (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,manager_user_id TEXT NOT NULL,
    member_label TEXT NOT NULL,line_role TEXT NOT NULL DEFAULT 'additional',
    existing_number_id TEXT NOT NULL DEFAULT '',plan_id TEXT NOT NULL DEFAULT '',
    device_ref TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'planned',
    metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS telecom_global_mobile_devices (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,manager_user_id TEXT NOT NULL,
    line_id TEXT NOT NULL DEFAULT '',platform TEXT NOT NULL DEFAULT 'other',
    device_model TEXT NOT NULL DEFAULT '',esim_capable INTEGER NOT NULL DEFAULT 0,
    unlocked_confirmed INTEGER NOT NULL DEFAULT 0,preferred_access TEXT NOT NULL DEFAULT 'auto',
    backup_enabled INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'needs_review',
    created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS telecom_global_mobile_blocklist (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,label TEXT NOT NULL DEFAULT '',reason TEXT NOT NULL DEFAULT 'spam',
    created_at INTEGER NOT NULL,UNIQUE(tenant_id,user_id,phone_e164)
  )`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('global mobile schema repair failed',error)}}
}

function profileDefaults(user){
 return{
  assistant_mode:'missed_only',
  ring_mode:'always',
  spam_action:'screen',
  assistant_voice:'neutral',
  assistant_tone:'helpful',
  summary_enabled:true,
  transcript_enabled:true,
  recording_enabled:false,
  recording_jurisdiction:'',
  forwarding_mode:'off',
  forwarding_target_ref:'',
  network_selection_mode:'automatic',
  user_id:String(user?.id||user?.user_id||'')
 };
}

function publicCapabilities(env){
 const mobileProvisioning=Boolean(String(env?.MOBILE_PROVISIONER_URL||'').trim()&&String(env?.MOBILE_PROVISIONER_TOKEN||'').trim());
 const publicNumber=Boolean(String(env?.VOIP_CALLER_ID||'').trim());
 const carrierBridge=Boolean(String(env?.VOIP_PROVIDER_URL||'').trim()&&String(env?.VOIP_PROVIDER_TOKEN||'').trim());
 return{
  identity:'Magnanimous Telecom',
  brain:'Magnanimous AI',
  source_policy:'public-patterns-reimplemented-with-original-magnanimous-code',
  provider_identity_exposed:false,
  capabilities:[
   {key:'global_esim',label:'Global SIM/eSIM lifecycle',state:mobileProvisioning?'adapter-connected':'software-ready',action:'/telecom/sim',truth:'Activation requires an authorized MNO/MVNO or SM-DP+ relationship.'},
   {key:'multi_line',label:'Family, additional and tablet lines',state:'native-control-plane',action:'/telecom/global-mobile',truth:'Line records do not create public-network service by themselves.'},
   {key:'port_in',label:'US number port-in workflow',state:'native-control-plane',action:'/telecom/network',truth:'Carrier account details and transfer authorization remain approval-gated and provider-side.'},
   {key:'backup_dialer',label:'Backup in-app calling',state:'available',action:'/softphone',truth:'Public PSTN use still requires an authorized active carrier route.'},
   {key:'ai_screening',label:'AI call screening preferences',state:'native-control-plane',action:'/telecom/global-mobile',truth:'Preferences are stored natively; live carrier behavior only applies on connected Magnanimous call routes.'},
   {key:'spam_policy',label:'Spam block/screen policy',state:'native-control-plane',action:'/telecom/global-mobile',truth:'No hidden third-party caller data is copied. Manual blocking and authorized intelligence can be layered in.'},
   {key:'call_summary',label:'Call summaries and transcripts',state:'available',action:'/contact-center',truth:'Generated only for calls handled by Magnanimous and subject to applicable consent/privacy rules.'},
   {key:'recording',label:'Consent-gated call recording',state:'gated',action:'/contact-center',truth:'Recording requires notice/consent and jurisdiction policy; covert monitoring is disabled.'},
   {key:'call_forwarding',label:'Call-forwarding policy',state:'native-control-plane',action:'/telecom/global-mobile',truth:'A saved policy does not reprogram an outside carrier unless a verified adapter executes it.'},
   {key:'device_readiness',label:'Unlocked/eSIM device readiness',state:'native-control-plane',action:'/telecom/global-mobile',truth:'Device records are readiness checks, not carrier unlocks or eSIM credentials.'},
   {key:'global_service',label:'Global service policy',state:mobileProvisioning?'adapter-dependent':'gated',action:'/telecom/global-mobile',truth:'Country coverage and roaming claims must come from the actual authorized mobile adapter and plan.'},
   {key:'public_number',label:'Public number readiness',state:publicNumber&&carrierBridge?'configured':'gated',action:'/telecom/network',truth:'Magnanimous never claims direct numbering authority from software configuration alone.'}
  ]
 };
}

async function audit(env,user,eventType,subjectType='',subjectId='',detail={}){
 try{
  await env.DB.prepare('INSERT INTO telecom_audit_events(tenant_id,actor_user_id,event_type,subject_type,subject_id,detail_json,created_at) VALUES(?,?,?,?,?,?,?)')
   .bind(String(user.tenant_id||''),String(user.id||user.user_id||''),eventType,subjectType,subjectId,JSON.stringify(detail),now()).run();
 }catch{}
}

function manager(user){return ['owner','admin'].includes(String(user?.role||''))}

export async function handleMagnanimousGlobalMobile(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/telecom/global-mobile'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS'}});
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);
 await ensureSchema(env);
 const tenant=String(user.tenant_id||''),userId=String(user.id||user.user_id||'');

 if(path==='/api/telecom/global-mobile/capabilities'&&request.method==='GET'){
  return json(publicCapabilities(env));
 }

 if(path==='/api/telecom/global-mobile/profile'&&request.method==='GET'){
  const row=await env.DB.prepare('SELECT * FROM telecom_global_mobile_profiles WHERE tenant_id=? AND user_id=?').bind(tenant,userId).first();
  return json({profile:row?{
   assistant_mode:row.assistant_mode,ring_mode:row.ring_mode,spam_action:row.spam_action,
   assistant_voice:row.assistant_voice,assistant_tone:row.assistant_tone,
   summary_enabled:Boolean(row.summary_enabled),transcript_enabled:Boolean(row.transcript_enabled),
   recording_enabled:Boolean(row.recording_enabled),recording_jurisdiction:row.recording_jurisdiction,
   forwarding_mode:row.forwarding_mode,forwarding_target_ref:row.forwarding_target_ref,
   network_selection_mode:row.network_selection_mode,user_id:userId
  }:profileDefaults(user),execution:{network_activation_performed:false,carrier_reprogrammed:false,recording_started:false}});
 }

 if(path==='/api/telecom/global-mobile/profile'&&request.method==='PUT'){
  const body=await request.json().catch(()=>({}));
  const existing=await env.DB.prepare('SELECT * FROM telecom_global_mobile_profiles WHERE tenant_id=? AND user_id=?').bind(tenant,userId).first();
  const base=existing||profileDefaults(user);
  const recording=body.recording_enabled===undefined?Boolean(base.recording_enabled):enabled(body.recording_enabled);
  const jurisdiction=text(body.recording_jurisdiction??base.recording_jurisdiction,40);
  if(recording&&(body.confirm_recording_compliance!==true||!jurisdiction)){
   return json({detail:'Recording can only be enabled after explicit compliance confirmation and a recording jurisdiction are supplied.'},409);
  }
  const profile={
   assistant_mode:allowed(String(body.assistant_mode??base.assistant_mode),['off','missed_only','unknown_only','all_calls'],'missed_only'),
   ring_mode:allowed(String(body.ring_mode??base.ring_mode),['always','contacts_only','never'],'always'),
   spam_action:allowed(String(body.spam_action??base.spam_action),['screen','block','voicemail','ring'],'screen'),
   assistant_voice:allowed(String(body.assistant_voice??base.assistant_voice),['neutral','warm','professional'],'neutral'),
   assistant_tone:allowed(String(body.assistant_tone??base.assistant_tone),['helpful','concise','friendly','formal'],'helpful'),
   summary_enabled:body.summary_enabled===undefined?Boolean(base.summary_enabled):enabled(body.summary_enabled),
   transcript_enabled:body.transcript_enabled===undefined?Boolean(base.transcript_enabled):enabled(body.transcript_enabled),
   recording_enabled:recording,
   recording_jurisdiction:jurisdiction,
   forwarding_mode:allowed(String(body.forwarding_mode??base.forwarding_mode),['off','magnanimous_app','ai_assistant','verified_external'],'off'),
   forwarding_target_ref:text(body.forwarding_target_ref??base.forwarding_target_ref,160),
   network_selection_mode:allowed(String(body.network_selection_mode??base.network_selection_mode),['automatic','manual_preferred'],'automatic')
  };
  const ts=now();
  if(existing){
   await env.DB.prepare(`UPDATE telecom_global_mobile_profiles SET assistant_mode=?,ring_mode=?,spam_action=?,assistant_voice=?,assistant_tone=?,summary_enabled=?,transcript_enabled=?,recording_enabled=?,recording_jurisdiction=?,forwarding_mode=?,forwarding_target_ref=?,network_selection_mode=?,updated_at=? WHERE tenant_id=? AND user_id=?`)
    .bind(profile.assistant_mode,profile.ring_mode,profile.spam_action,profile.assistant_voice,profile.assistant_tone,profile.summary_enabled?1:0,profile.transcript_enabled?1:0,profile.recording_enabled?1:0,profile.recording_jurisdiction,profile.forwarding_mode,profile.forwarding_target_ref,profile.network_selection_mode,ts,tenant,userId).run();
  }else{
   await env.DB.prepare(`INSERT INTO telecom_global_mobile_profiles(tenant_id,user_id,assistant_mode,ring_mode,spam_action,assistant_voice,assistant_tone,summary_enabled,transcript_enabled,recording_enabled,recording_jurisdiction,forwarding_mode,forwarding_target_ref,network_selection_mode,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(tenant,userId,profile.assistant_mode,profile.ring_mode,profile.spam_action,profile.assistant_voice,profile.assistant_tone,profile.summary_enabled?1:0,profile.transcript_enabled?1:0,profile.recording_enabled?1:0,profile.recording_jurisdiction,profile.forwarding_mode,profile.forwarding_target_ref,profile.network_selection_mode,ts).run();
  }
  await audit(env,user,'global_mobile_profile_updated','user',userId,{assistant_mode:profile.assistant_mode,ring_mode:profile.ring_mode,spam_action:profile.spam_action,recording_enabled:profile.recording_enabled,forwarding_mode:profile.forwarding_mode});
  return json({ok:true,profile,execution:{network_activation_performed:false,carrier_reprogrammed:false,recording_started:false}});
 }

 if(path==='/api/telecom/global-mobile/lines'&&request.method==='GET'){
  if(!manager(user))return json({detail:'Owner or admin access required.'},403);
  const {results=[]}=await env.DB.prepare('SELECT id,member_label,line_role,existing_number_id,plan_id,device_ref,status,created_at,updated_at FROM telecom_global_mobile_lines WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();
  return json({lines:results,network_activation_performed:false});
 }

 if(path==='/api/telecom/global-mobile/lines'&&request.method==='POST'){
  if(!manager(user))return json({detail:'Owner or admin access required.'},403);
  const body=await request.json().catch(()=>({}));
  const memberLabel=text(body.member_label,100);
  if(!memberLabel)return json({detail:'member_label is required.'},400);
  const lineRole=allowed(String(body.line_role||'additional'),['primary','additional','tablet','backup'],'additional');
  const lineId=id('gline'),ts=now();
  await env.DB.prepare('INSERT INTO telecom_global_mobile_lines(id,tenant_id,manager_user_id,member_label,line_role,existing_number_id,plan_id,device_ref,status,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(lineId,tenant,userId,memberLabel,lineRole,text(body.existing_number_id,160),text(body.plan_id,160),text(body.device_ref,160),'planned',JSON.stringify({source:'magnanimous-global-mobile'}),ts,ts).run();
  await audit(env,user,'global_mobile_line_planned','global_mobile_line',lineId,{line_role:lineRole});
  return json({id:lineId,status:'planned',network_activation_performed:false,requires_authorized_mobile_adapter:true},201);
 }

 if(path==='/api/telecom/global-mobile/devices'&&request.method==='GET'){
  if(!manager(user))return json({detail:'Owner or admin access required.'},403);
  const {results=[]}=await env.DB.prepare('SELECT id,line_id,platform,device_model,esim_capable,unlocked_confirmed,preferred_access,backup_enabled,status,created_at,updated_at FROM telecom_global_mobile_devices WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();
  return json({devices:results.map(row=>({...row,esim_capable:Boolean(row.esim_capable),unlocked_confirmed:Boolean(row.unlocked_confirmed),backup_enabled:Boolean(row.backup_enabled)}))});
 }

 if(path==='/api/telecom/global-mobile/devices'&&request.method==='POST'){
  if(!manager(user))return json({detail:'Owner or admin access required.'},403);
  const body=await request.json().catch(()=>({}));
  const platform=allowed(String(body.platform||'other').toLowerCase(),['ios','android','other'],'other');
  const deviceModel=text(body.device_model,120);
  if(!deviceModel)return json({detail:'device_model is required.'},400);
  const esimCapable=enabled(body.esim_capable),unlocked=enabled(body.unlocked_confirmed),backup=enabled(body.backup_enabled);
  const preferred=allowed(String(body.preferred_access||'auto'),['auto','5g','lte','wifi-first'],'auto');
  const status=esimCapable&&unlocked?'ready':'needs_review',deviceId=id('gdev'),ts=now();
  await env.DB.prepare('INSERT INTO telecom_global_mobile_devices(id,tenant_id,manager_user_id,line_id,platform,device_model,esim_capable,unlocked_confirmed,preferred_access,backup_enabled,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(deviceId,tenant,userId,text(body.line_id,160),platform,deviceModel,esimCapable?1:0,unlocked?1:0,preferred,backup?1:0,status,ts,ts).run();
  await audit(env,user,'global_mobile_device_added','global_mobile_device',deviceId,{platform,esim_capable:esimCapable,unlocked_confirmed:unlocked,backup_enabled:backup});
  return json({id:deviceId,status,esim_capable:esimCapable,unlocked_confirmed:unlocked,network_activation_performed:false},201);
 }

 if(path==='/api/telecom/global-mobile/blocklist'&&request.method==='GET'){
  const {results=[]}=await env.DB.prepare('SELECT id,phone_e164,label,reason,created_at FROM telecom_global_mobile_blocklist WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC').bind(tenant,userId).all();
  return json({numbers:results,enforcement:'magnanimous-screening-policy'});
 }

 if(path==='/api/telecom/global-mobile/blocklist'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const phone=text(body.phone_e164,20);
  if(!E164.test(phone))return json({detail:'phone_e164 must be a valid E.164 number such as +15551234567.'},400);
  const blockId=id('gblock'),ts=now();
  try{
   await env.DB.prepare('INSERT INTO telecom_global_mobile_blocklist(id,tenant_id,user_id,phone_e164,label,reason,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(blockId,tenant,userId,phone,text(body.label,100),allowed(String(body.reason||'spam'),['spam','harassment','manual'],'manual'),ts).run();
  }catch(error){
   if(String(error?.message||error).toLowerCase().includes('unique'))return json({detail:'That number is already blocked.'},409);
   throw error;
  }
  await audit(env,user,'global_mobile_number_blocked','phone',phone,{reason:body.reason||'manual'});
  return json({id:blockId,phone_e164:phone,enforcement:'magnanimous-screening-policy'},201);
 }

 const blockMatch=path.match(/^\/api\/telecom\/global-mobile\/blocklist\/([^/]+)$/);
 if(blockMatch&&request.method==='DELETE'){
  const existing=await env.DB.prepare('SELECT id,phone_e164 FROM telecom_global_mobile_blocklist WHERE id=? AND tenant_id=? AND user_id=?').bind(blockMatch[1],tenant,userId).first();
  if(!existing)return json({detail:'Blocked number not found.'},404);
  await env.DB.prepare('DELETE FROM telecom_global_mobile_blocklist WHERE id=? AND tenant_id=? AND user_id=?').bind(existing.id,tenant,userId).run();
  await audit(env,user,'global_mobile_number_unblocked','phone',existing.phone_e164,{});
  return json({ok:true});
 }

 return json({detail:'Global Mobile route not found.'},404);
}

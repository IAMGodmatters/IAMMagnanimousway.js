import { currentUser } from './integrations.js';
import { validateCapabilityState, mayOfferPublicly } from './magnanimous-telecom-worldwide-policy.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const id=prefix=>`${prefix}_${crypto.randomUUID()}`;
const truthy=value=>String(value||'').toLowerCase()==='true';
const ownerOnly=user=>user?.role==='owner';
const GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT=20;
const money=value=>Math.round((Number(value)+Number.EPSILON)*100)/100;

function globalMobileBlueprint(env,readiness=null){
 const globalMobileFlag=truthy(env?.TELECOM_GLOBAL_MOBILE_LIVE);
 const launchReady=readiness?.launch_ready===true;
 return{
  identity:'Magnanimous Telecom',
  brain:'Magnanimous AI',
  architecture:'provider-neutral SIM/eSIM packet access plus Magnanimous-owned communications, policy, charging and AI control',
  production_verified:globalMobileFlag&&launchReady,
  live_flag_enabled:globalMobileFlag,
  launch_readiness:readiness||{launch_ready:false,verified_countries:[],gates:{database_evidence:false}},
  provider_brand_customer_visible:false,
  access_paths:{
   primary_sim_esim:'authorized mobile adapter',
   backup_esim:'supported when an independently authorized backup profile/network is provisioned',
   network_selection:'quality/cost/coverage-aware with manual recovery path',
   local_profile_substitution:'required where permanent-roaming policy or regulation demands it'
  },
  communications_plane:{
   app_voice_fallback:true,
   app_messaging_fallback:true,
   multiple_number_identity:true,
   number_portability:'adapter-and-jurisdiction-gated',
   voicemail:true,
   ai_call_assistance:'optional and consent-aware',
   native_sms_2fa_guaranteed:false
  },
  cost_policy:{
   retail_markup_percent:GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT,
   verified_origin_cost_required:true,
   competitor_retail_price_is_not_origin_cost:true,
   funded_variable_capacity_required:true,
   hard_variable_cost_cap_required:true,
   silent_paid_fallback:false,
   fair_use_model:'high-speed allowance plus documented throttle/QoS only when supported by the wholesale agreement'
  },
  owner_research:{
   provider_details_private:true,
   wholesale_candidates:[
    {key:'gigs',role:'wireless subscription/SIM/porting/usage API',commercial_status:'account-and-contract-required',public_wholesale_rate_card:false},
    {key:'1global',role:'global telco-as-a-service and eSIM subscription API',commercial_status:'commercial-agreement-required',public_wholesale_rate_card:false},
    {key:'telna',role:'API-first global eSIM/network lifecycle and multi-network access',commercial_status:'commercial-agreement-required',public_wholesale_rate_card:false},
    {key:'bics',role:'global roaming/eSIM/MVNO infrastructure candidate',commercial_status:'product-eligibility-and-commercial-agreement-required',public_wholesale_rate_card:false}
   ],
   retail_benchmarks:{
    fonus:{reseller_application_public:true,wholesale_rate_public:false,pricing_role:'benchmark-only-until-contract-quote'},
    popcorn:{architecture_benchmark_only:true,resale_allowed_by_public_policy:false,pricing_role:'retail-benchmark-only'}
   }
  },
  truth_boundaries:{
   global_mobile_live_flag:'TELECOM_GLOBAL_MOBILE_LIVE',
   provider_credentials_do_not_prove_live_service:true,
   country_coverage_requires_capability_verification:true,
   esim_coverage_does_not_imply_emergency_calling:true,
   voip_numbers_do_not_guarantee_short_code_or_bank_2fa:true,
   regulatory_authority_is_external:true
  }
 };
}

function finiteAmount(value,max){
 const parsed=Number(value);
 return Number.isFinite(parsed)&&parsed>=0&&parsed<=max?parsed:null;
}
function validOriginReference(value){
 const ref=String(value||'').trim();
 return /^https:\/\/\S{6,}$/i.test(ref)||/^(contract|rate-card|provider-quote|invoice):\S{2,}$/i.test(ref);
}

export function planGlobalMobileOffers(body){
 const country=String(body?.country_code||'').trim().toUpperCase();
 if(!/^[A-Z]{2}$/.test(country))return {error:'country_code must be ISO 3166-1 alpha-2.'};
 const expectedGb=finiteAmount(body?.expected_high_speed_gb,10000);
 if(expectedGb===null)return {error:'expected_high_speed_gb must be a finite non-negative amount.'};
 const offers=Array.isArray(body?.offers)?body.offers.slice(0,50):[];
 if(!offers.length)return {error:'At least one verified wholesale offer is required.'};
 const eligible=[],rejected=[];
 for(const raw of offers){
  const offer=raw&&typeof raw==='object'?raw:{};
  const adapterKey=String(offer.adapter_key||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80);
  const reference=String(offer.origin_reference||'').trim().slice(0,500);
  const networkGroup=String(offer.network_group||adapterKey||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80);
  const monthly=finiteAmount(offer.origin_monthly_cost,100000);
  const perGb=finiteAmount(offer.origin_variable_cost_per_gb||0,10000);
  const includedGb=finiteAmount(offer.included_high_speed_gb||0,10000);
  const fundedCap=finiteAmount(offer.funded_variable_cost_cap||0,1000000);
  const fees=finiteAmount(offer.mandatory_taxes_and_fees||0,100000);
  const latency=finiteAmount(offer.observed_latency_ms||0,60000);
  const qualityRaw=Number(offer.quality_score??0.5);
  const quality=Number.isFinite(qualityRaw)?Math.max(0,Math.min(1,qualityRaw)):0.5;
  const reasons=[];
  if(!adapterKey)reasons.push('adapter_key_missing');
  if(!validOriginReference(reference)||offer.origin_cost_verified!==true)reasons.push('origin_cost_not_verified');
  if(offer.commercial_authorized!==true)reasons.push('commercial_authorization_not_verified');
  if(offer.country_verified!==true)reasons.push('country_coverage_not_verified');
  if(offer.data_supported!==true)reasons.push('data_not_supported');
  if([monthly,perGb,includedGb,fundedCap,fees,latency].some(v=>v===null))reasons.push('invalid_cost_or_quality_input');
  const meteredGb=Math.max(0,expectedGb-(includedGb||0));
  const variableExposure=(perGb||0)*meteredGb;
  if(variableExposure>0&&(fundedCap||0)+1e-9<variableExposure)reasons.push('variable_cost_not_fully_funded');
  if(reasons.length){rejected.push({adapter_key:adapterKey||'unknown',reasons});continue}
  const landedOrigin=money((monthly||0)+variableExposure);
  const retailBeforeFees=money(landedOrigin*(1+GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT/100));
  eligible.push({
   adapter_key:adapterKey,
   network_group:networkGroup||adapterKey,
   origin_reference:reference,
   country_code:country,
   expected_high_speed_gb:expectedGb,
   included_high_speed_gb:includedGb,
   metered_high_speed_gb:money(meteredGb),
   origin_monthly_cost:money(monthly),
   origin_variable_cost_per_gb:money(perGb),
   variable_cost_exposure:money(variableExposure),
   funded_variable_cost_cap:money(fundedCap),
   landed_origin_cost:landedOrigin,
   mandatory_taxes_and_fees:money(fees),
   retail_monthly_total:money(retailBeforeFees+(fees||0)),
   retail_markup_percent:GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT,
   observed_latency_ms:latency,
   quality_score:quality,
   voice_supported:offer.voice_supported===true,
   sms_supported:offer.sms_supported===true,
   local_breakout:offer.local_breakout===true,
   backup_eligible:offer.backup_eligible===true
  });
 }
 eligible.sort((a,b)=>a.retail_monthly_total-b.retail_monthly_total||b.quality_score-a.quality_score||a.observed_latency_ms-b.observed_latency_ms);
 const selected=eligible[0]||null;
 const backup=selected?eligible.find(x=>x.backup_eligible&&x.adapter_key!==selected.adapter_key&&x.network_group!==selected.network_group)
  ||eligible.find(x=>x.backup_eligible&&x.adapter_key!==selected.adapter_key)||null:null;
 return{
  identity:'Magnanimous Telecom',
  brain:'Magnanimous AI',
  preview_only:true,
  purchase_performed:false,
  provider_details_private:true,
  country_code:country,
  expected_high_speed_gb:expectedGb,
  pricing_rule:{verified_origin_cost_required:true,retail_markup_percent:GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT},
  selected,
  backup,
  eligible_offers:eligible,
  rejected_offers:rejected,
  truth_boundary:'Selection is a quote/planning result only. It does not activate service, prove regulatory authority, or mark any country/provider live.'
 };
}

const US_CASES=[
 ['fcc_frn','FCC Registration Number (FRN)'],
 ['fcc_499','FCC Form 499 registration/reporting'],
 ['robocall_mitigation','Robocall Mitigation Database filing'],
 ['e911','911/E911 service and registered-location compliance'],
 ['direct_numbering','Direct access to NANP numbering resources'],
 ['state_authority','State-specific telecom/VoIP authority review']
];
const PH_CASES=[
 ['ntc_voip_vas','NTC VoIP/VAS provider or reseller registration'],
 ['network_lease','Authorized facilities/network lease'],
 ['interconnection','Authorized interconnection agreement'],
 ['vno_mvno_hosting','VNO/MVNO host-network agreement'],
 ['sim_registration','SIM Registration Act operating compliance'],
 ['franchise_cpcn','Congressional franchise + CPCN for facilities-based public telecom']
];

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_network_providers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider_key TEXT NOT NULL,display_name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'wholesale',status TEXT NOT NULL DEFAULT 'planned',capabilities_json TEXT NOT NULL DEFAULT '{}',secret_binding_name TEXT NOT NULL DEFAULT '',account_reference TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,provider_key,role))`,
  `CREATE TABLE IF NOT EXISTS telecom_regulatory_cases (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,jurisdiction TEXT NOT NULL,authority_key TEXT NOT NULL,authority_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'not_started',application_reference TEXT NOT NULL DEFAULT '',evidence_reference TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,jurisdiction,authority_key))`,
  `CREATE TABLE IF NOT EXISTS telecom_network_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,actor_user_id TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,provider_key TEXT NOT NULL DEFAULT '',jurisdiction TEXT NOT NULL DEFAULT '',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_country_capabilities (tenant_id TEXT NOT NULL,country_code TEXT NOT NULL,capability TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'unavailable',evidence_reference TEXT NOT NULL DEFAULT '',provider_ref TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',production_verified INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,country_code,capability))`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_wholesale_offers (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,adapter_key TEXT NOT NULL,network_group TEXT NOT NULL DEFAULT '',country_code TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'USD',origin_reference TEXT NOT NULL,origin_cost_verified INTEGER NOT NULL DEFAULT 0,commercial_authorized INTEGER NOT NULL DEFAULT 0,country_verified INTEGER NOT NULL DEFAULT 0,data_supported INTEGER NOT NULL DEFAULT 0,voice_supported INTEGER NOT NULL DEFAULT 0,sms_supported INTEGER NOT NULL DEFAULT 0,local_breakout INTEGER NOT NULL DEFAULT 0,backup_eligible INTEGER NOT NULL DEFAULT 0,origin_monthly_cost REAL NOT NULL DEFAULT 0,included_high_speed_gb REAL NOT NULL DEFAULT 0,origin_variable_cost_per_gb REAL NOT NULL DEFAULT 0,funded_variable_cost_cap REAL NOT NULL DEFAULT 0,mandatory_taxes_and_fees REAL NOT NULL DEFAULT 0,observed_latency_ms REAL NOT NULL DEFAULT 0,quality_score REAL NOT NULL DEFAULT 0.5,status TEXT NOT NULL DEFAULT 'draft',valid_from INTEGER,valid_to INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_access_profiles (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,line_id TEXT,sim_id TEXT,adapter_key TEXT NOT NULL,provider_profile_ref TEXT NOT NULL DEFAULT '',network_group TEXT NOT NULL DEFAULT '',country_code TEXT NOT NULL DEFAULT '',profile_role TEXT NOT NULL DEFAULT 'primary',apn_profile_id TEXT,status TEXT NOT NULL DEFAULT 'planned',last_verified_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_mobile_connectivity_events (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,profile_id TEXT NOT NULL,line_id TEXT,country_code TEXT NOT NULL DEFAULT '',serving_network_ref TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,latency_ms REAL NOT NULL DEFAULT 0,packet_loss_percent REAL NOT NULL DEFAULT 0,downlink_mbps REAL NOT NULL DEFAULT 0,uplink_mbps REAL NOT NULL DEFAULT 0,failover_reason TEXT NOT NULL DEFAULT '',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom network schema repair failed',error)}}
}

async function seedCases(env,tenant){
 const ts=now();
 for(const [jurisdiction,cases] of [['US',US_CASES],['PH',PH_CASES]]){
  for(const [key,name] of cases){
   try{
    await env.DB.prepare(`INSERT OR IGNORE INTO telecom_regulatory_cases(id,tenant_id,jurisdiction,authority_key,authority_name,status,created_at,updated_at) VALUES(?,?,?,?,?,'not_started',?,?)`)
     .bind(id('reg'),tenant,jurisdiction,key,name,ts,ts).run();
   }catch(error){console.error('regulatory readiness seed failed',error)}
  }
 }
}

async function event(env,tenant,user,eventType,providerKey='',jurisdiction='',detail={}){
 try{
  await env.DB.prepare('INSERT INTO telecom_network_events(tenant_id,actor_user_id,event_type,provider_key,jurisdiction,detail_json,created_at) VALUES(?,?,?,?,?,?,?)')
   .bind(tenant,String(user?.id||user?.user_id||''),eventType,providerKey,jurisdiction,JSON.stringify(detail||{}),now()).run();
 }catch(error){console.error('telecom network event failed',error)}
}

function bool(value){return value===true||Number(value)===1}
function mobileOfferRow(row){return{
 adapter_key:String(row.adapter_key||''),
 network_group:String(row.network_group||''),
 origin_reference:String(row.origin_reference||''),
 origin_cost_verified:bool(row.origin_cost_verified),
 commercial_authorized:bool(row.commercial_authorized),
 country_verified:bool(row.country_verified),
 data_supported:bool(row.data_supported),
 voice_supported:bool(row.voice_supported),
 sms_supported:bool(row.sms_supported),
 local_breakout:bool(row.local_breakout),
 backup_eligible:bool(row.backup_eligible),
 origin_monthly_cost:Number(row.origin_monthly_cost||0),
 included_high_speed_gb:Number(row.included_high_speed_gb||0),
 origin_variable_cost_per_gb:Number(row.origin_variable_cost_per_gb||0),
 funded_variable_cost_cap:Number(row.funded_variable_cost_cap||0),
 mandatory_taxes_and_fees:Number(row.mandatory_taxes_and_fees||0),
 observed_latency_ms:Number(row.observed_latency_ms||0),
 quality_score:Number(row.quality_score??0.5)
}}

export function evaluateGlobalMobileReadiness({live_flag_enabled=false,countryRows=[],offer=null,profile=null,connectivity=null,backupProfile=null,backupConnectivity=null,policy=null}={}){
 const verifiedCountries=(countryRows||[]).filter(row=>String(row.state||'')==='production_verified'&&bool(row.production_verified)&&String(row.evidence_reference||'').trim()).map(row=>String(row.country_code||'')).filter(Boolean);
 const countryMatch=Boolean(offer?.country_code&&verifiedCountries.includes(String(offer.country_code)));
 const profileMatch=Boolean(profile?.country_code&&verifiedCountries.includes(String(profile.country_code))&&String(profile.adapter_key||'')===String(offer?.adapter_key||''));
 const resilienceVerified=Boolean(backupProfile&&backupConnectivity&&String(backupProfile.network_group||'')&&String(backupProfile.network_group)!==String(profile?.network_group||''));
 const gates={
  live_flag_enabled:live_flag_enabled===true,
  verified_country_mobile_data:verifiedCountries.length>0,
  active_verified_wholesale_offer:Boolean(offer&&countryMatch),
  active_primary_access_profile:Boolean(profile&&profileMatch),
  recent_real_connectivity:Boolean(connectivity),
  active_cost_fair_use_policy:Boolean(policy)
 };
 return{
  launch_ready:Object.values(gates).every(Boolean),
  verified_countries:verifiedCountries,
  gates,
  multi_network_resilience_verified:resilienceVerified,
  evidence:{
   offer_id:offer?.id||'',
   profile_id:profile?.id||'',
   connectivity_event_id:connectivity?.id||'',
   backup_profile_id:backupProfile?.id||'',
   backup_connectivity_event_id:backupConnectivity?.id||'',
   policy_id:policy?.id||''
  },
  truth_boundary:'The environment flag cannot make global mobile live by itself. Database-backed country, commercial, profile, connectivity and cost-control evidence must all pass.'
 };
}

async function globalMobileReadiness(env,tenant){
 const cutoff=now()-604800;
 let countryRows=[],offer=null,profile=null,connectivity=null,backupProfile=null,backupConnectivity=null,policy=null;
 try{
  countryRows=(await env.DB.prepare("SELECT country_code,capability,state,evidence_reference,production_verified FROM telecom_country_capabilities WHERE tenant_id=? AND capability='mobile_data' AND state='production_verified' AND production_verified=1 AND evidence_reference<>'' ORDER BY country_code").bind(tenant).all()).results||[];
  const ts=now();
  offer=await env.DB.prepare("SELECT id,adapter_key,network_group,country_code,origin_reference,funded_variable_cost_cap,origin_variable_cost_per_gb FROM telecom_mobile_wholesale_offers WHERE tenant_id=? AND status='active' AND origin_cost_verified=1 AND commercial_authorized=1 AND country_verified=1 AND data_supported=1 AND origin_reference<>'' AND (origin_variable_cost_per_gb=0 OR funded_variable_cost_cap>0) AND (valid_from IS NULL OR valid_from<=?) AND (valid_to IS NULL OR valid_to>=?) ORDER BY updated_at DESC LIMIT 1").bind(tenant,ts,ts).first();
  if(offer)profile=await env.DB.prepare("SELECT id,line_id,sim_id,adapter_key,network_group,country_code,last_verified_at FROM telecom_mobile_access_profiles WHERE tenant_id=? AND profile_role='primary' AND status='active' AND provider_profile_ref<>'' AND last_verified_at IS NOT NULL AND adapter_key=? AND country_code=? ORDER BY last_verified_at DESC LIMIT 1").bind(tenant,offer.adapter_key,offer.country_code).first();
  if(profile?.id)connectivity=await env.DB.prepare("SELECT id,event_type,country_code,serving_network_ref,latency_ms,packet_loss_percent,created_at FROM telecom_mobile_connectivity_events WHERE tenant_id=? AND profile_id=? AND created_at>=? AND event_type IN ('attach','quality','recovery') AND serving_network_ref<>'' ORDER BY created_at DESC LIMIT 1").bind(tenant,profile.id,cutoff).first();
  if(profile?.id)backupProfile=await env.DB.prepare("SELECT id,line_id,sim_id,adapter_key,network_group,country_code,last_verified_at FROM telecom_mobile_access_profiles WHERE tenant_id=? AND profile_role='backup' AND status='active' AND provider_profile_ref<>'' AND last_verified_at IS NOT NULL AND country_code=? AND network_group<>? ORDER BY last_verified_at DESC LIMIT 1").bind(tenant,profile.country_code,String(profile.network_group||'')).first();
  if(backupProfile?.id)backupConnectivity=await env.DB.prepare("SELECT id,event_type,country_code,serving_network_ref,latency_ms,packet_loss_percent,created_at FROM telecom_mobile_connectivity_events WHERE tenant_id=? AND profile_id=? AND created_at>=? AND event_type IN ('attach','quality','recovery') AND serving_network_ref<>'' ORDER BY created_at DESC LIMIT 1").bind(tenant,backupProfile.id,cutoff).first();
  policy=await env.DB.prepare("SELECT id,fair_use_units,throttle_kbps,max_daily_spend,status FROM telecom_policy_profiles WHERE tenant_id=? AND service_type IN ('data','roaming_data') AND status='active' AND (fair_use_units>0 OR throttle_kbps>0 OR max_daily_spend>0) ORDER BY updated_at DESC LIMIT 1").bind(tenant).first();
 }catch(error){console.error('global mobile readiness query failed',error)}
 return evaluateGlobalMobileReadiness({
  live_flag_enabled:truthy(env?.TELECOM_GLOBAL_MOBILE_LIVE),
  countryRows,offer,profile,connectivity,backupProfile,backupConnectivity,policy
 });
}

function providerReadiness(env){
 return{
  wholesale_voice:Boolean(String(env?.VOIP_PROVIDER_URL||'').trim()&&String(env?.VOIP_PROVIDER_TOKEN||'').trim()),
  telnyx:Boolean(String(env?.TELNYX_API_KEY||'').trim()),
  gigs:Boolean(String(env?.GIGS_API_TOKEN||'').trim()&&String(env?.GIGS_PROJECT_ID||'').trim()),
  emergency_enabled:truthy(env?.TELECOM_EMERGENCY_LIVE),
  direct_numbering_authorized:truthy(env?.TELECOM_DIRECT_NUMBERING_AUTHORIZED),
  carrier_authorized:truthy(env?.TELECOM_CARRIER_AUTHORIZED),
  native_webrtc_live:truthy(env?.TELECOM_NATIVE_WEBRTC_LIVE),
  global_mobile_live:truthy(env?.TELECOM_GLOBAL_MOBILE_LIVE),
  purchases_enabled:truthy(env?.TELECOM_PURCHASE_ACTIONS_ENABLED),
  regulated_actions_enabled:truthy(env?.TELECOM_REGULATED_ACTIONS_ENABLED)
 };
}

async function telnyx(env,path,{method='GET',body}={}){
 const token=String(env?.TELNYX_API_KEY||'').trim();
 if(!token)throw Object.assign(new Error('TELNYX_API_KEY is not configured in runtime secrets.'),{status:503});
 const response=await fetch(`https://api.telnyx.com/v2${path}`,{
  method,
  headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined
 });
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={detail:text}}
 if(!response.ok){const error=new Error(data?.errors?.[0]?.detail||data?.detail||`Telnyx request failed (${response.status}).`);error.status=response.status;throw error}
 return data;
}

async function gigs(env,path){
 const token=String(env?.GIGS_API_TOKEN||'').trim();
 const project=String(env?.GIGS_PROJECT_ID||'').trim();
 if(!token||!project)throw Object.assign(new Error('GIGS_API_TOKEN and GIGS_PROJECT_ID are not configured in runtime secrets.'),{status:503});
 const response=await fetch(`https://api.gigs.com/projects/${encodeURIComponent(project)}${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={detail:text}}
 if(!response.ok){const error=new Error(data?.message||data?.detail||`Gigs request failed (${response.status}).`);error.status=response.status;throw error}
 return data;
}

function requirePurchaseGate(env,body){
 if(!truthy(env?.TELECOM_PURCHASE_ACTIONS_ENABLED))return 'Paid telecom actions are locked. Set TELECOM_PURCHASE_ACTIONS_ENABLED=true only when the owner is ready for purchases.';
 if(body?.confirm_purchase!==true)return 'Explicit confirm_purchase=true is required for a paid telecom action.';
 return '';
}
function requireRegulatedGate(env,body){
 if(!truthy(env?.TELECOM_REGULATED_ACTIONS_ENABLED))return 'Regulated telecom actions are locked. Set TELECOM_REGULATED_ACTIONS_ENABLED=true only after the applicable compliance path is ready.';
 if(body?.confirm_regulated_action!==true)return 'Explicit confirm_regulated_action=true is required.';
 return '';
}

export async function handleMagnanimousTelecomNetwork(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/telecom/network'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);
 if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
 await ensureSchema(env);
 const tenant=String(user.tenant_id||'');
 await seedCases(env,tenant);

 if(path==='/api/telecom/network/overview'&&request.method==='GET'){
  const [providers,cases]=await Promise.all([
   env.DB.prepare('SELECT id,provider_key,display_name,role,status,capabilities_json,secret_binding_name,account_reference,notes,updated_at FROM telecom_network_providers WHERE tenant_id=? ORDER BY provider_key,role').bind(tenant).all(),
   env.DB.prepare('SELECT id,jurisdiction,authority_key,authority_name,status,application_reference,evidence_reference,notes,updated_at FROM telecom_regulatory_cases WHERE tenant_id=? ORDER BY jurisdiction,authority_name').bind(tenant).all()
  ]);
  return json({
   identity:'Magnanimous Telecom',brain:'Magnanimous AI',architecture:'Magnanimous-owned PBX/SIP core with replaceable upstream interconnects',
   readiness:providerReadiness(env),
   routing_policy:{
    order:['free-browser','magnanimous-asterisk-pbx','workspace-byoc-primary','workspace-byoc-secondary','metered-compatibility'],
    route_planner_enabled:true,
    measured_quality_signals:['ASR','ACD','PDD','network_failure_rate'],
    max_rate_enforced:true,
    live_execution_uses_route_planner:false,
    selected_route_execution:{native_telecom_core:true,generic_byoc:false,twilio_compatibility:true,plivo_compatibility:true},
    execution_note:'Explicit Twilio and Plivo route types now execute only when selected by the Magnanimous planner and pass authenticated account-health checks. The protected Magnanimous Telecom Core keeps its authenticated Asterisk route gate. Generic BYOC plus no-route legacy compatibility fallbacks remain outside full planner authority, so all-live-route authority remains false.',
    failover_boundary:'A secondary SIP interconnect is used only for network-unavailable or congestion outcomes; real busy/no-answer results are not redialed through another carrier.'
   },
   owned_service_core:{provider_key:'magnanimous-telecom',role:'PBX, SIP registrar, routing, policy, CDR and contact-center control',native_pbx:'Asterisk',provider_owned_identity:true},
   preferred_upstream_candidate:{provider_key:'telnyx',role:'default benchmark SIP/number/API candidate',connected:Boolean(String(env?.TELNYX_API_KEY||'').trim()),note:'A strong programmable candidate where destination economics, coverage and measured quality fit; it is not hard-wired as universally best. Credentials alone do not make it a live voice route.'},
   upstream_candidates:[
    {provider_key:'telnyx',role:'programmable SIP, numbers, network APIs',adapter_state:'implemented for regulated-network API actions; voice-route activation still requires a real interconnect',connected:Boolean(String(env?.TELNYX_API_KEY||'').trim())},
    {provider_key:'bandwidth',role:'direct-network/BYOC benchmark, especially U.S. and supported international numbering',adapter_state:'candidate; no dedicated Magnanimous adapter is claimed live',connected:false},
    {provider_key:'plivo',role:'SIP/API route candidate, useful where destination rates and coverage fit',adapter_state:'compatibility carrier adapter exists',connected:Boolean(String(env?.PLIVO_AUTH_ID||'').trim()&&String(env?.PLIVO_AUTH_TOKEN||'').trim())},
    {provider_key:'signalwire',role:'SIP/WebRTC benchmark for supported geographies',adapter_state:'candidate; no dedicated Magnanimous adapter is claimed live',connected:false},
    {provider_key:'twilio',role:'broad compatibility and browser Voice SDK fallback',adapter_state:'compatibility softphone/voice adapter exists',connected:Boolean(String(env?.TWILIO_ACCOUNT_SID||'').trim()&&String(env?.TWILIO_AUTH_TOKEN||'').trim())}
   ],
   native_browser_target:{provider_key:'magnanimous-asterisk-webrtc',role:'owned browser-agent signaling/media target',live:truthy(env?.TELECOM_NATIVE_WEBRTC_LIVE),truth_boundary:'Source readiness is not live readiness; live requires TLS/WSS plus successful browser registration and two-way media verification.'},
   secondary_upstream_candidate:{provider_key:'plivo',role:'secondary SIP/API candidate',connected:Boolean(String(env?.PLIVO_AUTH_ID||'').trim()&&String(env?.PLIVO_AUTH_TOKEN||'').trim()),note:'Use only where route economics, coverage and quality beat the primary path.'},
   compatibility_upstream:{provider_key:'twilio',role:'browser Voice SDK / compatibility carrier',connected:Boolean(String(env?.TWILIO_ACCOUNT_SID||'').trim()&&String(env?.TWILIO_AUTH_TOKEN||'').trim()),note:'Retained for compatibility and browser-agent transport while the native Asterisk WebRTC desk is completed.'},
   mobile_alternative:{provider_key:'gigs',role:'MVNO/mobile subscription adapter',capabilities:['physical_sim','esim','mobile_plans','subscriptions']},
   global_mobile:globalMobileBlueprint(env,await globalMobileReadiness(env,tenant)),
   providers:providers.results||[],regulatory_cases:cases.results||[],
   authority_note:'Software readiness is not regulatory authority. External approvals and provider contracts remain required until completed.'
  });
 }

 if(path==='/api/telecom/network/global-mobile/blueprint'&&request.method==='GET'){
  return json(globalMobileBlueprint(env,await globalMobileReadiness(env,tenant)));
 }

 if(path==='/api/telecom/network/global-mobile/readiness'&&request.method==='GET'){
  return json(await globalMobileReadiness(env,tenant));
 }

 if(path==='/api/telecom/network/global-mobile/countries'&&request.method==='GET'){
  const {results}=await env.DB.prepare('SELECT country_code,capability,state,evidence_reference,provider_ref,notes,production_verified,updated_at FROM telecom_country_capabilities WHERE tenant_id=? ORDER BY country_code,capability').bind(tenant).all();
  return json({items:results||[]});
 }

 if(path==='/api/telecom/network/global-mobile/countries'&&request.method==='PUT'){
  const body=await request.json().catch(()=>({}));
  let validated;try{validated=validateCapabilityState(body)}catch(error){return json({detail:error.message},422)}
  const providerRef=String(body.provider_ref||'').trim().slice(0,200),notes=String(body.notes||'').trim().slice(0,2000),verified=validated.state==='production_verified'&&body.production_verified===true;
  const ts=now();
  await env.DB.prepare(`INSERT INTO telecom_country_capabilities(tenant_id,country_code,capability,state,evidence_reference,provider_ref,notes,production_verified,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,country_code,capability) DO UPDATE SET state=excluded.state,evidence_reference=excluded.evidence_reference,provider_ref=excluded.provider_ref,notes=excluded.notes,production_verified=excluded.production_verified,updated_at=excluded.updated_at`)
   .bind(tenant,validated.country_code,validated.capability,validated.state,validated.evidence_reference,providerRef,notes,verified?1:0,ts).run();
  await event(env,tenant,user,'global_mobile.country_capability.updated',providerRef,validated.country_code,{capability:validated.capability,state:validated.state,production_verified:verified});
  return json({...validated,production_verified:verified,publicly_offerable:mayOfferPublicly({...validated,production_verified:verified})});
 }

 if(path==='/api/telecom/network/global-mobile/offers'&&request.method==='GET'){
  const country=String(url.searchParams.get('country_code')||'').trim().toUpperCase();
  const query=country?'SELECT * FROM telecom_mobile_wholesale_offers WHERE tenant_id=? AND country_code=? ORDER BY updated_at DESC':'SELECT * FROM telecom_mobile_wholesale_offers WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 200';
  const result=country?await env.DB.prepare(query).bind(tenant,country).all():await env.DB.prepare(query).bind(tenant).all();
  return json({items:result.results||[]});
 }

 if(path==='/api/telecom/network/global-mobile/offers'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const country=String(body.country_code||'').trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(country))return json({detail:'country_code must be ISO 3166-1 alpha-2.'},422);
  const adapterKey=String(body.adapter_key||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80);
  if(!adapterKey)return json({detail:'adapter_key is required.'},422);
  const originReference=String(body.origin_reference||'').trim().slice(0,500);
  if(body.origin_cost_verified!==true||!validOriginReference(originReference))return json({detail:'Verified origin-cost evidence is required.'},422);
  if(body.commercial_authorized!==true)return json({detail:'A verified commercial agreement/authorization is required before storing an active wholesale offer.'},409);
  const variableCost=finiteAmount(body.origin_variable_cost_per_gb||0,10000),fundedCost=finiteAmount(body.funded_variable_cost_cap||0,1000000);
  if(variableCost===null||fundedCost===null)return json({detail:'Wholesale variable cost and funded cap must be valid non-negative amounts.'},422);
  if(variableCost>0&&fundedCost<=0)return json({detail:'Metered wholesale data requires a funded_variable_cost_cap greater than zero before activation.'},409);
  const capability=await env.DB.prepare("SELECT state,evidence_reference,production_verified FROM telecom_country_capabilities WHERE tenant_id=? AND country_code=? AND capability='mobile_data'").bind(tenant,country).first();
  if(!capability||!mayOfferPublicly({capability:'mobile_data',state:capability.state,evidence_reference:capability.evidence_reference,production_verified:bool(capability.production_verified)}))return json({detail:'Country mobile_data capability must be production_verified with evidence before an active offer can be stored.'},409);
  const draft={...body,country_code:country,adapter_key:adapterKey,origin_reference:originReference,country_verified:true,data_supported:true,commercial_authorized:true,origin_cost_verified:true};
  const planned=planGlobalMobileOffers({country_code:country,expected_high_speed_gb:Number(body.expected_high_speed_gb??body.included_high_speed_gb??0),offers:[draft]});
  if(!planned.selected)return json({detail:'Wholesale offer failed cost/funding validation.',rejected:planned.rejected_offers},422);
  const offerId=id('mobile_offer'),ts=now(),selected=planned.selected;
  await env.DB.prepare(`INSERT INTO telecom_mobile_wholesale_offers(id,tenant_id,adapter_key,network_group,country_code,currency,origin_reference,origin_cost_verified,commercial_authorized,country_verified,data_supported,voice_supported,sms_supported,local_breakout,backup_eligible,origin_monthly_cost,included_high_speed_gb,origin_variable_cost_per_gb,funded_variable_cost_cap,mandatory_taxes_and_fees,observed_latency_ms,quality_score,status,valid_from,valid_to,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
   .bind(offerId,tenant,adapterKey,String(body.network_group||adapterKey).trim().slice(0,80),country,String(body.currency||'USD').trim().toUpperCase(),originReference,1,1,1,1,body.voice_supported===true?1:0,body.sms_supported===true?1:0,body.local_breakout===true?1:0,body.backup_eligible===true?1:0,selected.origin_monthly_cost,selected.included_high_speed_gb,selected.origin_variable_cost_per_gb,selected.funded_variable_cost_cap,selected.mandatory_taxes_and_fees,selected.observed_latency_ms,selected.quality_score,'active',Number(body.valid_from||0)||null,Number(body.valid_to||0)||null,ts,ts).run();
  await event(env,tenant,user,'global_mobile.wholesale_offer.activated',adapterKey,country,{offer_id:offerId,origin_reference:originReference});
  return json({ok:true,id:offerId,status:'active',country_code:country,adapter_key:adapterKey,purchase_performed:false},201);
 }

 if(path==='/api/telecom/network/global-mobile/profiles'&&request.method==='GET'){
  const {results}=await env.DB.prepare('SELECT id,line_id,sim_id,adapter_key,provider_profile_ref,network_group,country_code,profile_role,apn_profile_id,status,last_verified_at,created_at,updated_at FROM telecom_mobile_access_profiles WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();
  return json({items:results||[]});
 }

 if(path==='/api/telecom/network/global-mobile/profiles'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const role=String(body.profile_role||'primary').trim().toLowerCase();
  if(!['primary','backup'].includes(role))return json({detail:'profile_role must be primary or backup.'},422);
  const country=String(body.country_code||'').trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(country))return json({detail:'country_code must be ISO 3166-1 alpha-2.'},422);
  const adapterKey=String(body.adapter_key||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80),providerRef=String(body.provider_profile_ref||'').trim().slice(0,240);
  if(!adapterKey||!providerRef)return json({detail:'adapter_key and opaque provider_profile_ref are required.'},422);
  if(body.activation_code||body.qr_code||body.ki||body.opc||body.adm)return json({detail:'Raw SIM/eSIM activation or authentication secrets are forbidden in this endpoint.'},400);
  const offer=await env.DB.prepare("SELECT id FROM telecom_mobile_wholesale_offers WHERE tenant_id=? AND country_code=? AND adapter_key=? AND status='active' AND origin_cost_verified=1 AND commercial_authorized=1 AND country_verified=1 AND data_supported=1 ORDER BY updated_at DESC LIMIT 1").bind(tenant,country,adapterKey).first();
  if(!offer)return json({detail:'An active verified wholesale offer for this adapter/country is required first.'},409);
  const profileId=id('mobile_profile'),ts=now();
  await env.DB.prepare('INSERT INTO telecom_mobile_access_profiles(id,tenant_id,line_id,sim_id,adapter_key,provider_profile_ref,network_group,country_code,profile_role,apn_profile_id,status,last_verified_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(profileId,tenant,String(body.line_id||'').trim()||null,String(body.sim_id||'').trim()||null,adapterKey,providerRef,String(body.network_group||adapterKey).trim().slice(0,80),country,role,String(body.apn_profile_id||'').trim()||null,'provisioning',null,ts,ts).run();
  await event(env,tenant,user,'global_mobile.access_profile.created',adapterKey,country,{profile_id:profileId,role});
  return json({ok:true,id:profileId,status:'provisioning',profile_role:role,activation_secret_stored:false},201);
 }

 if(path==='/api/telecom/network/global-mobile/connectivity'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),profileId=String(body.profile_id||'').trim();
  const profile=await env.DB.prepare('SELECT id,line_id,adapter_key,country_code,status FROM telecom_mobile_access_profiles WHERE tenant_id=? AND id=?').bind(tenant,profileId).first();
  if(!profile)return json({detail:'Unknown mobile access profile.'},404);
  const type=String(body.event_type||'quality').trim().toLowerCase();
  if(!['attach','detach','quality','failover','recovery'].includes(type))return json({detail:'Unsupported connectivity event_type.'},422);
  const networkRef=String(body.serving_network_ref||'').trim().slice(0,200);
  if(['attach','quality','recovery'].includes(type)&&!networkRef)return json({detail:'serving_network_ref is required for positive connectivity proof.'},422);
  const latency=finiteAmount(body.latency_ms||0,60000),loss=finiteAmount(body.packet_loss_percent||0,100),down=finiteAmount(body.downlink_mbps||0,100000),up=finiteAmount(body.uplink_mbps||0,100000);
  if([latency,loss,down,up].some(v=>v===null))return json({detail:'Connectivity metrics must be finite non-negative values in supported ranges.'},422);
  const eventId=id('mobile_net'),ts=now();
  await env.DB.prepare('INSERT INTO telecom_mobile_connectivity_events(id,tenant_id,profile_id,line_id,country_code,serving_network_ref,event_type,latency_ms,packet_loss_percent,downlink_mbps,uplink_mbps,failover_reason,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(eventId,tenant,profileId,profile.line_id||null,String(body.country_code||profile.country_code||'').trim().toUpperCase(),networkRef,type,latency,loss,down,up,String(body.failover_reason||'').trim().slice(0,500),'{}',ts).run();
  if(['attach','quality','recovery'].includes(type))await env.DB.prepare("UPDATE telecom_mobile_access_profiles SET status='active',last_verified_at=?,updated_at=? WHERE tenant_id=? AND id=?").bind(ts,ts,tenant,profileId).run();
  await event(env,tenant,user,'global_mobile.connectivity_evidence',profile.adapter_key,String(profile.country_code||''),{event_id:eventId,profile_id:profileId,event_type:type});
  return json({ok:true,id:eventId,profile_id:profileId,event_type:type,raw_credentials_exposed:false},201);
 }

 if(path==='/api/telecom/network/global-mobile/offer-plan'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const plan=planGlobalMobileOffers(body);
  if(plan.error)return json({detail:plan.error},422);
  return json(plan);
 }

 if(path==='/api/telecom/network/global-mobile/retail-quote'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const originCost=Number(body.origin_monthly_cost);
  const mandatoryFees=Number(body.mandatory_taxes_and_fees||0);
  const variableOrigin=Number(body.origin_variable_cost_per_gb||0);
  const fundedCap=Number(body.funded_variable_cost_cap||0);
  const currency=String(body.currency||'USD').trim().toUpperCase();
  const originReference=String(body.origin_reference||'').trim().slice(0,500);
  if(body.origin_cost_verified!==true||!validOriginReference(originReference))return json({detail:'Owner-confirmed origin-cost evidence is required. Use an https:// evidence URL or a contract:, rate-card:, provider-quote:, or invoice: reference. Competitor retail pricing is not an origin wholesale cost.'},422);
  if(!Number.isFinite(originCost)||originCost<0||originCost>100000)return json({detail:'origin_monthly_cost must be a finite non-negative amount.'},422);
  if(!Number.isFinite(mandatoryFees)||mandatoryFees<0||mandatoryFees>100000)return json({detail:'mandatory_taxes_and_fees must be a finite non-negative amount.'},422);
  if(!Number.isFinite(variableOrigin)||variableOrigin<0||variableOrigin>10000)return json({detail:'origin_variable_cost_per_gb must be a finite non-negative amount.'},422);
  if(!Number.isFinite(fundedCap)||fundedCap<0||fundedCap>1000000)return json({detail:'funded_variable_cost_cap must be a finite non-negative amount.'},422);
  if(!/^[A-Z]{3}$/.test(currency))return json({detail:'currency must be a three-letter currency code.'},422);
  if(variableOrigin>0&&fundedCap<=0)return json({detail:'Variable-cost mobile usage requires a funded_variable_cost_cap greater than zero.'},409);
  const markupFactor=1+(GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT/100);
  const retailBase=money(originCost*markupFactor);
  const variableRetailPerGb=money(variableOrigin*markupFactor);
  return json({
   identity:'Magnanimous Telecom',
   brain:'Magnanimous AI',
   quote_only:true,
   purchase_performed:false,
   service_live_claimed:false,
   provider_brand_customer_visible:false,
   origin:{monthly_cost:money(originCost),currency,reference:originReference,verified:true,verification_mode:'owner-confirmed-evidence-reference'},
   pricing:{
    markup_percent:GLOBAL_MOBILE_RETAIL_MARKUP_PERCENT,
    retail_monthly_before_mandatory_fees:retailBase,
    mandatory_taxes_and_fees:money(mandatoryFees),
    retail_monthly_total:money(retailBase+mandatoryFees),
    origin_variable_cost_per_gb:money(variableOrigin),
    retail_variable_price_per_gb:variableRetailPerGb,
    funded_variable_cost_cap:money(fundedCap)
   },
   safeguards:{
    verified_origin_cost_required:true,
    competitor_retail_price_rejected_as_wholesale_basis:true,
    variable_usage_requires_funded_cap:variableOrigin>0,
    silent_paid_fallback:false,
    live_activation_requires_separate_provider_and_regulatory_verification:true
   }
  });
 }

 if(path==='/api/telecom/network/providers'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const providerKey=String(body.provider_key||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80);
  const displayName=String(body.display_name||'').trim().slice(0,120);
  const role=String(body.role||'wholesale').trim().slice(0,80);
  if(!providerKey||!displayName)return json({detail:'provider_key and display_name are required.'},400);
  if(body.api_key||body.token||body.secret||body.password)return json({detail:'Do not submit provider credentials here. Store them only in encrypted runtime secrets and save the binding name.'},400);
  const status=String(body.status||'planned').trim().slice(0,40),binding=String(body.secret_binding_name||'').trim().slice(0,120),accountRef=String(body.account_reference||'').trim().slice(0,200),notes=String(body.notes||'').trim().slice(0,2000),caps=JSON.stringify(body.capabilities||{}),ts=now(),providerId=id('net');
  await env.DB.prepare(`INSERT INTO telecom_network_providers(id,tenant_id,provider_key,display_name,role,status,capabilities_json,secret_binding_name,account_reference,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,provider_key,role) DO UPDATE SET display_name=excluded.display_name,status=excluded.status,capabilities_json=excluded.capabilities_json,secret_binding_name=excluded.secret_binding_name,account_reference=excluded.account_reference,notes=excluded.notes,updated_at=excluded.updated_at`).bind(providerId,tenant,providerKey,displayName,role,status,caps,binding,accountRef,notes,ts,ts).run();
  await event(env,tenant,user,'network.provider.updated',providerKey,'',{role,status,binding});
  return json({ok:true,provider_key:providerKey,role,status},201);
 }

 if(path==='/api/telecom/network/regulatory'&&request.method==='PUT'){
  const body=await request.json().catch(()=>({}));
  const jurisdiction=String(body.jurisdiction||'').trim().toUpperCase().slice(0,20),key=String(body.authority_key||'').trim().slice(0,120),status=String(body.status||'not_started').trim().slice(0,40);
  if(!jurisdiction||!key)return json({detail:'jurisdiction and authority_key are required.'},400);
  if(!['not_started','researching','planned','applying','submitted','pending','blocked','approved','verified','not_applicable'].includes(status))return json({detail:'Unsupported regulatory status.'},400);
  const appRef=String(body.application_reference||'').trim().slice(0,500),evidence=String(body.evidence_reference||'').trim().slice(0,500),notes=String(body.notes||'').trim().slice(0,2000),ts=now();
  const existing=await env.DB.prepare('SELECT id,authority_name FROM telecom_regulatory_cases WHERE tenant_id=? AND jurisdiction=? AND authority_key=?').bind(tenant,jurisdiction,key).first();
  if(!existing)return json({detail:'Unknown regulatory readiness item.'},404);
  await env.DB.prepare('UPDATE telecom_regulatory_cases SET status=?,application_reference=?,evidence_reference=?,notes=?,updated_at=? WHERE id=?').bind(status,appRef,evidence,notes,ts,existing.id).run();
  await event(env,tenant,user,'regulatory.case.updated','',jurisdiction,{authority_key:key,status});
  return json({ok:true,jurisdiction,authority_key:key,status});
 }

 if(path==='/api/telecom/network/telnyx/number-search'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const country=String(body.country_code||'US').trim().toUpperCase().replace(/[^A-Z]/g,'').slice(0,2);
  const area=String(body.area_code||'').trim().replace(/\D/g,'').slice(0,8);
  const params=new URLSearchParams();params.set('filter[country_code]',country||'US');params.set('filter[limit]','10');
  if(area)params.set('filter[national_destination_code]',area);
  if(body.emergency_capable===true)params.set('filter[features]','emergency');
  try{return json(await telnyx(env,`/available_phone_numbers?${params.toString()}`))}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/number-order'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),gate=requirePurchaseGate(env,body);if(gate)return json({detail:gate},409);
  const phone=String(body.phone_number||'').trim();if(!/^\+[1-9]\d{6,14}$/.test(phone))return json({detail:'A valid E.164 phone_number is required.'},422);
  try{const result=await telnyx(env,'/number_orders',{method:'POST',body:{phone_numbers:[{phone_number:phone}]}});await event(env,tenant,user,'telnyx.number.ordered','telnyx','',{phone_number:phone});return json(result,201)}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/sim-order-preview'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),addressId=String(body.address_id||'').trim(),quantity=Math.max(1,Math.min(500,Number(body.quantity||1)));if(!addressId)return json({detail:'address_id is required.'},400);
  try{return json(await telnyx(env,'/sim_card_order_preview',{method:'POST',body:{address_id:addressId,quantity}}))}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/esim-purchase'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),gate=requirePurchaseGate(env,body);if(gate)return json({detail:gate},409);
  const amount=Math.max(1,Math.min(100,Number(body.amount||1)));const payload={amount};if(body.sim_card_group_id)payload.sim_card_group_id=String(body.sim_card_group_id);if(Array.isArray(body.tags))payload.tags=body.tags.map(String).slice(0,20);
  try{const result=await telnyx(env,'/actions/purchase/esims',{method:'POST',body:payload});await event(env,tenant,user,'telnyx.esim.purchased','telnyx','',{amount});return json(result,202)}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/telnyx/emergency-address'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),gate=requireRegulatedGate(env,body);if(gate)return json({detail:gate},409);
  const allowed=['house_number','street_pre_directional','street_name','street_suffix','street_post_directional','extended_address','locality','administrative_area','postal_code','country_code'];const payload={};for(const key of allowed){if(body[key]!==undefined)payload[key]=String(body[key]).trim()}
  if(!payload.house_number||!payload.street_name||!payload.locality||!payload.administrative_area||!payload.postal_code||!['US','CA','PR'].includes(String(payload.country_code||'').toUpperCase()))return json({detail:'A complete supported emergency address is required (US, CA, or PR).'},422);
  try{const result=await telnyx(env,'/dynamic_emergency_addresses',{method:'POST',body:payload});await event(env,tenant,user,'telnyx.emergency_address.created','telnyx',String(payload.country_code),{locality:payload.locality,administrative_area:payload.administrative_area});return json(result,201)}catch(error){return json({detail:error.message},error.status||502)}
 }

 if(path==='/api/telecom/network/gigs/sims'&&request.method==='GET'){
  try{return json(await gigs(env,'/sims'))}catch(error){return json({detail:error.message},error.status||502)}
 }

 return json({detail:'Magnanimous regulated-network endpoint not found.'},404);
}

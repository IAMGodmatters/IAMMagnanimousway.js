import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handlePlivoCarrier, plivoReady } from './plivo-carrier-runtime.js';
import { handleMagnanimousCarrierPhoneAlias } from './magnanimous-carrier-phone-alias.js';
import { currentUser } from './integrations.js';
import { planCarrierRoute } from './magnanimous-carrier-core.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const runtimeTrue=value=>['1','true','yes','on'].includes(String(value||'').trim().toLowerCase());
const normPhone=value=>String(value||'').trim().replace(/[\s().-]/g,'');

function twilioReady(env) { return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER); }
function genericBridgeReady(env) { return Boolean(env.VOIP_PROVIDER_URL && env.VOIP_PROVIDER_TOKEN); }
const NATIVE_ROUTE_TYPES = new Set(['sip-trunk','byoc-bridge','direct-pstn']);

async function fetchJsonWithTimeout(url, init = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { const response = await fetch(url, { ...init, signal: controller.signal }); const data = await response.json().catch(() => ({})); return { response, data }; }
  finally { clearTimeout(timer); }
}

async function twilioAccountHealth(env) {
  if (!twilioReady(env)) return { ok: false, state: 'not-configured' };
  try {
    const auth = btoa(`${String(env.TWILIO_ACCOUNT_SID)}:${String(env.TWILIO_AUTH_TOKEN)}`);
    const { response, data } = await fetchJsonWithTimeout(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(String(env.TWILIO_ACCOUNT_SID))}.json`, { headers: { authorization: `Basic ${auth}` } });
    const state = String(data?.status || (response.ok ? 'unknown' : 'unavailable')).toLowerCase();
    return { ok: response.ok && state === 'active', state };
  } catch (error) { return { ok: false, state: error?.name === 'AbortError' ? 'timeout' : 'unavailable' }; }
}

async function plivoAccountHealth(env) {
  if (!plivoReady(env)) return { ok: false, state: 'not-configured' };
  try {
    const auth = btoa(`${String(env.PLIVO_AUTH_ID)}:${String(env.PLIVO_AUTH_TOKEN)}`);
    const { response, data } = await fetchJsonWithTimeout(`https://api.plivo.com/v1/Account/${encodeURIComponent(String(env.PLIVO_AUTH_ID))}/`, { headers: { authorization: `Basic ${auth}` } });
    if (!response.ok) return { ok: false, state: 'unavailable' };
    const billingMode = String(data?.billing_mode || '').toLowerCase();
    const credits = Number(data?.cash_credits);
    if (billingMode === 'prepaid' && (!Number.isFinite(credits) || credits <= 0)) return { ok: false, state: 'unfunded' };
    return { ok: true, state: billingMode || 'authenticated' };
  } catch (error) { return { ok: false, state: error?.name === 'AbortError' ? 'timeout' : 'unavailable' }; }
}

function localHour(timezone) {
  try { return Number(new Intl.DateTimeFormat('en-US',{timeZone:timezone||'UTC',hour:'2-digit',hour12:false}).format(new Date())); }
  catch { return null; }
}

async function serverOutboundCompliance(env,user,body={}) {
  const to=normPhone(body.to);
  if(!/^\+[1-9]\d{7,14}$/.test(to))return {ok:false,status:400,code:'INVALID_DESTINATION',detail:'Use a valid E.164 destination number.'};
  if(!env?.DB)return {ok:false,status:503,code:'COMPLIANCE_DB_UNAVAILABLE',detail:'Telecom compliance state is unavailable; carrier dialing is fail-closed.'};
  const dnc=await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(String(user.tenant_id||''),to).first().catch(()=>null);
  if(dnc)return {ok:false,status:409,code:'DO_NOT_CALL',detail:'This number has opted out of automated calls.'};

  const campaignLike=body.automated===true||body.campaign_id||body.campaign_policy_id||body.contact_id||body.queue_id;
  if(!campaignLike)return {ok:true,to,mode:'manual',dnc_checked:true};

  if(!runtimeTrue(env.TELECOM_AUTOMATED_CAMPAIGN_COMPLIANCE_READY))return {ok:false,status:503,code:'AUTOMATED_COMPLIANCE_NOT_READY',detail:'Automated campaign calling remains fail-closed until the server-side compliance profile is verified.'};
  if(!runtimeTrue(env.TELECOM_AUTOMATED_HOLIDAY_POLICY_VERIFIED))return {ok:false,status:503,code:'HOLIDAY_POLICY_NOT_VERIFIED',detail:'Automated calling is blocked until the server-side holiday policy is verified.'};
  if(!runtimeTrue(env.TELECOM_AUTOMATED_JURISDICTION_POLICY_VERIFIED))return {ok:false,status:503,code:'JURISDICTION_POLICY_NOT_VERIFIED',detail:'Automated calling is blocked until the jurisdiction policy is verified.'};
  if(!runtimeTrue(env.TELECOM_AUTOMATED_BILLING_GUARD_VERIFIED))return {ok:false,status:503,code:'BILLING_GUARD_NOT_VERIFIED',detail:'Automated calling is blocked until server-side billing reservation controls are verified.'};
  if(body.recording_enabled===true&&!runtimeTrue(env.TELECOM_RECORDING_POLICY_VERIFIED))return {ok:false,status:503,code:'RECORDING_POLICY_NOT_VERIFIED',detail:'Recording is blocked until the applicable recording policy is verified.'};

  const tenant=String(user.tenant_id||''),contactId=body.contact_id==null?null:Number(body.contact_id),queueId=String(body.queue_id||'');
  const row=await env.DB.prepare(`SELECT m.id member_id,m.phone,m.status member_status,m.consent_confirmed,m.lead_id,c.id campaign_id,c.status campaign_status,c.timezone,c.consent_required,c.queue_id,c.caller_id
    FROM cc_campaign_members m JOIN cc_campaigns c ON c.id=m.campaign_id AND c.tenant_id=m.tenant_id
    WHERE m.tenant_id=? AND m.phone=? AND c.status='active'
      AND (? IS NULL OR m.lead_id=?) AND (?='' OR COALESCE(c.queue_id,'')=?)
    ORDER BY m.updated_at DESC LIMIT 1`).bind(tenant,to,Number.isFinite(contactId)?contactId:null,Number.isFinite(contactId)?contactId:null,queueId,queueId).first().catch(()=>null);
  if(!row)return {ok:false,status:409,code:'CAMPAIGN_STATE_NOT_VERIFIED',detail:'No active server-side campaign record authorizes this automated destination.'};
  if(!['ready','dialing'].includes(String(row.member_status)))return {ok:false,status:409,code:'CAMPAIGN_MEMBER_NOT_READY',detail:'Campaign member is not in a dial-ready state.'};
  if(Number(row.consent_required)!==0&&Number(row.consent_confirmed)!==1)return {ok:false,status:409,code:'CONSENT_NOT_VERIFIED',detail:'Server-side campaign consent is not verified.'};
  const hour=localHour(row.timezone||'UTC');
  if(hour===null)return {ok:false,status:409,code:'INVALID_CAMPAIGN_TIME_ZONE',detail:'Campaign time zone is invalid; dialing is fail-closed.'};
  if(hour<8||hour>=20)return {ok:false,status:409,code:'OUTSIDE_CALLING_WINDOW',detail:`Campaign calling is limited to 08:00–20:00 in ${row.timezone||'UTC'}.`};
  const callerIdentityReady=Boolean(String(row.caller_id||env.VOIP_CALLER_ID||env.TWILIO_PHONE_NUMBER||env.PLIVO_PHONE_NUMBER||'').trim());
  if(!callerIdentityReady)return {ok:false,status:503,code:'CALLER_IDENTITY_NOT_VERIFIED',detail:'Automated calling is blocked until a truthful server-side caller identity is configured.'};
  return {ok:true,to,mode:'campaign',dnc_checked:true,consent_checked:true,calling_window_checked:true,campaign_id:row.campaign_id,member_id:row.member_id};
}

async function outboundRouting(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/phone/calls/outbound' || request.method !== 'POST') return null;
  const user = await currentUser(request, env).catch(() => null);
  if (!user) return { response: json({ detail: 'Sign in required.' }, 401) };
  const body = await request.clone().json().catch(() => ({}));
  if (body.consent_confirmed !== true || body.ai_disclosure_accepted !== true) return { response: json({ detail: 'Confirm contact permission and AI disclosure before placing an automated carrier call.', code: 'CALL_CONSENT_REQUIRED' }, 400) };
  const compliance=await serverOutboundCompliance(env,user,body);
  if(!compliance.ok)return {response:json({detail:compliance.detail,code:compliance.code},compliance.status||409)};
  let plan = null;
  try { plan = await planCarrierRoute(env, user, body.to, String(body.route_mode || 'balanced')); }
  catch (error) { console.error('Compatibility carrier route planning failed; preserving no-route legacy fallback', error); }
  const matches = Array.isArray(plan?.matches) ? plan.matches : [];
  if (!matches.length) return { explicit: false, user, body, plan, compliance };
  if (!plan?.selected) return { response: json({ detail: 'No healthy carrier route is currently eligible for this destination.', code: 'NO_ELIGIBLE_CARRIER_ROUTE' }, 503) };
  return { explicit: true, user, body, plan, selected: plan.selected, compliance };
}

function billingMode(env) { const value = String(env.VOIP_BILLING_MODE || 'metered').trim().toLowerCase(); return ['flat-rate', 'unlimited', 'channel', 'metered', 'wholesale'].includes(value) ? value : 'metered'; }
function isFlatRate(mode) { return mode === 'flat-rate' || mode === 'unlimited' || mode === 'channel'; }
function translatedRequest(request, pathname, body) { const source = new URL(request.url); const target = new URL(pathname, source.origin); const headers = new Headers(request.headers); headers.set('content-type', 'application/json'); return new Request(target.toString(), { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) }); }

export async function handlePhoneCarrier(request, env) {
  const url = new URL(request.url),path = url.pathname;
  if (!path.startsWith('/api/phone')) return null;
  const carrierCore = await handleMagnanimousCarrierPhoneAlias(request, env); if (carrierCore) return carrierCore;
  if (path === '/api/phone/plivo/answer') { const response = await handlePlivoCarrier(request, env); if (response) return response; }
  const publicCarrierWebhook = path === '/api/phone/webhook';
  if (!publicCarrierWebhook && !await currentUser(request, env).catch(() => null)) return json({ detail: 'Sign in required.' }, 401);

  const routing = await outboundRouting(request, env); if (routing?.response) return routing.response;
  const selectedType = String(routing?.selected?.type || '');
  const routeContext = routing?.explicit ? { selectedRoute: routing.selected, selectionMode: routing.plan?.selection_mode || 'balanced' } : {};

  if (genericBridgeReady(env)) {
    if (path === '/api/phone/config' && request.method === 'GET') {
      const mode = billingMode(env);
      return json({browserCalling:true,pstnConfigured:true,inboundConfigured:Boolean(env.VOIP_WEBHOOK_SECRET),provider:'Magnanimous Carrier',carrierMode:'byoc-bridge',billing_mode:mode,flatRateConfigured:isFlatRate(mode),leastCostRouting:true,routeOrder:['free-browser','workspace-byoc','metered-fallback','premium-fallback'],callerId:String(env.VOIP_CALLER_ID||''),accessGranted:true,carrierCore:'/api/phone/carrier-core/status',message:isFlatRate(mode)?'Workspace flat-rate/BYOC calling is the primary ordinary-number route. Metered carrier calling remains a fallback when configured.':'Workspace BYOC calling is connected. Free browser calls remain first choice and the carrier bridge can use wholesale or metered routing.'});
    }
    if (!routing?.explicit || NATIVE_ROUTE_TYPES.has(selectedType)) return null;
  }
  if (routing?.explicit && NATIVE_ROUTE_TYPES.has(selectedType)) return json({ detail: 'The selected native carrier route is not connected to the protected Telecom Core.', code: 'SELECTED_ROUTE_NOT_CONNECTED' }, 503);
  if (routing?.explicit && selectedType === 'plivo') {
    if (!plivoReady(env)) return json({ detail: 'The selected carrier route is not configured.', code: 'SELECTED_ROUTE_NOT_CONFIGURED' }, 503);
    const health = await plivoAccountHealth(env); if (!health.ok) return json({ detail: 'The selected carrier route is unavailable or unfunded.', code: 'SELECTED_ROUTE_UNHEALTHY' }, 503);
    const response = await handlePlivoCarrier(request, env, routeContext); if (response) return response;
    return json({ detail: 'The selected carrier route could not execute this request.', code: 'SELECTED_ROUTE_EXECUTION_FAILED' }, 503);
  }
  if (routing?.explicit && selectedType === 'twilio') {
    if (!twilioReady(env)) return json({ detail: 'The selected carrier route is not configured.', code: 'SELECTED_ROUTE_NOT_CONFIGURED' }, 503);
    const health = await twilioAccountHealth(env); if (!health.ok) return json({ detail: 'The selected carrier route is unavailable.', code: 'SELECTED_ROUTE_UNHEALTHY' }, 503);
  } else if (routing?.explicit) return json({ detail: 'The selected carrier route does not have an active execution adapter.', code: 'SELECTED_ROUTE_ADAPTER_UNAVAILABLE' }, 503);

  if (!routing?.explicit && plivoReady(env)) { const response = await handlePlivoCarrier(request, env); if (response) return response; }
  if (!twilioReady(env)) return null;

  if (path === '/api/phone/config' && request.method === 'GET') {
    const voiceResponse = await handleVoiceAgent(translatedRequest(request, '/api/voice-agent/config'),env); if (!voiceResponse) return null;
    const data = await voiceResponse.clone().json().catch(() => ({})); if (!voiceResponse.ok) return voiceResponse; const access = Boolean(data.full_business || data.platform_owner);
    return json({browserCalling:true,pstnConfigured:Boolean(data.twilio_configured),inboundConfigured:false,provider:'Magnanimous Carrier',carrierMode:'premium-fallback',billing_mode:'metered',flatRateConfigured:false,leastCostRouting:true,routeOrder:['free-browser','workspace-byoc','metered-fallback','premium-fallback'],aiCarrier:true,carrierCore:'/api/phone/carrier-core/status',callerId:String(env.TWILIO_PHONE_NUMBER||''),accessGranted:access,inboundWebhook:`${url.origin}/api/voice-agent/twilio/incoming`,message:access?'Ordinary-number carrier calling is connected as a fallback. Free browser and workspace BYOC routes should be preferred when available.':'Ordinary-number carrier calling is connected. Premium carrier calling requires Full Business; free browser calling remains available.'});
  }

  if (path === '/api/phone/calls/outbound' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (body.consent_confirmed !== true || body.ai_disclosure_accepted !== true) return json({ detail: 'Confirm contact permission and AI disclosure before placing an automated carrier call.', code: 'CALL_CONSENT_REQUIRED' }, 400);
    const voiceResponse = await handleVoiceAgent(translatedRequest(request, '/api/voice-agent/call', {to:body.to,contact_id:body.contact_id||null,queue_id:body.queue_id||null,opening_message:body.opening_message||undefined,consent_confirmed:true,ai_disclosure_accepted:true,time_limit_seconds:body.time_limit_seconds||900}),env,routeContext);
    if (!voiceResponse) return json({ detail: 'The configured carrier route is unavailable.' }, 503);
    const data = await voiceResponse.clone().json().catch(() => ({})); if (!voiceResponse.ok) return voiceResponse;
    return json({id:data.call_id,call_id:data.call_id,provider_call_id:data.provider_call_id,status:data.status,provider:'magnanimous-carrier',agent:data.agent||null,route_id:data.route_id||null,interconnect_id:data.interconnect_id||null,selected_route_applied:data.selected_route_applied===true},voiceResponse.status||201);
  }
  return null;
}

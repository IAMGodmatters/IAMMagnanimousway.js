import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const entry=read('worker/src/entrypoint.js');
const security=read('worker/src/security-entrypoint.js');
const runtime=read('worker/src/contact-center-runtime.js');
const compatSoftphone=read('worker/src/twilio-softphone-runtime.js');
const softphone=read('frontend/app/softphone/page.tsx');
const nativeSoftphone=read('frontend/app/softphone/native-webrtc.ts');
const autoDial=read('frontend/app/auto-dialer/page.tsx');
const envExample=read('.env.example');
const providerEnv=read('worker/src/provider-runtime-env.js');
const platformCredentials=read('worker/src/platform-credentials.js');
const frontendPackage=read('frontend/package.json');
const frontendLock=read('frontend/package-lock.json');

const checks=[];
const has=(src,needle,label)=>checks.push([label,src.includes(needle)]);
const lacks=(src,needle,label)=>checks.push([label,!src.includes(needle)]);

has(entry,"import { handleContactCenter } from './contact-center-runtime.js';",'contact-center runtime is imported by live Worker entrypoint');
has(entry,'const contactCenter=await handleContactCenter(request,env);','contact-center runtime is mounted before legacy phone fallback');
has(security,"/^\\/api\\/(?:phone|contact-center|telecom|voice-agent)",'telecom/contact-center routes receive provider-vault runtime credentials');
has(runtime,"path==='/api/contact-center/softphone/config'",'softphone config backend exists');
has(runtime,"path==='/api/contact-center/softphone/claim'",'softphone claim backend exists');
has(runtime,"path==='/api/contact-center/softphone/outgoing'",'signed softphone outgoing TwiML route exists');
has(runtime,"path==='/api/contact-center/softphone/status'",'signed softphone status callback exists');
has(runtime,'twilioVoiceToken','browser softphone token is generated server-side');
has(runtime,'TWILIO_API_KEY_SECRET','Twilio API key secret never needs to enter frontend');
has(runtime,"provider:'Magnanimous Carrier'",'softphone keeps Magnanimous Carrier as public identity');
has(runtime,"native_pbx_target:'Asterisk WebRTC'",'softphone exposes Asterisk WebRTC as native PBX target');
has(compatSoftphone,"provider:'Magnanimous Carrier'",'compatibility softphone keeps Magnanimous Carrier as public identity');
has(compatSoftphone,"native_pbx_target:'Asterisk WebRTC'",'compatibility softphone preserves Asterisk WebRTC as native PBX target');
has(runtime,"provider_details_private:true",'contact center keeps provider details private');
has(runtime,'live_route_count:[byoc,twilio].filter(Boolean).length','contact center counts only actually wired PSTN routes as live');
has(runtime,'upstream_accounts_configured:upstreamAccounts','contact center tracks configured upstream accounts without calling them live routes');
has(runtime,"truth_boundary:'An upstream account is not counted as a live call route",'provider readiness explicitly separates credentials from live routing');
has(runtime,"/dial-start$/",'campaign dial-start lifecycle endpoint exists');
has(runtime,"/dial-cancel$/",'campaign dial-cancel lifecycle endpoint exists');
has(runtime,'async function queueBrowserAgents','IVR queue can ring available registered browser agents');
has(runtime,'clients.map(identity=>','IVR queue routes through registered browser softphone identities');
has(runtime,"NOT EXISTS(SELECT 1 FROM voice_do_not_call",'campaign dialing retains server-side DNC enforcement');
has(runtime,"Campaign calling is limited to 08:00–20:00",'campaign dialing retains quiet-hour enforcement');
has(softphone,"/api/contact-center/softphone/config",'softphone frontend matches server config route');
has(softphone,"/api/contact-center/softphone/claim",'softphone frontend matches server claim route');
has(runtime,"path==='/api/contact-center/softphone/native-session'",'signed-in contact-center route can request a native PBX browser session');
has(runtime,'cc_native_webrtc_sessions','native PBX sessions are bound to tenant/user ownership in platform storage');
has(runtime,"u.protocol!=='https:'",'native Telecom Core bridge requires HTTPS');
has(runtime,'runtimeTrue(env.TELECOM_NATIVE_WEBRTC_LIVE)','native Telecom Core bridge is gated by the production live-verification flag');
has(runtime,"data?.pstn_direct!==false",'worker rejects native browser credentials that could directly dial PSTN');
has(runtime,'tenant_id=? AND user_id=?','native session revocation is scoped to the signed-in tenant and user');
has(softphone,"from './native-webrtc'",'agent softphone mounts the native Magnanimous WebRTC client');
has(nativeSoftphone,"from 'sip.js'",'native Magnanimous WebRTC client uses SIP.js transport');
has(softphone,'/api/contact-center/softphone/native-session','agent softphone obtains native credentials only through the signed-in platform');
has(softphone,"device.connect({params:{To:to}})",'ordinary-number dialing remains on the compatibility transport');
lacks(softphone,'new Inviter','main agent page cannot directly bypass platform PSTN policy');
lacks(nativeSoftphone,'+X.','native client does not contain an E.164 direct-PSTN dial pattern');
has(nativeSoftphone,"extension==='911'||extension==='112'",'native client blocks emergency-code dialing until compliant service exists');
lacks(softphone,'TELECOM_CORE_TOKEN','frontend never embeds the private Telecom Core token');
has(providerEnv,"'TELECOM_CORE_TOKEN'",'private Telecom Core token is eligible for server-side provider-vault overlay');
has(platformCredentials,"id:'magnanimous-telecom-core'",'owner integrations expose protected native Telecom Core setup');
has(frontendPackage,'"sip.js": "0.21.2"','frontend pins the proven SIP.js native browser client');
has(frontendLock,'"node_modules/sip.js"','committed frontend lockfile contains the pinned SIP.js dependency');
has(envExample,'TELECOM_CORE_URL=','environment contract documents native Telecom Core URL');
has(envExample,'TELECOM_CORE_TOKEN=','environment contract documents native Telecom Core token');
has(autoDial,'/dial-start','auto dialer start route is backed by server contract');
has(autoDial,'/dial-cancel','auto dialer cancel route is backed by server contract');
for(const key of ['TWILIO_API_KEY_SID=','TWILIO_API_KEY_SECRET=','TWILIO_TWIML_APP_SID=','TELNYX_API_KEY=','TELNYX_CONNECTION_ID=','TELNYX_PHONE_NUMBER=','PLIVO_AUTH_ID=','PLIVO_AUTH_TOKEN=','PLIVO_PHONE_NUMBER=']){
  has(envExample,key,`environment contract documents ${key.slice(0,-1)}`);
}
lacks(softphone,'TWILIO_API_KEY_SECRET','frontend never embeds Twilio API secret');
lacks(softphone,'TWILIO_AUTH_TOKEN','frontend never embeds Twilio auth token');

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks)console.log(`${ok?'PASS':'FAIL'}: ${label}`);
if(failed.length){console.error(`\n${failed.length} contact-center runtime contract(s) failed.`);process.exit(1)}
console.log('\nMagnanimous contact-center live routing + provider privacy lock passed.');

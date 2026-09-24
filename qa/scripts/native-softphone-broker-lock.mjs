import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const broker=read('worker/src/native-softphone-runtime.js');
const compat=read('worker/src/twilio-softphone-runtime.js');
const router=read('worker/src/router-entrypoint.js');
const ui=read('frontend/app/softphone/page.tsx');
const pkg=read('frontend/package.json');
const lock=read('frontend/package-lock.json');
const env=read('.env.example');

const checks=[];
const has=(src,text,label)=>checks.push([label,src.includes(text)]);
const lacks=(src,text,label)=>checks.push([label,!src.includes(text)]);

has(broker,'currentUser(request,env)','native broker requires a signed-in platform user');
has(broker,'TELECOM_NATIVE_WEBRTC_LIVE','native broker is gated by the production-live truth flag');
has(broker,'TELECOM_CORE_URL','native broker uses a protected server-side Telecom Core URL');
has(broker,'TELECOM_API_TOKEN','native broker authenticates server-to-server with the Telecom Core token');
has(broker,"url.protocol!=='https:'","non-local Telecom Core traffic requires HTTPS");
has(broker,"redirect:'error'","Telecom Core requests refuse redirects so the server-side bearer token cannot be forwarded");
has(broker,'PRIMARY KEY(tenant_id,user_id)','native broker binds one active session slot to each signed-in user');
has(broker,'await revokeCore(env,existing.session_id)','new issuance revokes the previous native browser credential first');
has(broker,"data.pstn_direct===false",'native broker rejects any Telecom Core session that permits direct PSTN');
has(broker,"allowed_call_scope",'native broker returns a constrained native call scope');
has(broker,"request.method==='DELETE'",'native broker supports explicit browser-session revocation');
has(broker,'session does not belong to this signed-in user','native broker prevents cross-user session revocation');

has(router,"handleNativeSoftphone","router invokes the native softphone broker");
has(router,"handleNativeSoftphone(request,providerEnv);if(native)return","native broker is evaluated before compatibility softphone handling");
has(compat,'native_session_ready:nativeReady','softphone config exposes native session readiness separately');
has(compat,"native-pbx-plus-compatibility-pstn",'softphone config preserves compatibility PSTN during native migration');
has(compat,"native-pbx-internal-only",'softphone config truthfully reports native-only restricted mode');

has(ui,"from 'sip.js'","agent softphone uses SIP.js for native PBX registration");
has(ui,"/api/contact-center/softphone/native-session","browser obtains native credentials only through the authenticated platform broker");
has(ui,"method:'POST',body:'{}'","browser explicitly issues a short-lived native session");
has(ui,"method:'DELETE'","browser revokes its native session on teardown");
has(ui,'session.pstn_direct!==false','browser rejects a native session contract that allows direct PSTN');
has(ui,'new UserAgent','browser creates an owned native SIP user agent');
has(ui,'new Registerer','browser registers to the owned Magnanimous/Asterisk PBX');
has(ui,'device.connect({params:{To:to}})','ordinary-number dialing remains on the existing policy-enforced compatibility transport');
lacks(ui,'TELECOM_API_TOKEN','Telecom Core admin token is never referenced by frontend code');

has(pkg,'"sip.js": "0.21.2"','frontend pins SIP.js for native registration');
has(lock,'"node_modules/sip.js"','frontend lockfile pins the SIP.js package');
has(lock,'sha512-tSqTcIgrOd2IhP/rd70JablvAp+fSfLSxO4hGNY6LkWRY1SKygTO7OtJEV/BQb8oIxtMRx0LE7nUF2MaqGbFzA==','SIP.js lockfile has deterministic registry integrity');
has(env,'TELECOM_CORE_URL=','root environment documents the server-side Telecom Core URL');
has(env,'TELECOM_API_TOKEN=','root environment documents the server-side Telecom Core token');
lacks(env,'NEXT_PUBLIC_TELECOM_API_TOKEN','Telecom Core admin token is never declared as a public frontend variable');

const failed=checks.filter(([,ok])=>!ok);
for(const [label,ok] of checks)console.log((ok?'PASS':'FAIL')+': '+label);
if(failed.length){
  console.error('\n'+failed.length+' native softphone broker contract(s) failed.');
  process.exit(1);
}
console.log('\nNative softphone broker lock passed: '+checks.length+' contracts.');

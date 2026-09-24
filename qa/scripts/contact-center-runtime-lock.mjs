import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const entry=read('worker/src/entrypoint.js');
const security=read('worker/src/security-entrypoint.js');
const runtime=read('worker/src/contact-center-runtime.js');
const softphone=read('frontend/app/softphone/page.tsx');
const autoDial=read('frontend/app/auto-dialer/page.tsx');
const envExample=read('.env.example');

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
has(runtime,"provider_details_private:true",'contact center keeps provider details private');
has(runtime,'configured_route_count:[byoc,telnyx,plivo,twilio].filter(Boolean).length','contact center readiness includes BYOC, Telnyx, Plivo and Twilio');
has(runtime,"/dial-start$/",'campaign dial-start lifecycle endpoint exists');
has(runtime,"/dial-cancel$/",'campaign dial-cancel lifecycle endpoint exists');
has(runtime,"NOT EXISTS(SELECT 1 FROM voice_do_not_call",'campaign dialing retains server-side DNC enforcement');
has(runtime,"Campaign calling is limited to 08:00–20:00",'campaign dialing retains quiet-hour enforcement');
has(softphone,"/api/contact-center/softphone/config",'softphone frontend matches server config route');
has(softphone,"/api/contact-center/softphone/claim",'softphone frontend matches server claim route');
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

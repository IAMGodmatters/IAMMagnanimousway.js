import fs from 'node:fs';

const path='worker/src/contact-center-runtime.js';
let text=fs.readFileSync(path,'utf8');
let changed=false;

function replaceOnce(oldText,newText,label){
 if(!text.includes(oldText))return false;
 text=text.replace(oldText,newText);
 changed=true;
 console.log(`Applied ${label}.`);
 return true;
}

const oldSnapshot=`function providerSnapshot(env){
 return {
  browser_webrtc:{configured:true,free_first:true,inbound:true,outbound:true,note:'Peer-to-peer browser calling for signed-in users.'},
  twilio:{configured:twilioReady(env),inbound:twilioReady(env),outbound:twilioReady(env),ai_receptionist:twilioReady(env)},
  telnyx:{configured:telnyxReady(env),inbound:false,outbound:false,note:'Credential detection is ready; direct Telnyx call-control activation remains opt-in.'},
  carrier_bridge:{configured:genericReady(env),inbound:genericReady(env)&&Boolean(env.VOIP_WEBHOOK_SECRET),outbound:genericReady(env),byoc:true},
  ai:{configured:Boolean(env.AI),free_first:Boolean(env.AI)},
  tavus:{configured:Boolean(env.TAVUS_API_KEY),premium:true},
  heygen:{configured:Boolean(env.HEYGEN_API_KEY),premium:true,note:'Optional presenter-video provider; real-time telephone routing continues through the voice stack.'}
 };
}`;

const privateSnapshot=`function providerSnapshot(env){
 const byoc=genericReady(env);
 const ordinary=byoc||twilioReady(env);
 const mode=String(env.VOIP_BILLING_MODE||'metered').trim().toLowerCase();
 return {
  provider_details_private:true,
  browser_calling:{configured:true,free_first:true,inbound:true,outbound:true,note:'Peer-to-peer browser calling for signed-in users.'},
  magnanimous_carrier:{configured:ordinary,inbound:ordinary,outbound:ordinary,byoc,flat_rate:['flat-rate','unlimited','channel'].includes(mode),billing_mode:byoc?mode:'metered',least_cost_routing:true},
  ai_assist:{configured:Boolean(env.AI),free_first:Boolean(env.AI)},
  optional_video:{configured:Boolean(env.TAVUS_API_KEY||env.HEYGEN_API_KEY),premium:true}
 };
}`;
replaceOnce(oldSnapshot,privateSnapshot,'provider-private contact-center capability snapshot');

replaceOnce(
 "if(path==='/api/contact-center/twilio/incoming'&&request.method==='POST')return twilioIncoming(request,env);",
 "if((path==='/api/contact-center/carrier/incoming'||path==='/api/contact-center/twilio/incoming')&&request.method==='POST')return twilioIncoming(request,env);",
 'provider-neutral inbound carrier alias'
);

replaceOnce(
 "inbound_webhook:`${url.origin}/api/contact-center/twilio/incoming`",
 "inbound_webhook:`${url.origin}/api/contact-center/carrier/incoming`",
 'provider-neutral public inbound webhook'
);

const ready=text.includes('provider_details_private:true')&&text.includes('magnanimous_carrier:')&&text.includes("path==='/api/contact-center/carrier/incoming'")&&text.includes('/api/contact-center/carrier/incoming`');
if(!ready)throw new Error('Contact-center carrier privacy insertion points were not found; refusing partial edit.');
if(!changed){console.log('Contact-center carrier privacy repair already present.');process.exit(0)}
fs.writeFileSync(path,text);
console.log('Contact-center carrier privacy repair applied.');

import fs from 'node:fs';
import {validateCapabilityState,mayOfferPublicly,WORLDWIDE_TELECOM_POLICY} from '../../worker/src/magnanimous-telecom-worldwide-policy.js';

const audit='telecom-core/WORLDWIDE_TELECOM_AUDIT_2026-09-17.md';
if(!fs.existsSync(audit))throw new Error('Worldwide telecom audit missing');
const text=fs.readFileSync(audit,'utf8');
for(const phrase of ['direct numbering','country-capability matrix','Provider availability never equals regulatory authorization','Truth lock']){
 if(!text.toLowerCase().includes(phrase.toLowerCase()))throw new Error(`Worldwide audit lock missing: ${phrase}`);
}
if(WORLDWIDE_TELECOM_POLICY.upstream_identity_public!==false)throw new Error('Upstream provider identity must remain private');
let blocked=false;
try{validateCapabilityState({country_code:'US',capability:'direct_numbering',state:'authorized'});}catch{blocked=true;}
if(!blocked)throw new Error('Direct numbering must require evidence');
const verified=validateCapabilityState({country_code:'US',capability:'public_pstn',state:'production_verified',evidence_reference:'verified-regulatory-record',production_verified:true});
if(!mayOfferPublicly(verified))throw new Error('Verified regulated capability should be offerable');
if(mayOfferPublicly({capability:'public_pstn',state:'provider_ready'}))throw new Error('Provider readiness must not unlock public regulated service');
console.log('Magnanimous worldwide telecom truth locks verified.');

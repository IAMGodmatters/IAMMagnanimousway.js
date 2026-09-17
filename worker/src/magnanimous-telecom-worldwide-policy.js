const REGULATED_CAPABILITIES=new Set(['public_pstn','direct_numbering','emergency_calling','number_portability','physical_sim','esim','mobile_voice','mobile_data','direct_interconnection']);
const VALID_STATES=new Set(['unavailable','researching','provider_ready','compliance_pending','authorized','production_verified']);

export function normalizeCountryCode(value){
 const code=String(value||'').trim().toUpperCase();
 if(!/^[A-Z]{2}$/.test(code))throw new Error('ISO 3166-1 alpha-2 country code required.');
 return code;
}

export function validateCapabilityState({country_code,capability,state,evidence_reference='',production_verified=false}){
 const country=normalizeCountryCode(country_code);
 const cap=String(capability||'').trim().toLowerCase();
 const next=String(state||'unavailable').trim().toLowerCase();
 if(!cap)throw new Error('Capability is required.');
 if(!VALID_STATES.has(next))throw new Error('Unsupported capability state.');
 const evidence=String(evidence_reference||'').trim();
 if(REGULATED_CAPABILITIES.has(cap)&&['authorized','production_verified'].includes(next)&&!evidence){
  throw new Error('Documentary authority/compliance evidence is required before enabling this regulated capability.');
 }
 if(next==='production_verified'&&production_verified!==true){
  throw new Error('Explicit production verification is required.');
 }
 return{country_code:country,capability:cap,state:next,evidence_reference:evidence};
}

export function mayOfferPublicly(record){
 if(!record)return false;
 const cap=String(record.capability||'').toLowerCase();
 if(REGULATED_CAPABILITIES.has(cap))return record.state==='production_verified'&&Boolean(String(record.evidence_reference||'').trim());
 return record.state==='production_verified';
}

export const WORLDWIDE_TELECOM_POLICY=Object.freeze({
 identity:'Magnanimous Telecom',
 upstream_identity_public:false,
 regulated_capabilities:[...REGULATED_CAPABILITIES],
 states:[...VALID_STATES],
 rule:'Provider connectivity never implies regulatory authority or production availability.'
});

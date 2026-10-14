import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

const clip=(value,max=200)=>String(value??'').trim().slice(0,max);

export function normalizePhoneNumber(value='',defaultCountry='PH'){
  const input=clip(value,80),country=clip(defaultCountry,2).toUpperCase();
  if(!input)return {input:'',default_country:country||'PH',parsed:false,valid:false,possible:false,e164:'',international:'',national:'',country:'',country_calling_code:''};
  if(!/^[A-Z]{2}$/.test(country))throw new Error('country must be a two-letter ISO country code.');
  let phone;
  try{phone=parsePhoneNumberFromString(input,country)}catch{}
  if(!phone)return {input,default_country:country,parsed:false,valid:false,possible:false,e164:'',international:'',national:'',country:'',country_calling_code:''};
  return {input,default_country:country,parsed:true,valid:phone.isValid(),possible:phone.isPossible(),e164:phone.number||'',international:phone.formatInternational(),national:phone.formatNational(),country:phone.country||'',country_calling_code:phone.countryCallingCode||''};
}

export const CONTACT_VALIDATION_BOUNDARY=Object.freeze({
  phone:'Numbering-plan parsing/format validation only. It does not prove that a line is assigned, active, reachable, owned by a person, associated with a carrier account, consented for contact, or outside a DNC registry.',
  email:'Syntax/DNS/disposable indicators only. It does not prove mailbox existence, ownership, identity, consent, deliverability, or permission to contact. The external email-hygiene provider receives the submitted address and may log validation input and request metadata under its privacy policy.'
});

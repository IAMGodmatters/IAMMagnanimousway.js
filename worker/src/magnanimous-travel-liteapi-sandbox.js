// Magnanimous Travel: explicitly sandbox-only LiteAPI supplier adapter.
// No production credentials, bookings, payments, or wallet debits are supported here.
const API='https://api.liteapi.travel/v3.0/hotels/rates';
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(Date.parse(value+'T00:00:00Z'));
export function validateLiteApiSandboxSearch(input){
 if(!input||!validDate(input.checkin)||!validDate(input.checkout)||input.checkout<=input.checkin)throw Error('Valid checkin and later checkout dates are required.');
 if(!/^[A-Z]{3}$/.test(String(input.currency||'')))throw Error('ISO-4217 currency required.');
 if(!/^[A-Z]{2}$/.test(String(input.guestNationality||'')))throw Error('ISO-2 guest nationality required.');
 if(!Array.isArray(input.occupancies)||input.occupancies.length<1||input.occupancies.length>4||input.occupancies.some(o=>!Number.isInteger(o.adults)||o.adults<1||o.adults>9||!Array.isArray(o.children)||o.children.some(a=>!Number.isInteger(a)||a<0||a>17)))throw Error('Invalid room occupancies.');
 if(!((typeof input.cityName==='string'&&input.cityName.trim()&&/^[A-Z]{2}$/.test(String(input.countryCode||'')))||(Array.isArray(input.hotelIds)&&input.hotelIds.length>0&&input.hotelIds.length<=20&&input.hotelIds.every(id=>typeof id==='string'&&id.length<=100))))throw Error('City and country or hotel IDs required.');
}
export async function searchLiteApiSandboxHotels(input,{sandboxKey,fetchImpl=fetch}={}){
 validateLiteApiSandboxSearch(input);
 if(!sandboxKey||typeof sandboxKey!=='string'||!sandboxKey.startsWith('sand_'))return {supplier:'liteapi',sandbox:true,configured:false,offers:[]};
 const payload={checkin:input.checkin,checkout:input.checkout,currency:input.currency,guestNationality:input.guestNationality,occupancies:input.occupancies,limit:Math.min(20,Math.max(1,Number(input.limit)||10)),timeout:6};
 if(input.hotelIds)payload.hotelIds=input.hotelIds;else {payload.cityName=input.cityName.trim();payload.countryCode=input.countryCode;}
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetchImpl(API,{method:'POST',headers:{'content-type':'application/json','accept':'application/json','X-API-Key':sandboxKey},body:JSON.stringify(payload),signal:controller.signal});
  if(!response.ok)return {supplier:'liteapi',sandbox:true,configured:true,error:'Sandbox supplier request failed',status:response.status,offers:[]};
  const length=Number(response.headers?.get?.('content-length')||0);if(length>1_500_000)throw Error('Sandbox response exceeds size limit.');
  const data=await response.text();if(data.length>1_500_000)throw Error('Sandbox response exceeds size limit.');
  return {supplier:'liteapi',sandbox:true,configured:true,results:JSON.parse(data),booking_enabled:false,payment_enabled:false};
 }finally{clearTimeout(timeout);}
}

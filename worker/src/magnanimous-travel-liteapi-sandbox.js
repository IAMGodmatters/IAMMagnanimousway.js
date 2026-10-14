// Magnanimous Travel: sandbox-only LiteAPI supplier adapter.
// No production credentials, bookings, payments, or wallet debits are supported here.
const API='https://api.liteapi.travel/v3.0/hotels/rates';
const MAX_BYTES=1_500_000;
const makeError=(message,code,status=0)=>Object.assign(new Error(message),{code,status});
const validDate=value=>{const raw=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return false;const [y,m,d]=raw.split('-').map(Number),x=new Date(Date.UTC(y,m-1,d));return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d};
export const isLiteApiSandboxKey=value=>{const key=String(value||'').trim();return key.startsWith('sand_')||key.startsWith('sandbox_')};
export function validateLiteApiSandboxSearch(input){
 if(!input||!validDate(input.checkin)||!validDate(input.checkout)||input.checkout<=input.checkin)throw makeError('Valid checkin and later checkout dates are required.','INPUT');
 if(!/^[A-Z]{3}$/.test(String(input.currency||'')))throw makeError('ISO-4217 currency required.','INPUT');
 if(!/^[A-Z]{2}$/.test(String(input.guestNationality||'')))throw makeError('ISO-2 guest nationality required.','INPUT');
 const rooms=Array.isArray(input.occupancies)?input.occupancies:[];
 if(!rooms.length||rooms.length>4||rooms.some(o=>{const children=o?.children??[];return !Number.isInteger(o?.adults)||o.adults<1||o.adults>9||!Array.isArray(children)||children.some(a=>!Number.isInteger(a)||a<0||a>17)}))throw makeError('Invalid room occupancies.','INPUT');
 const ids=Array.isArray(input.hotelIds)&&input.hotelIds.length>0&&input.hotelIds.length<=20&&input.hotelIds.every(id=>typeof id==='string'&&id.length>0&&id.length<=100);
 const city=typeof input.cityName==='string'&&Boolean(input.cityName.trim())&&/^[A-Z]{2}$/.test(String(input.countryCode||''));
 if(!ids&&!city)throw makeError('City and country or hotel IDs required.','INPUT');
}
async function boundedJson(response){
 if(response.status===204)return [];
 const declared=Number(response.headers?.get?.('content-length')||0);if(declared>MAX_BYTES)throw makeError('Sandbox response exceeds size limit.','SUPPLIER',502);
 const reader=response.body?.getReader?.();
 if(!reader){const buf=await response.arrayBuffer();if(buf.byteLength>MAX_BYTES)throw makeError('Sandbox response exceeds size limit.','SUPPLIER',502);const text=new TextDecoder().decode(buf);try{return text.trim()?JSON.parse(text):[]}catch{throw makeError('Sandbox supplier returned malformed JSON.','SUPPLIER',502)}}
 let total=0,text='',decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES){await reader.cancel().catch(()=>{});throw makeError('Sandbox response exceeds size limit.','SUPPLIER',502)}text+=decoder.decode(value,{stream:true})}
 text+=decoder.decode();try{return text.trim()?JSON.parse(text):[]}catch{throw makeError('Sandbox supplier returned malformed JSON.','SUPPLIER',502)}
}
export async function searchLiteApiSandboxHotels(input,{sandboxKey,fetchImpl=fetch}={}){
 validateLiteApiSandboxSearch(input);
 if(!isLiteApiSandboxKey(sandboxKey))return {supplier:'liteapi',sandbox:true,configured:false,offers:[],production_enabled:false,booking_enabled:false,payment_enabled:false};
 const n=Number(input.limit),limit=Number.isFinite(n)?Math.trunc(n):10;
 const payload={checkin:input.checkin,checkout:input.checkout,currency:input.currency,guestNationality:input.guestNationality,occupancies:input.occupancies.map(o=>o.children==null?{adults:o.adults}:{adults:o.adults,children:o.children}),limit:Math.min(20,Math.max(1,limit||10)),timeout:6};
 if(Array.isArray(input.hotelIds)&&input.hotelIds.length)payload.hotelIds=input.hotelIds;else{payload.cityName=input.cityName.trim();payload.countryCode=input.countryCode}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  let response;try{response=await fetchImpl(API,{method:'POST',headers:{'content-type':'application/json','accept':'application/json','X-API-Key':sandboxKey},body:JSON.stringify(payload),signal:controller.signal})}catch(error){return {supplier:'liteapi',sandbox:true,configured:true,error:error?.name==='AbortError'?'Sandbox supplier timed out.':'Sandbox supplier network request failed.',status:error?.name==='AbortError'?504:502,offers:[]}}
  if(!response.ok)return {supplier:'liteapi',sandbox:true,configured:true,error:'Sandbox supplier request failed.',status:response.status===429?429:502,upstream_status:response.status,offers:[]};
  try{return {supplier:'liteapi',sandbox:true,configured:true,results:await boundedJson(response),production_enabled:false,booking_enabled:false,payment_enabled:false}}catch(error){return {supplier:'liteapi',sandbox:true,configured:true,error:error.message,status:error.status||502,offers:[]}}
 }finally{clearTimeout(timer)}
}

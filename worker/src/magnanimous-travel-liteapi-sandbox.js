// Magnanimous Travel: sandbox-only LiteAPI supplier adapter.
// Production credentials, real charges, wallet use and production bookings are intentionally unsupported here.
const RATE_API='https://api.liteapi.travel/v3.0/hotels/rates';
const PREBOOK_API='https://book.liteapi.travel/v3.0/rates/prebook';
const BOOK_API='https://book.liteapi.travel/v3.0/rates/book';
const MAX_BYTES=1_500_000;
const makeError=(message,code,status=0)=>Object.assign(new Error(message),{code,status});
const validDate=value=>{const raw=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return false;const [y,m,d]=raw.split('-').map(Number),x=new Date(Date.UTC(y,m-1,d));return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d};
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim())&&String(value||'').length<=254;
const safeText=(value,max=120)=>{const text=String(value||'').trim();return text&&text.length<=max?text:''};
export const isLiteApiSandboxKey=value=>{const key=String(value||'').trim();return key.startsWith('sand_')||key.startsWith('sandbox_')};
const sandboxFlags=()=>({supplier:'liteapi',sandbox:true,production_enabled:false,payment_enabled:false,real_charge_allowed:false});

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

export function validateLiteApiSandboxPrebook(input){
 if(!input||!safeText(input.offerId,500))throw makeError('A valid LiteAPI sandbox offerId is required.','INPUT');
 if(input.usePaymentSdk===true)throw makeError('Payment SDK is disabled for Magnanimous sandbox simulation.','INPUT');
 return true;
}

export function validateLiteApiSandboxBook(input){
 if(!input||!safeText(input.prebookId,200))throw makeError('A valid LiteAPI sandbox prebookId is required.','INPUT');
 const holder=input.holder||{};
 if(!safeText(holder.firstName,80)||!safeText(holder.lastName,80)||!validEmail(holder.email))throw makeError('Valid holder first name, last name and email are required.','INPUT');
 const guests=Array.isArray(input.guests)?input.guests:[];
 if(!guests.length||guests.length>9||guests.some(g=>!Number.isInteger(g?.occupancyNumber)||g.occupancyNumber<1||g.occupancyNumber>4||!safeText(g.firstName,80)||!safeText(g.lastName,80)||!validEmail(g.email)))throw makeError('Each sandbox guest requires occupancyNumber, first name, last name and email.','INPUT');
 const ref=input.clientReference==null?'':safeText(input.clientReference,100);
 if(input.clientReference!=null&&!ref)throw makeError('clientReference must be 100 characters or fewer.','INPUT');
 if(input.payment&&String(input.payment.method||'ACC_CREDIT_CARD')!=='ACC_CREDIT_CARD')throw makeError('Only LiteAPI ACC_CREDIT_CARD sandbox simulation is permitted.','INPUT');
 return true;
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

function mappedFailure(response,message='Sandbox supplier request failed.'){
 const upstream=Number(response?.status)||502;
 const status=upstream===408?504:[400,409,429].includes(upstream)?upstream:502;
 return {...sandboxFlags(),configured:true,error:message,status,upstream_status:upstream};
}

async function sandboxPost(url,payload,{sandboxKey,fetchImpl=fetch,timeoutMs=30000}={}){
 if(!isLiteApiSandboxKey(sandboxKey))return {...sandboxFlags(),configured:false,error:'LiteAPI sandbox key is not configured.',status:503};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  let response;
  try{response=await fetchImpl(url,{method:'POST',headers:{'content-type':'application/json','accept':'application/json','X-API-Key':sandboxKey},body:JSON.stringify(payload),signal:controller.signal})}
  catch(error){return {...sandboxFlags(),configured:true,error:error?.name==='AbortError'?'Sandbox supplier timed out.':'Sandbox supplier network request failed.',status:error?.name==='AbortError'?504:502}}
  if(!response.ok)return mappedFailure(response);
  try{return {...sandboxFlags(),configured:true,result:await boundedJson(response)}}catch(error){return {...sandboxFlags(),configured:true,error:error.message,status:error.status||502}}
 }finally{clearTimeout(timer)}
}

export async function searchLiteApiSandboxHotels(input,{sandboxKey,fetchImpl=fetch}={}){
 validateLiteApiSandboxSearch(input);
 if(!isLiteApiSandboxKey(sandboxKey))return {...sandboxFlags(),configured:false,offers:[],status:503};
 const n=Number(input.limit),limit=Number.isFinite(n)?Math.trunc(n):10;
 const payload={checkin:input.checkin,checkout:input.checkout,currency:input.currency,guestNationality:input.guestNationality,occupancies:input.occupancies.map(o=>o.children==null?{adults:o.adults}:{adults:o.adults,children:o.children}),limit:Math.min(20,Math.max(1,limit||10)),timeout:6};
 if(Array.isArray(input.hotelIds)&&input.hotelIds.length)payload.hotelIds=input.hotelIds;else{payload.cityName=input.cityName.trim();payload.countryCode=input.countryCode}
 const response=await sandboxPost(RATE_API,payload,{sandboxKey,fetchImpl,timeoutMs:12000});
 if(response.error)return {...response,offers:[]};
 return {...sandboxFlags(),configured:true,results:response.result};
}

export async function prebookLiteApiSandboxHotel(input,{sandboxKey,fetchImpl=fetch}={}){
 validateLiteApiSandboxPrebook(input);
 const payload={offerId:String(input.offerId).trim(),usePaymentSdk:false,includeCreditBalance:false};
 const response=await sandboxPost(PREBOOK_API,payload,{sandboxKey,fetchImpl,timeoutMs:30000});
 if(response.error)return response;
 return {...sandboxFlags(),configured:true,booking_simulation_enabled:true,prebook:response.result};
}

export async function bookLiteApiSandboxHotel(input,{sandboxKey,fetchImpl=fetch}={}){
 validateLiteApiSandboxBook(input);
 const prebookId=String(input.prebookId).trim();
 const clientReference=safeText(input.clientReference,100)||`MAG-SBX-${prebookId.replace(/[^A-Za-z0-9_-]/g,'').slice(0,72)}`;
 const holder={firstName:String(input.holder.firstName).trim(),lastName:String(input.holder.lastName).trim(),email:String(input.holder.email).trim()};
 const guests=input.guests.map(g=>({occupancyNumber:g.occupancyNumber,firstName:String(g.firstName).trim(),lastName:String(g.lastName).trim(),email:String(g.email).trim()}));
 const payload={prebookId,clientReference,holder,guests,payment:{method:'ACC_CREDIT_CARD'},customTags:{MAGNANIMOUS_MODE:'SANDBOX'}};
 const response=await sandboxPost(BOOK_API,payload,{sandboxKey,fetchImpl,timeoutMs:30000});
 if(response.error)return response;
 return {...sandboxFlags(),configured:true,booking_simulation_enabled:true,simulated_booking:true,booking:response.result,clientReference};
}

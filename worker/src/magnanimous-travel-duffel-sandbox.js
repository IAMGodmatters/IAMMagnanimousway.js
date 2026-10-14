// Magnanimous Travel: Duffel test-token-only, no-spend flight sandbox.
// Live Duffel tokens, instant payments, cards, balances, payment intents and production orders are intentionally unsupported here.
const OFFER_REQUEST_API='https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=12000&view=offers';
const OFFER_API='https://api.duffel.com/air/offers/';
const ORDER_API='https://api.duffel.com/air/orders';
const MAX_BYTES=1_500_000;
const makeError=(message,code,status=0)=>Object.assign(new Error(message),{code,status});
const safeText=(value,max=160)=>{const text=String(value??'').trim();return text&&text.length<=max?text:''};
const validDate=value=>{const raw=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return false;const [y,m,d]=raw.split('-').map(Number),x=new Date(Date.UTC(y,m-1,d));return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d};
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim())&&String(value||'').length<=254;
const validPhone=value=>/^\+[1-9]\d{7,14}$/.test(String(value||'').trim());
export const isDuffelTestToken=value=>String(value||'').trim().startsWith('duffel_test_');
const flags=()=>({supplier:'duffel',sandbox:true,test_mode:true,production_enabled:false,live_booking_enabled:false,payment_enabled:false,real_charge_allowed:false});

export function validateDuffelTestSearch(input){
 const slices=Array.isArray(input?.slices)?input.slices:[];
 if(!slices.length||slices.length>2)throw makeError('Supply one or two test flight slices.','INPUT');
 for(const s of slices){
  if(!/^[A-Z]{3}$/.test(String(s?.origin||'').toUpperCase())||!/^[A-Z]{3}$/.test(String(s?.destination||'').toUpperCase()))throw makeError('Each test slice needs valid 3-letter airport codes.','INPUT');
  if(!validDate(s?.departure_date))throw makeError('Each test slice needs departure_date in YYYY-MM-DD format.','INPUT');
 }
 const passengers=Array.isArray(input?.passengers)?input.passengers:[];
 if(!passengers.length||passengers.length>9||passengers.some(p=>p?.age!=null?(!Number.isInteger(p.age)||p.age<0||p.age>120):!['adult','child','infant_without_seat'].includes(String(p?.type||'adult'))))throw makeError('Supply one to nine valid test passengers.','INPUT');
 const cabin=String(input?.cabin_class||'economy');
 if(!['economy','premium_economy','business','first'].includes(cabin))throw makeError('Invalid cabin class.','INPUT');
 return true;
}

function sanitizePassenger(p){
 const allowed=new Set(['id','title','gender','given_name','family_name','born_on','email','phone_number','type']);
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!allowed.has(k)))throw makeError('Sandbox passenger contains unsupported fields.','INPUT');
 const id=safeText(p.id,100),given=safeText(p.given_name,80),family=safeText(p.family_name,80),born=String(p.born_on||''),email=String(p.email||'').trim(),phone=String(p.phone_number||'').trim();
 if(!id||!given||!family||!validDate(born)||!validEmail(email)||!validPhone(phone))throw makeError('Each test passenger requires the Duffel passenger ID, name, birth date, email and E.164 phone.','INPUT');
 const title=String(p.title||'mr').toLowerCase(),gender=String(p.gender||'m').toLowerCase(),type=String(p.type||'adult');
 if(!['mr','mrs','ms','miss','dr'].includes(title)||!['m','f'].includes(gender)||!['adult','child','infant_without_seat'].includes(type))throw makeError('Invalid test passenger title, gender or type.','INPUT');
 // `type` is accepted only as a local validation hint. Duffel already ties passenger type to the offer passenger ID, so it is deliberately not forwarded in the order passenger object.
 return{id,title,gender,given_name:given,family_name:family,born_on:born,email,phone_number:phone};
}

export function validateDuffelTestHold(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw makeError('Valid sandbox hold input required.','INPUT');
 const allowed=new Set(['offerId','passengers']);
 if(Object.keys(input).some(k=>!allowed.has(k)))throw makeError('Only offerId and passenger identity fields are permitted; payment and production fields are forbidden.','INPUT');
 if(!safeText(input.offerId,120))throw makeError('A valid Duffel test offer ID is required.','INPUT');
 const passengers=Array.isArray(input.passengers)?input.passengers:[];
 if(!passengers.length||passengers.length>9)throw makeError('Supply one to nine test passengers.','INPUT');
 return passengers.map(sanitizePassenger);
}

async function boundedJson(response){
 if(response.status===204)return{};
 const declared=Number(response.headers?.get?.('content-length')||0);if(declared>MAX_BYTES)throw makeError('Duffel test response exceeds size limit.','SUPPLIER',502);
 const reader=response.body?.getReader?.();
 if(!reader){const buf=await response.arrayBuffer();if(buf.byteLength>MAX_BYTES)throw makeError('Duffel test response exceeds size limit.','SUPPLIER',502);const text=new TextDecoder().decode(buf);try{return text.trim()?JSON.parse(text):{}}catch{throw makeError('Duffel test mode returned malformed JSON.','SUPPLIER',502)}}
 let total=0,text='',decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES){await reader.cancel().catch(()=>{});throw makeError('Duffel test response exceeds size limit.','SUPPLIER',502)}text+=decoder.decode(value,{stream:true})}
 text+=decoder.decode();try{return text.trim()?JSON.parse(text):{}}catch{throw makeError('Duffel test mode returned malformed JSON.','SUPPLIER',502)}
}
function mappedStatus(status){const n=Number(status)||502;if(n===408)return 504;return[400,404,409,410,422,429].includes(n)?n:502}
function errorMessage(payload,fallback){return safeText(payload?.errors?.[0]?.message||payload?.meta?.message||fallback,240)||fallback}
async function duffelRequest(url,{token,method='GET',body,fetchImpl=fetch,timeoutMs=20000}={}){
 if(!isDuffelTestToken(token))return{...flags(),configured:false,error:'Duffel developer test token is not configured.',status:503};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  let response;
  try{response=await fetchImpl(url,{method,headers:{Authorization:`Bearer ${String(token).trim()}`,'Duffel-Version':'v2',Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal})}
  catch(error){return{...flags(),configured:true,error:error?.name==='AbortError'?'Duffel test mode timed out.':'Duffel test-mode network request failed.',status:error?.name==='AbortError'?504:502}}
  let payload={};try{payload=await boundedJson(response)}catch(error){return{...flags(),configured:true,error:error.message,status:error.status||502}}
  if(!response.ok)return{...flags(),configured:true,error:errorMessage(payload,`Duffel test request failed (${response.status}).`),status:mappedStatus(response.status),upstream_status:response.status};
  return{...flags(),configured:true,result:payload};
 }finally{clearTimeout(timer)}
}
function itinerary(offer){return(offer?.slices||[]).map(slice=>({origin:slice?.origin?.iata_code||'',destination:slice?.destination?.iata_code||'',duration:slice?.duration||'',segments:(slice?.segments||[]).map(seg=>({origin:seg?.origin?.iata_code||'',destination:seg?.destination?.iata_code||'',departing_at:seg?.departing_at||'',arriving_at:seg?.arriving_at||'',carrier:seg?.operating_carrier?.name||seg?.marketing_carrier?.name||'',flight_number:seg?.marketing_carrier_flight_number||''}))}))}

export async function searchDuffelTestFlights(input,{testToken,fetchImpl=fetch}={}){
 validateDuffelTestSearch(input);
 if(!isDuffelTestToken(testToken))return{...flags(),configured:false,offers:[],status:503};
 const data={slices:input.slices.map(s=>({origin:String(s.origin).toUpperCase(),destination:String(s.destination).toUpperCase(),departure_date:String(s.departure_date)})),passengers:input.passengers.map(p=>p.age!=null?{age:p.age}:{type:String(p.type||'adult')}),cabin_class:String(input.cabin_class||'economy'),max_connections:Math.max(0,Math.min(Number.isInteger(input.max_connections)?input.max_connections:1,3))};
 const response=await duffelRequest(OFFER_REQUEST_API,{token:testToken,method:'POST',body:{data},fetchImpl,timeoutMs:20000});
 if(response.error)return{...response,offers:[]};
 const root=response.result?.data||{};
 if(root.live_mode===true)return{...flags(),configured:true,error:'Duffel unexpectedly returned live-mode data to the test sandbox.',status:502,offers:[]};
 const passengerIds=(root.passengers||[]).map(p=>safeText(p?.id,100)).filter(Boolean);
 const offers=Array.isArray(root.offers)?root.offers:[];
 return{...flags(),configured:true,request_id:safeText(root.id,120)||null,passenger_ids:passengerIds,offers:offers.slice(0,30).map(o=>({offer_id:safeText(o.id,120),live_mode:o.live_mode===true,holdable:o?.payment_requirements?.requires_instant_payment===false,payment_required_by:o?.payment_requirements?.payment_required_by||null,price_guarantee_expires_at:o?.payment_requirements?.price_guarantee_expires_at||null,total_amount:safeText(o.total_amount,40),total_currency:safeText(o.total_currency,8),owner:{name:safeText(o?.owner?.name,120),iata_code:safeText(o?.owner?.iata_code,8)},expires_at:o.expires_at||null,itinerary:itinerary(o)})).filter(o=>o.offer_id&&!o.live_mode)};
}

export async function createDuffelTestHold(input,{testToken,fetchImpl=fetch}={}){
 const passengers=validateDuffelTestHold(input);
 if(!isDuffelTestToken(testToken))return{...flags(),configured:false,status:503,error:'Duffel developer test token is not configured.'};
 const offerId=String(input.offerId).trim();
 const offerResponse=await duffelRequest(`${OFFER_API}${encodeURIComponent(offerId)}`,{token:testToken,fetchImpl,timeoutMs:15000});
 if(offerResponse.error)return offerResponse;
 const offer=offerResponse.result?.data||{};
 if(offer.live_mode===true)return{...flags(),configured:true,error:'Live Duffel offers are forbidden in the no-spend test lab.',status:403};
 if(offer?.payment_requirements?.requires_instant_payment!==false)return{...flags(),configured:true,error:'This test offer requires instant payment. Only unpaid hold-capable test offers are permitted.',status:409};
 if(offer.expires_at&&Date.parse(offer.expires_at)<=Date.now())return{...flags(),configured:true,error:'This Duffel test offer has expired.',status:410};
 const expected=(offer.passengers||[]).map(p=>safeText(p?.id,100)).filter(Boolean).sort(),provided=passengers.map(p=>p.id).sort();
 if(expected.length&&JSON.stringify(expected)!==JSON.stringify(provided))return{...flags(),configured:true,error:'Passenger IDs must match the selected Duffel test offer.',status:400};
 const response=await duffelRequest(ORDER_API,{token:testToken,method:'POST',body:{data:{type:'hold',selected_offers:[offerId],passengers}},fetchImpl,timeoutMs:30000});
 if(response.error)return response;
 const order=response.result?.data||{},orderId=safeText(order.id,120);
 if(!orderId||order.live_mode===true)return{...flags(),configured:true,error:'Duffel did not confirm a test-mode hold order.',status:502};
 return{...flags(),configured:true,simulated_hold:true,hold_order_confirmed:true,order_id:orderId,booking_reference:safeText(order.booking_reference,80)||null,payment_status:order.payment_status||null,payment_required_by:order?.payment_status?.payment_required_by||order.payment_required_by||offer?.payment_requirements?.payment_required_by||null,note:'Test-mode hold only. No payments were sent and no live flight was booked.'};
}

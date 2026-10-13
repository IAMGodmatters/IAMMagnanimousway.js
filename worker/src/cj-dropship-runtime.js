import {getProviderRuntimeEnv} from './provider-runtime-env.js';

const API='https://developers.cjdropshipping.com/api2.0/v1';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let tokenCache={apiKey:'',token:'',expiresAt:0};
let lastCallAt=0;

async function throttledFetch(url,options={}){
 const wait=Math.max(0,1050-(Date.now()-lastCallAt));
 if(wait)await sleep(wait);
 lastCallAt=Date.now();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}
}
async function apiJson(url,options={}){
 const response=await throttledFetch(url,options),data=await response.json().catch(()=>({}));
 return{ok:response.ok&&data?.result!==false&&Number(data?.code||200)===200,status:response.status,data};
}
async function runtime(env){return getProviderRuntimeEnv(env)}
async function access(env){
 const rt=await runtime(env),apiKey=String(rt.CJ_API_KEY||'').trim();
 if(!apiKey)return{ok:false,code:'supplier_not_connected',detail:'Dropshipping supplier connection is not configured.'};
 if(tokenCache.apiKey===apiKey&&tokenCache.token&&tokenCache.expiresAt>Date.now()+86400000)return{ok:true,rt,token:tokenCache.token};
 const result=await apiJson(`${API}/authentication/getAccessToken`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({apiKey})});
 const token=String(result.data?.data?.accessToken||'').trim();
 if(!result.ok||!token)return{ok:false,code:'supplier_auth_failed',detail:String(result.data?.message||'Supplier authentication failed.')};
 const parsed=Date.parse(String(result.data?.data?.accessTokenExpiryDate||''));
 tokenCache={apiKey,token,expiresAt:Number.isFinite(parsed)?parsed:Date.now()+150*86400000};
 return{ok:true,rt,token};
}
async function cjCall(token,path,options={}){
 const headers={'CJ-Access-Token':token,...(options.headers||{})};
 return apiJson(`${API}${path}`,{...options,headers});
}
function cents(value){return Math.max(0,Math.round(Number(value||0)*100))}
function exactVariant(data,sku){
 const variants=Array.isArray(data?.variants)?data.variants:[];
 return variants.find(v=>String(v.variantSku||'').trim()===sku)||null;
}
function onlyVariant(data){const variants=Array.isArray(data?.variants)?data.variants:[];return variants.length===1&&String(variants[0]?.variantSku||'').trim()?variants[0]:null}
async function resolveVariant(token,sku){
 const clean=String(sku||'').trim();if(!clean)return null;
 let response=await cjCall(token,`/product/query?variantSku=${encodeURIComponent(clean)}`);
 let product=response.data?.data||null,variant=exactVariant(product,clean);
 if(variant)return{...variant,productSku:String(product?.productSku||''),productName:String(product?.productNameEn||'')};
 response=await cjCall(token,`/product/query?productSku=${encodeURIComponent(clean)}`);
 product=response.data?.data||null;variant=exactVariant(product,clean)||onlyVariant(product);
 if(variant)return{...variant,productSku:String(product?.productSku||clean),productName:String(product?.productNameEn||'')};
 const variants=await cjCall(token,`/product/variant/query?productSku=${encodeURIComponent(clean)}`),list=Array.isArray(variants.data?.data)?variants.data.data:[];
 variant=list.find(v=>String(v.variantSku||'').trim()===clean)||(list.length===1&&String(list[0]?.variantSku||'').trim()?list[0]:null);
 return variant?{...variant,productSku:clean,productName:''}:null;
}
function freightCost(row){
 const direct=Number(row?.totalPostageFee);if(Number.isFinite(direct)&&direct>=0)return direct;
 return Math.max(0,Number(row?.logisticPrice||0)+Number(row?.taxesFee||0)+Number(row?.clearanceOperationFee||0));
}
export async function cjSupplierConfigured(env){
 const rt=await runtime(env);return Boolean(String(rt.CJ_API_KEY||'').trim());
}
export async function checkCjSupplierConnection(env){
 const auth=await access(env);
 if(!auth.ok)return auth;
 const balance=await supplierBalance(auth.token);
 if(!balance.ok)return{ok:false,code:'supplier_balance_unavailable',detail:balance.detail};
 return{ok:true,balanceCents:Number(balance.balanceCents||0)};
}
export async function verifyCjCatalogVariant(env,sku){
 const auth=await access(env);if(!auth.ok)return auth;
 const variant=await resolveVariant(auth.token,sku);
 if(!variant?.vid||!String(variant.variantSku||'').trim())return{ok:false,code:'exact_variant_required',detail:'The exact supplier variant is not verified.'};
 const unitCostCents=cents(variant.variantSellPrice);
 if(!unitCostCents)return{ok:false,code:'supplier_price_unavailable',detail:'The exact supplier variant does not have a usable live price.'};
 return{ok:true,vid:String(variant.vid),sku:String(variant.variantSku),productSku:String(variant.productSku||''),productName:String(variant.productName||''),unitCostCents};
}

function matchTokens(value){return new Set(String(value||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(x=>x.length>2&&!['and','with','set','the','for'].includes(x)))}
function matchScore(query,title){const wanted=matchTokens(query),got=matchTokens(title);if(!wanted.size)return 0;let hits=0;for(const token of wanted)if(got.has(token))hits++;if(wanted.size<=2&&hits<wanted.size)return 0;return hits/wanted.size}
export async function searchCjCatalogTarget(env,query){
 const auth=await access(env);if(!auth.ok)return auth;
 const q=String(query||'').trim();if(!q)return{ok:false,code:'empty_query',detail:'Catalog search query is empty.'};
 const result=await cjCall(auth.token,`/product/listV2?page=1&size=8&keyWord=${encodeURIComponent(q)}`);
 if(!result.ok){const code=result.status===429?'supplier_rate_limited':'supplier_search_failed';return{ok:false,code,detail:String(result.data?.message||`Supplier catalog search failed with HTTP ${result.status||'unknown'}.`)}}
 const content=Array.isArray(result.data?.data?.content)?result.data.data.content:[],products=content.flatMap(group=>Array.isArray(group?.productList)?group.productList:[]);
 if(!products.length)return{ok:false,code:'no_match',detail:'No current CJ catalog match was found.'};
 const ranked=products.map(product=>({product,score:matchScore(q,product?.nameEn)})).sort((a,b)=>b.score-a.score||Number(a.product?.sellPrice||999999)-Number(b.product?.sellPrice||999999));
 const best=ranked[0],price=Math.max(0,Math.round(Number(best.product?.sellPrice||0)*100));
 return{ok:true,score:best.score,id:String(best.product?.id||''),sku:String(best.product?.sku||best.product?.spu||''),title:String(best.product?.nameEn||''),priceCents:price,image:String(best.product?.bigImage||'')};
}
export async function quoteCjCart(env,loaded,{country='US',zip=''}={}){
 const auth=await access(env);if(!auth.ok)return auth;
 const lines=[];
 for(const item of loaded){
  if(String(item.row?.supplier_provider||'').toLowerCase()!=='cj')return{ok:false,code:'unsupported_supplier',detail:'A product is not mapped to the active dropshipping supplier.'};
  const variant=await resolveVariant(auth.token,item.row?.supplier_sku||item.row?.supplier_product_id);
  if(!variant?.vid)return{ok:false,code:'variant_unavailable',detail:`${String(item.row?.title||'A product')} is temporarily unavailable from the supplier.`};
  const unitCostCents=cents(variant.variantSellPrice);
  if(!unitCostCents)return{ok:false,code:'supplier_price_unavailable',detail:`${String(item.row?.title||'A product')} does not have a usable supplier price.`};
  lines.push({productId:String(item.row.id),vid:String(variant.vid),sku:String(variant.variantSku||item.row.supplier_sku||''),quantity:Number(item.quantity||1),unitCostCents,productCostCents:unitCostCents*Number(item.quantity||1)});
 }
 const freight=await cjCall(auth.token,'/logistic/freightCalculate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({startCountryCode:'CN',endCountryCode:String(country||'US').toUpperCase(),zip:String(zip||''),products:lines.map(x=>({quantity:x.quantity,vid:x.vid}))})});
 const options=Array.isArray(freight.data?.data)?freight.data.data.map(row=>({...row,cost:freightCost(row)})).filter(row=>Number.isFinite(row.cost)&&row.cost>=0):[];
 if(!freight.ok||!options.length)return{ok:false,code:'shipping_unavailable',detail:'No supplier shipping method is available for this destination.'};
 options.sort((a,b)=>a.cost-b.cost);const selected=options[0];
 const productCostCents=lines.reduce((sum,line)=>sum+line.productCostCents,0),shippingCents=cents(selected.cost);
 return{ok:true,token:auth.token,lines,productCostCents,shippingCents,supplierTotalCents:productCostCents+shippingCents,logisticName:String(selected.logisticName||''),aging:String(selected.logisticAging||''),country:String(country||'US').toUpperCase()};
}
function countryName(code){return({US:'United States',PH:'Philippines',CA:'Canada',GB:'United Kingdom',AU:'Australia',SG:'Singapore'}[String(code||'').toUpperCase()]||String(code||'').toUpperCase())}
async function supplierBalance(token){
 const response=await cjCall(token,'/shopping/pay/getBalance');
 if(!response.ok)return{ok:false,balanceCents:0,detail:String(response.data?.message||'Supplier balance could not be verified.')};
 return{ok:true,balanceCents:cents(response.data?.data?.amount)};
}
async function deleteCreatedOrder(token,id){
 if(!id)return;await cjCall(token,`/shopping/order/deleteOrder?orderId=${encodeURIComponent(id)}`,{method:'DELETE'}).catch(()=>null);
}

export async function reconcileCjOrder(env,externalOrderId){
 const id=String(externalOrderId||'').trim();
 if(!id)return{ok:true,committed:false,status:'NO_ORDER'};
 const auth=await access(env);if(!auth.ok)return auth;
 const detail=await cjCall(auth.token,`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(id)}`);
 if(!detail.ok)return{ok:false,code:'supplier_status_unknown',detail:String(detail.data?.message||'Supplier order status could not be confirmed.')};
 const data=detail.data?.data||{},status=String(data.orderStatus||data.status||'').trim().toUpperCase();
 const committed=new Set(['PENDING','PROCESSING','UNSHIPPED','SHIPPED','DELIVERED']);
 if(committed.has(status))return{ok:true,committed:true,status};
 if(status==='CREATED'||status==='IN_CART'){
  const removed=await cjCall(auth.token,`/shopping/order/deleteOrder?orderId=${encodeURIComponent(id)}`,{method:'DELETE'});
  return removed.ok?{ok:true,committed:false,cancelled:true,status}:{ok:false,code:'supplier_cancel_failed',detail:String(removed.data?.message||'Uncommitted supplier order could not be cancelled.')};
 }
 if(status==='UNPAID'||status==='CANCELLED')return{ok:true,committed:false,status};
 return{ok:false,code:'supplier_status_ambiguous',detail:`Supplier order is in an unrecognized state (${status||'unknown'}).`};
}
export async function resumeCjOrderPayment(env,{externalOrderId,budgetCents=0}){
 const id=String(externalOrderId||'').trim();
 if(!id)return{ok:false,code:'supplier_order_missing',status:'retry',detail:'Supplier order reference is missing.'};
 const auth=await access(env);if(!auth.ok)return{...auth,status:'retry'};
 const detail=await cjCall(auth.token,`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(id)}`);
 if(!detail.ok)return{ok:false,code:'supplier_status_unknown',status:'retry',externalOrderId:id,detail:String(detail.data?.message||'Supplier order status could not be confirmed.')};
 const data=detail.data?.data||{},status=String(data.orderStatus||data.status||'').trim().toUpperCase();
 const committed=new Set(['PENDING','PROCESSING','UNSHIPPED','SHIPPED','DELIVERED']);
 if(committed.has(status))return{ok:true,status:'submitted',externalOrderId:id,resumed:true};
 if(status==='CANCELLED'||status==='DELETED')return{ok:false,code:'supplier_order_cancelled',status:'recreate_allowed',externalOrderId:id,recreate:true,detail:'The previous supplier order is cancelled and may be recreated safely.'};
 if(!['CREATED','IN_CART','UNPAID'].includes(status))return{ok:false,code:'supplier_status_ambiguous',status:'retry',externalOrderId:id,detail:`Supplier order is in an unrecognized state (${status||'unknown'}).`};
 const amount=cents(Number(data.orderAmount||data.totalAmount||0)),budget=Math.max(0,Number(budgetCents||0));
 if(!amount)return{ok:false,code:'supplier_cost_unverified',status:'retry',externalOrderId:id,detail:'Existing supplier order cost could not be verified before payment.'};
 if(amount>budget)return{ok:false,code:'cost_guard_existing_order',status:'supplier_cost_guard',externalOrderId:id,detail:'Existing supplier order exceeds the prepaid supplier budget.'};
 const maxAuto=cents(Number(auth.rt.STORE_AUTO_FULFILL_MAX_USD||100));
 if(maxAuto&&amount>maxAuto)return{ok:false,code:'auto_cap_existing_order',status:'supplier_cost_guard',externalOrderId:id,detail:'Existing supplier order exceeds the automatic fulfillment safety cap.'};
 const balance=await supplierBalance(auth.token);
 if(!balance.ok)return{ok:false,code:'supplier_balance_unavailable',status:'retry',externalOrderId:id,detail:balance.detail};
 if(balance.balanceCents<amount)return{ok:false,code:'insufficient_supplier_balance',status:'awaiting_supplier_funds',externalOrderId:id,detail:'Supplier balance is below the verified existing order cost.'};
 const shipmentOrderId=String(data.shipmentOrderId||data.shipmentId||id),payId=String(data.payId||'');
 const pay=await cjCall(auth.token,'/shopping/pay/payBalanceV2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({shipmentOrderId,payId:payId||undefined})});
 if(!pay.ok)return{ok:false,code:'supplier_payment_failed',status:'awaiting_supplier_funds',externalOrderId:id,shipmentOrderId,detail:String(pay.data?.message||'Existing supplier order payment failed.')};
 return{ok:true,status:'submitted',externalOrderId:id,shipmentOrderId,costCents:amount,resumed:true};
}

export async function fulfillCjOrder(env,{order,items,shipping}){
 const rt=await runtime(env);
 if(String(rt.STORE_AUTO_FULFILL||'true').toLowerCase()!=='true')return{ok:false,code:'auto_fulfillment_disabled',status:'awaiting_supplier_activation'};
 const quote=await quoteCjCart(rt,items,{country:shipping?.address?.country||order.destination_country||'US',zip:shipping?.address?.postal_code||''});
 if(!quote.ok)return{...quote,status:'retry'};
 const budget=Math.max(0,Number(order.supplier_budget_cents||0));
 if(quote.supplierTotalCents>budget)return{ok:false,code:'cost_guard',status:'supplier_cost_guard',detail:'Live supplier product and freight cost exceeds the prepaid supplier budget.'};
 const maxAuto=cents(Number(rt.STORE_AUTO_FULFILL_MAX_USD||100));
 if(maxAuto&&quote.supplierTotalCents>maxAuto)return{ok:false,code:'auto_cap',status:'supplier_cost_guard',detail:'Supplier cost exceeds the automatic fulfillment safety cap.'};
 const balance=await supplierBalance(quote.token);
 if(!balance.ok)return{ok:false,code:'supplier_balance_unavailable',status:'retry',detail:balance.detail};
 if(balance.balanceCents<quote.supplierTotalCents)return{ok:false,code:'insufficient_supplier_balance',status:'awaiting_supplier_funds',detail:'Supplier balance is below the verified order cost.'};
 const address=shipping?.address||{},name=String(shipping?.name||'').trim();
 if(!name||!address.line1||!address.city||!address.country)return{ok:false,code:'address_incomplete',status:'address_review',detail:'Customer shipping address is incomplete.'};
 const create=await cjCall(quote.token,'/shopping/order/createOrderV2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderNumber:String(order.public_id),shippingZip:String(address.postal_code||''),shippingCountry:countryName(address.country),shippingCountryCode:String(address.country).toUpperCase(),shippingProvince:String(address.state||address.city),shippingCity:String(address.city),shippingPhone:String(shipping?.phone||''),shippingCustomerName:name,shippingAddress:String(address.line1),shippingAddress2:String(address.line2||''),email:String(order.customer_email||''),payType:3,logisticName:quote.logisticName,fromCountryCode:'CN',platform:'Api',orderFlow:1,products:quote.lines.map((line,index)=>({vid:line.vid,quantity:line.quantity,storeLineItemId:`${order.public_id}-${index+1}`}))})});
 const data=create.data?.data||{},orderId=String(data.orderId||''),shipmentOrderId=String(data.shipmentOrderId||orderId),finalCost=cents(Number(data.orderAmount||0));
 if(!create.ok||!orderId)return{ok:false,code:'supplier_order_create_failed',status:'retry',detail:String(create.data?.message||'Supplier order could not be created.')};
 if(finalCost&&finalCost>budget){await deleteCreatedOrder(quote.token,orderId);return{ok:false,code:'cost_guard_after_create',status:'supplier_cost_guard',detail:'Supplier final order amount exceeded the prepaid supplier budget.'};}
 const pay=await cjCall(quote.token,'/shopping/pay/payBalanceV2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({shipmentOrderId,payId:String(data.payId||'')||undefined})});
 if(!pay.ok)return{ok:false,code:'supplier_payment_failed',status:'awaiting_supplier_funds',externalOrderId:orderId,shipmentOrderId,detail:String(pay.data?.message||'Supplier balance payment failed.')};
 return{ok:true,status:'submitted',externalOrderId:orderId,shipmentOrderId,costCents:finalCost||quote.supplierTotalCents,logisticName:quote.logisticName};
}

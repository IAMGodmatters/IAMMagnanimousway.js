import {currentUser} from './integrations.js';
import {tenantPlan,canUsePremium,recordUsage} from './usage-guard.js';
import {renderVisualScene} from './visual-runtime.js';
import {googleImageOriginCost,googleImageReserveUsd,googleOmniVideoOriginCost,googleOmniVideoReserveUsd,googleVeoOriginCost,googleVeoReserveUsd,googleTtsOriginCost,googleTtsReserveUsd,providerBillingMode,variableCustomerCharge,PROVIDER_PRICE_MARKUP_PERCENT,PROVIDER_PRICING_VERIFIED_AT} from './provider-origin-pricing.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const WATERMARK='Magnanimous AI • I AM MAGNANIMOUS WAY™';
const IMAGE_SIZES=new Set(['0.5K','1K','2K','4K']);
const VIDEO_RESOLUTIONS=new Set(['360p','720p','1080p','4k']);
const ASPECTS=new Set(['1:1','3:2','2:3','4:3','3:4','16:9','9:16','5:4','4:5','21:9','1:4','4:1','1:8','8:1']);

const enabled=env=>String(env?.ENABLE_PREMIUM_MEDIA||'').toLowerCase()==='true';
const googleApiReady=env=>Boolean(String(env?.GOOGLE_API_KEY||'').trim());
const googleReady=env=>enabled(env)&&googleApiReady(env);
const studioVoiceReady=env=>googleApiReady(env);
const freeRendererBase=env=>String(env?.MAGNANIMOUS_VIDEO_GATEWAY_URL||env?.VIDEO_GATEWAY_URL||env?.NEXT_PUBLIC_VIDEO_API_BASE_URL||'https://iam-magnanimous-video-gateway.iam-magnanimous.workers.dev').replace(/\/$/,'');
const cleanText=(value,max=4000)=>String(value||'').replace(/\u0000/g,'').trim().slice(0,max);
const watermarkRequired=plan=>['free','plus'].includes(String(plan||'free').toLowerCase());
const bytesFromB64=value=>{const raw=atob(String(value||'')),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out};
const b64FromBytes=bytes=>{let out='';const view=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(let i=0;i<view.length;i+=0x8000)out+=String.fromCharCode(...view.subarray(i,i+0x8000));return btoa(out)};
function parseDataUri(value){
 const m=String(value||'').match(/^data:([^;,]+);base64,(.+)$/s);
 if(!m)return null;return{content_type:m[1],base64:m[2],bytes:bytesFromB64(m[2])};
}
function extFor(contentType){const t=String(contentType||'').toLowerCase();if(t.includes('png'))return'png';if(t.includes('svg'))return'svg';if(t.includes('webp'))return'webp';if(t.includes('jpeg')||t.includes('jpg'))return'jpg';if(t.includes('wav'))return'wav';if(t.includes('mpeg'))return'mp3';return'mp4'}
function xmlEscape(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function aspectViewBox(aspect){
 const [a,b]=String(aspect||'16:9').split(':').map(Number);const w=1600,h=Math.round(w*(b||9)/(a||16));return{w,h};
}
function imageModelFor(quality,size){
 const q=String(quality||'balanced').toLowerCase();
 if(q==='economy')return{quality:'economy',model:'gemini-3.1-flash-lite-image',size:'1K'};
 if(q==='max'||q==='pro')return{quality:'max',model:'gemini-3-pro-image',size:String(size||'2K').toUpperCase()==='0.5K'?'1K':String(size||'2K').toUpperCase()};
 return{quality:'balanced',model:'gemini-3.1-flash-image',size:String(size||'2K').toUpperCase()==='0.5K'?'0.5K':String(size||'2K').toUpperCase()};
}
function videoModelFor(quality,resolution){
 const q=String(quality||'economy').toLowerCase(),requested=String(resolution||'720p').toLowerCase();
 if(q==='max'||q==='cinematic')return{quality:'max',engine:'veo',model:'veo-3.1-generate-preview',resolution:['720p','1080p','4k'].includes(requested)?requested:'4k'};
 if(q==='fast')return{quality:'fast',engine:'veo',model:'veo-3.1-fast-generate-preview',resolution:['720p','1080p','4k'].includes(requested)?requested:'1080p'};
 if(q==='editable'||q==='balanced')return{quality:'editable',engine:'omni',model:'gemini-omni-1.1-flash',resolution:VIDEO_RESOLUTIONS.has(requested)?requested:'720p'};
 return{quality:'economy',engine:'veo',model:'veo-3.1-lite-generate-preview',resolution:['720p','1080p'].includes(requested)?requested:'720p'};
}
function wavDurationSeconds(bytes){
 try{
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(bytes.byteLength<44||String.fromCharCode(...bytes.slice(0,4))!=='RIFF')return 0;
  let offset=12,sampleRate=24000,channels=1,bits=16,dataSize=0;
  while(offset+8<=bytes.byteLength){
   const id=String.fromCharCode(...bytes.slice(offset,offset+4)),size=view.getUint32(offset+4,true),body=offset+8;
   if(id==='fmt '&&body+16<=bytes.byteLength){channels=view.getUint16(body+2,true)||1;sampleRate=view.getUint32(body+4,true)||24000;bits=view.getUint16(body+14,true)||16}
   if(id==='data'){dataSize=size;break}
   offset=body+size+(size%2);
  }
  const bytesPerSecond=sampleRate*channels*Math.max(1,bits/8);return bytesPerSecond?dataSize/bytesPerSecond:0;
 }catch{return 0}
}
async function watermarkImage(env,dataUri,aspect){
 const parsed=parseDataUri(dataUri);if(!parsed)throw new Error('Generated image data is invalid.');
 if(env?.MAGNANIMOUS_IMAGES?.configured){
  try{
   const out=await env.MAGNANIMOUS_IMAGES.transform(parsed.base64,{format:'png',quality:96,watermark_text:WATERMARK,watermark_position:'bottom-right'});
   if(out?.base64)return{bytes:bytesFromB64(out.base64),content_type:'image/png',watermarked:true};
  }catch(error){console.error('native watermark transform fallback',error)}
 }
 const {w,h}=aspectViewBox(aspect);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${xmlEscape(dataUri)}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"/><g font-family="Arial,Helvetica,sans-serif" text-anchor="end"><rect x="${w-690}" y="${h-82}" width="660" height="54" rx="14" fill="#000" fill-opacity=".56"/><text x="${w-48}" y="${h-46}" font-size="24" font-weight="700" fill="#fff">${xmlEscape(WATERMARK)}</text></g></svg>`;
 return{bytes:new TextEncoder().encode(svg),content_type:'image/svg+xml',watermarked:true};
}
async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS movie_maker_assets(
  id TEXT PRIMARY KEY,share_token TEXT NOT NULL UNIQUE,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,
  kind TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',object_key TEXT NOT NULL DEFAULT '',source_url TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,watermarked INTEGER NOT NULL DEFAULT 1,ad_supported INTEGER NOT NULL DEFAULT 0,
  provider_origin_cost_usd REAL NOT NULL DEFAULT 0,customer_charge_usd REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,expires_at INTEGER
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS movie_maker_jobs(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,
  interaction_id TEXT NOT NULL DEFAULT '',prompt TEXT NOT NULL DEFAULT '',title TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',aspect_ratio TEXT NOT NULL DEFAULT '16:9',seconds INTEGER NOT NULL DEFAULT 0,
  error_text TEXT NOT NULL DEFAULT '',asset_id TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_movie_assets_tenant ON movie_maker_assets(tenant_id,created_at DESC)').run();
}
async function planFor(env,user){const p=await tenantPlan(env,user.tenant_id);return p.plan||'free'}
function mediaPolicy(plan){
 const watermarked=watermarkRequired(plan),premiumRank=!watermarked&&['business','pro','scale','agency','agency_pro'].includes(plan);
 return{
  plan,watermark_required:watermarked,watermark_text:watermarked?WATERMARK:null,
  clean_export:!watermarked,ad_supported:plan==='free',
  premium_studio_allowed:premiumRank,
  downloads:true,copy:true,web_share:true,
  direct_social_handoff:['youtube','tiktok','linkedin']
 };
}
function priceCard(){
 const flashImages=Object.fromEntries(['0.5K','1K','2K','4K'].map(size=>{const reserve=googleImageReserveUsd(size,'gemini-3.1-flash-image'),origin=Math.max(0,Number(reserve||0)-.03),charge=variableCustomerCharge(origin);return[size,{provider_origin_usd:origin,customer_variable_usd:charge.customer_charge_usd}]}));
 const proImages=Object.fromEntries(['1K','2K','4K'].map(size=>{const reserve=googleImageReserveUsd(size,'gemini-3-pro-image'),origin=Math.max(0,Number(reserve||0)-.03),charge=variableCustomerCharge(origin);return[size,{provider_origin_usd:origin,customer_variable_usd:charge.customer_charge_usd}]}));
 const liteOrigin=Math.max(0,Number(googleImageReserveUsd('1K','gemini-3.1-flash-lite-image')||0)-.03);
 const omniSecond=Number((5792*17.50/1_000_000).toFixed(6));
 return{
  markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,
  premium_image:{
   economy_1k:{provider_origin_usd:liteOrigin,customer_variable_usd:variableCustomerCharge(liteOrigin).customer_charge_usd},
   balanced:flashImages,
   max:proImages
  },
  premium_video:{
   economy_720p_per_second:{provider_origin_usd:.05,customer_variable_usd:.06},
   economy_1080p_per_second:{provider_origin_usd:.08,customer_variable_usd:.096},
   editable_720p_per_second:{provider_origin_usd:omniSecond,customer_variable_usd:variableCustomerCharge(omniSecond).customer_charge_usd},
   max_4k_per_second:{provider_origin_usd:.60,customer_variable_usd:.72}
  },
  premium_voice:{
   browser_native_customer_usd:0,
   api_free_tier_supported:true,
   economy_route:'/api/movie-maker/voice',
   studio_route:'/api/movie-maker/voice'
  },
  pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,
  billing_rule:'Actual paid usage is reconciled from verified provider-origin usage and customer variable pricing is origin cost plus exactly 20%. Free provider-tier usage remains $0 variable cost.'
 };
}
async function persistAsset(env,request,user,{kind,title,bytes,content_type,watermarked,origin=0,customer=0,source_url=''}) {
 const id=crypto.randomUUID(),share=crypto.randomUUID().replace(/-/g,''),extension=extFor(content_type),key=`movie-maker/${user.tenant_id}/${id}.${extension}`;
 let objectKey='',publicSource=source_url;
 if(bytes?.byteLength&&env?.MAGNANIMOUS_OBJECT_STORE?.put){
  await env.MAGNANIMOUS_OBJECT_STORE.put(key,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{httpMetadata:{contentType:content_type,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{tenant_id:String(user.tenant_id),kind:String(kind)}});
  objectKey=key;publicSource=`${new URL(request.url).origin}/api/movie-maker/share/${share}`;
 }
 await env.DB.prepare(`INSERT INTO movie_maker_assets(id,share_token,tenant_id,user_id,kind,title,object_key,source_url,content_type,watermarked,ad_supported,provider_origin_cost_usd,customer_charge_usd,created_at)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,share,String(user.tenant_id),String(user.id),String(kind),cleanText(title,180),objectKey,publicSource,String(content_type),watermarked?1:0,(await planFor(env,user))==='free'?1:0,Number(origin||0),Number(customer||0),now()).run();
 return{id,share_token:share,asset_url:publicSource||null,download_url:publicSource||null,watch_url:`${new URL(request.url).origin}/movie?asset=${encodeURIComponent(share)}`,social_publish_url:publicSource?`/social-connect?video_url=${encodeURIComponent(publicSource)}&title=${encodeURIComponent(cleanText(title,120))}`:null,storage_persistent:Boolean(objectKey)};
}
async function shareAsset(request,env,token,metaOnly=false){
 if(!env?.DB)return json({detail:'Asset storage is unavailable.'},503);
 await ensureSchema(env);const row=await env.DB.prepare('SELECT * FROM movie_maker_assets WHERE share_token=?').bind(String(token||'')).first();
 if(!row)return json({detail:'Shared movie asset not found.'},404);
 if(metaOnly)return json({title:row.title,kind:row.kind,content_type:row.content_type,watermarked:Boolean(row.watermarked),ad_supported:Boolean(row.ad_supported),asset_url:`${new URL(request.url).origin}/api/movie-maker/share/${row.share_token}`,watch_url:`${new URL(request.url).origin}/movie?asset=${row.share_token}`});
 if(row.object_key&&env?.MAGNANIMOUS_OBJECT_STORE?.get){
  const object=await env.MAGNANIMOUS_OBJECT_STORE.get(row.object_key);if(!object)return json({detail:'Movie asset bytes are unavailable.'},404);
  const bytes=new Uint8Array(await object.arrayBuffer());return new Response(bytes,{headers:{'content-type':row.content_type,'cache-control':'public, max-age=31536000, immutable','content-disposition':`inline; filename="magnanimous-${row.kind}.${extFor(row.content_type)}"`}});
 }
 if(row.source_url)return Response.redirect(row.source_url,302);
 return json({detail:'Movie asset delivery is unavailable.'},503);
}
function extractOutput(data,type){
 const direct=type==='image'?(data?.output_image||data?.outputImage):(data?.output_video||data?.outputVideo);
 if(direct?.data||direct?.uri)return direct;
 for(const step of data?.steps||[])for(const block of step?.content||[])if(String(block?.type||'').toLowerCase()===type&&(block?.data||block?.uri))return block;
 return null;
}
async function googleInteraction(env,payload){
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':String(env.GOOGLE_API_KEY),'Api-Revision':'2026-05-20'},body:JSON.stringify(payload)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`Studio media request failed (${r.status}).`);return d;
}
async function googleInteractionGet(env,id){
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(id)}`,{headers:{'x-goog-api-key':String(env.GOOGLE_API_KEY),'Api-Revision':'2026-05-20'}});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`Studio media status failed (${r.status}).`);return d;
}
async function generateFreeImage(request,env,user,body,plan){
 const title=cleanText(body.title||'Magnanimous creation',180),prompt=cleanText(body.prompt||body.text,4000),style=cleanText(body.style||'cinematic',40),aspect=ASPECTS.has(body.aspect_ratio)?body.aspect_ratio:'16:9';
 if(!prompt)return json({detail:'Describe the picture or scene first.'},400);
 const scene=await renderVisualScene(env,{title,text:prompt,style,director:'built-in'}),parsed=parseDataUri(scene.image_data_uri);if(!parsed)throw new Error('Free-first visual output was invalid.');
 let output={bytes:parsed.bytes,content_type:parsed.content_type,watermarked:false};
 if(watermarkRequired(plan))output=await watermarkImage(env,scene.image_data_uri,aspect);
 const persisted=await persistAsset(env,request,user,{kind:'image',title,bytes:output.bytes,content_type:output.content_type,watermarked:watermarkRequired(plan)});
 const dataUri=persisted.asset_url?null:`data:${output.content_type};base64,${b64FromBytes(output.bytes)}`;
 return json({ok:true,mode:'free-first',identity:'Magnanimous AI',plan,policy:mediaPolicy(plan),asset:{...persisted,data_uri:dataUri,content_type:output.content_type},provider_details_private:true});
}
async function generateStudioImage(request,env,user,body,plan){
 if(!mediaPolicy(plan).premium_studio_allowed)return json({detail:'Studio media starts with Business. Free and Plus Movie Maker remain available with a Magnanimous watermark.',code:'BUSINESS_REQUIRED'},402);
 if(!googleReady(env))return json({detail:'Studio media is not enabled. Free-first Movie Maker remains available.',code:'STUDIO_MEDIA_NOT_CONFIGURED'},503);
 const prompt=cleanText(body.prompt||body.text,4000),title=cleanText(body.title||'Magnanimous studio image',180),size=IMAGE_SIZES.has(String(body.image_size))?String(body.image_size):'2K',aspect=ASPECTS.has(body.aspect_ratio)?body.aspect_ratio:'16:9';
 if(!prompt)return json({detail:'Describe the picture first.'},400);
 const reserve=googleImageReserveUsd(size),gate=await canUsePremium(env,user.tenant_id,{category:'studio image',estimated_provider_origin_cost_usd:reserve,required_plan:'business',entitlement:'metered_ai'});
 if(!gate.ok)return json({detail:gate.detail,code:gate.code,free_first_available:true,estimated_customer_charge_usd:gate.estimated_variable_customer_charge_usd},402);
 const input=[{type:'text',text:prompt}];
 for(const raw of Array.isArray(body.reference_images)?body.reference_images.slice(0,8):[]){const p=parseDataUri(raw);if(p)input.unshift({type:'image',mime_type:p.content_type,data:p.base64})}
 const d=await googleInteraction(env,{model:'gemini-3.1-flash-image',input,response_format:{type:'image',mime_type:'image/png',aspect_ratio:aspect,image_size:size},generation_config:{thinking_level:'high'}});
 const out=extractOutput(d,'image');if(!out?.data)throw new Error('Studio image generation returned no image bytes.');
 const priced=googleImageOriginCost({image_size:size,usage:d.usage||{}});if(!priced.ok)throw new Error(priced.code);
 const variable=variableCustomerCharge(priced.provider_origin_cost_usd),ref=`movie-image:${d.id||crypto.randomUUID()}`;
 await recordUsage(env,user.tenant_id,{category:'movie-maker-image',provider:'managed-studio-image',units:1,provider_origin_cost_usd:priced.provider_origin_cost_usd,reference_id:ref,pricing_source:priced.pricing_source,pricing_verified_at:priced.pricing_verified_at});
 const bytes=bytesFromB64(out.data),persisted=await persistAsset(env,request,user,{kind:'image',title,bytes,content_type:out.mime_type||out.mimeType||'image/png',watermarked:false,origin:priced.provider_origin_cost_usd,customer:variable.customer_charge_usd});
 return json({ok:true,mode:'studio',identity:'Magnanimous AI',plan,policy:mediaPolicy(plan),asset:{...persisted,data_uri:persisted.asset_url?null:`data:image/png;base64,${out.data}`,content_type:'image/png'},billing:{provider_origin_cost_usd:priced.provider_origin_cost_usd,markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,customer_charge_usd:variable.customer_charge_usd},provider_details_private:true});
}
async function createStudioVoice(request,env,user,body,plan){
 if(!mediaPolicy(plan).premium_studio_allowed)return json({detail:'Studio narration starts with Business. Free browser narration remains available on every plan.',code:'BUSINESS_REQUIRED'},402);
 if(!studioVoiceReady(env))return json({detail:'Studio narration is not configured yet. Free browser narration remains available.',code:'STUDIO_VOICE_NOT_CONFIGURED'},503);
 const text=cleanText(body.text||body.narration||body.script,5000),title=cleanText(body.title||'Magnanimous narration',180);
 if(!text)return json({detail:'Add narration text first.'},400);
 const quality=String(body.quality||'expressive').toLowerCase()==='fast'?'fast':'expressive';
 const pricingKey=quality==='fast'?'elevenlabs-flash-v2.5':'elevenlabs-v3';
 const priced=voiceOriginCost({provider:pricingKey,characters:text.length});
 if(!priced.ok)return json({detail:priced.detail||priced.code,code:priced.code},409);
 const gate=await canUsePremium(env,user.tenant_id,{category:'studio narration',estimated_provider_origin_cost_usd:priced.provider_origin_cost_usd,required_plan:'business',entitlement:'metered_ai'});
 if(!gate.ok)return json({detail:gate.detail,code:gate.code,free_browser_voice:true,estimated_customer_charge_usd:gate.estimated_variable_customer_charge_usd},402);
 const modelId=quality==='fast'?'eleven_flash_v2_5':'eleven_v3';
 const voiceId=String(env.ELEVENLABS_VOICE_ID||'').trim();
 const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,{
  method:'POST',
  headers:{'xi-api-key':String(env.ELEVENLABS_API_KEY),'content-type':'application/json','accept':'audio/mpeg'},
  body:JSON.stringify({text,model_id:modelId})
 });
 if(!response.ok){
  const detail=await response.json().catch(()=>({}));throw new Error(detail?.detail?.message||detail?.detail||`Studio narration failed (${response.status}).`);
 }
 const bytes=new Uint8Array(await response.arrayBuffer()),requestId=String(response.headers.get('request-id')||crypto.randomUUID());
 await recordUsage(env,user.tenant_id,{category:'movie-maker-voice',provider:'managed-studio-voice',units:text.length,provider_origin_cost_usd:priced.provider_origin_cost_usd,reference_id:`movie-voice:${requestId}`,pricing_source:priced.pricing_source,pricing_verified_at:priced.pricing_verified_at});
 const variable=variableCustomerCharge(priced.provider_origin_cost_usd);
 const persisted=await persistAsset(env,request,user,{kind:'audio',title,bytes,content_type:'audio/mpeg',watermarked:false,origin:priced.provider_origin_cost_usd,customer:variable.customer_charge_usd});
 return json({ok:true,mode:'studio',identity:'Magnanimous AI',asset:{...persisted,content_type:'audio/mpeg'},billing:{provider_origin_cost_usd:priced.provider_origin_cost_usd,markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,customer_charge_usd:variable.customer_charge_usd},quality,provider_details_private:true});
}

async function freeVideo(request,env,user,body,plan){
 const prompt=cleanText(body.prompt||body.text,4000),title=cleanText(body.title||'Magnanimous Movie',180),style=cleanText(body.style||'cinematic',40);
 if(!prompt)return json({detail:'Describe the movie scene first.'},400);
 const duration=Math.max(3,Math.min(60,Number(body.seconds||body.duration||8))),aspect=String(body.aspect_ratio||'16:9');
 const vertical=aspect==='9:16',square=aspect==='1:1',width=vertical?1080:square?1080:1280,height=vertical?1920:square?1080:720;
 const scene=await renderVisualScene(env,{title,text:prompt,style,director:'built-in'});
 const r=await fetch(freeRendererBase(env)+'/api/video/render',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title,text:cleanText(body.caption||'',1200),width,height,duration,background_image_data_uri:scene.image_data_uri,watermark_text:watermarkRequired(plan)?WATERMARK:'',watermark_required:watermarkRequired(plan),publish_to_mux:false})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||'Free movie renderer failed.');
 const source=new URL(String(d.download_url||''),freeRendererBase(env)).toString();
 let persisted={asset_url:source,download_url:source,watch_url:null,social_publish_url:`/social-connect?video_url=${encodeURIComponent(source)}&title=${encodeURIComponent(title)}`,storage_persistent:false};
 if(env?.MAGNANIMOUS_OBJECT_STORE?.put){
  const vr=await fetch(source);if(vr.ok){const bytes=new Uint8Array(await vr.arrayBuffer());persisted=await persistAsset(env,request,user,{kind:'video',title,bytes,content_type:vr.headers.get('content-type')||'video/mp4',watermarked:watermarkRequired(plan),source_url:source})}
 }
 return json({ok:true,mode:'free-first',identity:'Magnanimous AI',plan,policy:mediaPolicy(plan),asset:{...persisted,content_type:'video/mp4'},provider_details_private:true});
}
async function startStudioVideo(request,env,user,body,plan){
 if(!mediaPolicy(plan).premium_studio_allowed)return json({detail:'Studio video starts with Business. Free and Plus Movie Maker remain available with a Magnanimous watermark.',code:'BUSINESS_REQUIRED'},402);
 if(!googleReady(env))return json({detail:'Studio video is not enabled. Free-first Movie Maker remains available.',code:'STUDIO_MEDIA_NOT_CONFIGURED'},503);
 const prompt=cleanText(body.prompt||body.text,4000),title=cleanText(body.title||'Magnanimous Studio Movie',180),seconds=Math.max(3,Math.min(10,Number(body.seconds||6))),resolution=VIDEO_RESOLUTIONS.has(String(body.resolution).toLowerCase())?String(body.resolution).toLowerCase():'720p',aspect=['16:9','9:16'].includes(body.aspect_ratio)?body.aspect_ratio:'16:9';
 if(!prompt)return json({detail:'Describe the movie scene first.'},400);
 const reserve=googleOmniVideoReserveUsd({seconds,resolution}),gate=await canUsePremium(env,user.tenant_id,{category:'studio video',estimated_provider_origin_cost_usd:reserve,required_plan:'business',entitlement:'metered_ai'});
 if(!gate.ok)return json({detail:gate.detail,code:gate.code,free_first_available:true,estimated_customer_charge_usd:gate.estimated_variable_customer_charge_usd},402);
 let input=prompt;const ref=parseDataUri(body.reference_image||'');if(ref)input=[{type:'image',mime_type:ref.content_type,data:ref.base64},{type:'text',text:prompt}];
 const d=await googleInteraction(env,{model:'gemini-omni-1.1-flash',input,background:true,store:true,response_format:{type:'video',delivery:'uri',aspect_ratio:aspect,resolution}});
 const job=crypto.randomUUID(),ts=now();await ensureSchema(env);
 await env.DB.prepare('INSERT INTO movie_maker_jobs(id,tenant_id,user_id,kind,status,interaction_id,prompt,title,resolution,aspect_ratio,seconds,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
  .bind(job,String(user.tenant_id),String(user.id),'video',String(d.status||'in_progress'),String(d.id||''),prompt,title,resolution,aspect,seconds,ts,ts).run();
 return json({ok:true,job_id:job,status:String(d.status||'in_progress'),poll_url:`/api/movie-maker/jobs/${job}`,mode:'studio',identity:'Magnanimous AI',plan,policy:mediaPolicy(plan),estimated_reserve:{provider_origin_usd:reserve,customer_variable_usd:variableCustomerCharge(reserve).customer_charge_usd},provider_details_private:true},202);
}
async function pollStudioVideo(request,env,user,jobId){
 await ensureSchema(env);const job=await env.DB.prepare('SELECT * FROM movie_maker_jobs WHERE id=? AND tenant_id=? AND user_id=?').bind(jobId,String(user.tenant_id),String(user.id)).first();
 if(!job)return json({detail:'Movie job not found.'},404);
 if(job.asset_id){const asset=await env.DB.prepare('SELECT * FROM movie_maker_assets WHERE id=?').bind(job.asset_id).first();return json({job_id:job.id,status:'completed',asset:{asset_url:asset?.source_url||null,download_url:asset?.source_url||null,watch_url:asset?.share_token?`${new URL(request.url).origin}/movie?asset=${asset.share_token}`:null,watermarked:Boolean(asset?.watermarked)},provider_details_private:true})}
 if(job.status==='billing_reconciliation_failed'||job.status==='failed')return json({job_id:job.id,status:job.status,detail:job.error_text||'Movie generation failed.'},job.status==='failed'?502:409);
 const d=await googleInteractionGet(env,job.interaction_id),status=String(d.status||'in_progress');
 if(!['completed','failed','cancelled','incomplete'].includes(status)){await env.DB.prepare('UPDATE movie_maker_jobs SET status=?,updated_at=? WHERE id=?').bind(status,now(),job.id).run();return json({job_id:job.id,status,provider_details_private:true},202)}
 if(status!=='completed'){const detail=cleanText(d?.error?.message||`Studio video ended with status ${status}.`,600);await env.DB.prepare('UPDATE movie_maker_jobs SET status=?,error_text=?,updated_at=? WHERE id=?').bind('failed',detail,now(),job.id).run();return json({job_id:job.id,status:'failed',detail},502)}
 const out=extractOutput(d,'video');if(!out?.uri&&!out?.data)throw new Error('Studio video completed without downloadable video.');
 let bytes,contentType='video/mp4';
 if(out.data)bytes=bytesFromB64(out.data);
 else{
  const fileId=String(out.uri).split('/').pop(),metaUrl=`https://generativelanguage.googleapis.com/v1beta/files/${encodeURIComponent(fileId)}`;
  const metaRes=await fetch(metaUrl,{headers:{'x-goog-api-key':String(env.GOOGLE_API_KEY)}}),meta=await metaRes.json().catch(()=>({}));
  if(!metaRes.ok)throw new Error(meta?.error?.message||'Generated movie file metadata was unavailable.');
  const state=String(meta.state||'');if(state==='FAILED')throw new Error('Generated movie file processing failed.');if(state!=='ACTIVE')return json({job_id:job.id,status:'processing-file',provider_details_private:true},202);
  const download=String(meta.downloadUri||meta.download_uri||out.uri);const vr=await fetch(download,{headers:{'x-goog-api-key':String(env.GOOGLE_API_KEY)}});
  if(!vr.ok)throw new Error('Generated movie download failed.');bytes=new Uint8Array(await vr.arrayBuffer());contentType=vr.headers.get('content-type')||'video/mp4';
 }
 const priced=googleOmniVideoOriginCost({seconds:Number(job.seconds||0),resolution:job.resolution,usage:d.usage||{}});
 if(!priced.ok){await env.DB.prepare('UPDATE movie_maker_jobs SET status=?,error_text=?,updated_at=? WHERE id=?').bind('billing_reconciliation_failed',priced.detail||priced.code,now(),job.id).run();return json({job_id:job.id,status:'billing_reconciliation_failed',detail:'Movie was generated but exact provider usage could not be verified, so the asset was withheld.',free_first_available:true},409)}
 const variable=variableCustomerCharge(priced.provider_origin_cost_usd);
 try{await recordUsage(env,user.tenant_id,{category:'movie-maker-video',provider:'managed-studio-video',units:Number(job.seconds||0),provider_origin_cost_usd:priced.provider_origin_cost_usd,reference_id:`movie-video:${job.interaction_id}`,pricing_source:priced.pricing_source,pricing_verified_at:priced.pricing_verified_at})}
 catch(error){await env.DB.prepare('UPDATE movie_maker_jobs SET status=?,error_text=?,updated_at=? WHERE id=?').bind('billing_reconciliation_failed',String(error?.message||error),now(),job.id).run();return json({job_id:job.id,status:'billing_reconciliation_failed',detail:'Movie was generated but funded billing reconciliation failed, so the asset was withheld.',free_first_available:true},409)}
 const persisted=await persistAsset(env,request,user,{kind:'video',title:job.title,bytes,content_type:contentType,watermarked:false,origin:priced.provider_origin_cost_usd,customer:variable.customer_charge_usd});
 await env.DB.prepare('UPDATE movie_maker_jobs SET status=?,asset_id=?,updated_at=? WHERE id=?').bind('completed',persisted.id,now(),job.id).run();
 return json({job_id:job.id,status:'completed',asset:{...persisted,content_type:contentType,watermarked:false},billing:{provider_origin_cost_usd:priced.provider_origin_cost_usd,markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,customer_charge_usd:variable.customer_charge_usd},provider_details_private:true});
}
function splitScenes(text,maxScenes=12){
 const parts=String(text||'').split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean);const chosen=(parts.length?parts:[String(text||'')]).slice(0,Math.max(1,Math.min(maxScenes,20)));
 return chosen.map((line,index)=>({scene:index+1,narration:line,prompt:`Cinematic scene ${index+1}: ${line}`,seconds:Math.max(3,Math.min(8,Math.ceil(line.split(/\s+/).length/2.3)))}));
}

export async function handleMovieMaker(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/movie-maker'))return null;
 if(path.startsWith('/api/movie-maker/share/')){
  const parts=path.split('/').filter(Boolean),token=parts[3]||'',metaOnly=parts[4]==='meta';return shareAsset(request,env,token,metaOnly);
 }
 if(!env?.DB)return json({detail:'Movie Maker storage is unavailable.'},503);
 await ensureSchema(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Magnanimous Movie Maker.'},401);
 const plan=await planFor(env,user),policy=mediaPolicy(plan);
 if(request.method==='GET'&&path==='/api/movie-maker/config')return json({identity:'Magnanimous AI',product:'Magnanimous Movie Maker',plan,policy,pricing:priceCard(),free_first:{image:true,video:true,browser_voice:true},studio:{enabled:googleReady(env)||studioVoiceReady(env),visual_video_enabled:googleReady(env),voice_enabled:studioVoiceReady(env),image_sizes:[...IMAGE_SIZES],video_resolutions:[...VIDEO_RESOLUTIONS],video_clip_seconds:{min:3,max:10},realistic_people:true,animation:true,reference_images:true},monetization:{free_watch_pages:plan==='free',sponsored_or_approved_ads_only:true,incentivized_clicks:false,artificial_views:false,placement:'movie-watch'},provider_details_private:true});
 if(request.method==='POST'&&path==='/api/movie-maker/plan'){const b=await request.json().catch(()=>({})),script=cleanText(b.script||b.prompt,12000);if(!script)return json({detail:'Add a story, script, or movie idea first.'},400);return json({title:cleanText(b.title||'Magnanimous Movie',180),scenes:splitScenes(script,Number(b.max_scenes||12)),policy,share_export:['download','copy link','Web Share','YouTube','TikTok','LinkedIn'],provider_details_private:true})}
 if(request.method==='POST'&&path==='/api/movie-maker/image'){const b=await request.json().catch(()=>({}));return String(b.mode||'free').toLowerCase()==='studio'?generateStudioImage(request,env,user,b,plan):generateFreeImage(request,env,user,b,plan)}
 if(request.method==='POST'&&path==='/api/movie-maker/video'){const b=await request.json().catch(()=>({}));return String(b.mode||'free').toLowerCase()==='studio'?startStudioVideo(request,env,user,b,plan):freeVideo(request,env,user,b,plan)}
 if(request.method==='POST'&&path==='/api/movie-maker/voice'){const b=await request.json().catch(()=>({}));return createStudioVoice(request,env,user,b,plan)}
 const m=path.match(/^\/api\/movie-maker\/jobs\/([^/]+)$/);if(m&&request.method==='GET')return pollStudioVideo(request,env,user,m[1]);
 return json({detail:'Unsupported Movie Maker operation.'},405);
}

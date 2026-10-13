import { currentUser } from './integrations.js';
import { getPublicApiAbsorptionSummary } from './magnanimous-public-api-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(value,max=1000)=>String(value??'').trim().slice(0,max);
const integer=(value,fallback=0)=>{if(value===null||value===undefined||String(value).trim()==='')return fallback;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):fallback};
const MAX_PROVIDER_BYTES=1_500_000;
const PROVIDER_TIMEOUT_MS=9_000;

async function providerJson(url,{headers={}}={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort('provider-timeout'),PROVIDER_TIMEOUT_MS);
  try{
    const response=await fetch(url,{method:'GET',headers:{accept:'application/json','user-agent':'I-AM-MAGNANIMOUS-WAY/1.0 (+https://iammagnanimousway.com)',...headers},signal:controller.signal,redirect:'follow'});
    if(!response.ok)throw new Error(`provider returned HTTP ${response.status}`);
    const length=Number(response.headers.get('content-length')||0);
    if(Number.isFinite(length)&&length>MAX_PROVIDER_BYTES)throw new Error('provider response exceeded size limit');
    const reader=response.body?.getReader();
    if(!reader)throw new Error('provider response body unavailable');
    const chunks=[];let total=0;
    try{
      while(true){
        const {done,value}=await reader.read();
        if(done)break;
        total+=value.byteLength;
        if(total>MAX_PROVIDER_BYTES)throw new Error('provider response exceeded size limit');
        chunks.push(value);
      }
    }catch(error){await reader.cancel().catch(()=>{});throw error}
    const bytes=new Uint8Array(total);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
    return JSON.parse(new TextDecoder().decode(bytes));
  }finally{
    clearTimeout(timeout);
  }
}

function sourceError(name,error){
  console.error(`public data adapter ${name} failed`,error);
  return json({detail:'That reference source is temporarily unavailable. Please try again later.',source:name},502);
}

function validCurrency(value){
  const code=clip(value,3).toUpperCase();
  return /^[A-Z]{3}$/.test(code)?code:'';
}

function crossrefYear(item={}){
  const parts=item?.published?.['date-parts']||item?.issued?.['date-parts']||item?.created?.['date-parts'];
  const year=Array.isArray(parts)&&Array.isArray(parts[0])?Number(parts[0][0]):null;
  return Number.isFinite(year)?year:null;
}

function crossrefAuthors(item={}){
  return (Array.isArray(item.author)?item.author:[]).slice(0,30).map(a=>[clip(a?.given,180),clip(a?.family,180)].filter(Boolean).join(' ')).filter(Boolean);
}

function normalizedCrossref(item={}){
  const title=Array.isArray(item.title)?clip(item.title[0],1200):clip(item.title,1200);
  const licenses=(Array.isArray(item.license)?item.license:[]).slice(0,10).map(row=>({url:clip(row?.URL,2000),start:row?.start?.['date-time']||null,delay_in_days:Number.isFinite(Number(row?.['delay-in-days']))?Number(row['delay-in-days']):null}));
  return {
    doi:clip(item.DOI,500),
    title,
    authors:crossrefAuthors(item),
    year:crossrefYear(item),
    publisher:clip(item.publisher,1000),
    type:clip(item.type,240),
    url:clip(item.URL,2000),
    citation_count:Number.isFinite(Number(item['is-referenced-by-count']))?Number(item['is-referenced-by-count']):null,
    issn:(Array.isArray(item.ISSN)?item.ISSN:[]).map(x=>clip(x,40)).filter(Boolean).slice(0,10),
    licenses
  };
}

function normalizeWorldBank(row={}){
  return {
    country:{id:clip(row?.country?.id,12),name:clip(row?.country?.value,300)},
    country_iso3:clip(row?.countryiso3code,8),
    indicator:{id:clip(row?.indicator?.id,100),name:clip(row?.indicator?.value,800)},
    date:clip(row?.date,20),
    value:row?.value??null,
    unit:clip(row?.unit,100),
    observation_status:clip(row?.obs_status,100),
    decimal:Number.isFinite(Number(row?.decimal))?Number(row.decimal):null
  };
}

function finite(value,min,max,fallback=null){
  if(value===null||value===undefined||String(value).trim()==='')return fallback;
  const n=Number(value);
  if(!Number.isFinite(n))return fallback;
  return Math.max(min,Math.min(max,n));
}

const SCRIPTURE_TRANSLATIONS=new Set(['kjv','web','asv']);

export async function handleMagnanimousPublicData(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/public-data'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,OPTIONS'}});
  if(request.method!=='GET')return json({detail:'Public data adapters are read-only.'},405);

  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to Magnanimous AI to use public data tools.'},401);

  if(path==='/api/public-data/capabilities'){
    return json({...getPublicApiAbsorptionSummary(),runtime:'read-only-fixed-provider-adapters',arbitrary_url_proxy:false});
  }

  if(path==='/api/public-data/fx'){
    const base=validCurrency(url.searchParams.get('base')||'USD'),quote=validCurrency(url.searchParams.get('quote')||'PHP');
    if(!base||!quote)return json({detail:'base and quote must be three-letter currency codes.'},400);
    if(base===quote)return json({identity:'Magnanimous AI',base,quote,rate:1,date:new Date().toISOString().slice(0,10),use:'reference-rate-not-payment-settlement',source:{name:'Frankfurter',url:'https://frankfurter.dev/'} });
    try{
      const data=await providerJson(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`);
      const rate=Number(data?.rate);
      if(!Number.isFinite(rate))throw new Error('reference rate missing');
      return json({identity:'Magnanimous AI',base:clip(data?.base||base,3),quote:clip(data?.quote||quote,3),rate,date:clip(data?.date,20),use:'reference-rate-not-payment-settlement',source:{name:'Frankfurter',url:'https://frankfurter.dev/'}});
    }catch(error){return sourceError('Frankfurter',error)}
  }

  if(path==='/api/public-data/crossref'){
    const q=clip(url.searchParams.get('q'),500),rows=Math.max(1,Math.min(10,integer(url.searchParams.get('rows'),5)||5));
    if(!q)return json({detail:'q is required.'},400);
    const query=new URLSearchParams({query:q,rows:String(rows)});
    try{
      const data=await providerJson(`https://api.crossref.org/works?${query.toString()}`);
      const items=(Array.isArray(data?.message?.items)?data.message.items:[]).slice(0,rows).map(normalizedCrossref);
      return json({identity:'Magnanimous AI Research',query:q,count:items.length,items,metadata_only:true,abstracts_included:false,source:{name:'Crossref REST API',url:'https://www.crossref.org/documentation/retrieve-metadata/rest-api/'}});
    }catch(error){return sourceError('Crossref',error)}
  }

  if(path==='/api/public-data/world-bank'){
    const country=clip(url.searchParams.get('country')||'PHL',8).toUpperCase(),indicator=clip(url.searchParams.get('indicator')||'SP.POP.TOTL',80).toUpperCase(),date=clip(url.searchParams.get('date')||'',20);
    if(!/^(?:ALL|[A-Z0-9]{2,3})$/.test(country))return json({detail:'country must be ALL or a 2–3 character country/region code.'},400);
    if(!/^[A-Z0-9._-]{1,80}$/.test(indicator))return json({detail:'indicator contains unsupported characters.'},400);
    if(date&&!/^\d{4}(?::\d{4})?$/.test(date))return json({detail:'date must be YYYY or YYYY:YYYY.'},400);
    const query=new URLSearchParams({format:'json',per_page:'100'});if(date)query.set('date',date);
    try{
      const data=await providerJson(`https://api.worldbank.org/v2/country/${encodeURIComponent(country.toLowerCase())}/indicator/${encodeURIComponent(indicator)}?${query.toString()}`);
      const metadata=Array.isArray(data)?data[0]||{}:{},records=Array.isArray(data)&&Array.isArray(data[1])?data[1].slice(0,100).map(normalizeWorldBank):[];
      return json({identity:'Magnanimous AI Research',country,indicator,date:date||null,count:records.length,records,page:Number(metadata?.page||1),pages:Number(metadata?.pages||1),source:{name:'World Bank Open Data',url:'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information',attribution:'World Bank'}});
    }catch(error){return sourceError('World Bank',error)}
  }

  if(path==='/api/public-data/earthquakes'){
    const days=Math.trunc(finite(url.searchParams.get('days'),1,30,1)),minMagnitude=finite(url.searchParams.get('min_magnitude'),0,10,2.5),limit=Math.trunc(finite(url.searchParams.get('limit'),1,50,20));
    const start=new Date(Date.now()-days*86400000).toISOString();
    const query=new URLSearchParams({format:'geojson',starttime:start,minmagnitude:String(minMagnitude),limit:String(limit),orderby:'time'});
    const latitude=finite(url.searchParams.get('latitude'),-90,90,null),longitude=finite(url.searchParams.get('longitude'),-180,180,null),radius=finite(url.searchParams.get('radius_km'),1,20000,null);
    if(latitude!==null||longitude!==null||radius!==null){
      if(latitude===null||longitude===null||radius===null)return json({detail:'latitude, longitude and radius_km must be supplied together.'},400);
      query.set('latitude',String(latitude));query.set('longitude',String(longitude));query.set('maxradiuskm',String(radius));
    }
    try{
      const data=await providerJson(`https://earthquake.usgs.gov/fdsnws/event/1/query?${query.toString()}`);
      const events=(Array.isArray(data?.features)?data.features:[]).slice(0,limit).map(feature=>({
        id:clip(feature?.id,160),magnitude:Number.isFinite(Number(feature?.properties?.mag))?Number(feature.properties.mag):null,place:clip(feature?.properties?.place,800),time:Number.isFinite(Number(feature?.properties?.time))?new Date(Number(feature.properties.time)).toISOString():null,url:clip(feature?.properties?.url,2000),coordinates:Array.isArray(feature?.geometry?.coordinates)?feature.geometry.coordinates.slice(0,3):[]
      }));
      return json({identity:'Magnanimous AI Research',days,min_magnitude:minMagnitude,count:events.length,events,safety_note:'Informational earthquake data only. This is not an emergency-warning service; follow local emergency authorities for safety decisions.',source:{name:'USGS Earthquake Hazards Program',url:'https://earthquake.usgs.gov/fdsnws/event/1/'}});
    }catch(error){return sourceError('USGS',error)}
  }

  if(path==='/api/public-data/scripture'){
    const passage=clip(url.searchParams.get('passage'),120),translation=clip(url.searchParams.get('translation')||'kjv',12).toLowerCase();
    if(!passage)return json({detail:'passage is required.'},400);
    if(!SCRIPTURE_TRANSLATIONS.has(translation))return json({detail:'This adapter currently supports KJV, WEB, and ASV only.'},400);
    try{
      const data=await providerJson(`https://bible-api.com/${encodeURIComponent(passage)}?translation=${encodeURIComponent(translation)}`);
      const verses=(Array.isArray(data?.verses)?data.verses:[]).slice(0,100).map(v=>({book:clip(v?.book_name,200),chapter:integer(v?.chapter,null),verse:integer(v?.verse,null),text:clip(v?.text,5000)}));
      return json({identity:'Magnanimous AI Bible Study',reference:clip(data?.reference||passage,500),translation:{id:clip(data?.translation_id||translation,80),name:clip(data?.translation_name,300),note:clip(data?.translation_note,1000)},text:clip(data?.text,50000),verses,bulk_mirroring:false,source:{name:'Bible API',url:'https://bible-api.com/'}});
    }catch(error){return sourceError('Bible API',error)}
  }

  return json({detail:'Public data route not found.'},404);
}

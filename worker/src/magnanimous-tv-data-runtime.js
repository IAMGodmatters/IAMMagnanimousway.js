const API='https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/2E/CS/0012E4EVCP0.px';
const CACHE_KEY=new Request('https://tv-cache.magnanimous.invalid/psa-palay-v1');
const J=(body,status=200,cache='public, s-maxage=21600, stale-while-revalidate=86400')=>Response.json(body,{status,headers:{'cache-control':cache}});
const pick=(variable,label)=>{const i=(variable?.valueTexts||[]).findIndex(x=>String(x).trim().toLowerCase()===label.toLowerCase());return i<0?null:String(variable.values[i]);};

export async function handleMagnanimousTvData(request){
 const url=new URL(request.url);
 if(url.pathname!=='/api/tv/data/psa/palay')return null;
 if(request.method!=='GET')return J({detail:'Method not allowed.'},405,'no-store');
 try{
  const cache=globalThis.caches?.default;
  if(cache){const hit=await cache.match(CACHE_KEY);if(hit)return hit;}
  const metaResponse=await fetch(API,{headers:{accept:'application/json'}});
  if(!metaResponse.ok)throw new Error('PSA OpenSTAT metadata request failed ('+metaResponse.status+').');
  const metadata=await metaResponse.json();
  const vars=Array.isArray(metadata.variables)?metadata.variables:[];
  const crop=vars.find(v=>v.code==='Ecosystem/Croptype');
  const geo=vars.find(v=>v.code==='Geolocation');
  const year=vars.find(v=>v.code==='Year');
  const period=vars.find(v=>v.code==='Period');
  const cropCode=pick(crop,'Palay'),geoCode=pick(geo,'PHILIPPINES'),periodCode=pick(period,'Annual');
  const latestCompletedYear=String(new Date().getUTCFullYear()-1);
  const yearIndex=(year?.valueTexts||[]).findIndex(x=>String(x).trim()===latestCompletedYear);
  const yearCode=yearIndex>=0?String(year.values[yearIndex]):null;
  if(!cropCode||!geoCode||!periodCode||!yearCode)throw new Error('The expected PSA OpenSTAT table dimensions changed; no data was published.');
  const query={
   query:[
    {code:'Ecosystem/Croptype',selection:{filter:'item',values:[cropCode]}},
    {code:'Geolocation',selection:{filter:'item',values:[geoCode]}},
    {code:'Year',selection:{filter:'item',values:[yearCode]}},
    {code:'Period',selection:{filter:'item',values:[periodCode]}}
   ],
   response:{format:'csv'}
  };
  const dataResponse=await fetch(API,{method:'POST',headers:{'content-type':'application/json',accept:'text/csv'},body:JSON.stringify(query)});
  const csv=await dataResponse.text();
  if(!dataResponse.ok)throw new Error('PSA OpenSTAT data request failed ('+dataResponse.status+').');
  if(!csv.trim())throw new Error('PSA OpenSTAT returned an empty data table.');
  const response=J({
   status:'source-data-ready',
   programme_type:'original_magnanimous_data_bulletin',
   title:'Philippine Palay Production — Annual National Statistics',
   source_name:'Philippine Statistics Authority — OpenSTAT',
   source_url:'https://openstat.psa.gov.ph/About',
   dataset_title:metadata.title||'Palay and Corn: Volume of Production',
   dataset_url:API,
   licence:'PSA OpenSTAT open-data licence; attribution required',
   attribution:'Source: Philippine Statistics Authority (PSA), OpenSTAT. Data retrieved from the official OpenSTAT API.',
   crop:'Palay',geography:'PHILIPPINES',period:'Annual',year:latestCompletedYear,
   format:'csv',data:csv,retrieved_at:new Date().toISOString(),
   refresh_window_hours:6,
   editorial_note:'This is a data bulletin source, not an official PSA broadcast or PSA endorsement. Check units, revisions and definitions before narration.'
  },200,'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400');
  if(cache)await cache.put(CACHE_KEY,response.clone());
  return response;
 }catch(error){
  return J({status:'source-unavailable',source_name:'Philippine Statistics Authority — OpenSTAT',source_url:'https://openstat.psa.gov.ph/',detail:String(error?.message||'The source is temporarily unavailable.'),retry_after_seconds:900},503,'no-store');
 }
}

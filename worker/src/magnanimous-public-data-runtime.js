import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { getPublicApiAbsorptionSummary } from './magnanimous-public-api-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(value,max=1000)=>String(value??'').trim().slice(0,max);
const integer=(value,fallback=0)=>{if(value===null||value===undefined||String(value).trim()==='')return fallback;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):fallback};
const MAX_PROVIDER_BYTES=1_500_000;
const PROVIDER_TIMEOUT_MS=9_000;

async function providerJson(url,{headers={},method='GET',body}={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort('provider-timeout'),PROVIDER_TIMEOUT_MS);
  try{
    const response=await fetch(url,{method,headers:{accept:'application/json','user-agent':'I-AM-MAGNANIMOUS-WAY/1.0 (+https://iammagnanimousway.com)',...headers},body,signal:controller.signal,redirect:'error'});
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

const OWNED_SECURITY_HOST_SUFFIX='iammagnanimousway.com';
const OPENVERSE_COMMERCIAL_LICENSES='cc0,pdm,by,by-sa';
const USAJOBS_CODELISTS=new Set(['countries','countrysubdivisions','jobcategories','payplans','cyberworkroles','cyberworkgroupings']);

function ownedSecurityHost(value){
  const host=clip(value,253).toLowerCase().replace(/\.$/,'');
  if(!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host))return '';
  return host===OWNED_SECURITY_HOST_SUFFIX||host.endsWith(`.${OWNED_SECURITY_HOST_SUFFIX}`)?host:'';
}

function nvdScore(cve={}){
  const groups=['cvssMetricV40','cvssMetricV31','cvssMetricV30','cvssMetricV2'];
  for(const key of groups){
    const rows=Array.isArray(cve?.metrics?.[key])?cve.metrics[key]:[];
    const row=rows[0];
    const score=Number(row?.cvssData?.baseScore),severity=clip(row?.cvssData?.baseSeverity||row?.baseSeverity,40);
    if(Number.isFinite(score))return {score,severity:severity||null,version:clip(row?.cvssData?.version,20)||null};
  }
  return {score:null,severity:null,version:null};
}

function normalizeNvd(item={}){
  const cve=item?.cve||{};
  const english=(Array.isArray(cve.descriptions)?cve.descriptions:[]).find(x=>String(x?.lang||'').toLowerCase()==='en');
  const weaknesses=(Array.isArray(cve.weaknesses)?cve.weaknesses:[]).flatMap(x=>Array.isArray(x?.description)?x.description:[]).filter(x=>String(x?.lang||'').toLowerCase()==='en').map(x=>clip(x?.value,120)).filter(Boolean).slice(0,12);
  const references=(Array.isArray(cve.references)?cve.references:[]).map(x=>({url:clip(x?.url,2000),source:clip(x?.source,120),tags:(Array.isArray(x?.tags)?x.tags:[]).map(t=>clip(t,80)).filter(Boolean).slice(0,8)})).filter(x=>x.url).slice(0,12);
  return {id:clip(cve.id,40),published:clip(cve.published,80),last_modified:clip(cve.lastModified,80),status:clip(cve.vulnStatus,80),description:clip(english?.value,5000),cvss:nvdScore(cve),weaknesses,references};
}

function normalizeOpenverse(row={}){
  return {
    id:clip(row?.id,100),title:clip(row?.title,500),creator:clip(row?.creator,300),creator_url:clip(row?.creator_url,2000),
    image_url:clip(row?.url,2000),thumbnail:clip(row?.thumbnail,2000),landing_url:clip(row?.foreign_landing_url,2000),
    license:clip(row?.license,40),license_version:clip(row?.license_version,40),license_url:clip(row?.license_url,2000),
    attribution:clip(row?.attribution,3000),source:clip(row?.source,120),provider:clip(row?.provider,120),
    width:Number.isFinite(Number(row?.width))?Number(row.width):null,height:Number.isFinite(Number(row?.height))?Number(row.height):null
  };
}

function normalizeDictionaryEntry(entry={}){
  return {
    word:clip(entry?.word,120),phonetic:clip(entry?.phonetic,300),
    phonetics:(Array.isArray(entry?.phonetics)?entry.phonetics:[]).slice(0,8).map(p=>({text:clip(p?.text,300),audio:clip(p?.audio,2000),source_url:clip(p?.sourceUrl,2000)})),
    meanings:(Array.isArray(entry?.meanings)?entry.meanings:[]).slice(0,8).map(m=>({
      part_of_speech:clip(m?.partOfSpeech,80),
      synonyms:(Array.isArray(m?.synonyms)?m.synonyms:[]).map(x=>clip(x,100)).filter(Boolean).slice(0,20),
      antonyms:(Array.isArray(m?.antonyms)?m.antonyms:[]).map(x=>clip(x,100)).filter(Boolean).slice(0,20),
      definitions:(Array.isArray(m?.definitions)?m.definitions:[]).slice(0,8).map(d=>({definition:clip(d?.definition,2000),example:clip(d?.example,1200),synonyms:(Array.isArray(d?.synonyms)?d.synonyms:[]).map(x=>clip(x,100)).filter(Boolean).slice(0,12),antonyms:(Array.isArray(d?.antonyms)?d.antonyms:[]).map(x=>clip(x,100)).filter(Boolean).slice(0,12)}))
    })),
    source_urls:(Array.isArray(entry?.sourceUrls)?entry.sourceUrls:[]).map(x=>clip(x,2000)).filter(Boolean).slice(0,8)
  };
}

function normalizeUsaJob(item={}){
  const d=item?.MatchedObjectDescriptor||item||{},details=d?.UserArea?.Details||{};
  const remuneration=(Array.isArray(d?.PositionRemuneration)?d.PositionRemuneration:[]).slice(0,4).map(r=>({minimum:clip(r?.MinimumRange,80),maximum:clip(r?.MaximumRange,80),rate_interval:clip(r?.RateIntervalCode,40),currency:clip(r?.Description,80)}));
  return {
    position_id:clip(d?.PositionID,120),title:clip(d?.PositionTitle,500),organization:clip(d?.OrganizationName,500),department:clip(d?.DepartmentName,500),
    location:clip(d?.PositionLocationDisplay,500),uri:clip(d?.PositionURI,2000),apply_uris:(Array.isArray(d?.ApplyURI)?d.ApplyURI:[]).map(x=>clip(x,2000)).filter(Boolean).slice(0,8),
    publication_start:clip(d?.PublicationStartDate,80),application_close:clip(d?.ApplicationCloseDate,80),position_start:clip(d?.PositionStartDate,80),position_end:clip(d?.PositionEndDate,80),
    remuneration,job_summary:clip(details?.JobSummary,3000),requirements:clip(details?.Requirements,3000),major_duties:(Array.isArray(details?.MajorDuties)?details.MajorDuties:[]).map(x=>clip(x,1500)).filter(Boolean).slice(0,10)
  };
}

function normalizeVin(row={}){
  const keys=['VIN','ModelYear','Make','Model','Trim','BodyClass','VehicleType','Manufacturer','PlantCountry','PlantState','PlantCity','Series','DriveType','FuelTypePrimary','EngineCylinders','DisplacementL','TransmissionStyle','Doors','ErrorCode','ErrorText'];
  const result={};
  for(const key of keys){const value=row?.[key];if(value!==undefined&&value!==null&&String(value).trim()!=='')result[key]=clip(value,1000)}
  return result;
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

  if(path==='/api/public-data/security-observatory'){
    const host=ownedSecurityHost(url.searchParams.get('host')||OWNED_SECURITY_HOST_SUFFIX);
    if(!host)return json({detail:'Security Observatory scans are limited to I AM MAGNANIMOUS WAY owned domains.'},400);
    try{
      const data=await providerJson(`https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(host)}`,{method:'POST'});
      return json({identity:'Magnanimous Security Auditor',host,grade:clip(data?.grade,20),score:Number.isFinite(Number(data?.score))?Number(data.score):null,tests_passed:integer(data?.tests_passed,null),tests_failed:integer(data?.tests_failed,null),tests_quantity:integer(data?.tests_quantity,null),status_code:integer(data?.status_code,null),scanned_at:clip(data?.scanned_at,80),details_url:clip(data?.details_url,2000),scope_note:'HTTP security-header posture only; this is not a complete vulnerability assessment.',source:{name:'MDN HTTP Observatory',url:'https://developer.mozilla.org/en-US/observatory/'}});
    }catch(error){return sourceError('MDN HTTP Observatory',error)}
  }

  if(path==='/api/public-data/nvd'){
    const cve=clip(url.searchParams.get('cve'),40).toUpperCase(),q=clip(url.searchParams.get('q'),300),limit=Math.trunc(finite(url.searchParams.get('limit'),1,10,5));
    if(cve&&!/^CVE-\d{4}-\d{4,}$/.test(cve))return json({detail:'cve must use the CVE-YYYY-NNNN format.'},400);
    if(!cve&&!q)return json({detail:'Provide cve or q.'},400);
    const query=new URLSearchParams({resultsPerPage:String(limit)});
    if(cve)query.set('cveId',cve);else query.set('keywordSearch',q);
    const runtimeEnv=await getProviderRuntimeEnv(env),headers={};if(clip(runtimeEnv?.NVD_API_KEY,500))headers.apiKey=clip(runtimeEnv.NVD_API_KEY,500);
    try{
      const data=await providerJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?${query.toString()}`,{headers});
      const items=(Array.isArray(data?.vulnerabilities)?data.vulnerabilities:[]).slice(0,limit).map(normalizeNvd);
      return json({identity:'Magnanimous Security Auditor',query:cve||q,count:items.length,total_results:Number.isFinite(Number(data?.totalResults))?Number(data.totalResults):items.length,items,source:{name:'NIST National Vulnerability Database',url:'https://nvd.nist.gov/developers/vulnerabilities'},rate_note:headers.apiKey?'Using configured NVD API key for higher provider allowance.':'Using the public unauthenticated NVD allowance; requests are intentionally bounded.'});
    }catch(error){return sourceError('NVD',error)}
  }

  if(path==='/api/public-data/usajobs'){
    const codelist=clip(url.searchParams.get('codelist'),80).toLowerCase();
    if(codelist){
      if(!USAJOBS_CODELISTS.has(codelist))return json({detail:'Unsupported USAJOBS codelist.'},400);
      try{
        const data=await providerJson(`https://data.usajobs.gov/api/codelist/${encodeURIComponent(codelist)}`);
        return json({identity:'Magnanimous Opportunity Vault',codelist,data,source:{name:'USAJOBS',url:'https://developer.usajobs.gov/api-reference/code-lists'}});
      }catch(error){return sourceError('USAJOBS',error)}
    }
    const runtimeEnv=await getProviderRuntimeEnv(env),apiKey=clip(runtimeEnv?.USAJOBS_API_KEY,1000),apiEmail=clip(runtimeEnv?.USAJOBS_API_EMAIL,500);
    if(!apiKey||!apiEmail)return json({detail:'USAJOBS search is ready but requires an owner-configured USAJOBS API key and matching email.',setup_required:true,required_credentials:['USAJOBS_API_KEY','USAJOBS_API_EMAIL'],source:{name:'USAJOBS',url:'https://developer.usajobs.gov/guides/authentication'}},503);
    const keyword=clip(url.searchParams.get('keyword'),300),location=clip(url.searchParams.get('location'),300),datePosted=Math.trunc(finite(url.searchParams.get('date_posted'),0,60,30)),limit=Math.trunc(finite(url.searchParams.get('limit'),1,25,10));
    const query=new URLSearchParams({ResultsPerPage:String(limit),DatePosted:String(datePosted)});
    if(keyword)query.set('Keyword',keyword);if(location)query.set('LocationName',location);
    try{
      const data=await providerJson(`https://data.usajobs.gov/api/Search?${query.toString()}`,{headers:{'Authorization-Key':apiKey,'User-Agent':apiEmail}});
      const items=(Array.isArray(data?.SearchResult?.SearchResultItems)?data.SearchResult.SearchResultItems:[]).slice(0,limit).map(normalizeUsaJob);
      return json({identity:'Magnanimous Opportunity Vault',keyword:keyword||null,location:location||null,date_posted_days:datePosted,count:items.length,total:Number.isFinite(Number(data?.SearchResult?.SearchResultCountAll))?Number(data.SearchResult.SearchResultCountAll):items.length,items,source:{name:'USAJOBS',url:'https://developer.usajobs.gov/api-reference/get-api-search'}});
    }catch(error){return sourceError('USAJOBS',error)}
  }

  if(path==='/api/public-data/openverse-images'){
    const q=clip(url.searchParams.get('q'),200),limit=Math.trunc(finite(url.searchParams.get('limit'),1,20,8));
    if(!q)return json({detail:'q is required.'},400);
    const query=new URLSearchParams({q,page_size:String(limit),license:OPENVERSE_COMMERCIAL_LICENSES,mature:'false'});
    try{
      const data=await providerJson(`https://api.openverse.org/v1/images/?${query.toString()}`);
      const items=(Array.isArray(data?.results)?data.results:[]).slice(0,limit).map(normalizeOpenverse);
      return json({identity:'Magnanimous Media Library',query:q,count:items.length,items,commercial_license_filter:['cc0','pdm','by','by-sa'],license_verification_required:true,usage_note:'Openverse indexes license claims but does not guarantee their accuracy. Verify each work and retain required attribution before publishing.',source:{name:'Openverse',url:'https://api.openverse.org/v1/'}});
    }catch(error){return sourceError('Openverse',error)}
  }

  if(path==='/api/public-data/dictionary'){
    const word=clip(url.searchParams.get('word'),80).toLowerCase();
    if(!/^[a-z][a-z'-]{0,79}$/.test(word))return json({detail:'word must contain English letters, apostrophes, or hyphens.'},400);
    try{
      const data=await providerJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const entries=(Array.isArray(data)?data:[]).slice(0,4).map(normalizeDictionaryEntry);
      return json({identity:'Magnanimous Learning',word,count:entries.length,entries,fallback:false,source:{name:'Free Dictionary API',url:'https://dictionaryapi.dev/'}});
    }catch(primaryError){
      console.warn('Free Dictionary API unavailable; using Datamuse definition fallback',primaryError);
      try{
        const data=await providerJson(`https://api.datamuse.com/words?${new URLSearchParams({sp:word,max:'8',md:'dps'}).toString()}`);
        const exact=(Array.isArray(data)?data:[]).find(row=>String(row?.word||'').toLowerCase()===word)||(Array.isArray(data)?data[0]:null);
        if(!exact)throw new Error('dictionary fallback returned no entry');
        return json({identity:'Magnanimous Learning',word,count:1,entries:[{word:clip(exact?.word,120),phonetic:'',phonetics:[],meanings:[{part_of_speech:'',synonyms:[],antonyms:[],definitions:(Array.isArray(exact?.defs)?exact.defs:[]).slice(0,12).map(d=>({definition:clip(d,2000),example:'',synonyms:[],antonyms:[]}))}],source_urls:[]}],fallback:true,fallback_reason:'Primary dictionary source temporarily unavailable.',source:{name:'Datamuse',url:'https://www.datamuse.com/api/'}});
      }catch(fallbackError){return sourceError('Dictionary sources',fallbackError)}
    }
  }

  if(path==='/api/public-data/words'){
    const q=clip(url.searchParams.get('q'),100),mode=clip(url.searchParams.get('mode')||'means-like',30).toLowerCase(),limit=Math.trunc(finite(url.searchParams.get('limit'),1,50,15));
    if(!q)return json({detail:'q is required.'},400);
    const modes={'means-like':'ml','sounds-like':'sl','spelled-like':'sp'};
    try{
      let endpoint;
      if(mode==='suggest')endpoint=`https://api.datamuse.com/sug?${new URLSearchParams({s:q,max:String(limit)}).toString()}`;
      else{
        const key=modes[mode];if(!key)return json({detail:'mode must be means-like, sounds-like, spelled-like, or suggest.'},400);
        endpoint=`https://api.datamuse.com/words?${new URLSearchParams({[key]:q,max:String(limit),md:'dps'}).toString()}`;
      }
      const data=await providerJson(endpoint);
      const items=(Array.isArray(data)?data:[]).slice(0,limit).map(row=>({word:clip(row?.word,120),score:Number.isFinite(Number(row?.score))?Number(row.score):null,tags:(Array.isArray(row?.tags)?row.tags:[]).map(x=>clip(x,120)).filter(Boolean).slice(0,20),definitions:(Array.isArray(row?.defs)?row.defs:[]).map(x=>clip(x,800)).filter(Boolean).slice(0,12)}));
      return json({identity:'Magnanimous Learning',query:q,mode,count:items.length,items,provider_transition_note:'Datamuse currently permits anonymous read-only use but has announced API-key requirements beginning February 1, 2027; this adapter is isolated for easy credential migration.',source:{name:'Datamuse',url:'https://www.datamuse.com/api/'}});
    }catch(error){return sourceError('Datamuse',error)}
  }

  if(path==='/api/public-data/vin'){
    const vin=clip(url.searchParams.get('vin'),17).toUpperCase(),modelYear=Math.trunc(finite(url.searchParams.get('model_year'),1900,2100,0));
    if(!/^[A-HJ-NPR-Z0-9*]{5,17}$/.test(vin))return json({detail:'vin must be a 5–17 character VIN/partial VIN using valid VIN characters; * may mark unknown positions.'},400);
    const query=new URLSearchParams({format:'json'});if(modelYear)query.set('modelyear',String(modelYear));
    try{
      const data=await providerJson(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?${query.toString()}`);
      const row=Array.isArray(data?.Results)?data.Results[0]||{}:{};
      return json({identity:'Magnanimous Vehicle Intelligence',vin,model_year:modelYear||null,vehicle:normalizeVin(row),informational_only:true,source:{name:'NHTSA vPIC',url:'https://vpic.nhtsa.dot.gov/api/'}});
    }catch(error){return sourceError('NHTSA vPIC',error)}
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

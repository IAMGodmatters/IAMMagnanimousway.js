// Vendor-neutral domain-registration standards intelligence.
// Sources: ICANN RDAP/EPP guidance, IANA RDAP bootstrap + registrar IDs.

const IANA_DNS_BOOTSTRAP='https://data.iana.org/rdap/dns.json';
const IANA_REGISTRAR_IDS='https://www.iana.org/assignments/registrar-ids/registrar-ids-1.csv';
const clip=(value,n=8000)=>String(value??'').trim().slice(0,n);

export const EPP_DOMAIN_STATUS={
 ok:{severity:'normal',meaning:'No pending operation or prohibition is active.'},
 inactive:{severity:'warning',meaning:'The domain has no delegated nameservers and is not active in DNS.'},
 clientTransferProhibited:{severity:'protective',meaning:'The registrar has asked the registry to reject transfer requests.'},
 clientDeleteProhibited:{severity:'protective',meaning:'The registrar has asked the registry to reject deletion requests.'},
 clientUpdateProhibited:{severity:'protective',meaning:'The registrar has asked the registry to reject update requests.'},
 clientRenewProhibited:{severity:'warning',meaning:'The registrar has asked the registry to reject renewal requests.'},
 serverTransferProhibited:{severity:'protective',meaning:'The registry is rejecting transfer requests.'},
 serverDeleteProhibited:{severity:'protective',meaning:'The registry is rejecting deletion requests.'},
 serverUpdateProhibited:{severity:'protective',meaning:'The registry is rejecting update requests.'},
 serverRenewProhibited:{severity:'warning',meaning:'The registry is rejecting renewal requests.'},
 addPeriod:{severity:'info',meaning:'The domain is in an initial registration grace period.'},
 autoRenewPeriod:{severity:'info',meaning:'The registry automatically renewed the domain and a grace period may apply.'},
 renewPeriod:{severity:'info',meaning:'The registrar explicitly renewed the domain and a grace period may apply.'},
 transferPeriod:{severity:'info',meaning:'The domain transfer completed recently and a transfer grace period may apply.'},
 pendingCreate:{severity:'pending',meaning:'A create request has been received and is being processed.'},
 pendingRenew:{severity:'pending',meaning:'A renewal request has been received and is being processed.'},
 pendingTransfer:{severity:'pending',meaning:'A transfer request has been received and is being processed.'},
 pendingUpdate:{severity:'pending',meaning:'An update request has been received and is being processed.'},
 pendingRestore:{severity:'urgent',meaning:'A restore request from redemption has been received and is being processed.'},
 redemptionPeriod:{severity:'urgent',meaning:'The domain is in redemption after a deletion request; restoration is time-sensitive and may require a fee.'},
 pendingDelete:{severity:'critical',meaning:'The domain is pending purge/deletion unless another restoration status applies.'}
};

function timeoutSignal(ms=12000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort('timeout'),ms);return{signal:controller.signal,done:()=>clearTimeout(timer)};}
async function fetchJson(url){const t=timeoutSignal();try{const r=await fetch(url,{headers:{accept:'application/json, application/rdap+json'},signal:t.signal,redirect:'follow'});if(!r.ok)throw Object.assign(new Error(`Registration-data source returned HTTP ${r.status}.`),{status:r.status});return await r.json();}finally{t.done();}}
async function fetchText(url){const t=timeoutSignal();try{const r=await fetch(url,{headers:{accept:'text/csv,text/plain'},signal:t.signal,redirect:'follow'});if(!r.ok)throw Object.assign(new Error(`IANA registrar registry returned HTTP ${r.status}.`),{status:r.status});return await r.text();}finally{t.done();}}
export function normalizeDomain(value){const name=clip(value,253).toLowerCase().replace(/\.$/,'');if(!name||name.includes('://')||name.includes('/')||name.includes('\\')||name.includes('@')||name.includes(' '))return'';const labels=name.split('.');if(labels.length<2||labels.some(label=>!label||label.length>63||!/^[a-z0-9-]+$/.test(label)||label.startsWith('-')||label.endsWith('-')))return'';return name;}
export function interpretEppStatuses(statuses=[]){return[...new Set((Array.isArray(statuses)?statuses:[]).map(x=>String(x||'').trim()).filter(Boolean))].map(status=>({status,...(EPP_DOMAIN_STATUS[status]||{severity:'unknown',meaning:'Unrecognized or provider-specific registration status.'})}));}

export async function getIanaDnsBootstrap(){return fetchJson(IANA_DNS_BOOTSTRAP);}
export function resolveRdapBase(domain,bootstrap){const normalized=normalizeDomain(domain);if(!normalized)return null;const tld=normalized.split('.').pop();for(const service of bootstrap?.services||[]){const zones=Array.isArray(service?.[0])?service[0]:[],bases=Array.isArray(service?.[1])?service[1]:[];if(zones.map(x=>String(x).toLowerCase()).includes(tld)&&bases.length){const base=String(bases[0]||'');if(/^https:\/\//i.test(base))return{tld,base:base.replace(/\/$/,'')};}}return{tld,base:''};}

function entitySummary(entity){const roles=Array.isArray(entity?.roles)?entity.roles:[];let name='';const cards=entity?.vcardArray?.[1];if(Array.isArray(cards)){const fn=cards.find(x=>Array.isArray(x)&&x[0]==='fn');if(fn)name=clip(fn[3],300);}return{handle:clip(entity?.handle,200),roles,name,public_ids:Array.isArray(entity?.publicIds)?entity.publicIds.map(x=>({type:clip(x?.type,100),identifier:clip(x?.identifier,200)})):[]};}
export function sanitizeRdapDomain(data,source={}){const statuses=Array.isArray(data?.status)?data.status:[];return{object_class:clip(data?.objectClassName,50),handle:clip(data?.handle,200),ldh_name:clip(data?.ldhName,253),unicode_name:clip(data?.unicodeName,253),status:statuses,status_interpretation:interpretEppStatuses(statuses),nameservers:Array.isArray(data?.nameservers)?data.nameservers.map(x=>clip(x?.ldhName||x?.unicodeName,253)).filter(Boolean):[],events:Array.isArray(data?.events)?data.events.map(x=>({action:clip(x?.eventAction,100),date:clip(x?.eventDate,100),actor:clip(x?.eventActor,200)})):[],secure_dns:data?.secureDNS?{delegation_signed:Boolean(data.secureDNS.delegationSigned),zone_signed:Boolean(data.secureDNS.zoneSigned),max_sig_life:data.secureDNS.maxSigLife??null,ds_data:Array.isArray(data.secureDNS.dsData)?data.secureDNS.dsData.map(x=>({key_tag:x?.keyTag??null,algorithm:x?.algorithm??null,digest_type:x?.digestType??null,digest:clip(x?.digest,512)})):[]}:null,entities:Array.isArray(data?.entities)?data.entities.map(entitySummary):[],links:Array.isArray(data?.links)?data.links.filter(x=>['self','related','alternate'].includes(String(x?.rel||''))).map(x=>({rel:clip(x?.rel,50),href:clip(x?.href,1000),type:clip(x?.type,100)})):[],port43:clip(data?.port43,255),notices:Array.isArray(data?.notices)?data.notices.slice(0,12).map(x=>({title:clip(x?.title,200),description:Array.isArray(x?.description)?x.description.map(v=>clip(v,1000)):[]})):[],source};}

export async function rdapDomainIntelligence(domain){const normalized=normalizeDomain(domain);if(!normalized)throw Object.assign(new Error('A valid domain is required.'),{httpStatus:400});const bootstrap=await getIanaDnsBootstrap();const resolved=resolveRdapBase(normalized,bootstrap);if(!resolved?.base)throw Object.assign(new Error(`No IANA RDAP bootstrap service is published for .${resolved?.tld||'unknown'}.`),{httpStatus:404});const data=await fetchJson(`${resolved.base}/domain/${encodeURIComponent(normalized)}`);return sanitizeRdapDomain(data,{standard:'RDAP',bootstrap:'IANA',tld:resolved.tld,rdap_base:resolved.base});}

function parseCsvLine(line){const out=[];let current='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(current);current='';}else current+=c;}out.push(current);return out;}
export async function lookupIanaRegistrar(id){const wanted=String(id??'').trim();if(!/^\d+$/.test(wanted))throw Object.assign(new Error('A numeric IANA registrar ID is required.'),{httpStatus:400});const text=await fetchText(IANA_REGISTRAR_IDS);const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);for(const line of lines.slice(1)){const cols=parseCsvLine(line);if(String(cols[0]||'').trim()===wanted)return{id:Number(wanted),name:clip(cols[1],500),status:clip(cols[2],100),rdap_base_url:clip(cols[3],1000),source:'IANA Registrar IDs'};}return null;}

export function registrarStandardsCapabilities(){return{identity:'Magnanimous AI',standards:['RDAP','EPP domain status','IANA RDAP bootstrap','IANA registrar IDs','DNSSEC delegation data'],sources:{rdap_bootstrap:IANA_DNS_BOOTSTRAP,registrar_ids:'IANA Registrar IDs'},epp_statuses:EPP_DOMAIN_STATUS,principles:['RDAP is primary structured registration-data intelligence; WHOIS is legacy/fallback only.','Registry and registrar are distinct roles; lifecycle state from RDAP/EPP must not be confused with DNS hosting state.','Registrar locks and EPP prohibitions are interpreted as protections or blockers, not automatically removed.','redemptionPeriod and pendingDelete are time-sensitive states; Magnanimous must surface urgency but cannot restore or spend funds without explicit authorization.','Registration-data responses may be redacted or access-controlled; absence of personal data does not mean no registrant exists.']};}

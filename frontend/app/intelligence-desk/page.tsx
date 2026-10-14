'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Any=Record<string,any>;
async function read(r:Response){const text=await r.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${r.status})`}}}

export default function IntelligenceDesk(){
  const[token,setToken]=useState('');
  const[caps,setCaps]=useState<Any>({providers:[],review_queue:[]});
  const[company,setCompany]=useState('');
  const[companyData,setCompanyData]=useState<Any>({gleif:[],wikidata:[]});
  const[cik,setCik]=useState('');
  const[sec,setSec]=useState<Any|null>(null);
  const[regQuery,setRegQuery]=useState('telecommunications artificial intelligence call center');
  const[rules,setRules]=useState<Any[]>([]);
  const[busy,setBusy]=useState('');
  const[error,setError]=useState('');

  useEffect(()=>{const t=getPlatformAuthToken();if(!t){location.replace('/login?returnTo=/intelligence-desk');return}setToken(t);get('/api/public-data/capabilities',t).then(setCaps).catch(e=>setError(e.message))},[]);
  async function get(path:string,active=token){const r=await fetch(`${api}${path}`,{headers:{Authorization:`Bearer ${active}`},cache:'no-store'}),d=await read(r);if(!r.ok)throw new Error(d.detail||`Request failed (${r.status})`);return d}
  async function companySearch(e:FormEvent){e.preventDefault();const q=company.trim();if(q.length<2)return;setBusy('company');setError('');try{const [g,w]=await Promise.allSettled([get(`/api/public-data/gleif?mode=search&q=${encodeURIComponent(q)}&limit=8`),get(`/api/public-data/wikidata?mode=search&q=${encodeURIComponent(q)}&limit=6`)]);setCompanyData({gleif:g.status==='fulfilled'?(g.value.records||[]):[],wikidata:w.status==='fulfilled'?(w.value.items||[]):[]});if(g.status==='rejected'&&w.status==='rejected')throw g.reason}catch(e:any){setError(e.message)}finally{setBusy('')}}
  async function secLookup(e:FormEvent){e.preventDefault();const value=cik.replace(/\D/g,'').slice(0,10);if(!value)return;setBusy('sec');setError('');try{setSec(await get(`/api/public-data/sec-edgar?cik=${encodeURIComponent(value)}&mode=submissions&limit=8`))}catch(e:any){setError(e.message)}finally{setBusy('')}}
  async function regulationSearch(e:FormEvent){e.preventDefault();const q=regQuery.trim();if(!q)return;setBusy('rules');setError('');try{const d=await get(`/api/public-data/federal-register?q=${encodeURIComponent(q)}&limit=10`);setRules(d.items||[])}catch(e:any){setError(e.message)}finally{setBusy('')}}
  const activeProviders=useMemo(()=>caps.providers||[],[caps]);
  const review=useMemo(()=>caps.review_queue||[],[caps]);

  return <main className="desk">
    <header><div><a href="/">← I AM Platform</a><small>MAGNANIMOUS AI • VERIFIED BUSINESS INTELLIGENCE</small><h1>Intelligence Desk</h1><p>One signed-in research surface for B2B, CRM, Contact Center and Telecom. Magnanimous owns the workflow; verified public sources remain replaceable evidence rails.</p></div><nav><a href="/b2b">B2B</a><a href="/crm">CRM</a><a href="/contact-center">Call Center</a><a href="/telecom">Telecom</a><a href="/contact-validation">Contact Validation</a></nav></header>
    {error&&<div className="alert">{error}<button onClick={()=>setError('')}>×</button></div>}

    <section className="stats"><Metric label="Active sources" value={caps.active_read_only_providers||0}/><Metric label="Capabilities" value={caps.capability_contracts||0}/><Metric label="Reviewed / deferred" value={review.length}/><Metric label="Runtime" value={caps.runtime?'READY':'LOADING'}/></section>

    <section className="grid">
      <Panel title="Global legal-entity research" eyebrow="B2B • GLEIF">
        <p>Search quality-assured Legal Entity Identifier reference data before supplier, partner, reseller, investor or enterprise outreach.</p>
        <form onSubmit={companySearch}><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company or legal entity name"/><button disabled={busy==='company'}>{busy==='company'?'SEARCHING…':'SEARCH GLEIF + WIKIDATA'}</button></form>
        <div className="results">{companyData.gleif.map((r:Any)=><article key={r.lei}><b>{r.legal_name||r.lei}</b><span>LEI {r.lei} • {r.entity_status||'status unknown'} • {r.jurisdiction||'jurisdiction unknown'}</span><p>{[...(r.legal_address?.lines||[]),r.legal_address?.city,r.legal_address?.country].filter(Boolean).join(', ')||'No address returned'}</p><small>LEI registration: {r.registration_status||'unknown'} • {r.corroboration_level||'corroboration not stated'}</small></article>)}{companyData.wikidata.map((r:Any)=><article className="secondary" key={r.id}><b>{r.label||r.id}</b><span>Wikidata {r.id}</span><p>{r.description||'No description returned.'}</p></article>)}</div>
        <p className="boundary">Identity evidence is not credit approval, sanctions clearance, beneficial-ownership completeness, consent, or authority to transact.</p>
      </Panel>

      <Panel title="U.S. public-company filings" eyebrow="B2B • SEC EDGAR">
        <p>Use a CIK to inspect recent official filing metadata before business research or account planning.</p>
        <form onSubmit={secLookup}><input value={cik} onChange={e=>setCik(e.target.value)} placeholder="CIK, e.g. 0000320193"/><button disabled={busy==='sec'}>{busy==='sec'?'LOOKING UP…':'LOOK UP SEC'}</button></form>
        {sec&&<><div className="company"><b>{sec.company?.name||sec.cik}</b><span>{(sec.company?.tickers||[]).join(', ')} {(sec.company?.exchanges||[]).join(', ')}</span></div><div className="results">{(sec.filings||[]).map((f:Any)=><article key={f.accession_number}><b>{f.form} • {f.filing_date}</b><span>{f.accession_number}</span><p>{f.primary_document_description||f.primary_document||'SEC filing'}</p>{f.filing_url&&<a href={f.filing_url} target="_blank" rel="noreferrer">Official filing →</a>}</article>)}</div></>}
        <p className="boundary">SEC evidence is informational research, not investment or legal advice.</p>
      </Panel>
    </section>

    <section className="grid">
      <Panel title="Regulatory watch" eyebrow="TELECOM • CALL CENTER • BUSINESS">
        <p>Search the Federal Register for current rules, proposed rules and notices that may affect communications, AI, business operations or compliance planning.</p>
        <form onSubmit={regulationSearch}><input value={regQuery} onChange={e=>setRegQuery(e.target.value)} placeholder="Search federal rules and notices"/><button disabled={busy==='rules'}>{busy==='rules'?'SEARCHING…':'SEARCH REGULATIONS'}</button></form>
        <div className="results">{rules.map((r:Any)=><article key={r.document_number||r.html_url}><b>{r.title}</b><span>{r.type||'DOCUMENT'} • {r.publication_date||''}</span><p>{r.abstract||r.agencies?.join(', ')||''}</p>{r.html_url&&<a href={r.html_url} target="_blank" rel="noreferrer">Federal Register →</a>}</article>)}</div>
        <p className="boundary">For legal reliance, verify the official Federal Register/GovInfo edition and applicable local law.</p>
      </Panel>

      <Panel title="Source control" eyebrow="MAGNANIMOUS CLEAN-ROOM FABRIC">
        <p>ApiVault is discovery-only. This list is Magnanimous' independently verified provider fabric, not a copied ApiVault catalog.</p>
        <div className="sources">{activeProviders.map((p:Any)=><article key={p.id}><b>{p.name}</b><span>{p.status}</span><p>{p.use_case}</p></article>)}</div>
        <details><summary>Deferred / gated candidates ({review.length})</summary><div className="review">{review.map((r:Any)=><p key={r.id}><b>{r.id}</b> — {r.reason}</p>)}</div></details>
      </Panel>
    </section>

    <section className="actions"><a href="/contact-validation"><b>Preflight contact data</b><span>Native phone checks + privacy-disclosed email hygiene</span></a><a href="/b2b"><b>Move into B2B</b><span>Use evidence for partner, supplier and account planning</span></a><a href="/contact-center"><b>Move into Call Center</b><span>Keep consent, DNC and recording gates intact</span></a><a href="/telecom"><b>Move into Telecom</b><span>Use evidence without claiming carrier authority</span></a></section>

    <style jsx>{`.desk{min-height:100vh;background:#060b10;color:#eef8fb;padding:28px;font-family:Inter,system-ui,sans-serif}header{max-width:1450px;margin:auto;display:flex;justify-content:space-between;gap:24px;align-items:end;padding:24px 0}header>a,header a,nav a,.results a{color:#79e6be;text-decoration:none}header small,.panel small{display:block;color:#66d9ae;letter-spacing:.14em;font-size:9px;font-weight:900;margin-top:14px}h1{font-size:clamp(42px,6vw,76px);margin:7px 0 12px;line-height:.95}header p,.panel>p{color:#8fa5ae;line-height:1.55;max-width:820px}nav{display:flex;gap:8px;flex-wrap:wrap}nav a{border:1px solid #29414b;border-radius:9px;padding:9px 11px}.alert{max-width:1450px;margin:10px auto;background:#32161d;border:1px solid #743a48;padding:12px;border-radius:10px;display:flex;justify-content:space-between}.alert button{background:none;border:0;color:#fff;font-size:20px}.stats{max-width:1450px;margin:10px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric,.panel{border:1px solid #1d3741;background:#091219;border-radius:16px;padding:18px}.metric small{display:block;color:#6c8c96;font-size:9px;letter-spacing:.12em}.metric b{display:block;font-size:28px;margin-top:7px}.grid{max-width:1450px;margin:12px auto;display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel h2{font-size:27px;margin:5px 0 12px}.panel form{display:grid;grid-template-columns:1fr auto;gap:8px;margin:14px 0}.panel input,.panel button{border-radius:9px;border:1px solid #2b4650;background:#071117;color:#eaf7fb;padding:11px;font:inherit}.panel button{background:#174635;border-color:#2b7658;color:#b9f7dc;font-weight:900;cursor:pointer}.results{display:grid;gap:8px;max-height:500px;overflow:auto}.results article,.sources article{border:1px solid #203640;background:#071016;border-radius:11px;padding:11px}.results article.secondary{border-style:dashed}.results b,.results span,.sources b,.sources span{display:block}.results span,.sources span{font-size:10px;color:#71cba8;margin-top:3px}.results p,.sources p,.review p{font-size:11px;color:#8ba0a9;line-height:1.45}.results small{color:#758c96;margin-top:5px}.company{border:1px solid #275243;background:#0b2119;border-radius:11px;padding:11px;margin:10px 0}.company b,.company span{display:block}.company span{font-size:10px;color:#86cbb0;margin-top:4px}.boundary{border-top:1px solid #1e3038;margin-top:12px;padding-top:10px;font-size:10px!important}.sources{display:grid;grid-template-columns:1fr 1fr;gap:7px;max-height:430px;overflow:auto}.sources article{padding:9px}.sources p{margin:5px 0}.panel details{margin-top:12px}.panel summary{cursor:pointer;color:#a7dbc7}.review{max-height:260px;overflow:auto}.actions{max-width:1450px;margin:12px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.actions a{border:1px solid #28414b;background:#0b161d;color:#eff8fb;text-decoration:none;border-radius:13px;padding:15px}.actions b,.actions span{display:block}.actions span{font-size:10px;color:#8199a4;margin-top:5px}@media(max-width:950px){header{display:block}.grid,.stats,.actions{grid-template-columns:1fr 1fr}.sources{grid-template-columns:1fr}}@media(max-width:650px){.desk{padding:16px}.grid,.stats,.actions{grid-template-columns:1fr}.panel form{grid-template-columns:1fr}}`}</style>
  </main>
}

function Panel({title,eyebrow,children}:{title:string;eyebrow:string;children:any}){return <article className="panel"><small>{eyebrow}</small><h2>{title}</h2>{children}</article>}
function Metric({label,value}:{label:string;value:any}){return <article className="metric"><small>{label.toUpperCase()}</small><b>{value}</b></article>}

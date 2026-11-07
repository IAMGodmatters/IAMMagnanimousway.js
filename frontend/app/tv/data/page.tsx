'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import styles from './data.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Bulletin={status:string;title?:string;source_name?:string;source_url?:string;dataset_title?:string;dataset_url?:string;licence?:string;attribution?:string;crop?:string;geography?:string;period?:string;year?:string;format?:string;data?:string;retrieved_at?:string;editorial_note?:string;detail?:string};
function parseCsvLine(line:string){const out:string[]=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'&&quoted){value+='"';i++}else if(ch==='"'){quoted=!quoted}else if(ch===','&&!quoted){out.push(value);value=''}else value+=ch}out.push(value);return out}
export default function TvDataBulletin(){
 const[data,setData]=useState<Bulletin|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=useCallback(async()=>{setLoading(true);setError('');try{const r=await fetch(api+'/api/tv/data/psa/palay',{cache:'no-store'}),d=await r.json();setData(d);if(!r.ok)throw new Error(d.detail||'The official data source is temporarily unavailable.')}catch(e:any){setError(e?.message||'Could not retrieve the source data.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),6*60*60*1000);return()=>window.clearInterval(timer)},[refresh]);
 const rows=(data?.data||'').split(/\r?\n/).filter(Boolean).map(parseCsvLine);
 return <main className={styles.page}>
  <header className={styles.topbar}><Link href="/tv" className={styles.brand}><span className={styles.mark}>M</span><span><strong>MAGNANIMOUS TV</strong><small>AUTOMATIC DATA PROGRAMMING</small></span></Link><Link href="/tv/studio" className={styles.back}>← TV Studio</Link></header>
  <section className={styles.hero}><p className={styles.eyebrow}>MAGNANIMOUS DATA BULLETIN</p><h1>Philippine rice production.</h1><p>An automatically refreshed factual bulletin built from the Philippine Statistics Authority's OpenSTAT data. Magnanimous presents the data in its own format and credits the official source.</p><div className={styles.tags}><span>PSA OpenSTAT</span><span>Annual national data</span><span>Refreshes every 6 hours</span></div></section>
  <section className={styles.panel}>
   <div className={styles.panelHead}><div><p className={styles.eyebrow}>SOURCE CONNECTION</p><h2>Palay production</h2></div><button onClick={()=>void refresh()} disabled={loading}>{loading?'Refreshing…':'Refresh now'}</button></div>
   {loading&&!data&&<p className={styles.muted}>Connecting to the official statistics source…</p>}
   {error&&<p className={styles.error}>{error}</p>}
   {data?.status==='source-data-ready'&&<><div className={styles.meta}><span>Year: <strong>{data.year}</strong></span><span>Area: <strong>{data.geography}</strong></span><span>Crop: <strong>{data.crop}</strong></span><span>Period: <strong>{data.period}</strong></span></div><div className={styles.tableWrap}><table><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>i===0?<th key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div><p className={styles.note}>{data.editorial_note}</p><p className={styles.attribution}>{data.attribution}</p><p className={styles.muted}>Retrieved: {data.retrieved_at?new Date(data.retrieved_at).toLocaleString(): '—'}</p><div className={styles.links}><a href={data.source_url} target="_blank" rel="noreferrer">PSA OpenSTAT licence and source ↗</a><a href={data.dataset_url} target="_blank" rel="noreferrer">Original dataset metadata ↗</a></div></>}
   {data?.status==='source-unavailable'&&<p className={styles.error}>{data.detail}</p>}
  </section>
  <section className={styles.explain}><h2>What this is — and what it is not</h2><p>This is the first automatic data-source connection for the network. It refreshes from PSA OpenSTAT and can become a narrated Magnanimous programme once the scheduled video playout engine is completed. It is not yet a continuous TV broadcast, and it is not an official PSA broadcast or endorsement.</p><p>Only aggregate OpenSTAT tables are used here. PSA Data Archive microdata has different restrictions and is not included in this bulletin.</p></section>
  <footer className={styles.footer}><span>Magnanimous TV Network</span><span>Presented by I Am Magnanimous Way™</span><Link href="/tv">Return to channels</Link></footer>
 </main>;
}

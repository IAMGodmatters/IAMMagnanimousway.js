'use client';

import {useEffect,useState} from 'react';
import {localVaultEstimate,localVaultSelfTest,requestLocalVaultPersistence} from '../../lib/magnanimous-local-vault';

type LocalState={usage:number;quota:number;persisted:boolean};
type ServerStorage={mode?:string;object_count?:number;logical_bytes?:number;unique_content_bytes?:number;deduplicated_bytes?:number;filesystem?:{total_bytes?:number;free_bytes?:number}|null};

function bytes(value?:number){
 const n=Math.max(0,Number(value||0));
 if(n<1024)return `${n} B`;
 if(n<1024**2)return `${(n/1024).toFixed(1)} KB`;
 if(n<1024**3)return `${(n/1024**2).toFixed(1)} MB`;
 return `${(n/1024**3).toFixed(2)} GB`;
}

export default function StoragePage(){
 const[local,setLocal]=useState<LocalState|null>(null);
 const[server,setServer]=useState<ServerStorage|null>(null);
 const[message,setMessage]=useState('');
 const[busy,setBusy]=useState('');
 async function refresh(){
  localVaultEstimate().then(setLocal).catch(()=>setLocal(null));
  fetch('/__magnanimous_runtime/health',{cache:'no-store'}).then(async r=>{if(r.ok){const d=await r.json();setServer(d?.storage||null)}}).catch(()=>{});
 }
 useEffect(()=>{void refresh()},[]);
 async function persist(){setBusy('persist');setMessage('');try{const ok=await requestLocalVaultPersistence();await refresh();setMessage(ok?'Persistent device storage was granted by this browser.':'This browser kept storage in its normal managed mode. Magnanimous will not pretend persistence was granted.')}catch(e:any){setMessage(String(e?.message||e))}finally{setBusy('')}}
 async function test(){setBusy('test');setMessage('');try{await localVaultSelfTest();await refresh();setMessage('Device vault write, read, and delete verification passed.')}catch(e:any){setMessage(String(e?.message||e))}finally{setBusy('')}}
 const localPct=local?.quota?Math.min(100,(local.usage/local.quota)*100):0;
 return <main className="page">
  <header><a href="/magnanimous">← Magnanimous AI</a><div><small>I AM MAGNANIMOUS WAY™</small><h1>Magnanimous Storage</h1><p>First-party server storage plus optional storage on this device. No paid storage provider is silently activated.</p></div><a href="/owner-infrastructure">Infrastructure →</a></header>
  <section className="grid">
   <article><small>SERVER STORAGE</small><h2>Magnanimous persistent object store</h2><p>Files are stored inside the platform's persistent storage and duplicate content is content-addressed so repeated identical files can share disk blocks.</p><dl><div><dt>Objects</dt><dd>{server?.object_count??'—'}</dd></div><div><dt>Logical data</dt><dd>{server?bytes(server.logical_bytes):'—'}</dd></div><div><dt>Unique content</dt><dd>{server?bytes(server.unique_content_bytes):'—'}</dd></div><div><dt>Saved by deduplication</dt><dd>{server?bytes(server.deduplicated_bytes):'—'}</dd></div><div><dt>Filesystem free</dt><dd>{server?.filesystem?bytes(server.filesystem.free_bytes):'—'}</dd></div></dl></article>
   <article><small>THIS DEVICE</small><h2>Zero-cost device vault</h2><p>IndexedDB and the browser Storage API can use storage available on your own device without adding hosted storage charges. The browser decides the exact quota.</p><dl><div><dt>Used</dt><dd>{local?bytes(local.usage):'—'}</dd></div><div><dt>Browser quota</dt><dd>{local?bytes(local.quota):'—'}</dd></div><div><dt>Persistence</dt><dd>{local?.persisted?'Granted':'Managed by browser'}</dd></div></dl><div className="bar"><i style={{width:`${localPct}%`}}/></div><div className="buttons"><button onClick={persist} disabled={!!busy}>{busy==='persist'?'REQUESTING…':'REQUEST PERSISTENT STORAGE'}</button><button onClick={test} disabled={!!busy}>{busy==='test'?'TESTING…':'VERIFY DEVICE VAULT'}</button></div></article>
  </section>
  <section className="policy"><b>Free-first storage rule</b><p>Magnanimous uses its existing persistent capacity efficiently first. Additional billable buckets, larger hosted volumes, or third-party storage are not enabled automatically. Storage that would create new cost remains an explicit funded action.</p>{message&&<strong>{message}</strong>}</section>
  <style jsx>{`.page{min-height:100vh;background:#050b12;color:#eef8ff;padding:24px;font-family:Inter,system-ui,sans-serif}header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;max-width:1180px;margin:auto}a{color:#8bdcff;text-decoration:none}small{letter-spacing:.14em;color:#7aa3be}h1{margin:.25rem 0;font-size:clamp(2rem,5vw,4rem)}header p{max-width:720px;color:#b8c9d6}.grid{max-width:1180px;margin:30px auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}article,.policy{background:#091520;border:1px solid #17334a;border-radius:18px;padding:22px}h2{margin:.45rem 0 1rem}article p,.policy p{color:#b9cbd9;line-height:1.55}dl{display:grid;gap:8px;margin:18px 0}dl div{display:flex;justify-content:space-between;gap:20px;padding:9px 0;border-bottom:1px solid #173048}dt{color:#95b2c5}dd{margin:0;font-weight:700}.bar{height:8px;border-radius:20px;background:#132331;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#48c9d9,#8ac9ff)}.buttons{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}button{background:#0d283a;color:#eaf9ff;border:1px solid #2b6483;border-radius:10px;padding:11px 14px;font-weight:700;cursor:pointer}button:disabled{opacity:.55}.policy{max-width:1136px;margin:0 auto}.policy strong{display:block;margin-top:12px;color:#aee7c5}@media(max-width:800px){.grid{grid-template-columns:1fr}header{flex-direction:column}.page{padding:18px}}`}</style>
 </main>
}

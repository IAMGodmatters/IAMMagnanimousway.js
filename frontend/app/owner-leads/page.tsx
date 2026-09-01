'use client';
import { useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Lead = {
  id:string; name:string; email:string; role:string; active:number; created_at:number;
  tenant_id:string; workspace:string; workspace_slug:string; last_activity:number|null; login_count:number;
};

type Summary = { total:number; active:number; new_last_24h:number };

async function readResponse(r:Response){
  const text=await r.text();
  try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${r.status})`}}
}

function fmt(ts:number|null){
  if(!ts)return 'Never';
  return new Date(ts*1000).toLocaleString();
}

export default function OwnerLeadsPage(){
  const [leads,setLeads]=useState<Lead[]>([]);
  const [summary,setSummary]=useState<Summary>({total:0,active:0,new_last_24h:0});
  const [q,setQ]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);

  async function load(search=''){
    setLoading(true);setError('');
    const token=localStorage.getItem('odin_admin_token');
    if(!token){location.replace('/owner-login');return;}
    try{
      const r=await fetch(`${api}/api/admin/leads?q=${encodeURIComponent(search)}`,{headers:{Authorization:`Bearer ${token}`}});
      const d=await readResponse(r);
      if(r.status===401){localStorage.removeItem('odin_admin_token');location.replace('/owner-login');return;}
      if(!r.ok)throw new Error(d.detail||'Unable to load leads.');
      setLeads(d.leads||[]);setSummary(d.summary||{total:0,active:0,new_last_24h:0});
    }catch(e:any){setError(e?.message||'Unable to load leads.')}finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  return <main className="page">
    <header>
      <div><div className="eyebrow">I AM MAGNANIMOUS WAY™ • OWNER</div><h1>Registered Users & Leads</h1><p>Every customer account created on the platform is listed here for owner follow-up.</p></div>
      <div className="actions"><a href="/">← Dashboard</a><button onClick={()=>load(q)}>Refresh</button></div>
    </header>

    <section className="stats">
      <article><b>{summary.total}</b><span>Total Registered Leads</span></article>
      <article><b>{summary.active}</b><span>Active Accounts</span></article>
      <article><b>{summary.new_last_24h}</b><span>New in Last 24 Hours</span></article>
    </section>

    <section className="panel">
      <div className="toolbar"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load(q)}} placeholder="Search name, email, or workspace…"/><button onClick={()=>load(q)}>Search</button></div>
      {error&&<div className="error">{error}</div>}
      {loading?<div className="empty">Loading registered users…</div>:leads.length===0?<div className="empty">No registered users found yet.</div>:<div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Workspace</th><th>Signed Up</th><th>Last Activity</th><th>Logins</th><th>Status</th></tr></thead><tbody>{leads.map(x=><tr key={x.id}><td><strong>{x.name||'Unnamed'}</strong></td><td><a href={`mailto:${x.email}`}>{x.email}</a></td><td>{x.workspace||'—'}</td><td>{fmt(x.created_at)}</td><td>{fmt(x.last_activity)}</td><td>{Number(x.login_count||0)}</td><td><span className={x.active?'on':'off'}>{x.active?'Active':'Inactive'}</span></td></tr>)}</tbody></table></div>}
    </section>

    <p className="privacy">Passwords are never displayed here. They remain stored only as secure hashes; this directory exposes only account and lead information needed for owner administration.</p>

    <style jsx>{`
      .page{min-height:100vh;background:#060911;color:#eef4ff;padding:32px;font-family:Inter,system-ui,sans-serif}header{max-width:1300px;margin:auto;display:flex;justify-content:space-between;gap:24px;align-items:end}.eyebrow{font-size:11px;letter-spacing:.18em;color:#76dcff;font-weight:900}h1{font-size:clamp(30px,5vw,52px);margin:8px 0}header p{color:#9eacc0}.actions{display:flex;gap:10px}.actions a,.actions button,.toolbar button{border:1px solid #304861;background:#0c1623;color:#dff6ff;padding:11px 15px;border-radius:10px;text-decoration:none;cursor:pointer}.stats{max-width:1300px;margin:28px auto;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stats article{padding:22px;border:1px solid #1d3348;background:#0a111c;border-radius:16px}.stats b{display:block;font-size:32px;color:#75e2ff}.stats span{color:#9ba9bb;font-size:13px}.panel{max-width:1300px;margin:auto;border:1px solid #1d3348;background:#0a111c;border-radius:18px;padding:18px}.toolbar{display:flex;gap:10px;margin-bottom:16px}.toolbar input{flex:1;padding:13px;border-radius:10px;border:1px solid #294156;background:#08111a;color:#fff}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:900px}th,td{text-align:left;padding:13px 12px;border-bottom:1px solid #182a3b;font-size:13px}th{color:#7f93aa;font-size:11px;letter-spacing:.08em;text-transform:uppercase}td a{color:#72dcff;text-decoration:none}.on,.off{padding:5px 9px;border-radius:999px;font-size:11px}.on{background:rgba(62,230,120,.12);color:#83f6aa}.off{background:rgba(255,90,100,.12);color:#ffabb2}.empty,.error{padding:30px;text-align:center;color:#9aa9bb}.error{color:#ffafb8}.privacy{max-width:1300px;margin:18px auto;color:#728198;font-size:12px}@media(max-width:760px){.page{padding:18px}header{display:block}.actions{margin-top:16px}.stats{grid-template-columns:1fr}}
    `}</style>
  </main>
}

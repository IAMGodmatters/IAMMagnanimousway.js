'use client';
import {useState} from 'react';

type Item={region:'us'|'ph';kind:'grant'|'loan'|'resource';tag:string;title:string;desc:string;url:string};
const items:Item[]=[
{region:'us',kind:'grant',tag:'U.S. FEDERAL GRANTS',title:'Grants.gov',desc:'Search official U.S. federal grant opportunities.',url:'https://www.grants.gov/'},
{region:'us',kind:'resource',tag:'FEDERAL REGISTRATION',title:'SAM.gov',desc:'Register an entity and prepare for federal awards.',url:'https://sam.gov/entity-registration'},
{region:'us',kind:'resource',tag:'SMALL BUSINESS',title:'SBA Funding',desc:'Official SBA funding programs and guidance.',url:'https://www.sba.gov/funding-programs'},
{region:'us',kind:'loan',tag:'LOANS',title:'SBA Microloans',desc:'Microloan information for qualifying small businesses.',url:'https://www.sba.gov/funding-programs/loans/microloans'},
{region:'us',kind:'grant',tag:'R&D FUNDING',title:'SBIR / STTR',desc:'Federal research and innovation funding for small businesses.',url:'https://www.sbir.gov/'},
{region:'us',kind:'grant',tag:'TECH STARTUPS',title:'NSF Seed Fund',desc:'America’s Seed Fund for qualifying technology startups.',url:'https://seedfund.nsf.gov/'},
{region:'us',kind:'grant',tag:'PRIZES & CHALLENGES',title:'Challenge.gov',desc:'Federal prize competitions and innovation challenges.',url:'https://www.challenge.gov/'},
{region:'us',kind:'resource',tag:'RURAL BUSINESS',title:'USDA Rural Development',desc:'Programs supporting qualifying rural businesses and projects.',url:'https://www.rd.usda.gov/programs-services/business-programs'},
{region:'us',kind:'grant',tag:'OFFICIAL GUIDANCE',title:'USA.gov Grants',desc:'Government guidance on grants, eligibility, and avoiding scams.',url:'https://www.usa.gov/government-grants'},
{region:'ph',kind:'loan',tag:'PHILIPPINES MSME',title:'SBCorp',desc:'MSME financing programs and business support.',url:'https://sbcorp.gov.ph/programs-and-services/msme-financing-programs/'},
{region:'ph',kind:'resource',tag:'PHILIPPINES BUSINESS',title:'DTI Philippines',desc:'MSME, entrepreneurship, and business assistance.',url:'https://www.dti.gov.ph/'},
{region:'ph',kind:'grant',tag:'SCIENCE & TECHNOLOGY',title:'DOST Philippines',desc:'Science, technology, innovation, and enterprise programs.',url:'https://www.dost.gov.ph/'},
{region:'ph',kind:'grant',tag:'R&D / INNOVATION',title:'DOST-PCIEERD',desc:'Research, development, startup, and innovation opportunities.',url:'https://pcieerd.dost.gov.ph/'},
{region:'ph',kind:'loan',tag:'FINANCING',title:'LANDBANK',desc:'Government-bank development and financing programs.',url:'https://www.landbank.com/'},
{region:'ph',kind:'resource',tag:'INVESTMENT',title:'Board of Investments',desc:'Investment registration, programs, and incentive information.',url:'https://boi.gov.ph/'},
{region:'ph',kind:'resource',tag:'GOVERNMENT CONTRACTS',title:'PhilGEPS',desc:'Philippine government procurement and supplier opportunities.',url:'https://www.philgeps.gov.ph/'}
];

export default function Funding(){
 const[filter,setFilter]=useState<'all'|'us'|'ph'|'grant'|'loan'>('all');
 const shown=items.filter(i=>filter==='all'||i.region===filter||i.kind===filter);
 return <main className="page">
  <header><a href="/">♛ I AM MAGNANIMOUS WAY™</a><a href="/">Home</a></header>
  <section className="hero"><small>OFFICIAL RESOURCE DIRECTORY</small><h1>Funding Resources</h1><p>Direct links to official U.S. and Philippine government funding, business assistance, grant, loan, research, and procurement resources.</p></section>
  <section className="notice safe"><b>Safety & privacy:</b> This page does not ask for passwords, bank details, card numbers, payments, downloads, or personal information. It only links to official public resources.</section>
  <section className="notice"><b>Important:</b> Grants do not normally require repayment; loans do. Check eligibility, deadlines, and terms directly with the official agency. I AM MAGNANIMOUS WAY™ does not guarantee funding or approval.</section>
  <div className="filters">{(['all','us','ph','grant','loan'] as const).map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f==='all'?'All':f==='us'?'U.S.':f==='ph'?'Philippines':f==='grant'?'Grants':'Loans'}</button>)}</div>
  <section className="grid">{shown.map(i=><article className="card" key={i.title}><span>{i.tag}</span><h2>{i.title}</h2><p>{i.desc}</p><a href={i.url} target="_blank" rel="noopener noreferrer">Open official site ↗</a></article>)}</section>
  <footer>I AM MAGNANIMOUS WAY™ · Official Funding Resources Directory</footer>
  <style jsx>{`
  *{box-sizing:border-box}.page{min-height:100vh;background:linear-gradient(180deg,#031129,#06192f);color:#eefaff;font-family:Inter,system-ui,sans-serif;padding-bottom:50px}header{height:70px;display:flex;justify-content:space-between;align-items:center;padding:0 24px;border-bottom:1px solid #1c82b5;background:#031129;position:sticky;top:0;z-index:10}header a{color:#eafcff;text-decoration:none;font-weight:800}.hero{max-width:1050px;margin:auto;padding:54px 20px 18px}.hero small{color:#58e6ff;font-weight:900;letter-spacing:.15em}.hero h1{font-size:clamp(42px,8vw,76px);margin:8px 0 12px;line-height:.95}.hero p{max-width:760px;color:#bed7e7;font-size:17px;line-height:1.6}.notice{max-width:1050px;margin:12px auto;padding:15px 18px;border:1px solid #45677f;border-radius:14px;background:#102136;color:#d9edf7}.notice.safe{border-color:#3b8c62;background:#0b291a}.filters{max-width:1050px;margin:22px auto;display:flex;gap:9px;flex-wrap:wrap;padding:0 20px}.filters button{border:1px solid #3e6681;background:#0b2038;color:#fff;border-radius:999px;padding:10px 15px;font-weight:800;cursor:pointer}.filters button.active{background:#5de3ee;color:#04121d}.grid{max-width:1050px;margin:auto;padding:0 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:14px}.card{display:flex;flex-direction:column;background:#102136;border:1px solid #284966;border-radius:16px;padding:18px;min-height:220px}.card span{font-size:11px;color:#5de3ee;font-weight:900}.card h2{margin:9px 0 6px}.card p{color:#b8cade;line-height:1.5}.card a{margin-top:auto;text-align:center;text-decoration:none;background:#5de3ee;color:#04121d;padding:12px;border-radius:10px;font-weight:900}.card a:hover{outline:2px solid white;outline-offset:2px}footer{max-width:1050px;margin:34px auto 0;padding:0 20px;color:#8fa9c2;font-size:13px}@media(max-width:600px){header{padding:0 14px}.hero{padding-top:36px}.notice{margin-left:14px;margin-right:14px}}
  `}</style>
 </main>
}
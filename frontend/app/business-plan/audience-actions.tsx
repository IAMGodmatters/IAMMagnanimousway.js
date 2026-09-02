'use client';

import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';

type Resource={name:string;url:string;tag:string;description:string;action:string};
type AudiencePreset={label:string;audience:string;goal:string;summary:string;resources:Resource[]};

const presets:AudiencePreset[]=[
 {
  label:'Bank / lender',audience:'Bank / lender',goal:'Apply for a bank / lender loan',summary:'Prepare the plan for debt financing, then compare legitimate lender programs and get application-preparation help.',
  resources:[
   {name:'SBA Lender Match',url:'https://www.sba.gov/loans/lender-match/',tag:'OFFICIAL · U.S.',description:'Describe the business and funding need, then see potential SBA-approved lenders that may be interested. Matching is not approval.',action:'FIND LENDERS'},
   {name:'SBA Loan Programs',url:'https://www.sba.gov/loans/',tag:'OFFICIAL · U.S.',description:'Compare SBA-backed 7(a), 504, microloan and other funding paths before choosing a lender or loan type.',action:'COMPARE LOAN PROGRAMS'},
   {name:'SBA Local Assistance',url:'https://www.sba.gov/counseling/local-assistance/',tag:'ADVISORS · U.S.',description:'Find SBDC, SCORE and other free or low-cost business advisers who can help prepare financing materials and applications.',action:'FIND LOCAL HELP'},
  ]
 },
 {
  label:'Investor',audience:'Investor',goal:'Raise investment',summary:'Adapt the case for equity investors, then research investor networks and fundraising platforms that accept founder applications.',
  resources:[
   {name:'SBA Investment Capital / SBIC',url:'https://www.sba.gov/loans/additional-funding-opportunities/investment-capital/',tag:'OFFICIAL · U.S.',description:'Learn about SBA-licensed Small Business Investment Companies that provide debt, equity or a combination to qualifying businesses.',action:'FIND SBIC INVESTORS'},
   {name:'Gust Raise Capital',url:'https://gust.com/raise-capital/',tag:'FUNDRAISING PLATFORM',description:'Build a company profile, research angel groups and venture funds, and manage fundraising applications from one platform.',action:'RESEARCH INVESTORS'},
   {name:'Republic Raise',url:'https://republic.com/raise',tag:'FUNDRAISING PLATFORM',description:'Explore community and online investment fundraising options. Republic reviews companies before they can raise on its platform.',action:'EXPLORE FUNDRAISING'},
  ]
 },
 {
  label:'Grant',audience:'Grant reviewer',goal:'Prepare a grant application',summary:'Adapt the business case for grant review, then search official opportunities and startup grant or accelerator databases.',
  resources:[
   {name:'Grants.gov',url:'https://www.grants.gov/search-grants.html',tag:'OFFICIAL · U.S.',description:'Search current U.S. federal grant opportunities and filter by eligibility, agency, funding instrument and status.',action:'SEARCH FEDERAL GRANTS'},
   {name:"America's Seed Fund · SBIR/STTR",url:'https://www.sbir.gov/',tag:'OFFICIAL · U.S.',description:'Research non-dilutive federal innovation funding for eligible small businesses developing technology with commercialization potential.',action:'SEARCH SBIR / STTR'},
   {name:'F6S Programs',url:'https://www.f6s.com/programs',tag:'GLOBAL PLATFORM',description:'Browse accelerator, startup program, grant and funding opportunities across regions and industries.',action:'SEARCH PROGRAMS'},
  ]
 },
 {
  label:'Startup',audience:'Startup / founder',goal:'Start a business',summary:'Turn the plan into a startup checklist and connect the founder with launch guidance, mentors, programs and accelerators.',
  resources:[
   {name:'SBA Launch Your Business',url:'https://www.sba.gov/counseling/launch-your-business/',tag:'OFFICIAL · U.S.',description:'Work through business structure, registration, tax IDs, permits, banking and insurance steps for a new business.',action:'OPEN STARTUP GUIDE'},
   {name:'SCORE Business Plan & Mentoring',url:'https://www.score.org/business-plan/',tag:'MENTORING · U.S.',description:'Use planning resources and connect with volunteer business mentors for feedback on a startup plan.',action:'GET PLAN HELP'},
   {name:'F6S Programs',url:'https://www.f6s.com/programs',tag:'GLOBAL PLATFORM',description:'Research accelerators, incubators, startup programs and funding opportunities by region and industry.',action:'FIND STARTUP PROGRAMS'},
  ]
 },
 {
  label:'Expansion',audience:'Expansion team',goal:'Expand an existing business',summary:'Refocus the plan on growth capital, fixed assets, new markets, exporting and professional expansion support.',
  resources:[
   {name:'SBA 504 Loans',url:'https://www.sba.gov/loans/504-loans/',tag:'OFFICIAL · U.S.',description:'Research long-term fixed-rate financing for qualifying major fixed assets that support business growth and job creation.',action:'RESEARCH 504 FINANCING'},
   {name:'SBA STEP Export Support',url:'https://www.sba.gov/loans/additional-funding-opportunities/grants/',tag:'OFFICIAL · U.S.',description:'Learn how eligible established small businesses may receive state-administered STEP support for export and international market expansion.',action:'EXPLORE EXPORT SUPPORT'},
   {name:'SBA Local Assistance / SBDC',url:'https://www.sba.gov/counseling/local-assistance/',tag:'ADVISORS · U.S.',description:'Find advisers for capital access, strategy, operations, export assistance, sales and expansion planning.',action:'FIND EXPANSION HELP'},
  ]
 },
 {
  label:'Partnership',audience:'Potential partner',goal:'Form a partnership',summary:'Adapt the plan for a potential partner, cofounder, mentor, joint venture or subcontracting relationship and surface places to find them.',
  resources:[
   {name:'CoFoundersLab',url:'https://cofounderslab.com/',tag:'GLOBAL NETWORK',description:'Research potential cofounders, advisers and entrepreneurial collaborators by skills, interests and location.',action:'FIND POTENTIAL PARTNERS'},
   {name:'SBA Mentor-Protégé & Joint Ventures',url:'https://www.sba.gov/certifications/contracting-assistance-programs/',tag:'OFFICIAL · U.S.',description:'Learn about SBA Mentor-Protégé relationships and qualifying joint ventures for government contracting and business development.',action:'EXPLORE JOINT VENTURES'},
   {name:'SBA SUBNet',url:'https://legacy.sba.gov/federal-contracting/contracting-guide/prime-subcontracting/subcontracting-opportunities',tag:'OFFICIAL · U.S.',description:'Browse subcontracting opportunities posted for small businesses by federal prime contractors and other organizations.',action:'SEARCH SUBCONTRACTS'},
   {name:'SAM.gov Contract Opportunities',url:'https://sam.gov/opportunities',tag:'OFFICIAL · U.S.',description:'Search public federal contracting opportunities and interested-vendor paths that may lead to teaming or subcontract relationships.',action:'SEARCH CONTRACTS'},
  ]
 },
 {
  label:'Internal plan',audience:'Internal management',goal:'Internal operating plan',summary:'Turn the business case into an operating plan supported by planning, financial and management tools rather than an outside-funding pitch.',
  resources:[
   {name:'SBA Plan Your Business',url:'https://www.sba.gov/counseling/plan-your-business/',tag:'OFFICIAL · U.S.',description:'Use market research, business-plan, startup-cost, business-credit and funding guidance to strengthen internal planning.',action:'OPEN PLANNING GUIDE'},
   {name:'SCORE Planning & Financial Templates',url:'https://www.score.org/business-planning-financial-statements-template-gallery/',tag:'TOOLS · U.S.',description:'Access planning and financial templates for forecasting, operations, cash flow, strategy and management.',action:'OPEN TEMPLATE LIBRARY'},
   {name:'SBA Resource Partners',url:'https://www.sba.gov/counseling/local-assistance/resource-partners/',tag:'ADVISORS · U.S.',description:'Find SBDC, SCORE, Women’s Business Center and other advisers for planning, operations, financial management and growth.',action:'FIND AN ADVISER'},
  ]
 },
 {
  label:'Immigration / business application',audience:'Immigration / business application',goal:'Immigration / business application support',summary:'Organize the business evidence, then send users to official immigration information and authorized legal-help resources for eligibility and filing questions.',
  resources:[
   {name:'USCIS Entrepreneur Employment Pathways',url:'https://www.uscis.gov/working-in-the-united-states/entrepreneur-employment-pathways',tag:'OFFICIAL · U.S.',description:'Review U.S. immigration pathways that may be relevant to entrepreneurs and business owners. Eligibility depends on the individual facts and law.',action:'REVIEW ENTREPRENEUR PATHWAYS'},
   {name:'USCIS International Entrepreneur Rule',url:'https://www.uscis.gov/working-in-the-united-states/international-entrepreneur-rule',tag:'OFFICIAL · U.S.',description:'Read official information about International Entrepreneur parole, including requirements and evidence.',action:'REVIEW IER'},
   {name:'USCIS EB-5 Immigrant Investor Program',url:'https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program',tag:'OFFICIAL · U.S.',description:'Read official EB-5 program information, requirements and filing guidance directly from USCIS.',action:'REVIEW EB-5'},
   {name:'USCIS Avoid Scams / Legal Help',url:'https://www.uscis.gov/scams-fraud-and-misconduct/avoid-scams',tag:'AUTHORIZED HELP · U.S.',description:'Learn how to identify authorized immigration attorneys or accredited representatives and avoid unauthorized immigration advice.',action:'FIND AUTHORIZED HELP'},
  ]
 },
];

function savedIntake(){
 try{return JSON.parse(localStorage.getItem('iam_business_plan_intake')||'{}')||{}}catch{return{}}
}

export default function AudienceActions(){
 const[target,setTarget]=useState<HTMLElement|null>(null);
 const[selected,setSelected]=useState('');
 const current=useMemo(()=>presets.find(p=>p.label===selected)||null,[selected]);

 useEffect(()=>{
  const find=()=>{
   const section=document.querySelector<HTMLElement>('.audiences');
   if(section)setTarget(section);
  };
  find();
  const timer=window.setInterval(()=>{if(!document.querySelector('.audiences'))return;find();window.clearInterval(timer)},150);
  return()=>window.clearInterval(timer);
 },[]);

 useEffect(()=>{
  const intake=savedIntake();
  const match=presets.find(p=>p.audience===intake.audience);
  if(match)setSelected(match.label);

  const q=new URLSearchParams(location.search);
  if(q.get('audience_selected')==='1'){
   window.setTimeout(()=>{
    const begin=document.querySelector<HTMLButtonElement>('.heroActions button');
    if(!document.getElementById('intake'))begin?.click();
    window.setTimeout(()=>{
     const tabs=document.querySelectorAll<HTMLButtonElement>('.stepTabs button');
     tabs[2]?.click();
     window.setTimeout(()=>document.getElementById('intake')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
    },60);
   },60);
  }
 },[]);

 function savePreset(p:AudiencePreset){
  const next={...savedIntake(),audience:p.audience,goal:p.goal};
  localStorage.setItem('iam_business_plan_intake',JSON.stringify(next));
  setSelected(p.label);
  const url=new URL(location.href);
  url.searchParams.set('audience',p.audience);
  url.searchParams.delete('audience_selected');
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
  window.setTimeout(()=>document.getElementById('iam-audience-resources')?.scrollIntoView({behavior:'smooth',block:'nearest'}),30);
 }

 function applyToPlan(p:AudiencePreset){
  const next={...savedIntake(),audience:p.audience,goal:p.goal};
  localStorage.setItem('iam_business_plan_intake',JSON.stringify(next));
  const url=new URL(location.href);
  url.searchParams.set('audience_selected','1');
  url.searchParams.set('audience',p.audience);
  location.href=`${url.pathname}${url.search}#intake`;
 }

 if(!target)return null;
 return createPortal(<>
  <div className="iamAudienceActions" aria-label="Choose business plan audience">
   {presets.map(p=><button key={p.label} type="button" className={selected===p.label?'active':''} aria-pressed={selected===p.label} onClick={()=>savePreset(p)}>{p.label}</button>)}
  </div>
  {current&&<section id="iam-audience-resources" className="iamAudienceResources" aria-live="polite">
   <div className="iamAudienceResourceHead"><div><small>RESEARCHED OUTSIDE RESOURCES</small><h3>{current.label}</h3><p>{current.summary}</p></div><button type="button" onClick={()=>applyToPlan(current)}>USE THIS AUDIENCE IN MY PLAN →</button></div>
   <div className="iamResourceGrid">{current.resources.map(r=><article key={r.url}><span>{r.tag}</span><h4>{r.name}</h4><p>{r.description}</p><a href={r.url} target="_blank" rel="noopener noreferrer">{r.action} ↗</a></article>)}</div>
   <p className="iamResourceNote">I Am Magnanimous Way™ organizes the research and sends you to the outside provider or official source. External programs and platforms control their own eligibility, underwriting, due diligence, fees, deadlines, awards and decisions. No listing here is an approval, endorsement, funding promise, investment offer or immigration/legal determination.</p>
  </section>}
  <style jsx global>{`
   .audiences>div:not(.iamAudienceActions){display:none!important}
   .audiences .iamAudienceActions{display:flex!important;justify-content:center;gap:8px;flex-wrap:wrap;margin:20px 0}
   .iamAudienceActions button{border:1px solid #cfc9bb;border-radius:999px;padding:11px 15px;font-size:10px;font-weight:800;background:#fff;color:#252b26;cursor:pointer;transition:.15s ease}
   .iamAudienceActions button:hover,.iamAudienceActions button:focus-visible{border-color:#8c7135;box-shadow:0 0 0 3px rgba(194,154,64,.14);outline:none}
   .iamAudienceActions button.active{background:#172019;color:#fff;border-color:#172019}
   .audiences .iamAudienceResources{margin:26px auto 5px;max-width:1180px;text-align:left;border-top:1px solid #ddd6c7;padding-top:24px}
   .iamAudienceResourceHead{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:end;margin-bottom:16px}
   .iamAudienceResourceHead small{display:block;color:#9a7629;font-size:9px;letter-spacing:.15em;font-weight:900}
   .iamAudienceResourceHead h3{font:34px Georgia,serif;margin:5px 0 7px;color:#1a211b}
   .iamAudienceResourceHead p{margin:0;max-width:760px;color:#657068;line-height:1.6;font-size:12px}
   .iamAudienceResourceHead button{border:0;border-radius:10px;background:#172019;color:#fff;padding:13px 15px;font-size:9px;font-weight:900;cursor:pointer;white-space:nowrap}
   .iamResourceGrid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px!important;margin:0!important}
   .iamResourceGrid article{border:1px solid #d7d0c0;border-radius:14px;padding:17px;background:#fbfaf6;display:flex;flex-direction:column;min-height:220px}
   .iamResourceGrid article>span{font-size:8px;letter-spacing:.12em;font-weight:900;color:#98752c}
   .iamResourceGrid h4{font:23px Georgia,serif;margin:9px 0 8px;color:#1c231d}
   .iamResourceGrid p{font-size:11px!important;line-height:1.55!important;color:#626c65!important;margin:0 0 16px!important;flex:1}
   .iamResourceGrid a{display:inline-block;text-decoration:none;color:#162019;font-size:9px;font-weight:900;border-top:1px solid #ddd6c7;padding-top:12px}
   .audiences .iamResourceNote{font-size:10px;line-height:1.55;color:#7c817c;max-width:1080px;margin:16px auto 0;text-align:center}
   @media(max-width:760px){.iamAudienceResourceHead{grid-template-columns:1fr}.iamAudienceResourceHead button{white-space:normal}.iamResourceGrid{grid-template-columns:1fr!important}}
  `}</style>
 </>,target);
}

import BusinessPlanClient from './business-plan-client';

export const metadata={
 title:'Professional Business Plan & MAGNANIMOUS LaunchPlan | I AM Magnanimous Way',
 description:'Go from a guided MAGNANIMOUS LaunchPlan intake to a researched, challenged and professionally prepared business plan, then continue into business email, CRM, outreach and meeting preparation.',
 alternates:{canonical:'/business-plan/'},
 openGraph:{title:'From Business Idea to the Meeting | I AM Magnanimous Way',description:'MAGNANIMOUS works like an automated consulting team: intake, research, validation, financial review, hostile critique and professional finalization.',url:'/business-plan/'}
};

export default function BusinessPlanPage(){return <>
 <div style={{maxWidth:1180,margin:'14px auto 0',padding:'0 22px',fontFamily:'Inter,system-ui,sans-serif'}}>
  <a href="/launchplan" style={{display:'block',textDecoration:'none',border:'1px solid #344451',borderRadius:12,padding:'12px 15px',background:'#071017',color:'#c9eff8',fontSize:11,fontWeight:800,letterSpacing:'.03em'}}>NEW MERGED INTAKE • Open MAGNANIMOUS LaunchPlan AI →</a>
 </div>
 <BusinessPlanClient/>
 </>}

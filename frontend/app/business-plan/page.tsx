import BusinessPlanClient from './business-plan-client';

export const metadata={
 title:'Professional Business Plan & Launch | I AM Magnanimous Way',
 description:'Go from a business idea to a researched, challenged and professionally prepared business plan with I AM Operator, then continue into business email, CRM, outreach and meeting preparation.',
 alternates:{canonical:'/business-plan/'},
 openGraph:{title:'From Business Idea to the Meeting | I AM Magnanimous Way',description:'I AM Operator works like an automated consulting team: intake, research, validation, financial review, hostile critique and professional finalization.',url:'/business-plan/'}
};

export default function BusinessPlanPage(){return <BusinessPlanClient/>}

import LaunchPlanClient from './launchplan-client';
import BusinessPlanSubscriptionCopy from '../business-plan/subscription-copy';

export const metadata={
 title:'MAGNANIMOUS LaunchPlan AI | I AM Magnanimous Way',
 description:'Turn a business idea into a structured founder intake, then continue into the production MAGNANIMOUS professional business-plan pipeline for research, financial review, hostile critique and finalization.',
 alternates:{canonical:'/launchplan/'},
 openGraph:{
  title:'MAGNANIMOUS LaunchPlan AI | I AM Magnanimous Way',
  description:'A guided idea-to-plan intake merged into the I AM Magnanimous Way professional business launch system.',
  url:'/launchplan/'
 }
};

export default function LaunchPlanPage(){return <><BusinessPlanSubscriptionCopy/><LaunchPlanClient/></>}

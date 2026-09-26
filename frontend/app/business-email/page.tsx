import EmailCenterClient from './email-center-client';
import EmailWriterClient from './email-writer-client';

export const metadata={
 title:'Magnanimous AI Email Writer + Business Email | I AM Magnanimous Way',
 description:'Ask Magnanimous AI to write complete new emails, replies, follow-ups, and rewrites in your voice, then copy them or explicitly send through a connected Gmail or Outlook account.'
};

export default function BusinessEmailPage(){
 return <><EmailWriterClient/><EmailCenterClient/></>;
}

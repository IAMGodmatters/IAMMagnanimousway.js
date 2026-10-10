import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
 title:'Magnanimous CRM Pro — AI Revenue Operating System',
 description:'Standalone Magnanimous CRM Pro: contacts, accounts, pipelines, forecasting, sequences, service, quotes, attribution and AI revenue intelligence under one Magnanimous brain.',
 alternates:{canonical:'/magnanimous-crm'},
 openGraph:{type:'website',url:'/magnanimous-crm',title:'Magnanimous CRM Pro',description:'AI-native CRM and revenue operating system from I AM Magnanimous Way™.'},
 robots:{index:true,follow:true}
};

export default function MagnanimousCrmLayout({children}:{children:ReactNode}){return children}

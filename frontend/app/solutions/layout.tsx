import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'Magnanimous AI — AI Business Execution Platform',
 description:'Meet Magnanimous AI, the primary AI business interface inside I AM Magnanimous Way™. Start with an outcome and coordinate CRM, content, video, calling, connected actions and specialist AI capabilities from one platform.',
 alternates:{canonical:'/solutions/'},
 openGraph:{title:'Magnanimous AI | I AM Magnanimous Way™',description:'One AI orchestrator with business, CRM, content, video, calling and connected capabilities behind it.',url:'/solutions/',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'Magnanimous AI by I AM Magnanimous Way'}]},
 twitter:{card:'summary_large_image',title:'Magnanimous AI | I AM Magnanimous Way™',description:'One AI orchestrator for business execution.',images:['/iam-operator-share.svg']}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

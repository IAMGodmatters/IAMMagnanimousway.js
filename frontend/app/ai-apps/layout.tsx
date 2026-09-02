import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'AI App Library',
 description:'Explore specialized AI helpers for research, writing, business, marketing, social media, customer service, coding, travel and more.',
 alternates:{canonical:'/ai-apps/'},
 openGraph:{title:'AI App Library | I AM Magnanimous Way™',description:'Specialized AI helpers for business, research, writing, marketing and more.',url:'/ai-apps/'}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

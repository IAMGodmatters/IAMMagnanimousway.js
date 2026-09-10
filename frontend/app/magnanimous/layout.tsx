import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
 title:'Magnanimous AI™ — Standalone',
 description:'Direct access to the Magnanimous AI central brain for reasoning, research, planning, writing, coding, knowledge and tool orchestration without the full website interface.',
 alternates:{canonical:'/magnanimous'},
 openGraph:{type:'website',url:'/magnanimous',title:'Magnanimous AI™ — Standalone',description:'One Magnanimous brain. Direct standalone access.',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'Magnanimous AI'}]},
 twitter:{card:'summary_large_image',title:'Magnanimous AI™ — Standalone',description:'One Magnanimous brain. Direct standalone access.',images:['/iam-operator-share.svg']},
 robots:{index:true,follow:true}
};

export default function MagnanimousStandaloneLayout({children}:{children:ReactNode}){return children;}

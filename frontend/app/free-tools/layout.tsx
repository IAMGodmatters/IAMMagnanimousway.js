import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'Free AI Tools',
 description:'Use free-first AI tools for summarizing, rewriting, social posts, video scripts and everyday work with I AM Magnanimous Way™.',
 alternates:{canonical:'/free-tools/'},
 openGraph:{title:'Free AI Tools | I AM Magnanimous Way™',description:'Free-first AI tools for writing, summaries, social content and video scripts.',url:'/free-tools/'}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

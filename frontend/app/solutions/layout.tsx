import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'AI Business Platform',
 description:'Discover I AM Magnanimous Way™: a free-first AI business platform with Odin, specialized agents, CRM, calling, video tools, workflows and optional Full Business features.',
 alternates:{canonical:'/solutions/'},
 openGraph:{title:'I AM Magnanimous Way™ AI Business Platform',description:'Free-first AI tools, agents, CRM, calling, video and business workflows.',url:'/solutions/'}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

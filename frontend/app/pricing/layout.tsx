import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'Free & Full Business Pricing',
 description:'Start I AM Magnanimous Way™ free or choose the optional $49/month Full Business plan for expanded business features.',
 alternates:{canonical:'/pricing/'},
 openGraph:{title:'I AM Magnanimous Way™ Pricing',description:'Free access remains available; Full Business is optional at $49/month.',url:'/pricing/'}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

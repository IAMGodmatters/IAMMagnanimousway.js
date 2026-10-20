import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'Free Samsung Device Diagnostics | Heimdall',
 description:'Explore the original MIT-licensed Heimdall Samsung USB toolkit and secure, owner-only local diagnostic capabilities in Magnanimous AI. No public flashing or lock bypass.',
 alternates:{canonical:'/samsung-tools/'},
 openGraph:{title:'Samsung Device Diagnostics | I AM Magnanimous Way™',description:'Original Heimdall open-source resources and owner-controlled Samsung USB detection.',url:'/samsung-tools/'},
 robots:{index:true,follow:true}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

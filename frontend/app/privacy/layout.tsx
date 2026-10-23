import type {Metadata} from 'next';
import type {ReactNode} from 'react';

// Route-specific public metadata. Do not expose private workspace details.
export const metadata:Metadata={
 title:"Privacy Notice | I AM Magnanimous Way™",
 description:"How I AM Magnanimous Way™ handles account information, workspace data, security, privacy choices and personal information.",
 alternates:{canonical:"/privacy/"},
 robots:{index:true,follow:true}
};

export default function PublicRouteLayout({children}:{children:ReactNode}){
 return <>{children}</>;
}

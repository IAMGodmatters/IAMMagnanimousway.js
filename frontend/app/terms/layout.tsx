import type {Metadata} from 'next';
import type {ReactNode} from 'react';

// Route-specific public metadata. Do not expose private workspace details.
export const metadata:Metadata={
 title:"Terms and Premium Services | I AM Magnanimous Way™",
 description:"Review I AM Magnanimous Way™ platform terms, subscription plans, usage billing, cancellations and premium service agreements.",
 alternates:{canonical:"/terms/"},
 robots:{index:true,follow:true}
};

export default function PublicRouteLayout({children}:{children:ReactNode}){
 return <>{children}</>;
}

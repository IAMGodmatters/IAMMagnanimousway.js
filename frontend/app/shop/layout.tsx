import type {Metadata} from 'next';
import type {ReactNode} from 'react';

// Route-specific public metadata. Do not expose private workspace details.
export const metadata:Metadata={
 title:"Shop | I AM Magnanimous Way™",
 description:"Browse products in the I AM Magnanimous Way™ store. Review availability, delivery options and the final order total before secure checkout.",
 alternates:{canonical:"/shop/"},
 robots:{index:true,follow:true}
};

export default function PublicRouteLayout({children}:{children:ReactNode}){
 return <>{children}</>;
}

import type {Metadata} from 'next';
import type {ReactNode} from 'react';

// Route-specific public metadata. Do not expose private workspace details.
export const metadata:Metadata={
 title:"Advertise | I AM Magnanimous Way™",
 description:"Learn about sponsored placements on I AM Magnanimous Way™ and review pricing before starting a recurring advertisement subscription.",
 alternates:{canonical:"/advertise/"},
 robots:{index:true,follow:true}
};

export default function PublicRouteLayout({children}:{children:ReactNode}){
 return <>{children}</>;
}

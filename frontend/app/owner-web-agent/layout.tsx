import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
 title:'Native Web Agent | I AM Magnanimous Way™',
 robots:{index:false,follow:false,noarchive:true,nocache:true},
};

export default function OwnerWebAgentLayout({children}:{children:ReactNode}){return children}

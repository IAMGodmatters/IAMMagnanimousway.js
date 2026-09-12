import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
 title:'White Label AI Business Platform | I AM Magnanimous Way™',
 description:'Preview a white-label AI business platform with funnels, client apps, booking, CRM, automation, reputation, calling, video and usage rebilling. Pricing is shown only inside the White Label product area.',
 alternates:{canonical:'/white-label/'}
};

export default function WhiteLabelLayout({children}:{children:ReactNode}){return children}

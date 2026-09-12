import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import WhiteLabelBrainDock from './white-label-brain-dock';

export const metadata:Metadata={
 title:'White Label AI Business Platform | I AM Magnanimous Way™',
 description:'Preview a white-label AI business platform powered by the shared Magnanimous AI brain, with funnels, client apps, booking, CRM, automation, reputation, calling, video and usage rebilling. Pricing is shown only inside the White Label product area.',
 alternates:{canonical:'/white-label/'}
};

export default function WhiteLabelLayout({children}:{children:ReactNode}){
 return <>{children}<WhiteLabelBrainDock/></>
}

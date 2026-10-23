import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
 title:'Strategy & Outcomes | I AM Magnanimous Way™',
 description:'Private, authenticated strategy and execution dashboard for Magnanimous AI users.',
 robots:{index:false,follow:false}
};

export default function StrategyCommandLayout({children}:{children:ReactNode}){
 return <>{children}</>;
}

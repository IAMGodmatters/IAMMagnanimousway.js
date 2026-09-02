import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'Reviews & Ratings',
 description:'Read approved user reviews and leave a 1–5 star rating for the I AM Magnanimous Way™ AI business platform.',
 alternates:{canonical:'/reviews/'},
 openGraph:{title:'I AM Magnanimous Way™ Reviews & Ratings',description:'Read approved user reviews and leave a 1–5 star rating.',url:'/reviews/'}
};
export default function Layout({children}:{children:React.ReactNode}){return children}

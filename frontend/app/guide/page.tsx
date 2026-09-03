import type {Metadata} from 'next';
import GuideClient from './guide-client';

export const metadata:Metadata={
 title:'Platform Guide & Resource Center | I Am Magnanimous Way™',
 description:'Understand what every major button, link, card and workspace does, where it leads, what happens next, and which official outside resources can help verify important information.',
 alternates:{canonical:'/guide/'},
 robots:{index:true,follow:true}
};

export default function GuidePage(){return <GuideClient/>}

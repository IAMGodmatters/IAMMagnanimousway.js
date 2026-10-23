import React from 'react';
import type {Metadata} from 'next';

export const metadata:Metadata={
 title:'Teach Magnanimous AI | I AM Magnanimous Way™',
 description:'Contribute useful knowledge, corrections and learning resources to Magnanimous AI through a review-first public teaching portal.',
 alternates:{canonical:'/teach/'},
 robots:{index:true,follow:true}
};

export default function TeachLayout({children}:{children:React.ReactNode}){
  return <div data-iam-route-recovery="true" data-no-autosave="true">{children}</div>;
}

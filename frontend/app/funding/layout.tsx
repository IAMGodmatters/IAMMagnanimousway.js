import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata: Metadata = {
  title: 'Funding Resources for Small Businesses',
  description: 'Official U.S. and Philippine grant, loan, research, procurement, and small-business funding resources curated by I AM Magnanimous Way™.',
  alternates: {canonical: '/funding/'},
  robots: {index: true, follow: true},
  openGraph: {
    type: 'website',
    url: '/funding/',
    title: 'Funding Resources | I AM Magnanimous Way™',
    description: 'Direct links to official U.S. and Philippine funding, grant, loan, research, procurement, and business-assistance resources.',
  },
};

export default function FundingLayout({children}:{children:ReactNode}) {
  return children;
}

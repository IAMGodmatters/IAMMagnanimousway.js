import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import TelecomLayout from '../telecom/layout';

export const metadata: Metadata = {
  title: 'Magnanimous Telecom | God Matters | I AM MAGNANIMOUS WAY™',
  description:
    'Magnanimous Telecom is owned by God Matters and affiliated with I AM MAGNANIMOUS WAY™. Operated by Magnanimous AI.',
};

export default function TelecomStandaloneLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            document.documentElement.setAttribute('data-iam-standalone','true');
          })();`,
        }}
      />
      <TelecomLayout>{children}</TelecomLayout>
    </>
  );
}

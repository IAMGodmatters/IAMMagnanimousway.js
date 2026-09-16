import type { ReactNode } from 'react';

export const metadata = {
  title: 'Magnanimous Telecom | God Matters | I AM MAGNANIMOUS WAY™',
  description: 'Magnanimous Telecom is owned by God Matters and affiliated with I AM MAGNANIMOUS WAY™. Operated by Magnanimous AI.',
};

export default function TelecomLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        role="note"
        aria-label="Magnanimous Telecom ownership and affiliation"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 18px',
          textAlign: 'center',
          background: '#06131d',
          color: '#d9f7ef',
          borderBottom: '1px solid #23404d',
          fontSize: '12px',
          lineHeight: 1.5,
          letterSpacing: '0.025em',
        }}
      >
        <strong>Magnanimous Telecom</strong> is owned by <strong>God Matters</strong> and affiliated with{' '}
        <strong>I AM MAGNANIMOUS WAY™</strong>. Operated by <strong>Magnanimous AI</strong>.
      </div>
      {children}
    </>
  );
}

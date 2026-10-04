import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Magnanimous Reels',
  description: 'Original short-drama series from Magnanimous Reels.',
  alternates: { canonical: '/reels' },
};

export default function MagnanimousReelsPage() {
  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100dvh',
      background: '#05060a',
      display: 'grid',
      gridTemplateRows: '44px 1fr',
      zIndex: 1000,
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 14px',
        background: '#090c13',
        color: '#fff',
        borderBottom: '1px solid #242b3a',
        fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
      }}>
        <strong style={{ fontSize: 15 }}>Magnanimous Reels</strong>
        <a
          href="https://magnanimous-production.up.railway.app/reels/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#ffd05a', fontSize: 12, textDecoration: 'none' }}
        >
          Open full screen
        </a>
      </header>
      <iframe
        src="https://magnanimous-production.up.railway.app/reels/"
        title="Magnanimous Reels"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ width: '100%', height: '100%', border: 0, background: '#05060a' }}
      />
    </main>
  );
}

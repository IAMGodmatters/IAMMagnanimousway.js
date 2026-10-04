import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Magnanimous Reels',
  description: 'Public original short-drama previews and cinematic series from Magnanimous Reels. No sign-in required.',
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
      zIndex: 2147483000,
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
        <span style={{
          color: '#bff3d6',
          border: '1px solid #2d6f50',
          background: '#0d2118',
          borderRadius: 999,
          padding: '4px 9px',
          fontSize: 11,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}>
          Public · No sign-in required
        </span>
      </header>
      <iframe
        src="https://magnanimous-production.up.railway.app/reels/"
        title="Magnanimous Reels public player"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ width: '100%', height: '100%', border: 0, background: '#05060a' }}
      />
    </main>
  );
}

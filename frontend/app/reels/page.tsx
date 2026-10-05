import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Magnanimous Reels',
  description: 'Public original short-drama previews and cinematic series from Magnanimous Reels. No sign-in required.',
  alternates: { canonical: '/reels' },
  manifest: '/reels.webmanifest',
  icons: {
    icon: [
      { url: '/reels-icon-192.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/reels-icon-512.svg', type: 'image/svg+xml', sizes: '512x512' },
    ],
    apple: '/reels-icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    title: 'Magnanimous Reels',
    statusBarStyle: 'black-translucent',
  },
};

const installScript = `
(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/reels-sw.js', { scope: '/reels' }).catch(() => {}));
  }
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    const button = document.getElementById('reelsInstall');
    if (button) button.textContent = 'Install';
  });
  window.addEventListener('appinstalled', () => {
    const button = document.getElementById('reelsInstall');
    if (button) { button.textContent = 'Installed'; button.setAttribute('aria-disabled', 'true'); }
  });
  window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('reelsInstall');
    if (!button) return;
    button.addEventListener('click', async event => {
      event.preventDefault();
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        deferredPrompt = null;
        return;
      }
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
      button.textContent = ios ? 'Share → Add to Home Screen' : 'Use browser Install menu';
    });
  });
})();`;

export default function MagnanimousReelsPage() {
  return (
    <>
      <main style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        background: '#05060a',
        display: 'grid',
        gridTemplateRows: '46px 1fr',
        zIndex: 2147483000,
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 10px 0 14px',
          background: '#090c13',
          color: '#fff',
          borderBottom: '1px solid #242b3a',
          fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
        }}>
          <strong style={{ fontSize: 15, whiteSpace: 'nowrap' }}>Magnanimous Reels</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <a
              id="reelsInstall"
              href="/reels"
              title="Install Magnanimous Reels on this device"
              style={{
                color: '#fff',
                border: '1px solid #48556e',
                background: '#151c2a',
                borderRadius: 999,
                padding: '5px 9px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              Install
            </a>
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
          </div>
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
      <script dangerouslySetInnerHTML={{ __html: installScript }} />
    </>
  );
}
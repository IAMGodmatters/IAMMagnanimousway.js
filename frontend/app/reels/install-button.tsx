'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [label, setLabel] = useState('Install');
  const [disabled, setDisabled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent || ''));

    if ('serviceWorker' in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker.register('/reels-sw.js', { scope: '/reels' }).catch(() => {});
      };
      if (document.readyState === 'complete') registerServiceWorker();
      else window.addEventListener('load', registerServiceWorker, { once: true });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setLabel('Install');
    };
    const handleAppInstalled = () => {
      setLabel('Installed');
      setDisabled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setLabel(isIOS ? 'Share → Add to Home Screen' : 'Use browser Install menu');
      return;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setLabel(choice.outcome === 'accepted' ? 'Installing…' : 'Install');
    } catch {
      setLabel('Install unavailable');
    }
  };

  return (
    <button
      id="reelsInstall"
      type="button"
      onClick={handleInstall}
      disabled={disabled}
      title="Install Magnanimous Reels on this device"
      style={{
        color: '#fff',
        border: '1px solid #48556e',
        background: '#151c2a',
        borderRadius: 999,
        padding: '5px 9px',
        fontSize: 11,
        fontWeight: 800,
        cursor: disabled ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

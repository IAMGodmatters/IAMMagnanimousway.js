'use client';

import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { pathname, search, origin } = window.location;

    if (pathname !== '/') {
      setReady(true);
      return;
    }

    const params = new URLSearchParams(search);
    const access = params.get('access');
    if (access === 'user' || access === 'owner') {
      window.history.replaceState(null, '', '/');
      setReady(true);
      return;
    }

    // Allow the immediate navigation that follows a successful login/signup.
    // A fresh visit, bookmark, refresh, or manually typed root URL must go
    // through the login entry screen instead of trusting an old browser token.
    try {
      if (document.referrer) {
        const previous = new URL(document.referrer);
        const cameFromAuth = previous.origin === origin &&
          ['/login', '/signup', '/owner-login'].includes(previous.pathname);
        if (cameFromAuth) {
          setReady(true);
          return;
        }
      }
    } catch (_) {}

    window.location.replace('/login');
  }, []);

  if (!ready) {
    return (
      <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#05070d',color:'#8fdfff',fontFamily:'system-ui,sans-serif'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:36}}>✦</div>
          <div style={{marginTop:10,fontWeight:800,letterSpacing:2}}>I AM MAGNANIMOUS WAY™</div>
          <div style={{marginTop:8,color:'#8d98b0'}}>Opening secure access…</div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

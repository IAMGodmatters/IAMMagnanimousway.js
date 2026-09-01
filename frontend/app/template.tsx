'use client';

import { useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function Template({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function openSecureAccess() {
      const cleanPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';

      if (cleanPath !== '/') {
        if (!cancelled) setReady(true);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const access = params.get('access');
      const userToken = localStorage.getItem('iam_account_token');
      const ownerToken = localStorage.getItem('odin_admin_token');
      const token = access === 'owner' ? ownerToken : access === 'user' ? userToken : null;

      // A fresh typed/bookmarked visit to the root always starts at login.
      // Only a successful login/signup sends the explicit one-time handoff.
      if (!token || (access !== 'user' && access !== 'owner')) {
        window.location.replace('/login');
        return;
      }

      try {
        const response = await fetch(`${api}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        const data = await response.json().catch(() => ({}));
        const role = data?.user?.role;
        const verified = response.ok && (access !== 'owner' || role === 'owner');

        if (!verified) throw new Error('Session verification failed');

        sessionStorage.setItem('iam_session_active', access);
        window.history.replaceState(null, '', '/');
        if (!cancelled) setReady(true);
      } catch {
        if (access === 'owner') localStorage.removeItem('odin_admin_token');
        if (access === 'user') localStorage.removeItem('iam_account_token');
        sessionStorage.removeItem('iam_session_active');
        window.location.replace(access === 'owner' ? '/owner-login' : '/login');
      }
    }

    openSecureAccess();
    return () => { cancelled = true; };
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

'use client';

import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { pathname, search } = window.location;

    if (pathname !== '/') {
      setReady(true);
      return;
    }

    const params = new URLSearchParams(search);
    const access = params.get('access');
    const active = sessionStorage.getItem('iam_session_active');
    const userToken = localStorage.getItem('iam_account_token');
    const ownerToken = localStorage.getItem('odin_admin_token');

    const validUserHandoff = access === 'user' && active === 'user' && !!userToken;
    const validOwnerHandoff = access === 'owner' && active === 'owner' && !!ownerToken;

    if (validUserHandoff || validOwnerHandoff) {
      window.history.replaceState(null, '', '/');
      setReady(true);
      return;
    }

    // A fresh visit, bookmark, refresh, or manually typed root URL always
    // starts at secure login. Successful auth uses the explicit one-time
    // access handoff above, avoiding browser-referrer redirect loops.
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

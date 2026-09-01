'use client';

import { useEffect, useState } from 'react';

type Connected = { external_account_id: string; display_name: string; token_expires_at: number | null };
type Integration = { id: string; name: string; category: string; auth: string; configured: boolean; connected: Connected[] };

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ConnectionsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${api}/api/integrations`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to load connections');
      setItems(d.integrations || []);
    } catch (e: any) {
      setError(e.message || 'Unable to load connections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function connect(item: Integration) {
    window.location.href = `${api}/api/integrations/${item.id}/connect`;
  }

  const categories: Record<string, string> = {
    email: 'Email', social: 'Social', messaging: 'Messaging', commerce: 'Commerce', work: 'Work', calendar: 'Calendar'
  };

  return (
    <main style={{ minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <a href="/" style={{ textDecoration: 'none' }}>← Back to I AM Magnanimous</a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginTop: 28 }}>
          <div>
            <p style={{ letterSpacing: '.12em', fontSize: 12, opacity: .7 }}>I AM MAGNANIMOUS WAY™</p>
            <h1 style={{ margin: '6px 0' }}>Connections</h1>
            <p style={{ maxWidth: 700, opacity: .78 }}>Connect the services your I AM agent is authorized to work with. This is an additive integration hub; the existing AI, CRM, video, and platform architecture remains unchanged.</p>
          </div>
          <button onClick={load} disabled={loading} style={{ padding: '10px 16px', borderRadius: 10, cursor: 'pointer' }}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>

        {error && <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'rgba(220,38,38,.08)' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginTop: 28 }}>
          {items.map(item => {
            const connected = item.connected.length > 0;
            const needsSetup = !item.configured;
            return (
              <article key={item.id} style={{ border: '1px solid rgba(128,128,128,.25)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <small style={{ opacity: .65 }}>{categories[item.category] || 'Integration'}</small>
                    <h2 style={{ fontSize: 20, margin: '5px 0' }}>{item.name}</h2>
                  </div>
                  <span style={{ fontSize: 12, whiteSpace: 'nowrap', opacity: .75 }}>{connected ? '● Connected' : needsSetup ? 'Setup needed' : 'Ready to connect'}</span>
                </div>
                {connected && <div style={{ margin: '14px 0', fontSize: 14 }}>{item.connected.map(c => <div key={c.external_account_id}>✓ {c.display_name || 'Connected account'}</div>)}</div>}
                {item.auth === 'bot-token' ? (
                  <p style={{ fontSize: 13, opacity: .7 }}>Telegram uses a bot token and will be enabled when its server-side secret is configured.</p>
                ) : (
                  <button onClick={() => connect(item)} disabled={needsSetup} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, cursor: needsSetup ? 'not-allowed' : 'pointer' }}>
                    {connected ? 'Connect another account' : needsSetup ? 'Configure provider first' : `Connect ${item.name}`}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <section style={{ marginTop: 30, padding: 20, borderRadius: 16, border: '1px solid rgba(128,128,128,.2)' }}>
          <h2 style={{ marginTop: 0 }}>Agent-ready architecture</h2>
          <p style={{ opacity: .78, lineHeight: 1.6 }}>Connected accounts are stored server-side per tenant. The next agent-action layer can use these authorized connections for permitted tasks such as email, social publishing, messaging, calendar work, customer/commerce operations, and CRM synchronization.</p>
          <p style={{ opacity: .65, fontSize: 13, marginBottom: 0 }}>OAuth credentials and access tokens are never placed in the browser or committed to GitHub.</p>
        </section>
      </div>
    </main>
  );
}

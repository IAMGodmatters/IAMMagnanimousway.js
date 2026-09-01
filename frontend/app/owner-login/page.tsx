'use client';
import { FormEvent, useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function readResponse(r: Response) {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { detail: text.startsWith('<') ? `The server returned an HTML page instead of the owner authentication API. (${r.status})` : text || `Request failed (${r.status})` }; }
}

export default function OwnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const existing = localStorage.getItem('odin_admin_token');
    if (!existing) return;
    fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${existing}` } })
      .then(async r => ({ r, d: await readResponse(r) }))
      .then(({ r, d }) => {
        if (r.ok && d?.user?.role === 'owner') window.location.replace('/');
        else localStorage.removeItem('odin_admin_token');
      })
      .catch(() => localStorage.removeItem('odin_admin_token'));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const r = await fetch(`${api}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await readResponse(r);
      if (!r.ok || !d.token) throw new Error(d.detail || 'Invalid owner email or password.');

      const verify = await fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${d.token}` } });
      const verified = await readResponse(verify);
      if (!verify.ok || verified?.user?.role !== 'owner') throw new Error('Owner session could not be verified. Please try again.');

      localStorage.setItem('odin_admin_token', d.token);
      localStorage.removeItem('iam_account_token');
      setSuccess('Owner verified. Opening your dashboard…');
      window.location.replace('/');
    } catch (err: any) {
      localStorage.removeItem('odin_admin_token');
      setError(err?.message || 'Unable to sign in as owner.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.scan} aria-hidden="true" />
      <div style={styles.glow} aria-hidden="true" />
      <section style={styles.card}>
        <div style={styles.badge}>PRIVATE OWNER ACCESS</div>
        <div style={styles.mark}>✦</div>
        <div style={styles.eyebrow}>I AM MAGNANIMOUS WAY™</div>
        <h1 style={styles.title}>OWNER COMMAND PORTAL</h1>
        <p style={styles.sub}>Secure access to your original owner dashboard, private CRM, platform controls, and revenue tools.</p>
        <div style={styles.notice}>Use the same owner email and password already configured for your profile.</div>
        <form onSubmit={submit} style={styles.form}>
          <input required type="email" autoComplete="username" placeholder="Owner email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
          <input required type="password" autoComplete="current-password" placeholder="Owner password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
          <button disabled={busy} type="submit" style={styles.button}>{busy ? 'VERIFYING OWNER…' : 'ENTER OWNER DASHBOARD'}</button>
          {success && <div role="status" style={styles.success}>{success}</div>}
          {error && <div role="alert" style={styles.error}>{error}</div>}
        </form>
        <div style={styles.divider} />
        <p style={styles.switch}>Customer access: <a href="/login" style={styles.link}>Sign in</a> · <a href="/signup" style={styles.link}>Create account</a></p>
        <a href="/" style={styles.back}>← Return to entry screen</a>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 25%, rgba(123,97,255,.25), transparent 30%), radial-gradient(circle at 70% 70%, rgba(0,217,255,.15), transparent 32%), #03050b', color: '#f7f9ff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  scan: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(110,140,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(110,140,255,.06) 1px, transparent 1px)', backgroundSize: '44px 44px', opacity: .45 },
  glow: { position: 'absolute', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(104,117,255,.18), transparent 68%)', filter: 'blur(10px)', pointerEvents: 'none' },
  card: { width: 'min(100%, 500px)', padding: '42px 34px', border: '1px solid rgba(142,126,255,.48)', borderRadius: 28, background: 'rgba(7,10,20,.92)', boxShadow: '0 30px 110px rgba(0,0,0,.65), 0 0 44px rgba(104,117,255,.20), inset 0 1px 0 rgba(255,255,255,.07)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1, textAlign: 'center' },
  badge: { display: 'inline-block', padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(169,155,255,.45)', color: '#c7bdff', fontSize: 11, letterSpacing: '.18em', fontWeight: 900, boxShadow: '0 0 20px rgba(123,97,255,.18)' },
  mark: { width: 60, height: 60, display: 'grid', placeItems: 'center', borderRadius: 18, background: 'linear-gradient(135deg, #6d57ff, #00d9ff)', color: '#fff', fontSize: 30, margin: '22px auto 16px', boxShadow: '0 0 34px rgba(90,120,255,.48)' },
  eyebrow: { fontSize: 12, letterSpacing: '.22em', fontWeight: 900, color: '#9eeaff' },
  title: { fontSize: 'clamp(30px, 6vw, 44px)', lineHeight: 1.05, margin: '12px 0', textShadow: '0 0 24px rgba(126,110,255,.45)' },
  sub: { color: '#b8c2d8', lineHeight: 1.55, marginBottom: 16 },
  notice: { marginBottom: 22, padding: '11px 13px', borderRadius: 12, background: 'rgba(123,97,255,.09)', border: '1px solid rgba(123,97,255,.22)', color: '#d7d0ff', fontSize: 13 },
  form: { display: 'grid', gap: 13 },
  input: { width: '100%', boxSizing: 'border-box', padding: '15px', borderRadius: 13, border: '1px solid rgba(150,165,230,.28)', background: 'rgba(255,255,255,.045)', color: '#fff', outline: 'none', fontSize: 15 },
  button: { width: '100%', border: '1px solid rgba(181,172,255,.35)', borderRadius: 13, padding: '15px 16px', fontWeight: 900, letterSpacing: '.05em', fontSize: 14, color: '#fff', cursor: 'pointer', background: 'linear-gradient(135deg, #6351ff, #00bfe8)', boxShadow: '0 0 30px rgba(98,83,255,.34)' },
  success: { padding: '11px 13px', borderRadius: 11, background: 'rgba(72,255,176,.08)', border: '1px solid rgba(72,255,176,.24)', color: '#a8ffd1', fontSize: 14 },
  error: { padding: '11px 13px', borderRadius: 11, background: 'rgba(255,75,100,.10)', border: '1px solid rgba(255,100,120,.25)', color: '#ffb9c4', fontSize: 14 },
  divider: { height: 1, background: 'rgba(160,170,220,.14)', margin: '22px 0 14px' },
  switch: { textAlign: 'center', color: '#aeb7cc', fontSize: 14, marginTop: 10 },
  link: { color: '#76dcff', fontWeight: 700, textDecoration: 'none' },
  back: { display: 'block', textAlign: 'center', color: '#8d98b0', textDecoration: 'none', marginTop: 20, fontSize: 14 },
};

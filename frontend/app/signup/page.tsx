'use client';
import { FormEvent, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function readResponse(r: Response) {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { detail: text.startsWith('<') ? `The server returned an HTML page instead of the signup API. (${r.status})` : text || `Request failed (${r.status})` }; }
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    if (password.length < 8) return setError('Use a password with at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match.');
    setBusy(true);
    try {
      const r = await fetch(`${api}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, workspace: workspace || name, email, password }) });
      const d = await readResponse(r);
      if (!r.ok || !d.token) throw new Error(d.detail || 'Unable to create your account.');
      localStorage.setItem('iam_account_token', d.token);
      window.location.href = '/crm';
    } catch (err: any) { setError(err?.message || 'Unable to create your account.'); }
    finally { setBusy(false); }
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} aria-hidden="true" />
      <section style={styles.card}>
        <div style={styles.mark}>✦</div>
        <div style={styles.eyebrow}>I AM MAGNANIMOUS WAY™</div>
        <h1 style={styles.title}>Create your I AM account</h1>
        <p style={styles.sub}>Your own private workspace for the I AM AI platform and CRM.</p>
        <form onSubmit={submit} style={styles.form}>
          <input required autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={styles.input} />
          <input autoComplete="organization" placeholder="Workspace or business name (optional)" value={workspace} onChange={e => setWorkspace(e.target.value)} style={styles.input} />
          <input required type="email" autoComplete="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
          <input required type="password" minLength={8} autoComplete="new-password" placeholder="Password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
          <input required type="password" minLength={8} autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} style={styles.input} />
          <button disabled={busy} type="submit" style={styles.button}>{busy ? 'Creating account…' : 'Create My Account'}</button>
          {error && <div role="alert" style={styles.error}>{error}</div>}
        </form>
        <p style={styles.switch}>Already have an account? <a href="/login" style={styles.link}>Sign in</a></p>
        <p style={styles.switch}>Owner? <a href="/owner-login" style={styles.link}>Owner Login</a></p>
        <a href="/" style={styles.back}>← Back to I AM Platform</a>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 80% 20%, rgba(82,92,255,.18), transparent 35%), radial-gradient(circle at 20% 80%, rgba(0,220,255,.12), transparent 32%), #05070d', color: '#f7f9ff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  glow: { position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(83,220,255,.12), transparent 68%)', filter: 'blur(8px)', pointerEvents: 'none' },
  card: { width: 'min(100%, 480px)', padding: '42px 34px', border: '1px solid rgba(120,150,255,.25)', borderRadius: 28, background: 'rgba(9,13,25,.86)', boxShadow: '0 30px 100px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06)', backdropFilter: 'blur(18px)', position: 'relative', zIndex: 1 },
  mark: { width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 16, background: 'linear-gradient(135deg, #5b6cff, #00d9ff)', color: '#fff', fontSize: 27, marginBottom: 20, boxShadow: '0 10px 35px rgba(0,190,255,.22)' },
  eyebrow: { fontSize: 12, letterSpacing: '.18em', fontWeight: 800, opacity: .72 },
  title: { fontSize: 'clamp(30px, 6vw, 44px)', lineHeight: 1.05, margin: '12px 0 12px' },
  sub: { color: '#aeb7cc', lineHeight: 1.55, marginBottom: 28 },
  form: { display: 'grid', gap: 13 },
  input: { width: '100%', boxSizing: 'border-box', padding: '14px 15px', borderRadius: 13, border: '1px solid rgba(150,165,210,.22)', background: 'rgba(255,255,255,.045)', color: '#fff', outline: 'none', fontSize: 15 },
  button: { width: '100%', border: 0, borderRadius: 13, padding: '14px 16px', fontWeight: 800, fontSize: 15, color: '#fff', cursor: 'pointer', background: 'linear-gradient(135deg, #5366ff, #00bfe8)', boxShadow: '0 12px 28px rgba(0,150,255,.2)' },
  error: { padding: '11px 13px', borderRadius: 11, background: 'rgba(255,75,100,.10)', border: '1px solid rgba(255,100,120,.25)', color: '#ffb9c4', fontSize: 14 },
  switch: { textAlign: 'center', color: '#aeb7cc', fontSize: 14, marginTop: 18 },
  link: { color: '#76dcff', fontWeight: 700, textDecoration: 'none' },
  back: { display: 'block', textAlign: 'center', color: '#8d98b0', textDecoration: 'none', marginTop: 22, fontSize: 14 },
};

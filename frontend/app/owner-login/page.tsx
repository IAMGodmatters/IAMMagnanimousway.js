'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BG = '/owner-command-bg.webp';

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
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    const existing = localStorage.getItem('odin_admin_token');
    if (!existing) return;
    fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${existing}` } })
      .then(async r => ({ r, d: await readResponse(r) }))
      .then(({ r, d }) => { if (r.ok && d?.user?.role === 'owner') window.location.replace('/'); else localStorage.removeItem('odin_admin_token'); })
      .catch(() => localStorage.removeItem('odin_admin_token'));
    return () => stopSound();
  }, []);

  function stopSound() {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} }); nodesRef.current = [];
    if (audioRef.current) { audioRef.current.close().catch(() => {}); audioRef.current = null; }
    setSoundOn(false);
  }
  function toggleSound() {
    if (soundOn) return stopSound();
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx(); audioRef.current = ctx;
      const master = ctx.createGain(); master.gain.value = 0.018; master.connect(ctx.destination);
      const freqs = [55, 82.41, 110];
      nodesRef.current = freqs.map((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = f; g.gain.value = i === 0 ? .65 : .18; o.connect(g); g.connect(master); o.start(); return o; });
      setSoundOn(true);
    } catch { setError('Sound is unavailable in this browser.'); }
  }
  function ping() {
    try {
      const ctx = audioRef.current; if (!ctx || !soundOn) return;
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(440, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + .12); g.gain.setValueAtTime(.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .2);
    } catch {}
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setSuccess(''); setBusy(true); ping();
    try {
      const r = await fetch(`${api}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const d = await readResponse(r);
      if (!r.ok || !d.token) throw new Error(d.detail || 'Invalid owner email or password.');
      const verify = await fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${d.token}` } });
      const verified = await readResponse(verify);
      if (!verify.ok || verified?.user?.role !== 'owner') throw new Error('Owner session could not be verified. Please try again.');
      localStorage.setItem('odin_admin_token', d.token); localStorage.removeItem('iam_account_token');
      setSuccess('OWNER VERIFIED • INITIALIZING COMMAND DASHBOARD…');
      setTimeout(() => window.location.replace('/'), 450);
    } catch (err: any) { localStorage.removeItem('odin_admin_token'); setError(err?.message || 'Unable to sign in as owner.'); }
    finally { setBusy(false); }
  }

  return <main className="portal" style={{backgroundImage:`linear-gradient(rgba(1,4,8,.25),rgba(1,4,8,.58)),url(${BG})`}}>
    <div className="sweep"/><div className="particles"/><div className="hud topLeft"><b>◈ SYSTEM STATUS</b><span>● OPERATIONAL</span></div>
    <button className="sound" onClick={toggleSound}>{soundOn?'🔊 SOUND: ON':'🔇 SOUND: OFF'}</button>
    <div className="hud right"><b>I AM MAGNANIMOUS SYSTEM</b><small>MISSION</small><p>Leadership • Legacy • Impact</p><span>AI SYSTEMS ONLINE</span></div>
    <section className="card">
      <div className="crest">M</div><div className="brand">I AM MAGNANIMOUS WAY™</div><div className="badge">PRIVATE OWNER ACCESS</div>
      <h1>OWNER COMMAND PORTAL</h1><div className="lock">▣ SECURE ENCRYPTED CONNECTION</div>
      <p>Enter your credentials to access your private dashboard, CRM, platform controls, and revenue tools.</p>
      <form onSubmit={submit}>
        <input required type="email" autoComplete="username" placeholder="Owner Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input required type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
        <button className="enter" disabled={busy}>{busy?'VERIFYING OWNER…':'ACCESS OWNER DASHBOARD  ›'}</button>
        {success&&<div className="success">{success}</div>}{error&&<div className="error">{error}</div>}
      </form>
      <div className="features"><span>✦ AI POWERED</span><span>▣ SECURE VAULT</span><span>◉ REAL-TIME DATA</span></div>
      <small className="customer">Customer access: <a href="/login">Sign in</a> · <a href="/signup">Create account</a></small>
    </section>
    <div className="hud bottomLeft"><b>GLOBAL IMPACT</b><span>ACTIVE</span><small>Network synchronized</small></div>
    <div className="hud bottomRight"><b>PLATFORM ACTIVITY</b><strong>24/7</strong><span>NETWORK ACTIVE</span></div>
    <style jsx>{`
      .portal{min-height:100vh;position:relative;overflow:hidden;background-size:cover;background-position:center;color:#fff;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:28px;isolation:isolate}.portal:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,transparent 0 22%,rgba(0,0,0,.25) 58%,rgba(0,0,0,.78));z-index:-1}.sweep{position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent 0 42%,rgba(255,181,42,.08) 48%,transparent 53%);animation:spin 14s linear infinite;pointer-events:none}.particles{position:absolute;inset:0;background-image:radial-gradient(#ffc44d 1px,transparent 1px),radial-gradient(#36d9ff 1px,transparent 1px);background-size:73px 73px,97px 97px;background-position:0 0,30px 20px;opacity:.24;animation:drift 16s linear infinite;pointer-events:none}@keyframes spin{to{transform:rotate(360deg)}}@keyframes drift{to{background-position:73px 146px,127px 214px}}.card{width:min(570px,calc(100vw - 40px));position:relative;z-index:3;text-align:center;padding:32px 36px 26px;border:1px solid rgba(255,184,49,.72);clip-path:polygon(4% 0,96% 0,100% 7%,100% 93%,96% 100%,4% 100%,0 93%,0 7%);background:linear-gradient(180deg,rgba(6,9,13,.9),rgba(4,7,10,.94));box-shadow:0 0 8px #ffb72f,0 0 48px rgba(255,159,20,.22),inset 0 0 55px rgba(255,151,18,.04);backdrop-filter:blur(10px);animation:float 5s ease-in-out infinite}@keyframes float{50%{transform:translateY(-6px)}}.crest{margin:auto;width:66px;height:66px;border:2px solid #f9b83d;border-radius:50%;display:grid;place-items:center;font:700 36px Georgia;color:#ffc84e;box-shadow:0 0 24px rgba(255,180,44,.4),inset 0 0 18px rgba(255,180,44,.15)}.brand{margin:10px 0 18px;color:#ffd26b;letter-spacing:.14em;font-weight:900;font-size:14px;text-shadow:0 0 12px #c87c00}.badge{display:inline-block;color:#ffd15e;letter-spacing:.24em;font-size:11px;font-weight:900}.card h1{font-size:clamp(27px,4vw,39px);margin:8px 0;color:#ffe3a0;text-shadow:0 0 10px #d98700,0 0 28px rgba(255,175,25,.55)}.lock{font-size:10px;letter-spacing:.15em;color:#c8a969;margin:0 0 16px}.card p{color:#d4d5d8;font-size:14px;line-height:1.5;max-width:460px;margin:0 auto 20px}.card form{display:grid;gap:12px}.card input{box-sizing:border-box;width:100%;padding:15px 16px;border-radius:7px;border:1px solid rgba(255,192,72,.3);background:rgba(4,8,11,.8);color:#fff;font-size:15px;outline:none}.card input:focus{border-color:#ffc54f;box-shadow:0 0 0 2px rgba(255,184,45,.12),0 0 22px rgba(255,174,29,.12)}.enter{padding:16px;border:1px solid #ffe39a;border-radius:7px;background:linear-gradient(180deg,#d98a08,#9d5700);color:#fff3cb;font-weight:900;letter-spacing:.04em;font-size:15px;box-shadow:0 0 10px #ffb42a,0 0 28px rgba(255,166,17,.5),inset 0 0 12px rgba(255,255,255,.2);cursor:pointer;animation:pulse 2s ease-in-out infinite}@keyframes pulse{50%{box-shadow:0 0 16px #ffc04b,0 0 42px rgba(255,166,17,.72),inset 0 0 18px rgba(255,255,255,.25)}}.enter:disabled{opacity:.7}.success,.error{padding:10px;border-radius:7px;font-size:12px}.success{color:#9effbd;border:1px solid rgba(80,255,140,.35);background:rgba(20,100,55,.18)}.error{color:#ffc0c8;border:1px solid rgba(255,90,110,.35);background:rgba(120,20,35,.2)}.features{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;border-top:1px solid rgba(255,184,49,.16);margin-top:20px;padding-top:16px;color:#dcb55c;font-size:10px;letter-spacing:.08em}.customer{display:block;color:#89929c;margin-top:16px}.customer a{color:#f3bd4f;text-decoration:none}.hud{position:absolute;z-index:2;padding:13px 16px;border:1px solid rgba(255,181,48,.32);background:rgba(4,8,11,.62);box-shadow:inset 0 0 20px rgba(255,159,16,.04);backdrop-filter:blur(7px);font-size:11px;display:grid;gap:5px;color:#e5c47a}.hud span{color:#6dff87}.hud small{color:#a9b0b8}.hud strong{font-size:28px;color:#ffc34b}.topLeft{top:26px;left:26px}.right{right:28px;top:110px;width:180px}.right p{color:#c8cbd0;margin:3px 0 10px}.bottomLeft{left:28px;bottom:28px}.bottomRight{right:28px;bottom:28px}.sound{position:absolute;right:28px;top:28px;z-index:5;border:1px solid rgba(255,188,59,.55);background:rgba(7,9,10,.72);color:#ffd369;padding:12px 17px;clip-path:polygon(8% 0,92% 0,100% 25%,100% 75%,92% 100%,8% 100%,0 75%,0 25%);cursor:pointer;letter-spacing:.08em;font-weight:800}.sound:hover{box-shadow:0 0 22px rgba(255,181,45,.35)}@media(max-width:900px){.hud{display:none}.sound{top:12px;right:12px;font-size:10px}.card{padding:28px 20px 22px}.portal{padding:18px}.features{gap:12px}}
    `}</style>
  </main>;
}

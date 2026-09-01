'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function readResponse(r: Response) {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { detail: text.startsWith('<') ? `The server returned an HTML page instead of the authentication API. (${r.status})` : text || `Request failed (${r.status})` }; }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  useEffect(() => () => stopSound(), []);

  function stopSound() {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    if (audioRef.current) { audioRef.current.close().catch(() => {}); audioRef.current = null; }
    setSoundOn(false);
  }

  function toggleSound() {
    if (soundOn) return stopSound();
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = 0.014;
      master.connect(ctx.destination);
      nodesRef.current = [55, 82.41, 110].map((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f;
        g.gain.value = i === 0 ? .6 : .16;
        o.connect(g); g.connect(master); o.start();
        return o;
      });
      setSoundOn(true);
    } catch { setError('Sound is unavailable in this browser.'); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r = await fetch(`${api}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const d = await readResponse(r);
      if (!r.ok || !d.token) throw new Error(d.detail || 'Invalid email or password.');
      const verify = await fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${d.token}` }, cache: 'no-store' });
      if (!verify.ok) throw new Error('Your login was accepted, but the session could not be verified. Please try again.');
      localStorage.setItem('iam_account_token', d.token);
      localStorage.removeItem('odin_admin_token');
      sessionStorage.setItem('iam_session_active', 'user');
      window.location.replace('/?access=user');
    } catch (err: any) { setError(err?.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  }

  return <main className="portal">
    <div className="robot"><div className="head"><i/><i/><b>M</b></div><div className="neck"/><div className="body"><strong>AI</strong></div></div>
    <div className="globe">◎<span>GLOBAL INTELLIGENCE</span></div>
    <div className="rings r1"/><div className="rings r2"/><div className="scan"/><div className="particles"/>
    <div className="hud tl"><b>◈ PLATFORM STATUS</b><span>● ONLINE</span><small>Secure tenant access ready</small></div>
    <button className="sound" onClick={toggleSound}>{soundOn ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}</button>
    <div className="hud right"><b>I AM MAGNANIMOUS SYSTEM</b><small>AI BUSINESS PLATFORM</small><p>Business • Social • CRM • Video • Virtual Assistance</p><span>AI SYSTEMS ACTIVE</span></div>

    <section className="card">
      <div className="crest">M</div>
      <div className="brand">I AM MAGNANIMOUS WAY™</div>
      <div className="badge">SECURE MEMBER ACCESS</div>
      <h1>WELCOME TO THE FUTURE OF YOUR WORK</h1>
      <div className="lock">▣ ENCRYPTED WORKSPACE CONNECTION</div>
      <p>Sign in to your private AI workspace for business, social media, virtual assistance, CRM, connected accounts and creator tools.</p>
      <form onSubmit={submit}>
        <input required type="email" autoComplete="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
        <input required type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="enter" disabled={busy} type="submit">{busy ? 'VERIFYING SECURE ACCESS…' : 'ENTER MY WORKSPACE  ›'}</button>
        {error && <div role="alert" className="error">{error}</div>}
      </form>
      <div className="features"><span>✦ AI POWERED</span><span>▣ PRIVATE WORKSPACE</span><span>◉ CONNECTED TOOLS</span></div>
      <div className="entryChoices">
        <a className="create" href="/signup"><b>NEW USER</b><span>Create My Account →</span></a>
        <a className="owner" href="/owner-login"><b>PRIVATE ACCESS</b><span>Owner / Admin →</span></a>
      </div>
    </section>

    <div className="hud bl"><b>PERSONAL AI</b><span>READY</span><small>Your workspace stays separated</small></div>
    <div className="hud br"><b>PLATFORM ACTIVITY</b><strong>24/7</strong><span>NETWORK ACTIVE</span></div>

    <style jsx>{`
      .portal{min-height:100vh;position:relative;overflow:hidden;background:radial-gradient(circle at 22% 45%,#102331 0,#071018 24%,transparent 46%),radial-gradient(circle at 78% 48%,#073452 0,transparent 28%),linear-gradient(135deg,#020405,#071018 55%,#020405);color:#fff;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:28px;isolation:isolate}.portal:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 79px,rgba(255,174,29,.025) 80px),repeating-linear-gradient(0deg,transparent 0 79px,rgba(38,196,255,.025) 80px);z-index:-1}.robot{position:absolute;left:-45px;bottom:-105px;width:430px;height:720px;opacity:.84;filter:drop-shadow(0 0 30px rgba(255,164,20,.22));animation:robotFloat 6s ease-in-out infinite}.head{position:absolute;top:50px;left:85px;width:235px;height:280px;border-radius:48% 48% 42% 42%;background:linear-gradient(110deg,#0a1117,#28323a 40%,#05080a 62%,#171d22);border:2px solid #805415;box-shadow:inset 18px 0 35px #020303,inset -10px 0 25px rgba(255,159,12,.15),0 0 30px rgba(255,153,0,.14);clip-path:polygon(25% 0,75% 0,100% 25%,94% 76%,68% 100%,32% 100%,5% 75%,0 26%)}.head:before{content:'';position:absolute;inset:24px;border:1px solid #a46a15;clip-path:polygon(20% 0,80% 0,100% 28%,90% 70%,65% 100%,35% 100%,10% 70%,0 28%)}.head i{position:absolute;top:110px;width:55px;height:7px;background:#17d6ff;box-shadow:0 0 10px #17d6ff,0 0 25px #008fff}.head i:first-child{left:40px;transform:rotate(8deg)}.head i:nth-child(2){right:40px;transform:rotate(-8deg)}.head b{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);width:46px;height:46px;border:1px solid #d89322;border-radius:50%;display:grid;place-items:center;color:#ffc34b;font:700 25px Georgia;box-shadow:0 0 20px #a46000}.neck{position:absolute;top:310px;left:140px;width:125px;height:80px;background:linear-gradient(90deg,#050708,#293139,#050708);border:1px solid #754d12}.body{position:absolute;top:375px;left:30px;width:360px;height:360px;border-radius:48% 48% 15% 15%;background:linear-gradient(110deg,#05080a,#252e34 42%,#050708 62%,#151b20);border:2px solid #5d4219;box-shadow:inset 30px 0 50px #020303,inset -15px 0 30px rgba(255,157,14,.12);display:grid;place-items:center}.body strong{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;border:1px solid #d89322;color:#ffc34b;box-shadow:0 0 28px rgba(255,169,25,.28);font-size:18px;letter-spacing:.08em}@keyframes robotFloat{50%{transform:translateY(-9px) rotate(.3deg)}}.globe{position:absolute;right:55px;top:28%;width:220px;height:220px;border:1px solid #17bff2;border-radius:50%;display:grid;place-items:center;font-size:170px;line-height:1;color:#24d5ff;text-shadow:0 0 20px #00aaff;box-shadow:0 0 45px rgba(0,180,255,.25),inset 0 0 35px rgba(0,180,255,.16);animation:glow 3s ease-in-out infinite}.globe:before,.globe:after{content:'';position:absolute;border:1px solid rgba(255,180,45,.5);border-radius:50%;inset:45% -45%;transform:rotate(12deg)}.globe:after{transform:rotate(-16deg)}.globe span{position:absolute;bottom:-30px;font-size:10px;letter-spacing:.2em;color:#6ee8ff;white-space:nowrap}@keyframes glow{50%{box-shadow:0 0 65px rgba(0,195,255,.42),inset 0 0 45px rgba(0,180,255,.25)}}.rings{position:absolute;border:1px solid rgba(255,174,35,.16);border-radius:50%;animation:spin 14s linear infinite}.r1{width:680px;height:680px;left:-160px;top:10%}.r2{width:540px;height:540px;right:-120px;top:18%;animation-direction:reverse}@keyframes spin{to{transform:rotate(360deg)}}.scan{position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent 0 42%,rgba(255,181,42,.07) 48%,transparent 53%);animation:spin 14s linear infinite;pointer-events:none}.particles{position:absolute;inset:0;background-image:radial-gradient(#ffc44d 1px,transparent 1px),radial-gradient(#36d9ff 1px,transparent 1px);background-size:73px 73px,97px 97px;opacity:.2;animation:drift 16s linear infinite;pointer-events:none}@keyframes drift{to{background-position:73px 146px,127px 214px}}.card{width:min(590px,calc(100vw - 40px));position:relative;z-index:3;text-align:center;padding:30px 36px 26px;border:1px solid rgba(255,184,49,.72);clip-path:polygon(4% 0,96% 0,100% 7%,100% 93%,96% 100%,4% 100%,0 93%,0 7%);background:linear-gradient(180deg,rgba(6,9,13,.91),rgba(4,7,10,.95));box-shadow:0 0 8px #ffb72f,0 0 48px rgba(255,159,20,.22),inset 0 0 55px rgba(255,151,18,.04);backdrop-filter:blur(10px);animation:float 5s ease-in-out infinite}@keyframes float{50%{transform:translateY(-6px)}}.crest{margin:auto;width:62px;height:62px;border:2px solid #f9b83d;border-radius:50%;display:grid;place-items:center;font:700 34px Georgia;color:#ffc84e;box-shadow:0 0 24px rgba(255,180,44,.4),inset 0 0 18px rgba(255,180,44,.15)}.brand{margin:9px 0 15px;color:#ffd26b;letter-spacing:.14em;font-weight:900;font-size:13px;text-shadow:0 0 12px #c87c00}.badge{display:inline-block;color:#ffd15e;letter-spacing:.24em;font-size:10px;font-weight:900}.card h1{font-size:clamp(26px,4vw,37px);line-height:1.02;margin:8px 0;color:#ffe3a0;text-shadow:0 0 10px #d98700,0 0 28px rgba(255,175,25,.55)}.lock{font-size:9px;letter-spacing:.15em;color:#c8a969;margin-bottom:13px}.card p{color:#d4d5d8;font-size:13px;line-height:1.5;max-width:480px;margin:0 auto 17px}.card form{display:grid;gap:10px}.card input{box-sizing:border-box;width:100%;padding:14px 15px;border-radius:7px;border:1px solid rgba(255,192,72,.3);background:rgba(4,8,11,.8);color:#fff;font-size:15px;outline:none}.card input:focus{border-color:#ffc54f;box-shadow:0 0 0 2px rgba(255,184,45,.12),0 0 22px rgba(255,174,29,.12)}.enter{padding:15px;border:1px solid #ffe39a;border-radius:7px;background:linear-gradient(180deg,#d98a08,#9d5700);color:#fff3cb;font-weight:900;letter-spacing:.04em;font-size:14px;box-shadow:0 0 10px #ffb42a,0 0 28px rgba(255,166,17,.5),inset 0 0 12px rgba(255,255,255,.2);cursor:pointer;animation:pulse 2s ease-in-out infinite}@keyframes pulse{50%{box-shadow:0 0 16px #ffc04b,0 0 42px rgba(255,166,17,.72),inset 0 0 18px rgba(255,255,255,.25)}}.enter:disabled{opacity:.7}.error{padding:10px;border-radius:7px;font-size:12px;color:#ffc0c8;border:1px solid rgba(255,90,110,.35);background:rgba(120,20,35,.2)}.features{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;border-top:1px solid rgba(255,184,49,.16);margin-top:17px;padding-top:13px;color:#dcb55c;font-size:9px;letter-spacing:.06em}.entryChoices{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.entryChoices a{padding:10px 12px;border-radius:8px;text-decoration:none;text-align:left;background:rgba(10,14,18,.82);border:1px solid rgba(255,188,66,.22);transition:.18s}.entryChoices a:hover{border-color:#ffc34b;box-shadow:0 0 18px rgba(255,174,35,.12)}.entryChoices b{display:block;color:#8d98a4;font-size:8px;letter-spacing:.14em}.entryChoices span{display:block;color:#ffd06b;font-weight:900;font-size:11px;margin-top:3px}.owner span{color:#77e4ff}.owner{border-color:rgba(69,203,255,.23)!important}.hud{position:absolute;z-index:2;padding:13px 16px;border:1px solid rgba(255,181,48,.32);background:rgba(4,8,11,.62);backdrop-filter:blur(7px);font-size:11px;display:grid;gap:5px;color:#e5c47a}.hud span{color:#6dff87}.hud small{color:#a9b0b8}.hud strong{font-size:28px;color:#ffc34b}.tl{top:26px;left:26px}.right{right:28px;top:100px;width:205px}.right p{color:#c8cbd0;margin:3px 0 10px}.bl{left:28px;bottom:28px}.br{right:28px;bottom:28px}.sound{position:absolute;right:28px;top:28px;z-index:5;border:1px solid rgba(255,188,59,.55);background:rgba(7,9,10,.72);color:#ffd369;padding:12px 17px;cursor:pointer;font-weight:800;letter-spacing:.08em}@media(max-width:1000px){.hud,.globe{display:none}.robot{opacity:.3;left:-160px}.sound{top:12px;right:12px;font-size:10px}.card{padding:27px 20px 22px}.portal{padding:18px}}@media(max-width:560px){.robot{opacity:.18}.entryChoices{grid-template-columns:1fr}.card h1{font-size:27px}.features{gap:10px}.sound{padding:9px 11px}}
    `}</style>
  </main>;
}

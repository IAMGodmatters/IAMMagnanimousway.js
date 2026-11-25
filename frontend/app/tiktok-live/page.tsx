'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { postMagnanimousChat } from '../../lib/magnanimous-chat-transport';
import { primeNaturalSpeech, speakTextNaturally, stopNaturalSpeech } from '../../lib/natural-speech';
import { configurePersonaVoice } from '../../lib/persona-voice';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';
type Line = { id: number; role: 'viewer' | 'host'; text: string };

async function read(response: Response) {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { detail: raw.startsWith('<') ? 'The Magnanimous service returned a webpage instead of an answer.' : raw || `Request failed (${response.status}).` }; }
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('iam_account_token') || localStorage.getItem('odin_admin_token') || '';
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const WELCOME = 'Welcome, everyone. This is Magnanimous AI, an openly disclosed AI co-host. I am here to share useful information, answer your questions, and keep the conversation respectful. Add your question in the comments and the host operator will bring it into the conversation.';

export default function TikTokLiveHost() {
  const [topic, setTopic] = useState('Faith & Scripture');
  const [viewerComment, setViewerComment] = useState('');
  const [hostReply, setHostReply] = useState('Welcome. This is the Magnanimous AI live-host preview. Your audience will see the stage when you send this browser window to OBS or TikTok LIVE Studio.');
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [status, setStatus] = useState('PREVIEW ONLY');
  const [notice, setNotice] = useState('');
  const [welcomeText, setWelcomeText] = useState(WELCOME);

  const topicInstruction = useMemo(() => {
    if (topic === 'Faith & Scripture') return 'You are speaking in a Christian ministry and Bible-learning context. When relevant, use the King James Version (KJV), distinguish Scripture from your own explanation, and never invent a verse or claim a quotation is Scripture unless accurate.';
    if (topic === 'AI Education') return 'Teach AI clearly for beginners. Explain terms in plain language, give practical examples, and do not pretend uncertain claims are facts.';
    if (topic === 'Magnanimous Platform') return 'Explain I AM MAGNANIMOUS WAY and Magnanimous AI accurately. Do not claim any feature, connection, approval, deployment, or live status that has not been verified.';
    return 'Be a helpful, welcoming general-interest host. Answer the question directly, keep it conversational, and avoid unsupported claims.';
  }, [topic]);

  useEffect(() => () => stopNaturalSpeech(), []);

  function speak(text: string) {
    if (!text.trim()) return;
    primeNaturalSpeech(true);
    setNotice('');
    const queued = speakTextNaturally(text, {
      configure: utterance => configurePersonaVoice(utterance, 'Magnanimous AI'),
      maxChunkChars: 190,
      interChunkDelayMs: 75,
      onStart: () => { setSpeaking(true); setStatus('HOST SPEAKING'); },
      onEnd: () => { setSpeaking(false); setStatus('PREVIEW READY'); },
      onError: () => { setSpeaking(false); setStatus('VOICE NEEDS ATTENTION'); setNotice('The browser could not play the voice. Check the computer volume and browser audio permissions, then tap Speak again.'); },
    });
    if (!queued) {
      setSpeaking(false);
      setNotice('This browser does not provide speech playback. Try the host on a desktop browser with audio enabled.');
    }
  }

  function stop() {
    stopNaturalSpeech();
    setSpeaking(false);
    setStatus('PREVIEW READY');
  }

  function welcome() {
    if (!welcomeText.trim()) return;
    setLines(items => [...items, { id: Date.now(), role: 'host', text: welcomeText.trim() }]);
    setHostReply(welcomeText.trim());
    speak(welcomeText.trim());
  }

  async function answerComment(event?: FormEvent) {
    event?.preventDefault();
    const comment = viewerComment.trim();
    if (!comment || busy) return;
    primeNaturalSpeech(true);
    setBusy(true);
    setNotice('');
    setViewerComment('');
    const commentId = Date.now();
    setLines(items => [...items, { id: commentId, role: 'viewer', text: comment }]);
    setStatus('MAGNANIMOUS IS THINKING');
    const recent = lines.slice(-8).map(line => `${line.role === 'viewer' ? 'Viewer' : 'Magnanimous AI'}: ${line.text}`).join('\n');
    const prompt = [
      'You are Magnanimous AI, the openly disclosed AI co-host for an educational/community livestream.',
      'Do not pretend to be a human. Speak naturally as a live host. Address the viewer respectfully.',
      'Keep the spoken answer concise (usually 1–4 short sentences), clear, warm, and useful.',
      'Do not make unsupported claims, invent facts, invent Bible quotations, reveal private information, or provide professional medical/legal/financial advice.',
      'Do not promote a TikTok Shop product or make a sales pitch. This host is for educational, ministry, and community conversation.',
      topicInstruction,
      recent ? `Recent live context:\n${recent}` : '',
      `Viewer comment: ${comment}`,
      'Write only the words the host should say aloud.'
    ].filter(Boolean).join('\n\n');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await postMagnanimousChat(`${api}/api/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: authHeaders(),
        body: JSON.stringify({ message: prompt, provider: 'auto', use_knowledge: true, use_tools: false, learn_links: false, live_search: false }),
      });
      const data = await read(response);
      if (!response.ok) throw new Error(data.detail || data.error || `Magnanimous AI request failed (${response.status}).`);
      if (data?.degraded === true || data?.code === 'AI_PROVIDER_POOL_DEGRADED') throw new Error('Magnanimous AI is temporarily unable to answer. Your viewer comment has been preserved; please try again.');
      const answer = String(data.output || '').trim();
      if (!answer) throw new Error('Magnanimous AI returned an empty answer.');
      setHostReply(answer);
      setLines(items => [...items, { id: Date.now() + 1, role: 'host', text: answer }]);
      setStatus(autoSpeak ? 'HOST SPEAKING' : 'REPLY READY');
      if (autoSpeak) speak(answer);
      else setStatus('REPLY READY');
    } catch (error: any) {
      setLines(items => items.filter(line => line.id !== commentId));
      setViewerComment(comment);
      setStatus('PREVIEW READY');
      setNotice(error?.name === 'AbortError' ? 'Magnanimous AI took too long. The viewer comment has been restored; tap Answer comment to retry.' : error?.message || 'Magnanimous AI could not answer this comment.');
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  return (
    <main className="livePage">
      <header className="topbar">
        <a href="/social-hub">← Social Hub</a>
        <span>I AM MAGNANIMOUS WAY™</span>
        <a href="/agent-video">Video Agents →</a>
      </header>

      <section className="intro">
        <div>
          <small>MAGNANIMOUS AI • TIKTOK LIVE HOST</small>
          <h1>Your AI host.<br /><em>Your message.</em></h1>
          <p>Run a transparent AI co-host for Bible learning, education, and community Q&amp;A. Magnanimous AI writes the answers; your browser supplies the voice; OBS or TikTok LIVE Studio carries the picture and sound.</p>
        </div>
        <div className="noticeCard">
          <b>Important platform boundary</b>
          <p>This tool creates a live host preview. It does not sign in to TikTok, start a LIVE, or read TikTok comments automatically. You remain in control of the account and bring viewer comments into the host console.</p>
        </div>
      </section>

      <section className="workspace">
        <div className="stageColumn">
          <div className="stageLabel"><span><i className={speaking ? 'pulse on' : 'pulse'} /> {status}</span><b>AI-GENERATED HOST • NOT A HUMAN</b></div>
          <div className={`stage ${speaking ? 'speaking' : ''}`}>
            <div className="stageGlow" />
            <div className="orbit orbitOne" /><div className="orbit orbitTwo" />
            <div className="brand">MAGNANIMOUS AI</div>
            <div className="portrait">
              <img src="/mode-images/virtual-assistant.webp" alt="Illustrative virtual host portrait" onError={event => { event.currentTarget.style.display = "none"; }} />
              <div className="portraitFallback">M</div>
              <div className="voiceHalo" />
            </div>
            <div className="hostName">MAGNANIMOUS</div>
            <div className="hostRole">YOUR AI LIVE CO-HOST</div>
            <div className="equalizer" aria-label={speaking ? 'Voice playing' : 'Voice idle'}>
              {Array.from({ length: 32 }, (_, index) => <i key={index} style={{ height: `${speaking ? 10 + ((index * 19) % 38) : 5 + ((index * 7) % 8)}px`, animationDelay: `${index * 0.013}s` }} />)}
            </div>
            <div className="disclosure">AI-GENERATED HOST • LIVE HUMAN MODERATION</div>
            <div className="spokenReply">{hostReply}</div>
          </div>
          <div className="stageActions">
            <button type="button" className="primary" onClick={welcome}>▶ Speak welcome</button>
            <button type="button" className="secondary" onClick={() => speak(hostReply)}>↻ Speak current reply</button>
            <button type="button" className="stop" onClick={stop}>■ Stop voice</button>
          </div>
          <p className="stageHint">The picture above is the preview stage. It is not a TikTok broadcast until you start an authorized stream in TikTok LIVE Manager / LIVE Studio.</p>
        </div>

        <aside className="console">
          <div className="consoleHead"><div><small>LIVE CONTROL ROOM</small><h2>Talk with your audience</h2></div><span className="safe">HOST OPERATOR</span></div>
          <label className="field">Host topic
            <select value={topic} onChange={event => setTopic(event.target.value)}>
              <option>Faith &amp; Scripture</option>
              <option>AI Education</option>
              <option>Magnanimous Platform</option>
              <option>General Community</option>
            </select>
          </label>
          <label className="field">Welcome message
            <textarea value={welcomeText} onChange={event => setWelcomeText(event.target.value)} rows={4} />
          </label>
          <form onSubmit={answerComment}>
            <label className="field">Viewer comment
              <textarea value={viewerComment} onChange={event => setViewerComment(event.target.value)} rows={4} placeholder="Paste or type a viewer's TikTok comment here…" />
            </label>
            <label className="toggle"><input type="checkbox" checked={autoSpeak} onChange={event => setAutoSpeak(event.target.checked)} /> Automatically speak each AI answer</label>
            <button className="primary answerButton" type="submit" disabled={busy || !viewerComment.trim()}>{busy ? 'Magnanimous is answering…' : '✦ Answer comment with Magnanimous AI'}</button>
          </form>
          {notice && <div className="notice">{notice}</div>}
          <div className="conversationHead"><b>Live conversation preview</b><button type="button" onClick={() => setLines([])}>Clear</button></div>
          <div className="conversation">
            {lines.length === 0 ? <p className="empty">Viewer comments and spoken answers will appear here.</p> : lines.slice(-12).map(line => <article key={line.id} className={line.role}><small>{line.role === 'viewer' ? 'VIEWER COMMENT' : 'MAGNANIMOUS AI'}</small><p>{line.text}</p></article>)}
          </div>
        </aside>
      </section>

      <section className="setup">
        <div><small>SETUP GUIDE</small><h2>Put the host on TikTok LIVE</h2></div>
        <ol>
          <li><b>Use your Windows computer.</b> Open this page in Chrome or Edge and allow browser audio. The voice runs on the computer; this page does not require a paid voice subscription.</li>
          <li><b>Open OBS Studio.</b> Add a Window Capture source for this browser window. Crop the capture to the vertical preview stage (hold Alt while dragging the source edges), then set your OBS canvas/output to portrait 1080 × 1920.</li>
          <li><b>Send OBS to TikTok.</b> Start OBS Virtual Camera. In TikTok LIVE Studio (or the desktop LIVE Manager flow available to your account), choose OBS Virtual Camera as the video source and select the computer/browser audio separately; the virtual camera itself carries video, not audio. Use Practice Mode where available to test both before going public. TikTok controls whether your account is eligible to start LIVE.</li>
          <li><b>Bring comments in safely.</b> Read comments in TikTok yourself, then paste or type a question into this control room. Magnanimous will answer and, when auto-speak is on, speak the response through the browser audio.</li>
          <li><b>Disclose the AI host.</b> Keep the visible AI-generated label. Do not use another person's face or voice without permission.</li>
        </ol>
        <div className="policy"><b>Do not use this AI-voice host to sell products on TikTok Shop LIVE.</b> TikTok Shop Philippines' current livestream guidance says AI-generated audio/narration should not be used in product-selling livestreams. Use this host for educational, ministry, and community sessions, and check the latest rules before changing the content type.</div>
        <div className="footLinks"><a href="/ai-chat">Magnanimous AI Chat</a><a href="/video-agents">Video Agents</a><a href="/social-hub">Connect Social Accounts</a></div>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.livePage{min-height:100vh;background:#050a11;color:#eef8ff;padding:18px 24px 55px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 12% 6%,rgba(40,192,231,.12),transparent 28%),radial-gradient(circle at 92% 20%,rgba(190,150,58,.09),transparent 24%)}
        .topbar{max-width:1440px;margin:auto;display:flex;justify-content:space-between;align-items:center;color:#85a2b4;font-size:10px;letter-spacing:.13em}.topbar a{color:#73dff4;text-decoration:none}
        .intro{max-width:1440px;margin:36px auto 20px;display:grid;grid-template-columns:1.4fr .8fr;gap:22px;align-items:center}.intro small,.setup small,.consoleHead small{color:#71dff0;letter-spacing:.18em;font-size:9px}.intro h1{font-size:clamp(48px,7vw,82px);line-height:.91;letter-spacing:-.055em;margin:10px 0 15px}.intro h1 em{font-style:normal;color:#e7c46a}.intro p{max-width:760px;color:#91a9b7;line-height:1.65;font-size:14px}.noticeCard{background:#101a21;border:1px solid #30485a;border-radius:16px;padding:18px}.noticeCard b{color:#e8cf8b}.noticeCard p{font-size:12px;margin-bottom:0}
        .workspace{max-width:1440px;margin:auto;display:grid;grid-template-columns:minmax(420px,1fr) minmax(340px,460px);gap:16px;align-items:start}.stageColumn,.console{background:#08121a;border:1px solid #203b4b;border-radius:18px;padding:15px}.stageLabel{display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#88a9b8;letter-spacing:.12em;margin:1px 2px 12px}.stageLabel span{display:flex;align-items:center;gap:7px}.stageLabel b{color:#d6ba72}.pulse{width:7px;height:7px;border-radius:50%;background:#647985}.pulse.on{background:#69f1b0;box-shadow:0 0 12px #69f1b0}
        .stage{position:relative;overflow:hidden;width:min(100%,490px);aspect-ratio:9/16;max-height:790px;margin:0 auto;border:1px solid #315268;border-radius:20px;background:radial-gradient(ellipse at 50% 38%,rgba(23,115,150,.38),transparent 40%),linear-gradient(160deg,#0d2333,#080e19 58%,#1d1b18);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;isolation:isolate}.stageGlow{position:absolute;width:85%;aspect-ratio:1;border-radius:50%;background:#b68b3b;opacity:.12;filter:blur(70px);top:23%;z-index:-1}.orbit{position:absolute;left:50%;top:41%;width:84%;aspect-ratio:1;border:1px solid rgba(108,224,245,.17);border-radius:50%;transform:translate(-50%,-50%)}.orbitTwo{width:105%;border-color:rgba(217,182,94,.16);transform:translate(-50%,-50%) rotateX(68deg) rotateZ(-24deg)}.brand{position:absolute;top:7%;font-size:11px;letter-spacing:.28em;color:#e5c36d;font-weight:800}
        .portrait{position:relative;width:64%;aspect-ratio:1;border-radius:50%;overflow:hidden;border:2px solid rgba(229,196,109,.78);box-shadow:0 0 0 10px rgba(229,196,109,.07),0 0 60px rgba(60,196,225,.18);background:linear-gradient(140deg,#173b4c,#111b29);z-index:1}.portrait img{position:relative;z-index:2;width:100%;height:100%;object-fit:cover}.portraitFallback{position:absolute;inset:0;display:grid;place-items:center;font-size:100px;color:#e5c36d;font-family:Georgia,serif}.voiceHalo{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(255,255,255,.3);pointer-events:none;z-index:3}.speaking .voiceHalo{animation:halo .85s infinite alternate}@keyframes halo{to{inset:-8px;box-shadow:0 0 36px rgba(78,221,245,.5)}}
        .hostName{margin-top:28px;font-size:clamp(28px,4vw,43px);font-weight:900;letter-spacing:.12em;text-align:center;text-shadow:0 3px 18px #000}.hostRole{font-size:9px;letter-spacing:.24em;color:#d8bd79;margin-top:8px}.equalizer{height:50px;display:flex;align-items:center;justify-content:center;gap:4px;margin-top:28px}.equalizer i{display:block;width:4px;height:7px;border-radius:4px;background:linear-gradient(0deg,#d6ac57,#78e6f3);opacity:.9;transition:height .15s ease}.speaking .equalizer i{animation:bars .42s ease-in-out infinite alternate}@keyframes bars{to{transform:scaleY(.35)}}.disclosure{position:absolute;bottom:12%;font-size:8px;letter-spacing:.15em;color:#9fc5d1;text-align:center}.spokenReply{position:absolute;bottom:4%;left:8%;right:8%;font-size:9px;line-height:1.4;color:#c7dce3;text-align:center;max-height:8%;overflow:hidden;text-overflow:ellipsis}
        .stageActions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:13px 0 5px}.primary,.secondary,.stop{border:0;border-radius:10px;padding:11px 13px;font-weight:800;font-size:11px;cursor:pointer}.primary{background:linear-gradient(110deg,#dcb75e,#8ee9f1);color:#07131b}.secondary{background:#123140;color:#c9f7ff;border:1px solid #2e6375}.stop{background:#311e25;color:#ffb9c2;border:1px solid #6c3944}.stageHint{color:#7893a2;font-size:10px;text-align:center;line-height:1.5}
        .console{padding:18px}.consoleHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}.consoleHead h2{font-size:22px;margin:6px 0 0}.safe{font-size:8px;color:#85e6b4;border:1px solid #326b54;border-radius:30px;padding:6px 8px}.field{display:block;color:#a7bdc8;font-size:10px;font-weight:700;margin:12px 0}.field select,.field textarea{display:block;width:100%;margin-top:7px;background:#050d13;color:#e9f8ff;border:1px solid #2b4b5b;border-radius:10px;padding:11px;font:inherit;font-size:12px;resize:vertical}.toggle{display:flex;align-items:center;gap:8px;color:#9eb3bd;font-size:10px;margin:10px 0}.toggle input{accent-color:#77dff1}.answerButton{width:100%;margin-top:7px}.primary:disabled{opacity:.45;cursor:not-allowed}.notice{background:#2a1d0e;color:#f1d59a;padding:10px;border:1px solid #6c5228;border-radius:9px;font-size:10px;line-height:1.5;margin-top:12px}.conversationHead{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #203b4b;margin-top:18px;padding-top:13px;color:#d4e7ee;font-size:11px}.conversationHead button{background:transparent;border:0;color:#79d9ea;font-size:9px;cursor:pointer}.conversation{max-height:380px;overflow:auto;margin-top:8px}.conversation article{padding:10px 12px;border-radius:10px;margin:7px 0}.conversation article.viewer{background:#112b39}.conversation article.host{background:#151a22;border:1px solid #3a4a51}.conversation article small{font-size:8px;letter-spacing:.13em;color:#80dfee}.conversation article p,.empty{font-size:11px;line-height:1.5;color:#d8e9ef;white-space:pre-wrap;margin:5px 0 0}.empty{color:#829ba8;padding:12px}
        .setup{max-width:1440px;margin:18px auto 0;background:#08121a;border:1px solid #203b4b;border-radius:18px;padding:21px}.setup h2{margin:5px 0 14px;font-size:24px}.setup ol{padding-left:20px;color:#a4b8c2;font-size:11px;line-height:1.65}.setup li{margin:7px 0;padding-left:4px}.setup li b{color:#e8cd84}.policy{background:#2b1b12;border:1px solid #714d2d;border-radius:10px;padding:13px;color:#f2d39a;font-size:11px;line-height:1.55;margin-top:14px}.footLinks{display:flex;flex-wrap:wrap;gap:16px;border-top:1px solid #203b4b;margin-top:16px;padding-top:14px}.footLinks a{color:#7adff1;text-decoration:none;font-size:10px}
        @media(max-width:960px){.workspace{grid-template-columns:1fr}.stage{max-height:720px}.intro{grid-template-columns:1fr}.console{max-width:none}}@media(max-width:560px){.livePage{padding:14px 12px 40px}.topbar{font-size:8px}.intro{margin-top:25px}.intro h1{font-size:54px}.workspace{grid-template-columns:minmax(0,1fr)}.stageColumn,.console{padding:11px}.stage{width:min(100%,390px)}.stageLabel{font-size:7px}.consoleHead h2{font-size:19px}}
      `}</style>
    </main>
  );
}

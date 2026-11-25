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
        <section className="frontier" aria-labelledby="frontier-title">
          <div className="frontierHead">
            <small>FRONTIER TECHNOLOGY • RESEARCH CHECKED 25 NOVEMBER 2026</small>
            <h2 id="frontier-title">The newest live-host technology you can acquire</h2>
            <p>Magnanimous remains the brain. These are optional voice, avatar, and broadcast tools underneath it. Nothing below is activated, billed, or connected to your accounts automatically.</p>
          </div>
          <div className="techGrid">\n            <article className="techCard recommended">
              <span className="techTag">BEST LOW-COST REAL AVATAR FIT</span>
              <h3>Simli Trinity-2 + Magnanimous</h3>
              <p>Simli turns approved speech audio into a real-time animated avatar stream. Keep Magnanimous as the brain and choose the speech engine separately. Its current pricing page lists 50 free minutes/month; paid plans start at $10/month for 1,000 minutes, with published usage rates from $0.01/min on Hobby and lower at larger tiers.</p>
              <p className="techNote">The browser SDK accepts an audio MediaStreamTrack or audio element and returns avatar video/audio over WebRTC. The provider's README says API keys stay on the server; the browser receives only a short-lived session token. A separate TTS audio stream is still required—browser speech synthesis alone is not a drop-in audio track.</p>
              <div className="techLinks"><a href="https://www.simli.com/" target="_blank" rel="noreferrer">Official product and pricing</a><a href="https://github.com/simliai/simli-client" target="_blank" rel="noreferrer">Official WebRTC SDK</a><a href="https://www.npmjs.com/package/simli-client" target="_blank" rel="noreferrer">SDK and server-token guide</a></div>
              <b className="techStatus">BEST NEXT AVATAR ADAPTER • NOT CONNECTED</b>
            </article>

            <article className="techCard recommended">
              <span className="techTag">RECOMMENDED NOW • NO NEW PROVIDER FEE</span>
              <h3>Magnanimous Native Host</h3>
              <p>Already connected to the Magnanimous chat brain, platform knowledge, browser speech, and your local OBS/TikTok LIVE Studio workflow.</p>
              <ul><li>Best fit for longer sessions on your existing computer.</li><li>Does not add a per-minute voice or avatar bill.</li><li>Viewer comments stay operator-controlled until TikTok grants an official supported route.</li></ul>
              <b className="techStatus">AVAILABLE IN THIS CONTROL ROOM</b>
            </article>
            <article className="techCard">
              <span className="techTag">LATEST INTEGRATED AUDIO + AVATAR STACK</span>
              <h3>Google Gemini 3.8 Live + Live Avatar</h3>
              <p>A newer all-in-one real-time voice/video model with synchronized 24-FPS avatar video, affective dialogue, function calling, and multilingual switching. Google lists it as generally available through Gemini Enterprise. Custom avatars require enterprise allowlisting.</p>
              <p className="techNote">Not the best default for Magnanimous because the Gemini model is also doing the conversation reasoning. Google documents 2-minute audio-video sessions without context compression and about 10-minute WebSocket connections; longer sessions require context compression and session resumption. Confirm region, quotas, and enterprise billing before a trial.</p>
              <div className="techLinks"><a href="https://deepmind.google/models/model-cards/gemini-3-8-audio/" target="_blank" rel="noreferrer">Model capabilities</a><a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Official pricing</a></div>
              <b className="techStatus">AVAILABLE TO TEST • NOT CONNECTED</b>
            </article>
            <article className="techCard">
              <span className="techTag">MOST NATURAL LIVE VOICE</span>
              <h3>OpenAI GPT-Live 1.1</h3>
              <p>Full-duplex voice can listen and speak at the same time, making interruptions and conversational turn-taking more natural. It is a voice engine, not a rendered avatar; it would pair with a separate visual host.</p>
              <p className="techNote">Published active voice rate: $0.05/minute, with $0.02/minute standby on paused WebRTC sessions; backend model/tool use is billed separately. It is a conversational voice engine, not the avatar renderer, and is not enabled by default.</p>
              <div className="techLinks"><a href="https://openai.com/index/introducing-gpt-live-1-in-the-api/" target="_blank" rel="noreferrer">API details</a><a href="https://platform.openai.com/pricing/" target="_blank" rel="noreferrer">Official pricing</a></div>
              <b className="techStatus">OPTIONAL PAID UPGRADE • NOT CONNECTED</b>
            </article>
            <article className="techCard">
              <span className="techTag">READY-MADE TALKING AVATAR</span>
              <h3>HeyGen LiveAvatar</h3>
              <p>Provides real-time facial animation and lip-sync through an API/SDK. The official free plan currently includes 10 credits per month, a watermark, one concurrent session, and a maximum two-minute session. Credits provide 30 seconds in Full mode or one minute in Lite mode.</p>
              <p className="techNote">Current homepage pricing: Starter $19/month (150 credits, up to 5-minute sessions); Essential $99/month (1,000 credits, up to 20-minute sessions); Business $475/month (5,000 credits, up to 60-minute sessions). One credit is 30 seconds in Full mode or one minute in Lite mode. These are short sessions with a credit budget—not an uninterrupted all-day host.</p>
              <div className="techLinks"><a href="https://www.liveavatar.com/" target="_blank" rel="noreferrer">Current official plans and limits</a><a href="https://help.heygen.com/en/articles/12758866-liveavatar-faq" target="_blank" rel="noreferrer">Credit calculation FAQ</a><a href="https://help.heygen.com/en/articles/12758516-introducing-liveavatar" target="_blank" rel="noreferrer">Plan details in Help Center</a></div>
              <b className="techStatus">FREE TEST AVAILABLE • NOT CONNECTED</b>
            </article>
            <article className="techCard">
              <span className="techTag">FREE BROADCAST CONTROL</span>
              <h3>OBS Studio + obs-websocket</h3>
              <p>OBS includes its WebSocket control API in version 28 and newer. It can control scenes and overlays locally, with password protection. This is the practical bridge between a browser avatar and an authorized TikTok stream.</p>
              <div className="techLinks"><a href="https://github.com/obsproject/obs-websocket" target="_blank" rel="noreferrer">Official OBS WebSocket project</a></div>
              <b className="techStatus">OPEN SOURCE • LOCAL CONTROL</b>
            </article>
          </div>
          <div className="techDecision"><b>Best architecture for Magnanimous:</b> Magnanimous owns identity, memory, reasoning, moderation rules, and the final answer. Voice/avatar vendors only render the approved response. Keep native Magnanimous chat as the brain; trial Simli first as a low-cost avatar renderer once an approved TTS audio stream and server secret are ready. Tavus is the richer but materially more expensive alternate. Use Gemini Live only if its separate managed model is acceptable for the brain; keep GPT-Live voice sessions disabled until a usage cap and funding source are configured.</div>
        </section>
        <div className="policy"><b>Important: TikTok Shop LIVE does not allow AI-generated voiceovers</b><p>TikTok Shop Philippines permits AIGC in compliant content generally, but its separate Unoriginal Content creator guidance explicitly says not to use AI-generated audio or narration in livestreams. Its Non-Interactive Content policy also warns against static/looping scenes and streams without sustained, real-time verbal interaction. For any TikTok Shop LIVE, use a real human voice and active live interaction; do not use this synthetic-voice host as the narrator.</p><p>For non-Shop ministry or educational streams, TikTok’s general AI disclosure rules still apply to realistic AI audio/video. Keep the AI identity disclosed, have a real operator present, answer viewers meaningfully, and verify the current in-app rules and account eligibility before broadcasting.</p><div className="techLinks"><a href="https://seller-ph.tiktok.com/university/essay?knowledge_id=7654197957084929" target="_blank" rel="noreferrer">Philippines Unoriginal Content policy</a><a href="https://seller-ph.tiktok.com/university/essay?from=policy&identity=1&knowledge_id=7654203686192897&role=1" target="_blank" rel="noreferrer">Non-Interactive LIVE policy</a><a href="https://seller-ph.tiktok.com/university/essay?default_language=en&identity=1&knowledge_id=7188082378639105" target="_blank" rel="noreferrer">AIGC policy</a></div></div>
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
        .setup{max-width:1440px;margin:18px auto 0;background:#08121a;border:1px solid #203b4b;border-radius:18px;padding:21px}.setup h2{margin:5px 0 14px;font-size:24px}.setup ol{padding-left:20px;color:#a4b8c2;font-size:11px;line-height:1.65}.setup li{margin:7px 0;padding-left:4px}.setup li b{color:#e8cd84}.frontier{margin-top:18px;border:1px solid #254557;border-radius:16px;background:#07131c;padding:18px}.frontierHead h2{font-size:clamp(23px,3vw,32px);margin:6px 0}.frontierHead p{max-width:900px;color:#8ea9b8;font-size:11px;line-height:1.6}.frontierHead small{color:#70dfef;letter-spacing:.16em;font-size:9px}.techGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:13px}.techCard{border:1px solid #244353;border-radius:12px;background:#0a1a24;padding:14px;display:flex;flex-direction:column;min-width:0}.techCard.recommended{border-color:#a58a4b;background:linear-gradient(145deg,#1d1b11,#0a1a24)}.techTag{font-size:8px;letter-spacing:.12em;color:#7bdff0;font-weight:900}.techCard h3{font-size:16px;margin:8px 0}.techCard p,.techCard li{color:#9eb4bf;font-size:10px;line-height:1.6}.techCard ul{padding-left:17px;margin:0 0 9px}.techNote{border-left:2px solid #ac8744;padding-left:9px}.techLinks{display:flex;flex-wrap:wrap;gap:12px;margin:7px 0 10px}.techLinks a{color:#83e1f1;font-size:9px;text-decoration:underline;text-underline-offset:3px}.techStatus{color:#91e6b2;font-size:8px;letter-spacing:.1em;margin-top:auto;padding-top:6px}.techDecision{margin-top:13px;border:1px solid #50603a;border-radius:10px;background:#16190f;color:#c4d1ab;padding:13px;font-size:10px;line-height:1.6}.techDecision b{color:#efce7c}.policy{background:#171b12;border:1px solid #58633a;border-radius:10px;padding:14px;color:#d2ddb9;font-size:11px;line-height:1.6;margin-top:14px}.policy b{color:#f1d184}.policy p{margin:8px 0}.policy .techLinks{margin-bottom:0}.footLinks{display:flex;flex-wrap:wrap;gap:16px;border-top:1px solid #203b4b;margin-top:16px;padding-top:14px}.footLinks a{color:#7adff1;text-decoration:none;font-size:10px}
        @media(max-width:960px){.techGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.workspace{grid-template-columns:1fr}.stage{max-height:720px}.intro{grid-template-columns:1fr}.console{max-width:none}}@media(max-width:560px){.techGrid{grid-template-columns:1fr}.livePage{padding:14px 12px 40px}.topbar{font-size:8px}.intro{margin-top:25px}.intro h1{font-size:54px}.workspace{grid-template-columns:minmax(0,1fr)}.stageColumn,.console{padding:11px}.stage{width:min(100%,390px)}.stageLabel{font-size:7px}.consoleHead h2{font-size:19px}}
      `}</style>
    </main>
  );
}

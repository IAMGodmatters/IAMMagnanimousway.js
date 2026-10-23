"use client";
import { useEffect, useMemo, useState } from "react";
import { speakTextNaturally, stopNaturalSpeech } from "../../lib/natural-speech";
import { availablePersonaVoices, configurePersonaVoice, getPreferredPersonaVoiceId, setPreferredPersonaVoiceId } from "../../lib/persona-voice";
const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
async function read(r: Response) {
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return { detail: t || `Request failed (${r.status})` };
  }
}
const modes: Record<string, { prompt: string; presets: string[] }> = {
  "Daily Assistant": {
    prompt:
      "Act as an executive virtual assistant. Organize the request into priorities, actions, reminders, drafts, and next steps.",
    presets: [
      "Prioritize everything I need to do today",
      "Turn these notes into an action plan",
      "Create a follow-up checklist for this week",
    ],
  },
  "Email & Replies": {
    prompt:
      "Act as a professional correspondence assistant. Draft concise, warm, clear messages and identify any follow-up needed.",
    presets: [
      "Draft a professional reply to this email",
      "Write a polite follow-up message",
      "Turn these notes into a client update",
    ],
  },
  Research: {
    prompt:
      "Act as a practical research assistant. Organize the answer into findings, implications, useful questions, and next actions.",
    presets: [
      "Research this business idea",
      "Compare these two options for me",
      "Turn this topic into a short decision brief",
    ],
  },
  "Customer Follow-up": {
    prompt:
      "Act as a customer success assistant. Create respectful follow-up, next-step messaging, and a clear relationship plan.",
    presets: [
      "Create a lead follow-up sequence",
      "Draft a message for an inactive customer",
      "Prepare a customer check-in plan",
    ],
  },
  "Meeting Prep": {
    prompt:
      "Act as an executive meeting assistant. Prepare objectives, agenda, questions, talking points, decisions needed, and follow-up.",
    presets: [
      "Prepare me for a client meeting",
      "Build a 30-minute meeting agenda",
      "Turn these notes into meeting talking points",
    ],
  },
  "Task Planner": {
    prompt:
      "Act as an operations assistant. Break the request into ordered tasks with priority, dependencies, and a realistic sequence.",
    presets: [
      "Break this project into tasks",
      "Create a launch checklist",
      "Organize this messy to-do list",
    ],
  },
};
const isSimpleSongRequest=(request:string)=>/^(?:(?:hey\s+)?magnanimous[,\s]+)?(?:please\s+)?(?:(?:can|could|would|will)\s+you\s+)?sing\s+(?:(?:me|us)\s+)?(?:(?:an?|some)\s+)?(?:(?:short|little|happy|original)\s+)*song(?:\s+(?:for\s+me|please))?[.!?]*$/i.test(request.trim());
export default function VA() {
  const [task, setTask] = useState(""),
    [type, setType] = useState("Daily Assistant"),
    [output, setOutput] = useState(""),
    [busy, setBusy] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [name, setName] = useState(""),
    [checking, setChecking] = useState(true),
    [ready, setReady] = useState(false),
    [provider, setProvider] = useState(""),
    [webSearchReady, setWebSearchReady] = useState(false),
    [sources, setSources] = useState<any[]>([]),
    [notice, setNotice] = useState("");
  const [voiceChoices,setVoiceChoices]=useState<Array<{id:string;label:string}>>([]);
  const [voiceChoice,setVoiceChoice]=useState("");
  const current = useMemo(() => modes[type], [type]);
  useEffect(() => {
    const token =
      localStorage.getItem("odin_admin_token") ||
      localStorage.getItem("iam_account_token") ||
      "";
    const h = token
      ? { Authorization: `Bearer ${token}` }
      : { Authorization: "" };
    Promise.all([
      fetch(`${api}/api/providers`).then(read),
      fetch(`${api}/api/magnanimous/health`).then(read),
      token
        ? fetch(`${api}/api/auth/me`, { headers: h }).then(read)
        : Promise.resolve({}),
    ])
      .then(([p, health, me]) => {
        const available = (p.providers || []).filter(
          (x: any) => x.configured && x.enabled !== false,
        );
        setReady(available.length > 0);
        setProvider(available.length ? "Magnanimous AI private routing" : "Magnanimous AI setup needed");
        setWebSearchReady(Boolean(health.web_search_configured));
        setName(me.user?.name || "");
      })
      .catch(() => {
        setReady(false);
        setProvider("Service check failed");
      })
      .finally(() => setChecking(false));
  }, []);
  useEffect(()=>{
    if(typeof window==='undefined'||!('speechSynthesis' in window))return;
    const updateVoices=()=>setVoiceChoices(availablePersonaVoices());
    setVoiceChoice(getPreferredPersonaVoiceId());
    updateVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged',updateVoices);
    return()=>window.speechSynthesis.removeEventListener?.('voiceschanged',updateVoices);
  },[]);
  async function run() {
    const request = task.trim();
    if (!request || busy || (!ready && !isSimpleSongRequest(request))) return;
    setBusy(true);
    setOutput("");
    setSources([]);
    setNotice("");
    try {
      const token =
        localStorage.getItem("odin_admin_token") ||
        localStorage.getItem("iam_account_token") ||
        "";
      const h: Record<string, string> = { "Content-Type": "application/json" };
      if (token) h.Authorization = `Bearer ${token}`;
      const research = type === "Research" && webSearchReady;
      const isSimpleSong=isSimpleSongRequest(request);
      const r = await fetch(`${api}/api/chat`, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            message: isSimpleSong ? request : `${current.prompt}\n\nMode: ${type}\nRequest: ${request}\n\nUse saved workspace knowledge when it is available. Point out missing information, suggest the best next move, and provide ready-to-use copy where appropriate.`,
            use_knowledge: true,
            live_search: research,
            news: research,
            freshness: research ? "pw" : "",
          }),
        }),
        d = await read(r);
      if (!r.ok) throw new Error(d.detail || "Assistant request failed.");
      if (d.degraded || d.code === "AI_PROVIDER_POOL_DEGRADED") {
        const partialSources=Array.isArray(d.sources)?d.sources:[];
        if(partialSources.length && String(d.output||"").trim()) {
          setOutput(d.output);
          setSources(partialSources);
          setProvider("AI response engines temporarily unavailable");
          setNotice("Partial research is available above. Your request is still here; tap CREATE RESULT to retry the AI response.");
          return;
        }
        throw new Error("The AI response engines are temporarily unavailable. Your request is saved below; tap CREATE RESULT to retry.");
      }
      if (!String(d.output || "").trim())
        throw new Error("Magnanimous AI returned an empty response.");
      setOutput(d.output);
      setTask("");
      setSources(d.sources || []);
      if (d.native_song) setNotice("Original song lyrics are ready. READ RESULT speaks them; free browser speech is not a genuine singing voice.");
      setProvider("Magnanimous AI private routing");
      if (type === "Research" && d.web_search_configured === false)
        setNotice(
          "This result was created without live web search because Magnanimous live research is not ready.",
        );
    } catch (e: any) {
      setTask(request);
      setNotice(e?.message || "Unable to reach Magnanimous AI.");
    } finally {
      setBusy(false);
    }
  }
  function speak() {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !output
    )
      return;
    if (speaking) {
      stopNaturalSpeech();
      setSpeaking(false);
      return;
    }
    speakTextNaturally(output, {
      maxChunkChars: 220,
      interChunkDelayMs: 60,
      configure: (u) => { configurePersonaVoice(u, "Virtual Assistant"); },
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }
  return (
    <main className="va">
      <header>
        <a href="/">← Dashboard</a>
        <div>
          AI WORK ASSISTANT •{" "}
          {checking
            ? "CHECKING"
            : busy
              ? "WORKING"
              : ready
                ? "READY"
                : "SETUP NEEDED"}
        </div>
      </header>
      <section className="hero virtualRoyalHero">
        <div className="copy">
          <small>I AM VIRTUAL ASSISTANT</small>
          <h1>
            {name
              ? `${name}, meet your digital right hand.`
              : "Your digital right hand."}
          </h1>
          <p>
            Create plans, research briefs, message drafts, meeting notes,
            customer follow-ups and organized task lists. This page prepares
            work for you; it does not send messages or complete outside actions
            automatically.
          </p>
          <div className="quick">
            <a href="/knowledge">Knowledge Center</a>
            <a href="/connections">Check connections</a>
            <a href="/crm">Customer CRM</a>
            <a href="/business">Business Command</a>
          </div>
        </div>
        <div className="stage">
          <div className="rings r1" />
          <div className="rings r2" />
          <div className="avatar">
            <div className="crown" />
            <div className="head">
              <i />
              <i />
              <b />
            </div>
            <div className="neck" />
            <div className="body">
              <strong>M</strong>
            </div>
            <div className="hand h1" />
            <div className="hand h2" />
          </div>
          <div className="letters">
            M&nbsp;&nbsp;A&nbsp;&nbsp;G&nbsp;&nbsp;N&nbsp;&nbsp;A&nbsp;&nbsp;N&nbsp;&nbsp;I&nbsp;&nbsp;M&nbsp;&nbsp;O&nbsp;&nbsp;U&nbsp;&nbsp;S
          </div>
          <span className="online">
            {ready ? "MAGNANIMOUS AI READY" : "MAGNANIMOUS AI SETUP NEEDED"}
          </span>
        </div>
      </section>
      <section className="desk">
        <aside className="modes">
          <small>ASSISTANT MODES</small>
          {Object.keys(modes).map((x) => (
            <button
              key={x}
              className={x === type ? "active" : ""}
              onClick={() => {
                setType(x);
                setTask("");
                setOutput("");
                setSources([]);
                setNotice("");
              }}
            >
              {x}
            </button>
          ))}
          <div className="status">
            <b>MAGNANIMOUS AI</b>
            <span>{provider || "Checking connection"}</span>
            <b>WORKSPACE KNOWLEDGE</b>
            <span>Used when signed in and sources are saved</span>
            <b>LIVE SEARCH</b>
            <span>{webSearchReady ? "Connected" : "Not connected"}</span>
          </div>
        </aside>
        <section className="work">
          <div className="workhead">
            <div>
              <small>CURRENT ASSIGNMENT</small>
              <h2>{type}</h2>
            </div>
            <span>
              {checking ? "CHECKING" : ready ? "READY" : "SETUP NEEDED"}
            </span>
          </div>
          <div className="presets">
            {current.presets.map((p) => (
              <button key={p} onClick={() => setTask(p)}>
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Tell your virtual assistant what you want prepared…"
            disabled={busy || checking}
          />
          <div className="actions">
            <button
              className="assign"
              onClick={run}
              disabled={busy || checking || (!ready && !isSimpleSongRequest(task)) || !task.trim()}
            >
              {busy ? "CREATING…" : "CREATE RESULT →"}
            </button>
            {output && (
              <button className="speak" onClick={speak}>
                {speaking ? "STOP VOICE" : "🔊 READ RESULT"}
              </button>
            )}
            {voiceChoices.length>0&&<label className="voice-choice">Voice
              <select aria-label="Choose spoken voice" value={voiceChoice} onChange={e=>{setVoiceChoice(e.target.value);setPreferredPersonaVoiceId(e.target.value);}}>
                <option value="">Best available</option>
                {voiceChoices.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </label>}
          </div>
          {!ready && !checking && (
            <div className="notice">
              AI-powered assignments need a configured response engine. The built-in original-song request works without one.
            </div>
          )}
          {notice && <div className="notice">{notice}</div>}
          {output && <div className="result">{output}</div>}
          {sources.length > 0 && (
            <div className="sources">
              <b>SOURCES USED</b>
              {sources.slice(0, 10).map((s: any, i: number) => (
                <div key={`${s.url || s.title}-${i}`}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title || s.url}
                    </a>
                  ) : (
                    <span>{s.title || "Saved workspace knowledge"}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="suggest">
          <small>HOW IT WORKS</small>
          <h3>For each request</h3>
          <ol>
            <li>
              <b>1</b>
              <span>Use saved knowledge when available</span>
            </li>
            <li>
              <b>2</b>
              <span>Organize the requested outcome</span>
            </li>
            <li>
              <b>3</b>
              <span>Create drafts and suggested actions</span>
            </li>
            <li>
              <b>4</b>
              <span>Recommend a next step</span>
            </li>
          </ol>
          <a href="/knowledge">Add knowledge →</a>
          <a href="/social-media">Content support →</a>
          <a href="/business">Business support →</a>
        </aside>
      </section>
      <section className="capabilities">
        <article>
          <b>COMMUNICATE</b>
          <span>Email drafts • replies • customer follow-up</span>
        </article>
        <article>
          <b>ORGANIZE</b>
          <span>Tasks • meetings • priorities • checklists</span>
        </article>
        <article>
          <b>RESEARCH</b>
          <span>
            {webSearchReady
              ? "Saved knowledge • live web • news"
              : "Saved knowledge • business briefs"}
          </span>
        </article>
        <article>
          <b>CREATE</b>
          <span>Plans • messages • scripts • next actions</span>
        </article>
      </section>
      <style jsx>{`
        .va {
          min-height: 100vh;
          background: #040810;
          color: #eaf7ff;
          padding: 24px 34px 70px;
          font-family: Inter, system-ui, sans-serif;
          background-image:
            radial-gradient(
              circle at 75% 18%,
              rgba(28, 180, 255, 0.13),
              transparent 30%
            ),
            radial-gradient(
              circle at 40% 90%,
              rgba(255, 175, 45, 0.07),
              transparent 25%
            );
        }
        header {
          max-width: 1400px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          color: #61788a;
          font-size: 9px;
          letter-spacing: 0.18em;
        }
        header a {
          color: #9ae8ff;
          text-decoration: none;
        }
        .hero {
          max-width: 1400px;
          margin: 25px auto 13px;
          border: 1px solid #18364b;
          border-radius: 24px;
          background: linear-gradient(120deg, #07111c, #05080e 65%, #0b1118);
          min-height: 360px;
          display: grid;
          grid-template-columns: 1.25fr 0.9fr;
          overflow: hidden;
        }
        .copy {
          padding: 38px;
          align-self: center;
        }
        .copy small,
        .desk small {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #65ddff;
          font-weight: 900;
        }
        .copy h1 {
          font-size: clamp(39px, 6vw, 70px);
          line-height: 0.98;
          margin: 10px 0;
        }
        .copy p {
          max-width: 720px;
          color: #91a8b9;
          line-height: 1.6;
        }
        .quick {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 17px;
        }
        .quick a {
          padding: 8px 11px;
          border: 1px solid #21475e;
          border-radius: 999px;
          color: #b9ecff;
          text-decoration: none;
          font-size: 9px;
        }
        .stage {
          position: relative;
          min-height: 360px;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(54, 206, 255, 0.12),
            transparent 42%
          );
          overflow: hidden;
        }
        .rings {
          position: absolute;
          left: 50%;
          top: 48%;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(62, 210, 255, 0.25);
          border-radius: 50%;
        }
        .r1 {
          width: 310px;
          height: 310px;
        }
        .r2 {
          width: 240px;
          height: 240px;
          border-color: rgba(255, 184, 59, 0.2);
          border-style: dashed;
          animation: spin 18s linear infinite;
        }
        @keyframes spin {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        .avatar {
          position: absolute;
          left: 50%;
          top: 47%;
          transform: translate(-50%, -50%);
          width: 220px;
          height: 280px;
        }
        .head {
          position: absolute;
          left: 66px;
          top: 24px;
          width: 90px;
          height: 108px;
          clip-path: polygon(
            24% 0,
            76% 0,
            100% 24%,
            90% 80%,
            64% 100%,
            36% 100%,
            10% 80%,
            0 24%
          );
          background: linear-gradient(120deg, #4a5964, #0c1116 58%, #35424b);
          border: 1px solid #53dfff;
          box-shadow: 0 0 25px rgba(54, 211, 255, 0.16);
        }
        .head:before {
          content: "";
          position: absolute;
          inset: 12px;
          border: 1px solid rgba(255, 188, 67, 0.35);
          clip-path: inherit;
        }
        .head i {
          position: absolute;
          top: 45px;
          width: 22px;
          height: 4px;
          background: #62e6ff;
          box-shadow: 0 0 10px #39ccff;
        }
        .head i:first-child {
          left: 15px;
        }
        .head i:nth-child(2) {
          right: 15px;
        }
        .head b {
          position: absolute;
          bottom: 20px;
          left: 35px;
          width: 20px;
          border-top: 2px solid #ffc458;
        }
        .crown {
          position: absolute;
          left: 80px;
          top: 0;
          width: 62px;
          height: 26px;
          border: 1px solid #8c6728;
          border-bottom: 0;
          clip-path: polygon(
            0 100%,
            10% 25%,
            30% 65%,
            50% 0,
            70% 65%,
            90% 25%,
            100% 100%
          );
          background: rgba(255, 181, 52, 0.07);
        }
        .neck {
          position: absolute;
          left: 91px;
          top: 126px;
          width: 40px;
          height: 30px;
          background: #18222b;
        }
        .body {
          position: absolute;
          left: 37px;
          top: 150px;
          width: 148px;
          height: 115px;
          border-radius: 48% 48% 18% 18%;
          background: linear-gradient(
            110deg,
            #0b1116,
            #394650 43%,
            #080c10 65%,
            #202a31
          );
          border: 1px solid #6d522b;
          display: grid;
          place-items: center;
        }
        .body strong {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid #d59b35;
          color: #ffc85f;
          font: 900 20px Georgia;
          box-shadow: 0 0 18px rgba(255, 184, 50, 0.16);
        }
        .hand {
          position: absolute;
          top: 188px;
          width: 65px;
          height: 22px;
          border: 5px solid #303d46;
          border-radius: 20px;
        }
        .h1 {
          left: 0;
          transform: rotate(-25deg);
        }
        .h2 {
          right: 0;
          transform: rotate(25deg);
        }
        .letters {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 34px;
          text-align: center;
          color: #4dcff3;
          font: 700 9px monospace;
          letter-spacing: 0.12em;
        }
        .online {
          position: absolute;
          right: 13px;
          bottom: 11px;
          color: #e4b75f;
          font-size: 9px;
          letter-spacing: 0.12em;
        }
        .desk {
          max-width: 1400px;
          margin: auto;
          display: grid;
          grid-template-columns: 225px 1fr 225px;
          gap: 10px;
        }
        .desk > aside,
        .work {
          border: 1px solid #173246;
          border-radius: 17px;
          background: #071019;
          padding: 18px;
        }
        .modes button {
          display: block;
          width: 100%;
          border: 0;
          background: transparent;
          color: #708b9e;
          text-align: left;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .modes button.active {
          background: #10283a;
          color: #c9efff;
          font-weight: 900;
        }
        .status {
          border-top: 1px solid #183245;
          margin-top: 13px;
          padding-top: 12px;
        }
        .status b,
        .status span {
          display: block;
          font-size: 9px;
        }
        .status b {
          color: #cc9c47;
          margin-top: 9px;
        }
        .status span {
          color: #657c8d;
        }
        .workhead {
          display: flex;
          justify-content: space-between;
        }
        .work h2 {
          font-size: 28px;
          margin: 5px 0 14px;
        }
        .workhead span {
          font-size: 9px;
          color: #71e2a1;
        }
        .presets {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .presets button {
          border: 1px solid #1b4054;
          background: #091620;
          color: #8ecbe0;
          padding: 8px 9px;
          border-radius: 999px;
          font-size: 9px;
          cursor: pointer;
        }
        .work textarea {
          width: 100%;
          min-height: 190px;
          box-sizing: border-box;
          border: 1px solid #1b4055;
          border-radius: 12px;
          background: #03080c;
          color: #eaf7ff;
          padding: 15px;
          font: inherit;
        }
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .actions button {
          padding: 12px 14px;
          border-radius: 9px;
          font-weight: 900;
          cursor: pointer;
        }
        .actions button:disabled,
        .work textarea:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .voice-choice{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#bbeef9}
        .voice-choice select{max-width:185px;min-width:110px;border:1px solid rgba(105,215,249,.36);border-radius:9px;padding:9px;background:#091b28;color:#eaf7ff;font:inherit}
        .assign {
          border: 0;
          background: linear-gradient(90deg, #1c8fbd, #b97d24);
          color: #fff;
        }
        .speak {
          border: 1px solid #315063;
          background: #0b1620;
          color: #9fdff3;
        }
        .result {
          white-space: pre-wrap;
          margin-top: 13px;
          padding: 16px;
          border: 1px solid #17394c;
          border-radius: 12px;
          background: #06131c;
          color: #d8edf7;
          line-height: 1.62;
        }
        .notice {
          margin-top: 12px;
          padding: 11px 13px;
          border: 1px solid #6b4a2b;
          border-radius: 9px;
          background: #1b1109;
          color: #f2c98c;
          font-size: 12px;
        }
        .sources {
          margin-top: 12px;
          padding: 13px;
          border: 1px solid #17394c;
          border-radius: 10px;
        }
        .sources > b {
          display: block;
          color: #70dfff;
          font-size: 10px;
          letter-spacing: 0.14em;
          margin-bottom: 7px;
        }
        .sources div {
          padding: 5px 0;
          font-size: 12px;
        }
        .sources a,
        .sources span {
          color: #afdced;
          text-decoration: none;
        }
        .suggest h3 {
          font-size: 20px;
        }
        .suggest ol {
          list-style: none;
          padding: 0;
          margin: 12px 0;
        }
        .suggest li {
          display: flex;
          gap: 8px;
          align-items: center;
          border-bottom: 1px solid #142a3a;
          padding: 10px 0;
          color: #879eae;
          font-size: 10px;
        }
        .suggest li b {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #0d2230;
          color: #63d7f8;
        }
        .suggest a {
          display: block;
          padding: 8px 0;
          color: #d6a959;
          text-decoration: none;
          font-size: 10px;
        }
        .capabilities {
          max-width: 1400px;
          margin: 10px auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .capabilities article {
          padding: 16px;
          border: 1px solid #162f41;
          border-radius: 13px;
          background: #071018;
        }
        .capabilities b {
          display: block;
          color: #6ddcff;
          font-size: 9px;
          letter-spacing: 0.12em;
        }
        .capabilities span {
          display: block;
          color: #667e8f;
          font-size: 10px;
          margin-top: 5px;
        }
        @media (max-width: 900px) {
          .va {
            padding: 18px 14px;
          }
          .hero,
          .desk {
            grid-template-columns: 1fr;
          }
          .stage {
            min-height: 300px;
          }
          .suggest {
            display: none;
          }
          .capabilities {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .stage {
            display: none;
          }
          .capabilities {
            grid-template-columns: 1fr;
          }
          .copy {
            padding: 27px;
          }
          .actions {
            flex-direction: column;
          }
        }

        /* Two separately composed Magnanimous palace images; the existing animated avatar remains. */
        .va{background:radial-gradient(circle at 84% 0%,rgba(34,121,241,.16),transparent 32%),linear-gradient(165deg,#041830,#020817 82%)}
        .hero.virtualRoyalHero{position:relative;isolation:isolate;overflow:hidden;min-height:clamp(490px,42vw,640px);
          border:2px solid #f0c775;border-radius:26px;background:#06132f;
          box-shadow:0 31px 70px rgba(0,0,0,.55),0 0 0 1px rgba(60,191,255,.31),inset 0 1px rgba(255,232,180,.22)}
        .virtualRoyalHero:before{content:'';position:absolute;inset:0;background:url('/magnanimous-virtual-palace-v1.svg') center/cover no-repeat;z-index:0;pointer-events:none;transform:scale(1.015);animation:virtualRoyalDrift 18s ease-in-out infinite alternate}
        .virtualRoyalHero:after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;
          background:linear-gradient(90deg,rgba(2,9,28,.97),rgba(2,10,29,.84) 39%,rgba(2,10,29,.16) 79%)}
        .virtualRoyalHero .copy,.virtualRoyalHero .stage{position:relative;z-index:2}
        .virtualRoyalHero .copy{padding:clamp(26px,4.4vw,60px)}
        .virtualRoyalHero .copy small{color:#92eaff}
        .virtualRoyalHero .copy h1{font-size:clamp(34px,4.2vw,66px);line-height:1.06;color:#ffe6a8;text-shadow:0 2px 0 #8b541d,0 4px 0 #30200c,0 11px 26px rgba(0,0,0,.72)}
        .virtualRoyalHero .copy p{color:#ecf9ff;font-weight:610;text-shadow:0 3px 14px #000;line-height:1.55}
        .virtualRoyalHero .quick a{border-color:rgba(241,202,119,.69);background:linear-gradient(125deg,rgba(10,53,102,.93),rgba(6,21,48,.95));
          color:#fff3ce;box-shadow:0 7px 19px rgba(0,0,0,.3)}
        .desk,.capabilities article{border-color:rgba(229,183,99,.45);background:linear-gradient(135deg,rgba(11,41,82,.91),rgba(4,15,36,.97));box-shadow:0 9px 26px rgba(0,0,0,.3)}
        @keyframes virtualRoyalDrift{to{transform:scale(1.06);filter:brightness(1.06)}}
        @media(max-width:760px) and (orientation:portrait){
          .hero.virtualRoyalHero{min-height:620px;aspect-ratio:2/3;max-height:810px;display:flex;flex-direction:column;justify-content:flex-start;border-radius:20px}
          .virtualRoyalHero:before{background-image:url('/magnanimous-virtual-palace-mobile-v1.svg');background-position:center}
          .virtualRoyalHero:after{background:linear-gradient(180deg,rgba(2,9,29,.98),rgba(3,11,33,.85) 38%,rgba(3,11,33,.06) 78%)}
          .virtualRoyalHero .copy{padding:22px 16px;max-width:100%}
          .virtualRoyalHero .copy h1{font-size:clamp(30px,8vw,46px);margin:10px 0}
          .virtualRoyalHero .copy p{font-size:clamp(12px,3.35vw,16px);line-height:1.41}
          .virtualRoyalHero .quick{gap:6px;margin-top:12px}
          .virtualRoyalHero .quick a{padding:7px 10px;font-size:10px}
          .virtualRoyalHero .stage{display:none}
        }
        @media(orientation:landscape) and (max-height:560px) and (max-width:1100px){
          .hero.virtualRoyalHero{min-height:350px;grid-template-columns:1.3fr .7fr}
          .virtualRoyalHero .copy{padding:20px}
          .virtualRoyalHero .copy h1{font-size:clamp(28px,4.6vw,43px);margin:7px 0}
          .virtualRoyalHero .copy p{font-size:12px;line-height:1.4}
          .virtualRoyalHero .quick{margin-top:8px}
          .virtualRoyalHero .quick a{padding:6px 9px}
          .virtualRoyalHero .stage{display:block;min-height:300px}
        }
        /* Tablet-size portrait devices keep their native animated avatar and readiness banner. */
        @media(min-width:561px) and (max-width:760px) and (orientation:portrait){
          .hero.virtualRoyalHero{aspect-ratio:auto;max-height:none;min-height:790px}
          .virtualRoyalHero .stage{display:block;min-height:300px;width:100%;margin-top:8px}
        }
        /* Narrow landscape phones get a stacked composition, avoiding a cropped avatar. */
        @media(orientation:landscape) and (max-height:560px) and (max-width:700px){
          .hero.virtualRoyalHero{grid-template-columns:1fr;min-height:660px;overflow:hidden}
          .virtualRoyalHero .stage{min-height:295px;width:100%}
          .virtualRoyalHero .copy{padding:17px 22px}
        }
        @media(prefers-reduced-motion:reduce){
          .virtualRoyalHero:before{animation:none;transform:none}
          .virtualRoyalHero .r2{animation:none!important}
        }
      `}</style>
    </main>
  );
}

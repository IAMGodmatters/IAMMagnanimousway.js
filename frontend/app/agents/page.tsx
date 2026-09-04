"use client";
import { useEffect, useMemo, useRef, useState } from "react";
const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
type Agent = {
  id: string;
  name: string;
  title: string;
  description: string;
  group: string;
};
type Group = { id: string; name: string; description: string };
type Provider = {
  id: string;
  name: string;
  tier: string;
  configured: boolean;
  openai: boolean;
};
type Msg = {
  id?: number;
  role: string;
  content: string;
  provider?: string;
  model?: string;
};
async function read(r: Response) {
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return { detail: t || `Request failed (${r.status})` };
  }
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]),
    [groups, setGroups] = useState<Group[]>([]),
    [providers, setProviders] = useState<Provider[]>([]),
    [selected, setSelected] = useState("vinnie"),
    [group, setGroup] = useState("all"),
    [search, setSearch] = useState(""),
    [messages, setMessages] = useState<Msg[]>([]),
    [input, setInput] = useState(""),
    [provider, setProvider] = useState("auto"),
    [busy, setBusy] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [listening, setListening] = useState(false),
    [autoSpeak, setAutoSpeak] = useState(true),
    [humanVideo, setHumanVideo] = useState(false),
    [loaded, setLoaded] = useState(false),
    [loadError, setLoadError] = useState(false),
    [voiceReady, setVoiceReady] = useState(false),
    [micReady, setMicReady] = useState(false),
    [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("iam_account_token") ||
        localStorage.getItem("odin_admin_token") ||
        ""
      : "";
  const agent = useMemo(
    () => agents.find((a) => a.id === selected) || agents[0],
    [agents, selected],
  );
  const visible = useMemo(
    () =>
      agents.filter(
        (a) =>
          (group === "all" || a.group === group) &&
          `${a.name} ${a.title} ${a.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [agents, group, search],
  );
  useEffect(() => {
    const browser: any = window;
    setVoiceReady("speechSynthesis" in browser);
    setMicReady(
      Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition),
    );
    fetch(`${api}/api/agents`, { cache: "no-store" })
      .then(async (response) => {
        const data = await read(response);
        if (!response.ok)
          throw new Error(data.detail || "Agent workspace failed to load.");
        return data;
      })
      .then((d) => {
        setAgents(d.agents || []);
        setGroups(d.groups || []);
        setProviders(d.providers || []);
        setHumanVideo(!!d.talking_avatar?.human_video_configured);
        const q = new URLSearchParams(location.search).get("agent");
        if (q && (d.agents || []).some((a: Agent) => a.id === q))
          setSelected(q);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (!token || !selected) return;
    fetch(
      `${api}/api/agents/history?agent_id=${encodeURIComponent(selected)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    )
      .then(read)
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, [selected]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);
  function speak(text: string) {
    if (
      !autoSpeak ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    )
      return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 5000));
    u.rate = 0.98;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find(
        (v) => /^en/i.test(v.lang) && /natural|google|microsoft/i.test(v.name),
      ) || voices.find((v) => /^en/i.test(v.lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }
  function listen() {
    const w: any = window;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setNotice(
        "Voice input is not supported in this browser. You can still type and the agent can speak replies.",
      );
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      if (text) setInput((v) => (v ? `${v} ${text}` : text));
    };
    r.start();
  }
  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy || !providers.some((item) => item.configured)) return;
    if (!token) {
      location.href = "/login?returnTo=%2Fagents";
      return;
    }
    setInput("");
    setMessages((v) => [...v, { role: "user", content: text }]);
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch(`${api}/api/agents/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agent_id: selected, message: text, provider }),
      });
      const d = await read(r);
      if (!r.ok) throw new Error(d.detail || "Agent request failed.");
      if (!String(d.output || "").trim())
        throw new Error("The AI provider returned an empty response.");
      setMessages((v) => [
        ...v,
        {
          role: "assistant",
          content: d.output,
          provider: d.provider_name || d.provider,
          model: d.model,
        },
      ]);
      speak(d.output);
    } catch (err: any) {
      setInput(text);
      setMessages((items) => items.slice(0, -1));
      setNotice(err?.message || "Agent request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function clearHistory() {
    if (!token) return;
    await fetch(
      `${api}/api/agents/history?agent_id=${encodeURIComponent(selected)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    setMessages([]);
    setNotice(
      `${agent?.name || "Agent"} history cleared. Other team memory remains in your workspace.`,
    );
  }
  function choose(a: Agent) {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setSelected(a.id);
    history.replaceState(null, "", `/agents?agent=${encodeURIComponent(a.id)}`);
  }
  const providerReady = providers.some((item) => item.configured);
  return (
    <main className="mesh">
      <header>
        <a href="/">← Dashboard</a>
        <span>
          AI ROLE WORKSPACE •{" "}
          {!loaded
            ? "CHECKING"
            : loadError
              ? "UNAVAILABLE"
              : providerReady
                ? "READY"
                : "SETUP NEEDED"}
        </span>
        <a href="/solutions">Solutions →</a>
      </header>
      <section className="hero">
        <div>
          <small>AI FOR REAL LIFE + REAL WORK</small>
          <h1>Choose the role you need.</h1>
          <p>
            These task-focused profiles use connected AI providers with
            different instructions for everyday life, careers, business, call
            centers, content and learning. When you are signed in, saved
            conversations can provide context to another role in the same
            private workspace.
          </p>
        </div>
        <div className={`avatar ${speaking ? "speaking" : ""}`}>
          <div className="halo" />
          <div className="head">
            <i />
            <i />
            <b />
          </div>
          <div className="body" />
          <span>
            {agent?.name || "AGENT"} •{" "}
            {speaking ? "SPEAKING" : providerReady ? "READY" : "NOT READY"}
          </span>
        </div>
      </section>
      <section className="groups">
        <button
          className={group === "all" ? "active" : ""}
          onClick={() => setGroup("all")}
        >
          All <b>{agents.length}</b>
        </button>
        {groups.map((g) => (
          <button
            className={group === g.id ? "active" : ""}
            key={g.id}
            onClick={() => setGroup(g.id)}
          >
            {g.name}
            <b>{agents.filter((a) => a.group === g.id).length}</b>
          </button>
        ))}
      </section>
      <section className="providerBar">
        <div>
          <b>AI PROVIDERS</b>
          {providers.map((p) => (
            <span key={p.id} className={p.configured ? "ready" : ""}>
              {p.name} <i>{p.configured ? "READY" : "NOT CONNECTED"}</i>
            </span>
          ))}
        </div>
        <div>
          <b>VOICE / VIDEO</b>
          <span className={voiceReady ? "ready" : ""}>
            Voice output {voiceReady ? "available" : "unsupported"}
          </span>
          <span className={micReady ? "ready" : ""}>
            Microphone {micReady ? "available" : "unsupported"}
          </span>
          <span className={humanVideo ? "ready" : ""}>
            {humanVideo ? "Human video connected" : "Human video not connected"}
          </span>
        </div>
      </section>
      <section className="layout">
        <aside>
          <div className="asideHead">
            <small>{visible.length} SPECIALISTS</small>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by task or role…"
            />
          </div>
          <div className="agentList">
            {visible.map((a, i) => (
              <button
                className={selected === a.id ? "active" : ""}
                key={a.id}
                onClick={() => choose(a)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{a.name}</b>
                  <small>{a.title}</small>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className="chat">
          <div className="chatHead">
            <div>
              <small>
                {groups.find((g) => g.id === agent?.group)?.name ||
                  "ACTIVE SPECIALIST"}
              </small>
              <h2>
                {agent?.name || "Loading…"} <span>{agent?.title}</span>
              </h2>
              <p>{agent?.description}</p>
            </div>
            <div className="chatActions">
              <label>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                />{" "}
                Speak replies
              </label>
              <button onClick={clearHistory}>Clear this agent</button>
            </div>
          </div>
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome">
                <b>Talk to {agent?.name || "your agent"}.</b>
                <p>
                  Type or use the microphone. This agent can use your
                  workspace’s shared Agent Mesh memory and knows which platform
                  integrations are connected. External write actions still go
                  through permission and confirmation controls.
                </p>
                <div>
                  <a href="/assistant-actions">Connected Actions</a>
                  <a href="/connections">Connections</a>
                  <a href="/ai-receptionist">Phone / Video</a>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <article
                className={m.role === "assistant" ? "assistant" : "user"}
                key={`${i}-${m.id || ""}`}
              >
                <small>
                  {m.role === "assistant" ? agent?.name : "YOU"}
                  {m.provider ? ` • ${m.provider}` : ""}
                </small>
                <p>{m.content}</p>
                {m.role === "assistant" && (
                  <button onClick={() => speak(m.content)}>🔊 Speak</button>
                )}
              </article>
            ))}
            {busy && (
              <article className="assistant thinking">
                <small>{agent?.name}</small>
                <p>Working with the Agent Mesh…</p>
              </article>
            )}
            <div ref={endRef} />
          </div>
          {!providerReady && loaded && !loadError && (
            <div className="notice">
              An AI provider must be connected before these roles can respond.
            </div>
          )}
          {loadError && (
            <div className="notice">
              The agent workspace could not be loaded. Refresh the page to try
              again.
            </div>
          )}
          {notice && <div className="notice">{notice}</div>}
          <form onSubmit={send}>
            <div className="controls">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                disabled={!providerReady}
              >
                <option value="auto">Auto — free-first fallback</option>
                {providers
                  .filter((p) => p.configured)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className={listening ? "mic live" : "mic"}
                onClick={listen}
                disabled={!micReady}
              >
                {listening
                  ? "● Listening"
                  : micReady
                    ? "🎙 Talk"
                    : "Mic unavailable"}
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`What do you want ${agent?.name || "this role"} to help with?`}
              disabled={!providerReady || loadError}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="send"
              disabled={busy || !providerReady || !input.trim()}
            >
              {busy ? "Working…" : `Send to ${agent?.name || "Agent"} →`}
            </button>
          </form>
        </section>
      </section>
      <section className="explainer">
        <div>
          <b>FOCUSED ROLES</b>
          <p>
            Choose instructions tailored to daily organization, work, business,
            call centers, creation or learning.
          </p>
        </div>
        <div>
          <b>SAVED CONTEXT</b>
          <p>
            Signed-in conversation history stays inside that user’s workspace so
            another role can use recent context.
          </p>
        </div>
        <div>
          <b>CONNECTED ACTIONS</b>
          <p>
            External changes only happen through a real connected action with
            the required permission and confirmation.
          </p>
        </div>
        <div>
          <b>BROWSER VOICE</b>
          <p>
            {voiceReady
              ? "This browser can read replies aloud without a paid avatar service."
              : "This browser does not report support for reading replies aloud."}{" "}
            Human video requires a connected provider.
          </p>
        </div>
      </section>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .mesh {
          min-height: 100vh;
          background: #04070b;
          color: #e9f7ff;
          padding: 22px 30px 60px;
          font-family: Inter, system-ui, sans-serif;
          background-image:
            radial-gradient(
              circle at 80% 0,
              rgba(54, 220, 255, 0.08),
              transparent 32%
            ),
            linear-gradient(rgba(60, 215, 255, 0.025) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(60, 215, 255, 0.025) 1px,
              transparent 1px
            );
          background-size:
            auto,
            34px 34px,
            34px 34px;
        }
        header,
        .hero,
        .groups,
        .providerBar,
        .layout,
        .explainer {
          max-width: 1450px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          color: #608b9b;
          font-size: 9px;
          letter-spacing: 0.15em;
        }
        header a {
          color: #70ddf4;
          text-decoration: none;
        }
        .hero {
          margin-top: 28px;
          border: 1px solid #173643;
          border-radius: 24px;
          background: linear-gradient(145deg, #07131b, #080b10);
          padding: 34px;
          display: grid;
          grid-template-columns: 1fr 260px;
          align-items: center;
          gap: 30px;
        }
        .hero small,
        .chatHead small,
        .asideHead small {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #4fb7ca;
        }
        .hero h1 {
          font-size: clamp(42px, 6vw, 76px);
          line-height: 0.95;
          letter-spacing: -0.04em;
          margin: 10px 0 18px;
        }
        .hero p {
          max-width: 850px;
          color: #82a0ad;
          line-height: 1.65;
        }
        .avatar {
          width: 220px;
          height: 240px;
          margin: auto;
          position: relative;
          display: grid;
          place-items: center;
          background: radial-gradient(
            circle at 50% 43%,
            rgba(54, 218, 255, 0.17),
            transparent 42%
          );
        }
        .halo {
          position: absolute;
          width: 180px;
          height: 180px;
          border: 1px solid #216075;
          border-radius: 50%;
          box-shadow: 0 0 45px rgba(51, 215, 255, 0.1);
        }
        .avatar .head {
          position: absolute;
          top: 34px;
          width: 96px;
          height: 112px;
          border-radius: 45% 45% 42% 42%;
          background: linear-gradient(145deg, #b98267, #794a3d);
          border: 2px solid #8bdff2;
        }
        .avatar .head i {
          position: absolute;
          top: 53px;
          width: 9px;
          height: 5px;
          border-radius: 50%;
          background: #b9f5ff;
        }
        .avatar .head i:first-child {
          left: 23px;
        }
        .avatar .head i:nth-child(2) {
          right: 23px;
        }
        .avatar .head b {
          position: absolute;
          left: 35px;
          right: 35px;
          bottom: 23px;
          height: 4px;
          background: #1e1111;
          border-radius: 8px;
        }
        .speaking .head b {
          height: 13px;
          animation: talk 0.3s infinite alternate;
        }
        .body {
          position: absolute;
          top: 142px;
          width: 145px;
          height: 82px;
          border-radius: 60px 60px 18px 18px;
          background: linear-gradient(145deg, #172a36, #071018);
          border: 1px solid #326579;
        }
        .avatar > span {
          position: absolute;
          bottom: 0;
          font-size: 9px;
          letter-spacing: 0.12em;
          color: #6feaff;
          font-weight: 900;
        }
        @keyframes talk {
          to {
            height: 7px;
          }
        }
        .groups {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .groups button {
          border: 1px solid #1e3c48;
          border-radius: 999px;
          background: #071017;
          color: #7999a5;
          padding: 8px 11px;
          font-size: 9px;
          cursor: pointer;
        }
        .groups button b {
          margin-left: 5px;
          color: #4fbfd4;
        }
        .groups button.active {
          background: #0d2732;
          color: #eaffff;
          border-color: #337185;
        }
        .providerBar {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }
        .providerBar > div {
          border: 1px solid #15313c;
          border-radius: 13px;
          padding: 11px 13px;
          background: #071017;
          display: flex;
          gap: 7px;
          align-items: center;
          flex-wrap: wrap;
        }
        .providerBar b {
          font-size: 9px;
          letter-spacing: 0.14em;
          color: #6b8792;
        }
        .providerBar span {
          font-size: 9px;
          border: 1px solid #273843;
          padding: 6px 8px;
          border-radius: 999px;
          color: #718995;
        }
        .providerBar span.ready {
          border-color: #266348;
          color: #8de9ae;
        }
        .providerBar i {
          font-style: normal;
          font-size: 7px;
        }
        .layout {
          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        aside,
        .chat {
          border: 1px solid #15323d;
          background: #061018;
          border-radius: 18px;
          overflow: hidden;
        }
        .asideHead {
          padding: 14px;
          border-bottom: 1px solid #15323d;
        }
        .asideHead input {
          width: 100%;
          margin-top: 9px;
          padding: 9px;
          border: 1px solid #25434f;
          border-radius: 8px;
          background: #040b10;
          color: #e9f7ff;
        }
        .agentList {
          max-height: 720px;
          overflow: auto;
          padding: 7px;
        }
        .agentList button {
          width: 100%;
          border: 0;
          background: transparent;
          color: #b7cad4;
          padding: 9px;
          display: grid;
          grid-template-columns: 30px 1fr;
          gap: 8px;
          text-align: left;
          border-radius: 9px;
          cursor: pointer;
        }
        .agentList button:hover,
        .agentList button.active {
          background: #0c202a;
          color: #fff;
        }
        .agentList button > span {
          font-size: 9px;
          color: #466b79;
        }
        .agentList b,
        .agentList small {
          display: block;
        }
        .agentList b {
          font-size: 12px;
        }
        .agentList small {
          font-size: 9px;
          color: #6e8b97;
        }
        .chat {
          display: grid;
          grid-template-rows: auto minmax(360px, 1fr) auto auto;
        }
        .chatHead {
          padding: 18px;
          border-bottom: 1px solid #15323d;
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }
        .chatHead h2 {
          font-size: 24px;
          margin: 5px 0;
        }
        .chatHead h2 span {
          font-size: 12px;
          color: #77a2b2;
          font-weight: 500;
        }
        .chatHead p {
          font-size: 11px;
          color: #758e99;
          margin: 0;
        }
        .chatActions {
          display: grid;
          align-content: center;
          gap: 6px;
        }
        .chatActions label {
          font-size: 10px;
          color: #78929e;
        }
        .chatActions button,
        .welcome a,
        .assistant button {
          border: 1px solid #244858;
          background: #08161e;
          color: #99dced;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 9px;
          text-decoration: none;
          cursor: pointer;
        }
        .messages {
          padding: 18px;
          overflow: auto;
          max-height: 620px;
        }
        .messages article {
          max-width: 82%;
          margin: 10px 0;
          padding: 13px 15px;
          border-radius: 15px;
        }
        .messages article.user {
          margin-left: auto;
          background: #102c38;
          border: 1px solid #215166;
        }
        .messages article.assistant {
          background: #0b151d;
          border: 1px solid #193543;
        }
        .messages small {
          font-size: 8px;
          letter-spacing: 0.13em;
          color: #55bdd0;
        }
        .messages p {
          white-space: pre-wrap;
          line-height: 1.55;
          font-size: 13px;
          margin: 7px 0;
        }
        .thinking {
          opacity: 0.7;
        }
        .welcome {
          border: 1px dashed #265061;
          border-radius: 14px;
          padding: 22px;
          color: #88a7b4;
        }
        .welcome b {
          font-size: 18px;
          color: #d9f5ff;
        }
        .welcome > div {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .notice {
          padding: 9px 14px;
          background: #2a2010;
          color: #ffd997;
          font-size: 10px;
        }
        form {
          border-top: 1px solid #15323d;
          padding: 12px;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .controls select,
        .controls button {
          border: 1px solid #244858;
          background: #07141b;
          color: #9fd7e4;
          border-radius: 8px;
          padding: 8px;
          font-size: 9px;
        }
        .mic.live {
          color: #ff8b8b;
        }
        textarea {
          width: 100%;
          min-height: 84px;
          resize: vertical;
          border: 1px solid #234452;
          border-radius: 10px;
          background: #040b10;
          color: #eaffff;
          padding: 11px;
        }
        .send {
          width: 100%;
          margin-top: 7px;
          border: 0;
          border-radius: 9px;
          padding: 11px;
          background: #dffaff;
          color: #051014;
          font-weight: 900;
          cursor: pointer;
        }
        .send:disabled {
          opacity: 0.4;
        }
        .explainer {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        .explainer > div {
          border: 1px solid #17313c;
          border-radius: 12px;
          padding: 14px;
          background: #071017;
        }
        .explainer b {
          font-size: 9px;
          color: #69dcec;
          letter-spacing: 0.12em;
        }
        .explainer p {
          font-size: 10px;
          color: #6f8994;
          line-height: 1.5;
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .agentList {
            max-height: 280px;
          }
          .providerBar,
          .explainer {
            grid-template-columns: 1fr 1fr;
          }
          .hero {
            grid-template-columns: 1fr;
          }
          .avatar {
            display: none;
          }
        }
        @media (max-width: 600px) {
          .mesh {
            padding: 16px 12px 45px;
          }
          .providerBar,
          .explainer {
            grid-template-columns: 1fr;
          }
          .hero {
            padding: 24px;
          }
          .hero h1 {
            font-size: 48px;
          }
          .chatHead {
            display: block;
          }
          .chatActions {
            margin-top: 10px;
          }
          .messages article {
            max-width: 94%;
          }
        }
      `}</style>
    </main>
  );
}

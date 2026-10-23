"use client";

import { type CSSProperties, useEffect, useState } from "react";

import ModeHero from "../../components/ModeHero";
import AIProcessingIndicator from "../../components/AIProcessingIndicator";
import { postMagnanimousChat } from "../../lib/magnanimous-chat-transport";
import {
  MODE_OPTIONS,
  MODE_VISUALS,
  MagnanimousMode,
  normalizeMode,
} from "../../lib/mode-visuals";

const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Source = { title?: string; url?: string; source?: string };
type Exchange = {
  question: string;
  answer: string;
  sources: Source[];
};

async function read(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      detail: text.startsWith("<")
        ? `The server returned a webpage instead of the Magnanimous AI service (${response.status}).`
        : text || `Request failed (${response.status}).`,
    };
  }
}

function auth(): Record<string, string> {
  const token =
    localStorage.getItem("odin_admin_token") ||
    localStorage.getItem("iam_account_token") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AIChat() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<MagnanimousMode>("General");
  const [webSearchReady, setWebSearchReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [desktopModesCollapsed, setDesktopModesCollapsed] = useState(false);
  useEffect(() => { try { setDesktopModesCollapsed(localStorage.getItem("iam_ai_modes_collapsed") === "1"); } catch {} }, []);
  function toggleDesktopModes() {
    setDesktopModesCollapsed(value => {
      const next = !value;
      try { localStorage.setItem("iam_ai_modes_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedMode = query.get("mode");
    const prompt = query.get("prompt");
    if (requestedMode) setMode(normalizeMode(requestedMode));
    if (prompt) setMessage(prompt);

    Promise.all([
      fetch(`${api}/api/providers`).then(async (response) => ({
        response,
        data: await read(response),
      })),
      fetch(`${api}/api/magnanimous/health`).then(async (response) => ({
        response,
        data: await read(response),
      })),
    ])
      .then(([providersResult, healthResult]) => {
        const providers = Array.isArray(providersResult.data.providers)
          ? providersResult.data.providers
          : [];
        const available = providers.filter(
          (item: any) => item.configured && item.enabled !== false,
        );
        setReady(providersResult.response.ok && available.length > 0);
        setWebSearchReady(
          healthResult.response.ok &&
            Boolean(healthResult.data.web_search_configured),
        );
      })
      .catch(() => {
        setReady(false);
      })
      .finally(() => setChecking(false));
  }, []);

  async function ask() {
    const question = message.trim();
    if (!question || busy || !ready) return;
    setBusy(true);
    setActiveQuestion(question);
    setNotice("");
    setMessage("");

    const recentContext = history
      .slice(-6)
      .map((item) => `User: ${item.question}\nAssistant: ${item.answer}`)
      .join("\n\n");
    const modeInstruction = mode === "General" ? "" : `Work in ${mode} mode.\n`;
    const continuity = recentContext
      ? `Conversation so far:\n${recentContext}\n\n`
      : "";
    const requestMessage = `${modeInstruction}${continuity}New request: ${question}`;
    const research = mode === "Research" && webSearchReady;

    try {
      const response = await postMagnanimousChat(`${api}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({
          message: requestMessage,
          provider: "auto",
          use_knowledge: true,
          use_tools: !research,
          live_search: research,
          news: research,
          freshness: research ? "pw" : "",
        }),
      }, { retryTransientEdgeOnce: research });
      const data = await read(response);
      if (!response.ok)
        throw new Error(data.detail || `Request failed (${response.status}).`);
      const answer = String(data.output || "").trim();
      if (!answer)
        throw new Error("Magnanimous AI returned an empty response.");
      setHistory((items) => [
        ...items,
        {
          question,
          answer,
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
      if (mode === "Research" && data.web_search_configured === false)
        setNotice(
          "Answer created without live web search because live search is not connected.",
        );
    } catch (error: any) {
      setMessage(question);
      setNotice(error?.message || "Unable to reach Magnanimous AI.");
    } finally {
      setBusy(false);
      setActiveQuestion("");
    }
  }

  function newConversation() {
    setHistory([]);
    setMessage("");
    setNotice("");
  }

  function chooseMode(nextMode: MagnanimousMode) {
    setMode(nextMode);
    setNavigationOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    window.history.replaceState({}, "", url);
  }

  const status = checking ? "CHECKING" : busy ? "PROCESSING" : ready ? "READY" : "SETUP NEEDED";
  const researchLabel = webSearchReady
    ? "Live web and news search available"
    : "Live web search is not connected";
  const activeMode = normalizeMode(mode);
  const activeVisual = MODE_VISUALS[activeMode];

  return (
    <main className={`odin ai-chat ${activeVisual.themeClass} ${desktopModesCollapsed ? "ai-modes-collapsed" : ""}`}>
      <aside id="ai-mode-side-navigation" className={navigationOpen ? "nav-open" : ""}>
        <a href="/" className="back">
          ← Dashboard
        </a>
        <div className="brand">
          <div className="core">✦</div>
          <div>
            <b>MAGNANIMOUS</b>
            <span>I AM AI</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={navigationOpen}
          aria-controls="ai-chat-sidebar-navigation"
          onClick={() => setNavigationOpen((open) => !open)}
        >
          <span>{navigationOpen ? "Hide" : "Explore"} AI modes & workspaces</span>
          <span aria-hidden="true">{navigationOpen ? "−" : "+"}</span>
        </button>
        <nav id="ai-chat-sidebar-navigation" className="sidebar-navigation" aria-label="AI modes and workspaces">
        <small>MODES</small>
        <div className="mode-list">
          {MODE_OPTIONS.map((item) => {
            const visual = MODE_VISUALS[item];
            const active = activeMode === item;
            return (
              <button
                key={item}
                type="button"
                className={`mode-card ${active ? "active" : ""} ${visual.themeClass}`}
                style={{ "--card-accent": visual.accent } as CSSProperties}
                onClick={() => chooseMode(item)}
                aria-pressed={active}
              >
                <span className="mode-card-thumb">
                  <img src={visual.image} alt="" />
                </span>
                <span className="mode-card-copy">
                  <strong>{item}</strong>
                  <em>{visual.title}</em>
                </span>
              </button>
            );
          })}
        </div>
        <small>WORKSPACES</small>
        <a href="/business-plan"><img src="/mode-images/business.webp" alt="" loading="lazy"/><span>Professional Business Launch</span></a>
        <a href="/knowledge"><img src="/mode-images/research.webp" alt="" loading="lazy"/><span>Knowledge Center</span></a>
        <a href="/business"><img src="/mode-images/business.webp" alt="" loading="lazy"/><span>Business Command</span></a>
        <a href="/social-media"><img src="/mode-images/social-media.webp" alt="" loading="lazy"/><span>Social Studio</span></a>
        <a href="/virtual-assistant"><img src="/mode-images/virtual-assistant.webp" alt="" loading="lazy"/><span>Virtual Assistant</span></a>
        <a href="/ai-apps"><img src="/mode-images/general.webp" alt="" loading="lazy"/><span>AI Apps</span></a>
        </nav>
      </aside>
      <section className="main">
        <div className="ai-modes-controls">
          <button type="button" aria-controls="ai-mode-side-navigation" aria-expanded={!desktopModesCollapsed} onClick={toggleDesktopModes}>
            <span aria-hidden="true">{desktopModesCollapsed ? "›" : "‹"}</span>
            {desktopModesCollapsed ? "Show illustrated AI modes" : "Hide AI modes · expand workspace"}
          </button>
        </div>
        <header>
          <div>
            <small>AI WORKSPACE · {activeMode.toUpperCase()}</small>
            <p>{activeVisual.subtitle}</p>
          </div>
          <div className={`status ${ready ? "ready" : ""} ${busy ? "processing" : ""}`}>
            <b>{status}</b>
            <span>MAGNANIMOUS AI™ · PRIVATE ROUTING</span>
          </div>
        </header>
        <ModeHero mode={activeMode} />
        <section className="mode-context">
          <small>ACTIVE MODE</small>
          <strong>{activeMode}</strong>
          <span>
            {activeMode === "Research"
              ? researchLabel
              : "Uses workspace knowledge when you are signed in and have saved sources"}
          </span>
        </section>
        <section className="console">
          <div className="consolehead">
            <span>CONVERSATION</span>
            <button
              onClick={newConversation}
              disabled={busy || (!history.length && !message)}
            >
              NEW CONVERSATION
            </button>
          </div>
          {history.length > 0 && (
            <div className="history">
              {history.map((item, index) => (
                <article key={`${item.question}-${index}`}>
                  <div className="question">
                    <b>YOU</b>
                    <p>{item.question}</p>
                  </div>
                  <div className="answer">
                    <b>MAGNANIMOUS</b>
                    <p>{item.answer}</p>
                  </div>
                  {item.sources.length > 0 && (
                    <div className="sources">
                      <b>SOURCES USED</b>
                      {item.sources.slice(0, 10).map((source, sourceIndex) => (
                        <div
                          key={`${source.url || source.title}-${sourceIndex}`}
                        >
                          <span>[{sourceIndex + 1}]</span>
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title || source.url}
                            </a>
                          ) : (
                            <em>
                              {source.title || "Saved workspace knowledge"}
                            </em>
                          )}
                          <small>{source.source || ""}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
          {busy && activeQuestion && (
            <div className="pending-exchange">
              <div className="question">
                <b>YOU</b>
                <p>{activeQuestion}</p>
              </div>
              <AIProcessingIndicator mode={activeMode} request={activeQuestion} />
            </div>
          )}
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter")
                ask();
            }}
            placeholder={
              history.length
                ? "Continue this conversation…"
                : `Ask for help with ${mode.toLowerCase()}…`
            }
            disabled={busy || checking}
          />
          <div className="actions">
            <span>
              {!ready && !checking
                ? "Magnanimous AI needs an owner connection before messages can be sent."
                : mode === "Research"
                  ? researchLabel
                  : "Your message clears after it sends; the conversation remains above."}
            </span>
            <button
              onClick={ask}
              disabled={busy || checking || !ready || !message.trim()}
            >
              {busy ? "WORKING…" : "SEND →"}
            </button>
          </div>
          {notice && <div className="notice">{notice}</div>}
        </section>
        <section className="quick">
          <a href="/knowledge">
            <b>Add workspace knowledge</b>
            <span>Knowledge Center →</span>
          </a>
          <a href="/business-plan">
            <b>Build a business plan</b>
            <span>Business workflow →</span>
          </a>
          <a href="/social-media">
            <b>Create social drafts</b>
            <span>Social Studio →</span>
          </a>
        </section>
      </section>
      <style jsx>{`
        .mode-theme-general {
          --mode-bg-1: #0f1f3d;
          --mode-bg-2: #243f73;
          --mode-bg-3: #95afe8;
          --mode-accent: #7fb6ff;
        }
        .mode-theme-business {
          --mode-bg-1: #10281d;
          --mode-bg-2: #1f5b43;
          --mode-bg-3: #d7b85f;
          --mode-accent: #8ee3a1;
        }
        .mode-theme-social {
          --mode-bg-1: #35162f;
          --mode-bg-2: #7f2d7f;
          --mode-bg-3: #ff9bd7;
          --mode-accent: #ff87dc;
        }
        .mode-theme-assistant {
          --mode-bg-1: #12332f;
          --mode-bg-2: #2a7068;
          --mode-bg-3: #c3fff2;
          --mode-accent: #7ff0d8;
        }
        .mode-theme-research {
          --mode-bg-1: #101a33;
          --mode-bg-2: #234b85;
          --mode-bg-3: #9dbfff;
          --mode-accent: #7aa7ff;
        }
        .mode-theme-writing {
          --mode-bg-1: #2b1838;
          --mode-bg-2: #6a3f89;
          --mode-bg-3: #f0c4ff;
          --mode-accent: #d39bff;
        }
        .odin {
          min-height: 100vh;
          position: relative;
          background: var(--mode-bg-1);
          color: #f5f1ff;
          font-family: Inter, system-ui, sans-serif;
          display: grid;
          grid-template-columns: 278px 1fr;
          background-image:
            radial-gradient(
              circle at 65% 18%,
              color-mix(in srgb, var(--mode-accent) 24%, transparent),
              transparent 28%
            ),
            radial-gradient(
              circle at 80% 70%,
              color-mix(in srgb, var(--mode-bg-3) 15%, transparent),
              transparent 25%
            ),
            linear-gradient(145deg, #05070d 0%, var(--mode-bg-1) 48%, #05070d 100%);
          transition: background 320ms ease, background-image 320ms ease;
        }
        aside {
          padding: 24px 14px;
          border-right: 1px solid color-mix(in srgb, var(--mode-accent) 24%, transparent);
          background: linear-gradient(180deg, color-mix(in srgb, var(--mode-bg-1) 58%, #05070d), #05070d 78%);
          min-height: 100vh;
          transition: background 320ms ease, border-color 320ms ease;
        }
        .back {
          color: color-mix(in srgb, var(--mode-accent) 72%, white);
          text-decoration: none;
          font-size: 11px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 28px 5px;
        }
        .core {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid var(--mode-accent);
          color: var(--mode-accent);
          box-shadow: 0 0 24px color-mix(in srgb, var(--mode-accent) 28%, transparent);
          transition: color 320ms ease, border-color 320ms ease, box-shadow 320ms ease;
        }
        .brand b {
          font-size: 15px;
          letter-spacing: 0.1em;
        }
        .brand span {
          display: block;
          font-size: 8px;
          color: color-mix(in srgb, var(--mode-accent) 45%, #728096);
          letter-spacing: 0.16em;
        }
        .sidebar-navigation > small {
          display: block;
          color: color-mix(in srgb, var(--mode-accent) 48%, #718096);
          font-size: 10px;
          letter-spacing: 0.18em;
          margin: 18px 8px 7px;
        }
        .sidebar-navigation > a {
          display: block;
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          color: #aeb8c8;
          padding: 10px;
          border-radius: 7px;
          text-decoration: none;
          font-size: 12px;
          cursor: pointer;
        }
        .sidebar-navigation > a:hover {
          background: color-mix(in srgb, var(--mode-bg-2) 28%, #090b12);
          color: #ffffff;
        }
        .mode-list {
          display: grid;
          gap: 8px;
        }
        .mode-card {
          width: 100%;
          display: grid;
          grid-template-columns: 62px 1fr;
          gap: 10px;
          align-items: center;
          padding: 7px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: rgba(6, 9, 15, 0.58);
          color: #dce6f3;
          text-align: left;
          cursor: pointer;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }
        .mode-card:hover {
          transform: translateX(2px);
          border-color: color-mix(in srgb, var(--card-accent) 42%, transparent);
          background: color-mix(in srgb, var(--mode-bg-2) 22%, #080b12);
        }
        .mode-card.active {
          border-color: var(--card-accent);
          background: color-mix(in srgb, var(--mode-bg-2) 38%, #080b12);
          box-shadow: 0 0 24px color-mix(in srgb, var(--card-accent) 18%, transparent);
        }
        .mode-card-thumb {
          width: 62px;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--card-accent) 40%, transparent);
          border-radius: 8px;
          background: #06080d;
        }
        .mode-card-thumb img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .mode-card-copy,
        .mode-card-copy strong,
        .mode-card-copy em {
          display: block;
        }
        .mode-card-copy strong {
          font-size: 11px;
        }
        .mode-card-copy em {
          margin-top: 3px;
          color: color-mix(in srgb, var(--card-accent) 68%, #8290a3);
          font-size: 8px;
          font-style: normal;
        }
        .main {
          padding: 28px 34px 50px;
          max-width: 1450px;
          width: 100%;
          margin: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        header small,
        .mode-context small {
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--mode-accent);
          font-weight: 900;
        }
        header p {
          color: color-mix(in srgb, var(--mode-bg-3) 68%, white);
          margin: 0;
          line-height: 1.55;
        }
        .status {
          padding: 11px 14px;
          border: 1px solid color-mix(in srgb, var(--mode-accent) 38%, transparent);
          border-radius: 10px;
          background: color-mix(in srgb, var(--mode-bg-1) 54%, #06080d);
          text-align: right;
          height: max-content;
          box-shadow: 0 0 28px color-mix(in srgb, var(--mode-accent) 10%, transparent);
        }
        .status b {
          display: block;
          font-size: 11px;
          color: #e8b86d;
        }
        .status.ready b {
          color: #83f1b3;
        }
        .status.processing b {
          color: var(--mode-accent);
          animation: statusPulse 1.4s ease-in-out infinite;
        }
        .status span {
          display: block;
          font-size: 10px;
          color: #9a8da6;
          margin-top: 3px;
          max-width: 240px;
        }
        .mode-context {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 13px;
          align-items: center;
          margin: 0 0 15px;
          padding: 12px 15px;
          border: 1px solid color-mix(in srgb, var(--mode-accent) 28%, transparent);
          border-radius: 12px;
          background: color-mix(in srgb, var(--mode-bg-1) 52%, #07090e);
        }
        .mode-context strong {
          color: var(--mode-accent);
          font-size: 13px;
        }
        .mode-context span {
          color: color-mix(in srgb, var(--mode-bg-3) 58%, #cbd5e2);
          font-size: 12px;
          line-height: 1.45;
        }
        .console {
          border: 1px solid color-mix(in srgb, var(--mode-accent) 27%, transparent);
          border-radius: 18px;
          background: color-mix(in srgb, var(--mode-bg-1) 36%, #06080d);
          padding: 19px;
          box-shadow: 0 18px 54px rgba(0, 0, 0, 0.22);
          transition: background 320ms ease, border-color 320ms ease;
        }
        .consolehead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: color-mix(in srgb, var(--mode-accent) 68%, #aab5c6);
        }
        .consolehead button {
          border: 1px solid color-mix(in srgb, var(--mode-accent) 30%, transparent);
          border-radius: 7px;
          background: transparent;
          color: color-mix(in srgb, var(--mode-accent) 72%, white);
          padding: 8px 10px;
          font-size: 10px;
          cursor: pointer;
        }
        .consolehead button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .history {
          margin-top: 14px;
          max-height: 680px;
          overflow: auto;
          padding-right: 5px;
        }
        .history article {
          border-top: 1px solid #261b36;
          padding: 16px 0;
        }
        .history article:first-child {
          border-top: 0;
        }
        .question,
        .answer {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
        }
        .question b,
        .answer > b {
          font-size: 10px;
          letter-spacing: 0.14em;
          color: #9578b5;
          padding-top: 4px;
        }
        .question p,
        .answer p {
          white-space: pre-wrap;
          margin: 0;
          line-height: 1.65;
        }
        .question p {
          color: #b8acc5;
        }
        .answer {
          margin-top: 14px;
        }
        .answer p {
          color: #e0d6ee;
        }
        .pending-exchange {
          margin-top: 14px;
          padding: 14px 0 2px;
          border-top: 1px solid color-mix(in srgb, var(--mode-accent) 22%, transparent);
        }
        .pending-exchange .question {
          margin-bottom: 6px;
        }
        .console textarea {
          width: 100%;
          min-height: 150px;
          margin: 14px 0 10px;
          padding: 17px;
          border: 1px solid color-mix(in srgb, var(--mode-accent) 34%, transparent);
          border-radius: 12px;
          background: color-mix(in srgb, var(--mode-bg-1) 28%, #03050a);
          color: #f4efff;
          font: inherit;
          font-size: 16px;
          resize: vertical;
        }
        .console textarea:disabled {
          opacity: 0.6;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }
        .actions span {
          color: #9588a0;
          font-size: 12px;
          line-height: 1.45;
        }
        .actions button {
          border: 0;
          border-radius: 9px;
          background: linear-gradient(90deg, var(--mode-bg-2), var(--mode-accent));
          color: #fff;
          padding: 12px 18px;
          font-weight: 900;
          cursor: pointer;
        }
        .actions button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .notice {
          margin-top: 14px;
          border: 1px solid #6a4934;
          border-radius: 9px;
          background: #1c110c;
          color: #f1c798;
          padding: 11px 13px;
          font-size: 13px;
        }
        .sources {
          margin: 14px 0 0 132px;
          border-left: 2px solid var(--mode-accent);
          padding-left: 13px;
        }
        .sources > b {
          display: block;
          color: var(--mode-accent);
          font-size: 10px;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }
        .sources div {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 6px 0;
          font-size: 12px;
        }
        .sources div > span {
          color: var(--mode-accent);
        }
        .sources a,
        .sources em {
          color: #c9b5df;
          text-decoration: none;
          font-style: normal;
          flex: 1;
        }
        .sources small {
          color: #7d6b8a;
        }
        .quick {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
        }
        .quick a {
          border: 1px solid color-mix(in srgb, var(--mode-accent) 24%, transparent);
          border-radius: 12px;
          padding: 14px;
          color: color-mix(in srgb, var(--mode-bg-3) 68%, white);
          text-decoration: none;
          background: color-mix(in srgb, var(--mode-bg-1) 34%, #06080d);
        }
        .quick b {
          display: block;
          font-size: 13px;
        }
        .quick span {
          display: block;
          color: #8f819a;
          font-size: 11px;
          margin-top: 5px;
        }
        /* Interior-only cinematic styling; the approved homepage is untouched. */
        .odin {
          isolation: isolate;
          perspective: 1600px;
          background-image:
            radial-gradient(circle at 84% 10%, rgba(245, 202, 105, .13), transparent 27%),
            radial-gradient(circle at 56% 34%, color-mix(in srgb, var(--mode-accent) 23%, transparent), transparent 36%),
            radial-gradient(circle at 79% 83%, rgba(48, 190, 255, .12), transparent 30%),
            linear-gradient(140deg, #020713, #0b1d38 48%, #030a1a);
        }
        .odin:before {
          content: '';
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: -1;
          opacity: .46;
          background-image: linear-gradient(rgba(88, 205, 248, .045) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 205, 248, .045) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(to bottom, #000, transparent 92%);
        }
        aside {
          background: linear-gradient(156deg, rgba(6, 26, 51, .98), rgba(2, 7, 18, .98) 74%);
          box-shadow: 12px 0 65px rgba(0, 0, 0, .37), inset -1px 0 rgba(245, 202, 105, .12);
        }
        .brand .core {
          border-color: #f5ca69;
          color: #f5ca69;
          background: radial-gradient(circle at 32% 20%, rgba(245, 202, 105, .22), rgba(2, 15, 34, .9) 68%);
          box-shadow: 0 0 28px rgba(245, 202, 105, .17), inset 0 1px rgba(255, 255, 255, .17);
        }
        .brand b { color: #fff2c8; }
        .sidebar-toggle {
          display: none;
          width: 100%;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          border: 1px solid rgba(245, 202, 105, .55);
          border-radius: 12px;
          padding: 13px;
          background: linear-gradient(105deg, rgba(25, 54, 82, .9), rgba(11, 27, 52, .96));
          color: #ffe5a2;
          font: 800 12px Inter, system-ui, sans-serif;
          cursor: pointer;
        }
        .mode-card, .mode-context, .console, .quick a, .status {
          box-shadow: 0 18px 42px rgba(0, 0, 0, .31), inset 0 1px rgba(255, 255, 255, .07), 0 0 32px color-mix(in srgb, var(--mode-accent) 4%, transparent);
          backdrop-filter: blur(14px) saturate(1.12);
        }
        .mode-card {
          border-color: rgba(117, 213, 251, .18);
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(20, 51, 82, .72), rgba(2, 13, 30, .94));
          transform-style: preserve-3d;
        }
        .mode-card:hover, .mode-card:focus-visible {
          transform: perspective(900px) translateY(-3px) rotateX(1.2deg);
          box-shadow: 0 22px 46px rgba(0, 0, 0, .45), 0 0 24px color-mix(in srgb, var(--card-accent) 15%, transparent);
        }
        .mode-card.active {
          border-color: #f5ca69;
          box-shadow: 0 0 30px color-mix(in srgb, var(--card-accent) 13%, transparent), inset 0 0 0 1px rgba(245, 202, 105, .23);
        }
        .mode-context, .console, .quick a {
          background: linear-gradient(145deg, rgba(13, 38, 69, .87), rgba(3, 12, 29, .94));
          border-color: rgba(104, 206, 249, .29);
        }
        .console { box-shadow: 0 28px 78px rgba(0, 0, 0, .45), inset 0 1px rgba(245, 202, 105, .12); }
        .actions button {
          background: linear-gradient(105deg, #f5ca69, #7de5f8 55%, var(--mode-accent));
          color: #05172b;
          box-shadow: 0 13px 30px rgba(54, 192, 237, .2), inset 0 1px rgba(255, 255, 255, .42);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .actions button:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(54, 192, 237, .28); }
        .quick a { transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .quick a:hover, .quick a:focus-visible {
          transform: translateY(-3px);
          border-color: rgba(245, 202, 105, .6);
          box-shadow: 0 24px 55px rgba(0, 0, 0, .4), 0 0 24px rgba(245, 202, 105, .08);
        }

        /* Independent AI-mode rail: the global cinematic navigation stays untouched. */
        .ai-modes-controls { display: flex; justify-content: flex-start; margin-bottom: 13px; }
        .ai-modes-controls button { display: flex; align-items: center; gap: 10px; min-height: 39px; padding: 7px 15px;
          border: 1px solid #e6bc70; border-radius: 999px; color: #ffe8b9; cursor: pointer;
          font: 850 11px Inter,system-ui,sans-serif; letter-spacing: .01em;
          background: linear-gradient(130deg,#0d467b,#071832 68%,#2c271e);
          box-shadow: 0 0 18px rgba(55,184,255,.24), inset 0 1px rgba(255,227,165,.23);
          transition: transform .2s ease, border-color .2s ease; }
        .ai-modes-controls button:hover { border-color: #7fe7ff; transform: translateY(-1px); }
        .ai-modes-controls button span { display: inline-grid; width: 23px; height: 23px; place-items: center;
          border: 1px solid #9eeaff; border-radius: 50%; font-size: 19px; color: #95f3ff; }
        .sidebar-navigation > a { display: flex; align-items: center; gap: 11px; min-height: 48px; padding: 6px 8px;
          margin-bottom: 5px; border: 1px solid rgba(237,189,106,.27); border-radius: 11px;
          background: linear-gradient(100deg,rgba(9,39,77,.8),rgba(6,16,32,.75));
          box-shadow: inset 0 1px rgba(255,231,170,.12); }
        .sidebar-navigation > a img { display: block; width: 44px; height: 34px; object-fit: cover;
          border: 1px solid rgba(245,200,116,.7); border-radius: 8px; box-shadow: 0 0 10px rgba(47,178,255,.22);
          transition: transform .25s ease, filter .25s ease; }
        .sidebar-navigation > a span { font-weight: 800; color: #edf8ff; overflow-wrap: anywhere; }
        .sidebar-navigation > a:hover img { transform: scale(1.06); filter: brightness(1.18) saturate(1.3); }
        @media (min-width: 801px) {
          .odin.ai-modes-collapsed { grid-template-columns: minmax(0,1fr); }
          .odin.ai-modes-collapsed > aside { display: none; }
          .odin.ai-modes-collapsed .main { max-width: none; }
        }
        @media (max-width: 800px) { .ai-modes-controls { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .ai-modes-controls button, .sidebar-navigation > a img { transition: none; }
          .ai-modes-controls button:hover, .sidebar-navigation > a:hover img { transform: none; }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: .62; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .status.processing b { animation: none; }
          .odin, .mode-card, .quick a, .actions button { transition: none; }
          .mode-card:hover, .mode-card:focus-visible, .quick a:hover, .quick a:focus-visible, .actions button:not(:disabled):hover { transform: none; }
        }
        @media (max-width: 800px) {
          .odin {
            grid-template-columns: 1fr;
          }
          aside {
            min-height: auto;
            padding: 16px;
          }
          .brand { margin: 16px 5px; }
          .sidebar-toggle { display: flex; }
          aside:not(.nav-open) .sidebar-navigation { display: none; }
          aside.nav-open .sidebar-navigation { padding-top: 12px; }
          .mode-card:hover, .mode-card:focus-visible, .quick a:hover, .quick a:focus-visible { transform: none; }
          .sidebar-navigation > a { min-height: 42px; display: flex; align-items: center; }
          .mode-card { min-height: 56px; }
          .main {
            padding: 20px 14px;
          }
          .mode-context {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .quick {
            grid-template-columns: 1fr;
          }
          header {
            display: block;
          }
          .status {
            margin-top: 12px;
            text-align: left;
          }
          .question,
          .answer {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .sources {
            margin-left: 0;
          }
          .actions {
            align-items: stretch;
            flex-direction: column;
          }
          .actions button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

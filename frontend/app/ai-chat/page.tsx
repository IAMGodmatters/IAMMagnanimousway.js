"use client";

import { type CSSProperties, useEffect, useState } from "react";

import ModeHero from "../../components/ModeHero";
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
  provider?: string;
  model?: string;
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
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [mode, setMode] = useState<MagnanimousMode>("General");
  const [webSearchReady, setWebSearchReady] = useState(false);
  const [notice, setNotice] = useState("");

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
        setProvider(available[0]?.name || "No AI provider connected");
        setWebSearchReady(
          healthResult.response.ok &&
            Boolean(healthResult.data.web_search_configured),
        );
      })
      .catch(() => {
        setReady(false);
        setProvider("Service check failed");
      })
      .finally(() => setChecking(false));
  }, []);

  async function ask() {
    const question = message.trim();
    if (!question || busy || !ready) return;
    setBusy(true);
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
      const response = await fetch(`${api}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({
          message: requestMessage,
          provider: "auto",
          use_knowledge: true,
          live_search: research,
          news: research,
          freshness: research ? "pw" : "",
        }),
      });
      const data = await read(response);
      if (!response.ok)
        throw new Error(data.detail || `Request failed (${response.status}).`);
      const answer = String(data.output || "").trim();
      if (!answer)
        throw new Error("The AI provider returned an empty response.");
      const usedProvider = data.provider_name || data.provider || provider;
      setProvider(usedProvider);
      setModel(data.model || "");
      setHistory((items) => [
        ...items,
        {
          question,
          answer,
          provider: usedProvider,
          model: data.model || "",
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
      if (mode === "Research" && data.web_search_configured === false)
        setNotice(
          "Answer created without live web search because no search provider is connected.",
        );
    } catch (error: any) {
      setMessage(question);
      setNotice(error?.message || "Unable to reach the AI service.");
    } finally {
      setBusy(false);
    }
  }

  function newConversation() {
    setHistory([]);
    setMessage("");
    setNotice("");
    setModel("");
  }

  function chooseMode(nextMode: MagnanimousMode) {
    setMode(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    window.history.replaceState({}, "", url);
  }

  const status = checking ? "CHECKING" : ready ? "READY" : "SETUP NEEDED";
  const researchLabel = webSearchReady
    ? "Live web and news search available"
    : "Live web search is not connected";
  const activeMode = normalizeMode(mode);
  const activeVisual = MODE_VISUALS[activeMode];

  return (
    <main className={`odin ai-chat ${activeVisual.themeClass}`}>
      <aside>
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
        <a href="/business-plan">Professional Business Launch</a>
        <a href="/knowledge">Knowledge Center</a>
        <a href="/business">Business Command</a>
        <a href="/social-media">Social Studio</a>
        <a href="/virtual-assistant">Virtual Assistant</a>
        <a href="/ai-apps">AI Apps</a>
      </aside>
      <section className="main">
        <header>
          <div>
            <small>AI WORKSPACE · {activeMode.toUpperCase()}</small>
            <p>{activeVisual.subtitle}</p>
          </div>
          <div className={`status ${ready ? "ready" : ""}`}>
            <b>{status}</b>
            <span>
              {provider}
              {model ? ` · ${model}` : ""}
            </span>
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
                    {(item.provider || item.model) && (
                      <small>
                        {[item.provider, item.model]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    )}
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
                ? "An owner must connect an AI provider before messages can be sent."
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
        .odin aside > small {
          display: block;
          color: color-mix(in srgb, var(--mode-accent) 48%, #718096);
          font-size: 10px;
          letter-spacing: 0.18em;
          margin: 18px 8px 7px;
        }
        .odin aside > a:not(.back) {
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
        .odin aside > a:not(.back):hover {
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
        .answer > small {
          grid-column: 2;
          color: #80718e;
          font-size: 11px;
          margin-top: 5px;
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
        @media (max-width: 800px) {
          .odin {
            grid-template-columns: 1fr;
          }
          aside {
            min-height: auto;
          }
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

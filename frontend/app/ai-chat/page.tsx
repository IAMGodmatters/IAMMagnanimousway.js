"use client";

import { useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const modes = [
  "General",
  "Business",
  "Social Media",
  "Virtual Assistant",
  "Research",
  "Writing",
];

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
  const [mode, setMode] = useState("General");
  const [webSearchReady, setWebSearchReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedMode = query.get("mode");
    const prompt = query.get("prompt");
    if (requestedMode && modes.includes(requestedMode)) setMode(requestedMode);
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

  const status = checking ? "CHECKING" : ready ? "READY" : "SETUP NEEDED";
  const researchLabel = webSearchReady
    ? "Live web and news search available"
    : "Live web search is not connected";

  return (
    <main className="odin">
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
        {modes.map((item) => (
          <button
            key={item}
            className={mode === item ? "active" : ""}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
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
            <small>AI WORKSPACE</small>
            <h1>Magnanimous AI</h1>
            <p>
              Ask questions, create drafts, and continue a conversation using a
              connected AI provider.
            </p>
          </div>
          <div className={`status ${ready ? "ready" : ""}`}>
            <b>{status}</b>
            <span>
              {provider}
              {model ? ` · ${model}` : ""}
            </span>
          </div>
        </header>
        <section className="scene">
          <div className="rings">
            <i />
            <i />
            <i />
            <div>M</div>
          </div>
          <div className="meta">
            <small>ACTIVE MODE</small>
            <strong>{mode}</strong>
            <span>
              {mode === "Research"
                ? researchLabel
                : "Uses workspace knowledge when you are signed in and have saved sources"}
            </span>
          </div>
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
        .odin {
          min-height: 100vh;
          background: #06050d;
          color: #f5f1ff;
          font-family: Inter, system-ui, sans-serif;
          display: grid;
          grid-template-columns: 235px 1fr;
          background-image:
            radial-gradient(
              circle at 65% 18%,
              rgba(141, 87, 255, 0.14),
              transparent 28%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(0, 200, 255, 0.08),
              transparent 25%
            );
        }
        aside {
          padding: 24px 14px;
          border-right: 1px solid #20172f;
          background: #090713;
          min-height: 100vh;
        }
        .back {
          color: #9b8bb4;
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
          border: 1px solid #8d60da;
          color: #cba6ff;
          box-shadow: 0 0 24px rgba(159, 91, 255, 0.25);
        }
        .brand b {
          font-size: 15px;
          letter-spacing: 0.1em;
        }
        .brand span {
          display: block;
          font-size: 8px;
          color: #695d7a;
          letter-spacing: 0.16em;
        }
        .odin aside > small {
          display: block;
          color: #71647e;
          font-size: 10px;
          letter-spacing: 0.18em;
          margin: 18px 8px 7px;
        }
        .odin aside button,
        .odin aside > a:not(.back) {
          display: block;
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          color: #a698b8;
          padding: 10px;
          border-radius: 7px;
          text-decoration: none;
          font-size: 12px;
          cursor: pointer;
        }
        .odin aside button.active,
        .odin aside > a:not(.back):hover {
          background: #151021;
          color: #dfc8ff;
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
        .meta small {
          font-size: 10px;
          letter-spacing: 0.18em;
          color: #9475b4;
          font-weight: 900;
        }
        header h1 {
          font-size: clamp(38px, 6vw, 72px);
          margin: 5px 0;
          letter-spacing: -0.03em;
        }
        header p {
          color: #a597b2;
          margin: 0;
          line-height: 1.55;
        }
        .status {
          padding: 11px 14px;
          border: 1px solid #463653;
          border-radius: 10px;
          background: #0c0914;
          text-align: right;
          height: max-content;
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
        .scene {
          height: 260px;
          margin: 28px 0 15px;
          border: 1px solid #211831;
          border-radius: 20px;
          background: linear-gradient(135deg, #0d0a17, #0a0712);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          overflow: hidden;
        }
        .rings {
          width: 190px;
          height: 190px;
          border: 1px solid #463060;
          border-radius: 50%;
          margin: auto;
          display: grid;
          place-items: center;
          position: relative;
          box-shadow: 0 0 70px rgba(142, 76, 255, 0.12);
        }
        .rings:before,
        .rings:after,
        .rings i {
          content: "";
          position: absolute;
          border: 1px solid #30203f;
          border-radius: 50%;
        }
        .rings:before {
          inset: 24px;
        }
        .rings:after {
          inset: 52px;
        }
        .rings i:nth-child(1) {
          inset: -24px;
        }
        .rings i:nth-child(2) {
          width: 1px;
          height: 100%;
          border: 0;
          border-left: 1px solid #352446;
          border-radius: 0;
        }
        .rings i:nth-child(3) {
          width: 100%;
          height: 1px;
          border: 0;
          border-top: 1px solid #352446;
          border-radius: 0;
        }
        .rings div {
          font: 900 18px Georgia;
          color: #c8a6ff;
          letter-spacing: 0.15em;
        }
        .meta strong {
          display: block;
          font-size: 42px;
          margin: 8px 0;
        }
        .meta span {
          color: #a093ab;
          line-height: 1.5;
        }
        .console {
          border: 1px solid #271d37;
          border-radius: 18px;
          background: #0b0812;
          padding: 19px;
        }
        .consolehead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: #9d86b6;
        }
        .consolehead button {
          border: 1px solid #3a2b4b;
          border-radius: 7px;
          background: transparent;
          color: #b9a4d1;
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
          border: 1px solid #3a2b50;
          border-radius: 12px;
          background: #07050c;
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
          background: linear-gradient(90deg, #8256d6, #3c82f6);
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
          border-left: 2px solid #2e2140;
          padding-left: 13px;
        }
        .sources > b {
          display: block;
          color: #a389bf;
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
          color: #9f79cf;
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
          border: 1px solid #2d213d;
          border-radius: 12px;
          padding: 14px;
          color: #d8c6ea;
          text-decoration: none;
          background: #090711;
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
          .scene {
            grid-template-columns: 1fr;
            height: auto;
            padding: 25px;
          }
          .meta {
            text-align: center;
            margin-top: 20px;
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

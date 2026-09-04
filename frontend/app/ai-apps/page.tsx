"use client";
import { useEffect, useMemo, useState } from "react";
const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
type Tool = { id: string; name: string; description: string };
const modes: Record<string, string> = {
  "Business Helper": "Business",
  "Marketing Helper": "Business",
  "Social Media Helper": "Social Media",
  "Customer Service Helper": "Virtual Assistant",
  "Research Helper": "Research",
  "Writing Helper": "Writing",
  "Video Script Helper": "Writing",
  "Coding Helper": "General",
  "Travel Helper": "Research",
  "Bible Study": "Research",
  "AI Chat": "General",
  "I AM Operator": "General",
  "Magnanimous AI": "General",
};
const starters: Record<string, string> = {
  "Writing Helper": "Help me write or improve: ",
  "Research Helper": "Research this topic and organize the findings: ",
  "Bible Study": "Help me study this Bible topic carefully: ",
  "Marketing Helper": "Build a practical marketing strategy for: ",
  "Business Helper": "Help me plan or improve this business: ",
  "Coding Helper": "Help me troubleshoot or build: ",
  "Social Media Helper": "Create a social media campaign for: ",
  "Video Script Helper": "Write a strong video script about: ",
  "Travel Helper": "Research and plan: ",
  "Customer Service Helper": "Help me respond to this customer situation: ",
  "AI Chat": "Help me with: ",
  "I AM Operator": "Help me plan this request: ",
  "Magnanimous AI": "Help me plan this request: ",
};
function displayName(name: string) {
  return name === "I AM Operator" ? "Magnanimous AI" : name;
}
export default function AIApps() {
  const [tools, setTools] = useState<Tool[]>([]),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [providers, setProviders] = useState(0);
  useEffect(() => {
    Promise.all([
      fetch(`${api}/api/tools`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(`${api}/api/providers`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
    ])
      .then(([t, p]) => {
        setTools(t.tools || []);
        setProviders(
          (p.providers || []).filter(
            (x: any) => x.configured && x.enabled !== false,
          ).length,
        );
      })
      .catch(() => setError("The app directory could not be loaded."))
      .finally(() => setLoading(false));
  }, []);
  const visible = useMemo(
    () =>
      tools.filter((t) =>
        (displayName(t.name) + " " + t.description)
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [tools, search],
  );
  function href(t: Tool) {
    return `/ai-chat?mode=${encodeURIComponent(modes[t.name] || "General")}&prompt=${encodeURIComponent(starters[t.name] || `Help me with ${displayName(t.name)}: `)}`;
  }
  return (
    <main className="apps">
      <header>
        <a href="/">← Dashboard</a>
        <div className="state">
          AI APP DIRECTORY •{" "}
          {loading
            ? "CHECKING"
            : error
              ? "UNAVAILABLE"
              : `${tools.length} HELPERS • ${providers} PROVIDER${providers === 1 ? "" : "S"} READY`}
        </div>
      </header>
      <section className="hero">
        <div>
          <small>SPECIALIZED AI</small>
          <h1>Start with the right prompt.</h1>
          <p>
            Each helper opens Magnanimous AI with a task-specific mode and
            starter prompt. They use the same connected AI providers; these are
            focused starting points, not separate AI systems.
          </p>
          <a className="meshLaunch" href="/agents">
            VIEW AGENT WORKSPACE →
          </a>
        </div>
        <div className="matrix">
          <i />
          <i />
          <i />
          <i />
          <b>AI</b>
        </div>
      </section>
      <section className="toolbar">
        <div>
          <small>APP DIRECTORY</small>
          <h2>Specialized helpers</h2>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search AI helpers…"
        />
      </section>
      <section className="grid">
        {visible.map((t, i) => (
          <a href={href(t)} key={t.id} className={`card c${i % 4}`}>
            <div className="num">{String(i + 1).padStart(2, "0")}</div>
            <div className="icon">{["✦", "◉", "◇", "⌁"][i % 4]}</div>
            <small>{modes[t.name] || "General"} MODE</small>
            <h3>{displayName(t.name)}</h3>
            <p>{t.description}</p>
            <span>OPEN IN MAGNANIMOUS AI →</span>
          </a>
        ))}
        {loading && <div className="loading">Loading AI helpers…</div>}
        {error && (
          <div className="loading">{error} Refresh the page to try again.</div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div className="loading">No helpers match that search.</div>
        )}
      </section>
      <section className="footer">
        <a href="/agents">
          <b>Agent Workspace</b>
          <span>Task-focused roles →</span>
        </a>
        <a href="/business">
          <b>Business</b>
          <span>Strategy drafts →</span>
        </a>
        <a href="/virtual-assistant">
          <b>Virtual Assistant</b>
          <span>Planning and drafts →</span>
        </a>
        <a href="/ai-chat">
          <b>Magnanimous AI</b>
          <span>Open general AI →</span>
        </a>
      </section>
      <style jsx>{`
        .apps {
          min-height: 100vh;
          background: #020b10;
          color: #eaffff;
          padding: 24px 34px 60px;
          font-family: Inter, system-ui, sans-serif;
          background-image:
            linear-gradient(rgba(0, 216, 255, 0.025) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(0, 216, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 32px 32px;
        }
        header {
          max-width: 1400px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          color: #4f8995;
          font-size: 9px;
          letter-spacing: 0.16em;
        }
        header a {
          color: #7ceeff;
          text-decoration: none;
        }
        .hero {
          max-width: 1400px;
          margin: 28px auto 24px;
          padding: 38px;
          border: 1px solid #14333d;
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 80% 50%,
              rgba(0, 211, 255, 0.12),
              transparent 28%
            ),
            #061118;
          display: grid;
          grid-template-columns: 1fr 300px;
          align-items: center;
        }
        .hero small,
        .toolbar small,
        .card small {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #46a8b8;
          font-weight: 900;
        }
        .hero h1 {
          font-size: clamp(40px, 7vw, 78px);
          line-height: 0.95;
          max-width: 900px;
          margin: 12px 0;
        }
        .hero p {
          color: #7798a1;
          max-width: 720px;
          line-height: 1.6;
        }
        .meshLaunch {
          display: inline-block;
          margin-top: 10px;
          padding: 11px 14px;
          border: 1px solid #2a7587;
          border-radius: 9px;
          color: #b7f5ff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          background: #0a2731;
        }
        .matrix {
          width: 210px;
          height: 210px;
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          position: relative;
        }
        .matrix i {
          border: 1px solid #1c5664;
          border-radius: 12px;
          background: #071820;
        }
        .matrix b {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: 42px;
          color: #71efff;
          text-shadow: 0 0 30px #00c8e8;
        }
        .toolbar {
          max-width: 1400px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 20px;
        }
        .toolbar h2 {
          font-size: 28px;
          margin: 5px 0;
        }
        .toolbar input {
          width: min(360px, 100%);
          padding: 12px 14px;
          border: 1px solid #17434f;
          border-radius: 10px;
          background: #041018;
          color: #eaffff;
        }
        .grid {
          max-width: 1400px;
          margin: 15px auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
        }
        .card {
          min-height: 265px;
          padding: 18px;
          border: 1px solid #14333d;
          border-radius: 16px;
          text-decoration: none;
          color: #eaffff;
          position: relative;
          background: #061118;
          overflow: hidden;
        }
        .card:after {
          content: "";
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          right: -50px;
          bottom: -50px;
          background: rgba(90, 240, 255, 0.045);
        }
        .card:hover {
          transform: translateY(-2px);
          border-color: #296579;
        }
        .num {
          position: absolute;
          right: 15px;
          top: 14px;
          color: #315b65;
          font-size: 10px;
        }
        .icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          margin-bottom: 27px;
          background: #0b222b;
          color: #75eefe;
        }
        .card h3 {
          font-size: 18px;
          margin: 8px 0;
        }
        .card p {
          color: #71909a;
          font-size: 11px;
          line-height: 1.55;
        }
        .card span {
          position: absolute;
          bottom: 17px;
          font-size: 9px;
          letter-spacing: 0.12em;
          color: #6ce7f8;
          font-weight: 900;
        }
        .c1 {
          background: linear-gradient(145deg, #08101b, #061118);
        }
        .c2 {
          background: linear-gradient(145deg, #0a1510, #061118);
        }
        .c3 {
          background: linear-gradient(145deg, #170e18, #061118);
        }
        .loading {
          grid-column: 1/-1;
          padding: 40px;
          border: 1px dashed #17434f;
          border-radius: 15px;
          color: #668b94;
          text-align: center;
        }
        .footer {
          max-width: 1400px;
          margin: 13px auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
        }
        .footer a {
          padding: 13px;
          border-top: 1px solid #17434f;
          color: #cdeff4;
          text-decoration: none;
        }
        .footer b {
          display: block;
          font-size: 11px;
        }
        .footer span {
          font-size: 9px;
          color: #567780;
        }
        @media (max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hero {
            grid-template-columns: 1fr;
          }
          .matrix {
            display: none;
          }
        }
        @media (max-width: 600px) {
          .apps {
            padding: 18px 14px;
          }
          .grid,
          .footer {
            grid-template-columns: 1fr;
          }
          .toolbar {
            display: block;
          }
          .toolbar input {
            width: 100%;
            box-sizing: border-box;
          }
          .hero {
            padding: 24px;
          }
          .card {
            min-height: 230px;
          }
        }
      `}</style>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { getPlatformAuthToken } from "../lib/magnanimous-session";
const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
async function read(r: Response) {
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return { detail: t };
  }
}
function chatHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" },
    t = getPlatformAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}
export default function Social() {
  const [topic, setTopic] = useState(""),
    [platform, setPlatform] = useState("Facebook"),
    [goal, setGoal] = useState("Engagement"),
    [output, setOutput] = useState(""),
    [busy, setBusy] = useState(false),
    [aiReady, setAiReady] = useState<boolean | null>(null);
  const platforms = [
    "Facebook",
    "Instagram",
    "TikTok",
    "YouTube",
    "LinkedIn",
    "X",
  ];
  useEffect(() => {
    fetch(`${api}/api/providers`)
      .then(read)
      .then((data) => setAiReady(Boolean(data.magnanimous_ready)))
      .catch(() => setAiReady(false));
  }, []);
  async function create() {
    if (!topic.trim() || aiReady === false) return;
    setBusy(true);
    setOutput("Creating campaign…");
    try {
      const r = await fetch(`${api}/api/chat`, {
        method: "POST",
        headers: chatHeaders(),
        body: JSON.stringify({
          message: `You are a social media strategist. Create a ${platform} content package for this topic/business: ${topic}. Primary goal: ${goal}. Include hook, polished post/caption, CTA, content angle, 5 relevant hashtags, and a short video idea where useful. Keep it platform-native and practical. Use the customer's saved brand/business knowledge when relevant.`,
          use_knowledge: true,
        }),
      });
      const d = await read(r);
      setOutput(d.output || d.detail || "No response.");
    } catch {
      setOutput("Unable to reach Magnanimous AI.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="social">
      <header>
        <a href="/">← Dashboard</a>
        <div>
          {aiReady === null
            ? "CHECKING AI"
            : aiReady
              ? "AI CONTENT GENERATOR AVAILABLE"
              : "AI PROVIDER NOT AVAILABLE"}
        </div>
      </header>
      <section className="hero">
        <div className="signal">●</div>
        <small>SOCIAL STUDIO</small>
        <h1>Create once. Adapt everywhere.</h1>
        <p>
          Draft platform-specific campaigns with a configured AI provider. This
          page creates content; it does not publish anything to a social
          account.
        </p>
        <div className="platforms">
          {platforms.map((x) => (
            <button
              key={x}
              className={platform === x ? "on" : ""}
              onClick={() => setPlatform(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </section>
      <section className="grid">
        <div className="composer">
          <div className="head">
            <div>
              <small>CONTENT COMPOSER</small>
              <h2>{platform} Campaign</h2>
            </div>
            <span>{goal}</span>
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What do you want to promote, teach, announce, sell, or talk about?"
          />
          <div className="goals">
            <button
              onClick={() => setGoal("Engagement")}
              className={goal === "Engagement" ? "on" : ""}
            >
              Engagement
            </button>
            <button
              onClick={() => setGoal("Leads")}
              className={goal === "Leads" ? "on" : ""}
            >
              Leads
            </button>
            <button
              onClick={() => setGoal("Sales")}
              className={goal === "Sales" ? "on" : ""}
            >
              Sales
            </button>
            <button
              onClick={() => setGoal("Awareness")}
              className={goal === "Awareness" ? "on" : ""}
            >
              Awareness
            </button>
          </div>
          <button
            className="create"
            disabled={busy || aiReady === false}
            onClick={create}
          >
            {busy
              ? "CREATING…"
              : aiReady === false
                ? "AI PROVIDER REQUIRED"
                : "CREATE CONTENT PACKAGE →"}
          </button>
          {output && <div className="result">{output}</div>}
        </div>
        <aside>
          <div className="pulse">
            <b>THIS PAGE</b>
            <strong>DRAFTS</strong>
            <span>Nothing is posted automatically</span>
          </div>
          <a className="publish" href="/social-connect">
            <b>Check Publishing Connections</b>
            <span>
              See which YouTube, TikTok or LinkedIn account is connected →
            </span>
          </a>
          <a href="/connections">
            <b>Other Connections</b>
            <span>Review supported and unsupported account connections →</span>
          </a>
          <a href="/video-studio">
            <b>Create Video</b>
            <span>Generate or prepare a video source →</span>
          </a>
          <a href="/knowledge">
            <b>Knowledge Center</b>
            <span>Brand voice • products • research →</span>
          </a>
        </aside>
      </section>
      <section className="ideas">
        <article>
          <b>01</b>
          <h3>Campaign Builder</h3>
          <p>Turn one offer into platform-specific content and scripts.</p>
        </article>
        <article>
          <b>02</b>
          <h3>Creator Assistant</h3>
          <p>
            Hooks, captions, CTAs and repurposing from Magnanimous AI using your
            saved brand context.
          </p>
        </article>
        <article>
          <b>03</b>
          <h3>Official Publishing</h3>
          <p>
            YouTube, TikTok and LinkedIn publishing is available only after its
            connection page reports that the account is connected.
          </p>
        </article>
      </section>
      <style jsx>{`
        .social {
          min-height: 100vh;
          background: #07120f;
          color: #edfff7;
          padding: 24px 34px 60px;
          font-family: Inter, system-ui, sans-serif;
          background-image:
            radial-gradient(
              circle at 15% 20%,
              rgba(60, 255, 178, 0.1),
              transparent 24%
            ),
            radial-gradient(
              circle at 85% 65%,
              rgba(110, 64, 255, 0.12),
              transparent 30%
            );
        }
        header {
          max-width: 1400px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: #6f9183;
        }
        header a {
          color: #bdf8df;
          text-decoration: none;
        }
        .hero {
          max-width: 1400px;
          margin: 26px auto;
          padding: 38px 0;
          border-bottom: 1px solid #19332a;
          position: relative;
        }
        .signal {
          position: absolute;
          right: 0;
          top: 20px;
          width: 100px;
          height: 100px;
          border: 1px solid #2b6a53;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #69ffbd;
          box-shadow: 0 0 55px rgba(45, 255, 167, 0.12);
        }
        .hero small,
        .composer small {
          letter-spacing: 0.2em;
          font-size: 10px;
          color: #55d69d;
        }
        .hero h1 {
          font-size: clamp(42px, 7vw, 82px);
          line-height: 0.92;
          max-width: 900px;
          margin: 13px 0;
        }
        .hero p {
          max-width: 720px;
          color: #8eb2a2;
          font-size: 16px;
        }
        .platforms {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 22px;
        }
        .platforms button,
        .goals button {
          border: 1px solid #244b3c;
          background: #0c1b16;
          color: #9dc8b6;
          padding: 9px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .platforms button.on,
        .goals button.on {
          background: #54f0aa;
          color: #052016;
          border-color: #54f0aa;
        }
        .grid {
          max-width: 1400px;
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }
        .composer {
          border: 1px solid #1f4436;
          border-radius: 22px;
          padding: 24px;
          background: rgba(7, 24, 18, 0.75);
        }
        .head {
          display: flex;
          justify-content: space-between;
        }
        .head h2 {
          font-size: 32px;
          margin: 6px 0 20px;
        }
        .head span {
          color: #70eeb8;
          font-size: 11px;
        }
        .composer textarea {
          width: 100%;
          min-height: 200px;
          padding: 18px;
          background: #06100d;
          color: #fff;
          border: 1px solid #24513f;
          border-radius: 14px;
          font: inherit;
          box-sizing: border-box;
        }
        .goals {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin: 12px 0;
        }
        .create {
          border: 0;
          border-radius: 12px;
          background: linear-gradient(90deg, #45eba2, #66a6ff);
          color: #052016;
          padding: 14px 18px;
          font-weight: 900;
          cursor: pointer;
        }
        .result {
          white-space: pre-wrap;
          margin-top: 17px;
          padding: 18px;
          border: 1px solid #1e4938;
          border-radius: 14px;
          background: #081a14;
          line-height: 1.65;
          color: #d6f7e8;
        }
        aside {
          display: grid;
          gap: 12px;
        }
        .pulse,
        aside a {
          padding: 20px;
          border: 1px solid #1f4436;
          border-radius: 18px;
          background: #0a1813;
          color: #dff8ed;
          text-decoration: none;
        }
        .pulse strong {
          display: block;
          font-size: 48px;
          margin: 14px 0;
          color: #55efaa;
        }
        .pulse span,
        aside a span {
          display: block;
          color: #789989;
          font-size: 11px;
          margin-top: 7px;
        }
        .publish {
          border-color: #3d7f63 !important;
          box-shadow: 0 0 28px rgba(85, 239, 170, 0.08);
        }
        .ideas {
          max-width: 1400px;
          margin: 16px auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .ideas article {
          border-top: 1px solid #2b5143;
          padding: 20px 4px;
        }
        .ideas b {
          color: #55efaa;
        }
        .ideas p {
          color: #7e9e90;
          line-height: 1.5;
        }
        @media (max-width: 800px) {
          .social {
            padding: 18px 14px;
          }
          .grid,
          .ideas {
            grid-template-columns: 1fr;
          }
          .signal {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

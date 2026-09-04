"use client";

import { useEffect, useMemo, useState } from "react";
import {
  interactionTopics,
  topicByKey,
  topicFor,
} from "../interaction-catalog";

type Context = { topic: string; source: string; label: string };
function niceRoute(route: string) {
  const [path] = route.split("?");
  if (path === "/") return "Dashboard";
  const name = path
    .split("/")
    .filter(Boolean)
    .map((x) => x.replace(/-/g, " "))
    .map((x) => x.replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
  return name
    .replace(/\bAi\b/g, "AI")
    .replace(/\bCrm\b/g, "CRM")
    .replace(/\bBpo\b/g, "BPO");
}

export default function GuideClient() {
  const [ctx, setCtx] = useState<Context>({
    topic: "start",
    source: "",
    label: "",
  });
  useEffect(() => {
    const q = new URLSearchParams(location.search),
      source = q.get("source") || "";
    setCtx({
      topic: q.get("topic") || topicFor(source || location.pathname).key,
      source,
      label: q.get("label") || "",
    });
  }, []);
  const selected = useMemo(() => topicByKey(ctx.topic), [ctx.topic]);
  function choose(key: string) {
    const q = new URLSearchParams();
    q.set("topic", key);
    if (ctx.source) q.set("source", ctx.source);
    history.replaceState({}, "", `/guide?${q.toString()}`);
    setCtx((v) => ({ ...v, topic: key, label: "" }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <main className="guide">
      <header>
        <a href="/solutions">I Am Magnanimous Way™</a>
        <nav>
          <a href="/start">Start Here</a>
          <a href="/security">Security</a>
          <a href="/support">Support</a>
          <a href="/pricing">Pricing</a>
        </nav>
      </header>
      <section className="hero">
        <div>
          <small>PLATFORM GUIDE</small>
          <h1>Go directly to working tools.</h1>
          <p>
            Choose an area to see what it does, then open its real workspace.
            Official outside references are included where they help verify
            important information.
          </p>
          {ctx.label && (
            <div className="selected">
              <b>You selected</b>
              <span>{ctx.label}</span>
              {ctx.source && <em>From {niceRoute(ctx.source)}</em>}
            </div>
          )}
        </div>
        <div className="rule">
          <b>HOW TO USE THIS GUIDE</b>
          <span>Choose an area → open the tool</span>
          <p>
            Buttons and links throughout the platform keep their real actions.
            Informational cards remain informational instead of pretending to be
            working features.
          </p>
        </div>
      </section>
      <section className="focus">
        <div className="focusHead">
          <small>CONTEXT</small>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
        </div>
        <div className="what">
          <small>WHAT HAPPENS</small>
          <p>{selected.whatHappens}</p>
        </div>
        <div className="inside">
          <small>CONTINUE INSIDE I AM</small>
          {selected.internal.map((route) => (
            <a key={route} href={route}>
              <span>{niceRoute(route)} — Open →</span>
            </a>
          ))}
        </div>
        <div className="research">
          <small>OFFICIAL RESEARCH & REFERENCE</small>
          {selected.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <b>{r.label}</b>
                <span>{r.note}</span>
              </div>
              <em>OFFICIAL SOURCE ↗</em>
            </a>
          ))}
        </div>
      </section>
      <section className="directory">
        <div className="heading">
          <small>PLATFORM DIRECTORY</small>
          <h2>Choose a platform area.</h2>
          <p>
            Pick any area to see its purpose, next steps and researched
            reference sources.
          </p>
        </div>
        <div className="grid">
          {interactionTopics.map((t, i) => (
            <button
              key={t.key}
              className={t.key === selected.key ? "active" : ""}
              onClick={() => choose(t.key)}
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              <h3>{t.title}</h3>
              <p>{t.summary}</p>
              <span>UNDERSTAND THIS AREA →</span>
            </button>
          ))}
        </div>
      </section>
      <section className="transparency">
        <div>
          <small>TRANSPARENCY</small>
          <h2>What a link does—and what it does not mean.</h2>
        </div>
        <div>
          <p>
            <b>Internal links</b> move into an I Am Magnanimous Way™ workspace
            or feature.
          </p>
          <p>
            <b>External links</b> open an outside source. The outside
            organization controls its site, eligibility rules, policies and
            outcomes.
          </p>
          <p>
            <b>Research links</b> are references, not endorsements or
            guarantees. Funding, grants, immigration, legal, tax, employment and
            compliance outcomes depend on the relevant authority and the
            user&apos;s facts.
          </p>
          <p>
            <b>AI actions</b> provide assistance and preparation. Users should
            review material before publishing, sending, filing or relying on it
            for consequential decisions.
          </p>
        </div>
      </section>
      <footer>
        <button
          onClick={() =>
            history.length > 1 ? history.back() : location.assign("/start")
          }
        >
          ← Go back
        </button>
        <a href="/start">Start Here</a>
        <a href="/solutions">All Solutions</a>
        <a href="/support">Get Support</a>
      </footer>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .guide {
          min-height: 100vh;
          background: #061016;
          color: #eafaff;
          font-family: Inter, system-ui, sans-serif;
          padding: 0 26px 60px;
          background-image:
            radial-gradient(
              circle at 78% 8%,
              rgba(55, 214, 255, 0.12),
              transparent 29%
            ),
            linear-gradient(rgba(65, 210, 240, 0.025) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(65, 210, 240, 0.025) 1px,
              transparent 1px
            );
          background-size:
            auto,
            38px 38px,
            38px 38px;
        }
        header,
        .hero,
        .focus,
        .directory,
        .transparency,
        footer {
          max-width: 1360px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          height: 72px;
          border-bottom: 1px solid #173642;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        header > a {
          color: #eefcff;
          text-decoration: none;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.09em;
        }
        header nav {
          display: flex;
          gap: 15px;
        }
        header nav a {
          color: #86a9b4;
          text-decoration: none;
          font-size: 10px;
        }
        .hero {
          padding: 72px 0 34px;
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 34px;
          align-items: end;
        }
        .hero small,
        .focus small,
        .heading small,
        .transparency small {
          font-size: 8px;
          letter-spacing: 0.19em;
          color: #5edbf0;
          font-weight: 900;
        }
        .hero h1 {
          font-size: clamp(50px, 7vw, 94px);
          line-height: 0.89;
          letter-spacing: -0.05em;
          margin: 12px 0 18px;
        }
        .hero > div > p {
          max-width: 850px;
          color: #8aa7b1;
          line-height: 1.7;
        }
        .selected {
          display: flex;
          gap: 9px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 20px;
        }
        .selected b {
          font-size: 8px;
          letter-spacing: 0.12em;
          color: #63dff2;
        }
        .selected span {
          padding: 8px 11px;
          border: 1px solid #2c6170;
          border-radius: 999px;
          background: #0a1c25;
          font-size: 11px;
        }
        .selected em {
          font-size: 9px;
          color: #668592;
          font-style: normal;
        }
        .rule {
          border: 1px solid #245163;
          border-radius: 18px;
          padding: 23px;
          background: #081821;
        }
        .rule b,
        .rule span {
          display: block;
        }
        .rule b {
          font-size: 8px;
          letter-spacing: 0.15em;
          color: #e8b85a;
        }
        .rule span {
          font-size: 19px;
          font-weight: 900;
          margin: 8px 0;
        }
        .rule p {
          font-size: 11px;
          color: #7896a1;
          line-height: 1.55;
        }
        .focus {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .focus > div {
          border: 1px solid #1b4250;
          border-radius: 17px;
          background: #08151d;
          padding: 23px;
        }
        .focusHead {
          grid-column: 1/-1;
          background: linear-gradient(135deg, #09202a, #08151d) !important;
        }
        .focus h2 {
          font-size: 36px;
          margin: 7px 0;
        }
        .focus p {
          color: #8ca7b1;
          line-height: 1.65;
        }
        .inside,
        .research {
          display: grid;
          align-content: start;
          gap: 7px;
        }
        .inside > a,
        .research > a {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          border-top: 1px solid #173944;
          padding: 11px 2px;
          text-decoration: none;
          color: #d8f8ff;
        }
        .inside > a span,
        .research b,
        .research span {
          display: block;
        }
        .inside > a span,
        .research b {
          font-size: 11px;
        }
        .inside > a b,
        .research em {
          font-size: 8px;
          color: #62d9ee;
          font-style: normal;
          white-space: nowrap;
        }
        .research span {
          font-size: 9px;
          color: #718d98;
          line-height: 1.45;
          margin-top: 3px;
        }
        .directory {
          padding-top: 50px;
        }
        .heading h2,
        .transparency h2 {
          font-size: 38px;
          margin: 7px 0;
        }
        .heading p {
          color: #77939d;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          margin-top: 18px;
        }
        .grid button {
          min-height: 220px;
          text-align: left;
          border: 1px solid #183c49;
          border-radius: 16px;
          background: #07141b;
          color: #e8f9ff;
          padding: 18px;
          cursor: pointer;
          position: relative;
        }
        .grid button:hover,
        .grid button.active {
          border-color: #4ea7bb;
          background: #0a1c25;
        }
        .grid button small {
          color: #477785;
        }
        .grid h3 {
          font-size: 19px;
          margin: 25px 0 8px;
        }
        .grid p {
          color: #76919b;
          font-size: 10px;
          line-height: 1.55;
        }
        .grid span {
          position: absolute;
          left: 18px;
          bottom: 16px;
          color: #64d9ec;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.09em;
        }
        .transparency {
          margin-top: 18px;
          border: 1px solid #274840;
          border-radius: 18px;
          padding: 28px;
          background: #081712;
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 28px;
        }
        .transparency p {
          font-size: 11px;
          color: #82a094;
          line-height: 1.6;
          border-top: 1px solid #18352e;
          padding-top: 10px;
        }
        .transparency b {
          color: #c9f3e6;
        }
        footer {
          margin-top: 34px;
          border-top: 1px solid #173642;
          padding-top: 18px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        footer button,
        footer a {
          border: 1px solid #264a57;
          border-radius: 9px;
          background: transparent;
          color: #b9e8f2;
          text-decoration: none;
          padding: 9px 11px;
          font-size: 9px;
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .hero,
          .transparency {
            grid-template-columns: 1fr;
          }
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .guide {
            padding: 0 14px 80px;
          }
          header nav a:not(:last-child) {
            display: none;
          }
          .hero {
            padding-top: 48px;
          }
          .focus {
            grid-template-columns: 1fr;
          }
          .focusHead {
            grid-column: auto;
          }
          .grid {
            grid-template-columns: 1fr;
          }
          .transparency {
            padding: 20px;
          }
          footer {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </main>
  );
}

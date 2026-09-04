"use client";

import { useEffect, useMemo, useState } from "react";
import {
  interactionTopics,
  topicByKey,
  topicFor,
} from "../interaction-catalog";

type Context = { topic: string; source: string; label: string };
type Lesson = {
  purpose: string;
  steps: string[];
  result: string;
  requirement: string;
};

const lessons: Record<string, Lesson> = {
  start: {
    purpose:
      "Find the correct working area without guessing which page to use.",
    steps: [
      "Open Start Here for a short list of common goals.",
      "Choose the goal that matches what you want to accomplish.",
      "Open the recommended workspace and use its main form or control.",
    ],
    result: "You arrive at a working tool, not another description page.",
    requirement:
      "No connection is required to browse. Individual tools may require sign-in.",
  },
  magnanimous: {
    purpose:
      "Create answers, drafts, plans and research with a connected AI provider.",
    steps: [
      "Open Magnanimous AI or choose a task-focused role.",
      "Select the mode that fits your request.",
      "Write a specific request and send it.",
      "Review the answer, continue the conversation, or start a new one.",
    ],
    result:
      "A generated response appears with the provider used and sources when available.",
    requirement:
      "At least one AI provider must show Ready. Live research also requires a search connection.",
  },
  "business-plan": {
    purpose: "Turn business information into an organized planning document.",
    steps: [
      "Open Business Plan and complete the intake fields.",
      "Describe the business, customer, offer, costs and intended audience.",
      "Generate the draft and review assumptions or missing information.",
      "Use Professional Workspace for deeper revisions and saved work.",
    ],
    result:
      "You receive a planning draft for review; approval, funding and profit are not guaranteed.",
    requirement:
      "AI generation requires a connected provider. Accurate financial inputs remain the user’s responsibility.",
  },
  business: {
    purpose:
      "Prepare strategy, offer, marketing, sales and operating recommendations.",
    steps: [
      "Open Business Command and choose the type of business work.",
      "Describe the real situation, goal and limitations.",
      "Run the analysis and review any sources shown.",
      "Copy the useful material or continue in Professional Workspace.",
    ],
    result:
      "You receive a practical business draft or analysis, not legal or accounting approval.",
    requirement:
      "AI requires a provider; current market research requires web search.",
  },
  crm: {
    purpose: "Keep contacts, leads, customers and follow-up records organized.",
    steps: [
      "Sign in and open CRM.",
      "Create or select a contact.",
      "Add the correct status, notes and next follow-up.",
      "Use Leads or Business Email when you are ready for authorized outreach.",
    ],
    result: "The customer record is saved inside the signed-in workspace.",
    requirement:
      "Sign-in is required. Sending messages requires a connected account and applicable consent.",
  },
  email: {
    purpose:
      "Draft, read or send business email through a supported connected account.",
    steps: [
      "Open Connections and connect Gmail or Outlook when available.",
      "Open Business Email or Connected Actions.",
      "Choose the account and prepare the message.",
      "Review the recipient, subject and content before confirming Send.",
    ],
    result:
      "Supported actions use the authorized mailbox; without a connection, the platform can only prepare text.",
    requirement: "A real email connection and permission to send are required.",
  },
  calling: {
    purpose:
      "Use free browser-to-browser calls or carrier calling when a carrier is connected.",
    steps: [
      "Open Phone and sign in.",
      "For a free call, create an invite link and send it to another signed-in user.",
      "Allow microphone access and wait for the other person to join.",
      "Use mobile or landline calling only after the page confirms a carrier and caller ID are connected.",
    ],
    result:
      "A browser call connects between users, or a carrier call is placed when its paid infrastructure is ready.",
    requirement:
      "Browser calls need two signed-in users and microphone permission. Public telephone calls need a carrier.",
  },
  video: {
    purpose:
      "Create downloadable animated text videos and optional AI background scenes.",
    steps: [
      "Open Video Studio and enter the title and video text.",
      "Choose Classic mode, or AI Visual only when it shows connected.",
      "Choose format and duration, then create the video.",
      "Preview, download and share it from the device.",
    ],
    result:
      "A video file appears when the browser supports local recording; the platform does not publish it automatically.",
    requirement:
      "Classic mode needs browser MediaRecorder support. AI backgrounds need sign-in and a visual provider.",
  },
  social: {
    purpose: "Prepare social posts, campaigns and captions for review.",
    steps: [
      "Open Social Studio and choose the platform or content type.",
      "Enter the topic, audience and desired outcome.",
      "Generate the draft and correct any unsupported claims.",
      "Copy it or use a genuinely connected publishing action when available.",
    ],
    result:
      "You receive a social-content draft. It is not posted automatically.",
    requirement:
      "AI generation requires a provider; direct publishing requires an authorized social connection.",
  },
  connections: {
    purpose: "Authorize outside services that support real platform actions.",
    steps: [
      "Open Connections and find the service you need.",
      "Read what permissions the connection requests.",
      "Choose Connect and complete the provider’s authorization page.",
      "Return and confirm the service shows Connected before using it.",
    ],
    result:
      "A successful connection enables only the actions supported for that provider.",
    requirement:
      "The outside provider account and its authorization must be valid.",
  },
  knowledge: {
    purpose:
      "Save workspace notes and sources for later AI answers, with optional live research.",
    steps: [
      "Sign in and open Knowledge Center.",
      "Add a note, public webpage or supported feed.",
      "Search saved knowledge to confirm it was stored.",
      "Use Research mode; enable live web/news only when it shows Connected.",
    ],
    result:
      "Saved material becomes available to AI requests in that private workspace.",
    requirement:
      "Sign-in is required. Live web and news results require a search provider.",
  },
  "finance-people": {
    purpose:
      "Organize internal financial and staffing information for planning.",
    steps: [
      "Sign in and open Finance & People.",
      "Enter actual records rather than sample figures.",
      "Review totals, dates and categories.",
      "Use the information as internal planning support and verify regulated obligations separately.",
    ],
    result:
      "The workspace displays the records and summaries that were actually saved.",
    requirement:
      "Sign-in is required. This area does not replace payroll, tax, legal or accounting professionals.",
  },
  billing: {
    purpose:
      "Compare available plans and manage a real subscription when billing is connected.",
    steps: [
      "Open Pricing and compare included features.",
      "Choose a paid plan only if checkout is available.",
      "Review the amount and billing interval on the secure checkout page.",
      "Use Billing Support or the customer portal to manage or cancel.",
    ],
    result:
      "A subscription changes only after payment succeeds; browsing pricing creates no charge.",
    requirement:
      "Paid checkout requires a correctly configured Stripe account and price.",
  },
  security: {
    purpose:
      "Understand data handling, permissions and provider boundaries before authorizing services.",
    steps: [
      "Read Security, Privacy and Terms.",
      "Review what data a requested connection can access.",
      "Connect only the services needed for the intended task.",
      "Remove or restrict access when it is no longer needed.",
    ],
    result: "You can make an informed choice about account and data access.",
    requirement:
      "Users remain responsible for protecting passwords and reviewing outside-provider terms.",
  },
  support: {
    purpose:
      "Report a problem, request help or submit a review for moderation.",
    steps: [
      "Open Support and choose the relevant issue type.",
      "Describe what you tried and what happened.",
      "Include useful details without passwords or secret keys.",
      "Submit and retain any reference shown.",
    ],
    result:
      "A support or feedback record is created when the form confirms success.",
    requirement:
      "Do not include credentials or unnecessary sensitive information.",
  },
  advertising: {
    purpose:
      "Review or request disclosed sponsored placement without mixing ads into AI answers.",
    steps: [
      "Open Advertise and review the available placement information.",
      "Provide accurate advertiser and destination details.",
      "Review pricing and disclosure requirements before paying.",
      "Confirm the placement is active before treating it as published.",
    ],
    result:
      "A placement request or paid campaign may be created; traffic and sales are not guaranteed.",
    requirement:
      "Payment and publication depend on configured billing and owner approval.",
  },
  owner: {
    purpose: "Manage protected platform settings and operational records.",
    steps: [
      "Sign in through Owner Login.",
      "Open the specific owner area needed.",
      "Review current status before changing settings.",
      "Save one change at a time and confirm the success message.",
    ],
    result: "Authorized platform settings or records are updated.",
    requirement:
      "Platform-owner access is required. Provider credentials should only be entered in protected settings.",
  },
};
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
  const lesson = lessons[selected.key] || lessons.start;
  function choose(key: string) {
    const q = new URLSearchParams();
    q.set("topic", key);
    if (ctx.source) q.set("source", ctx.source);
    history.replaceState({}, "", `/guide?${q.toString()}`);
    setCtx((v) => ({ ...v, topic: key, label: "" }));
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
          <small>WHAT THIS AREA DOES</small>
          <p>{lesson.purpose}</p>
          <b>Expected result</b>
          <p>{lesson.result}</p>
          <b>What must be ready</b>
          <p>{lesson.requirement}</p>
        </div>
        <div className="how">
          <small>HOW TO USE IT</small>
          <ol>
            {lesson.steps.map((step, index) => (
              <li key={step}>
                <b>{index + 1}</b>
                <span>{step}</span>
              </li>
            ))}
          </ol>
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
              {r.label} — {r.note} — Official source ↗
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
          {interactionTopics.map((t, i) => {
            const itemLesson = lessons[t.key] || lessons.start;
            const active = t.key === selected.key;
            return (
              <article key={t.key} className={active ? "active" : ""}>
                <button onClick={() => choose(t.key)} aria-expanded={active}>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                  <h3>{t.title}</h3>
                  <p>{t.summary}</p>
                  <span>
                    {active ? "INSTRUCTIONS OPEN" : "SHOW INSTRUCTIONS →"}
                  </span>
                </button>
                {active && (
                  <div className="cardLesson">
                    <h4>How to use this area</h4>
                    <ol>
                      {itemLesson.steps.map((step, index) => (
                        <li key={step}>
                          <b>{index + 1}</b>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <p>
                      <b>Expected result:</b> {itemLesson.result}
                    </p>
                    <p>
                      <b>Required:</b> {itemLesson.requirement}
                    </p>
                    <div className="lessonLinks">
                      {t.internal.map((route) => (
                        <a key={route} href={route}>
                          {niceRoute(route)} — Open →
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
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
        .what > b {
          display: block;
          margin-top: 16px;
          color: #d8f8ff;
          font-size: 13px;
        }
        .how ol,
        .cardLesson ol {
          list-style: none;
          padding: 0;
          margin: 14px 0 0;
          display: grid;
          gap: 10px;
        }
        .how li,
        .cardLesson li {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 10px;
          align-items: start;
          color: #b8ced6;
          line-height: 1.55;
        }
        .how li > b,
        .cardLesson li > b {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #0d2a35;
          color: #69def0;
        }
        .inside,
        .research {
          display: grid;
          align-content: start;
          gap: 7px;
        }
        .inside > a,
        .research > a {
          display: block;
          border-top: 1px solid #173944;
          padding: 11px 2px;
          text-decoration: none;
          color: #d8f8ff;
          font-size: 12px;
          line-height: 1.55;
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
        .grid > article {
          min-width: 0;
        }
        .grid > article.active {
          grid-column: 1/-1;
          display: grid;
          grid-template-columns: minmax(240px, 0.7fr) minmax(0, 1.3fr);
          gap: 9px;
        }
        .grid > article > button {
          width: 100%;
          height: 100%;
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
        .grid > article > button:hover,
        .grid > article.active > button {
          border-color: #4ea7bb;
          background: #0a1c25;
        }
        .grid > article > button small {
          color: #477785;
        }
        .grid h3 {
          font-size: 19px;
          margin: 25px 0 8px;
        }
        .grid > article > button p {
          color: #76919b;
          font-size: 10px;
          line-height: 1.55;
        }
        .grid > article > button > span {
          position: absolute;
          left: 18px;
          bottom: 16px;
          color: #64d9ec;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.09em;
        }
        .cardLesson {
          border: 1px solid #2a6272;
          border-radius: 16px;
          background: #091b23;
          padding: 20px;
        }
        .cardLesson h4 {
          margin: 0;
          font-size: 21px;
        }
        .cardLesson p {
          font-size: 13px;
          color: #9bb4bd;
          line-height: 1.55;
        }
        .lessonLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }
        .lessonLinks a {
          border: 1px solid #367184;
          border-radius: 9px;
          padding: 10px 12px;
          color: #d9faff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
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
          .grid > article.active {
            grid-template-columns: 1fr;
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

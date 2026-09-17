"use client";

const cards = [
  {
    key: "MCP",
    className: "mcp",
    eyebrow: "CONNECT",
    title: "MCP",
    summary: "Standardizes how Magnanimous AI reaches tools, resources, and prompts.",
    plain: "Think of MCP like a universal plug. It gives Magnanimous one consistent way to connect to many approved tools.",
    href: "/ai-connectors",
    cta: "OPEN AI CONNECTORS",
    steps: [
      ["Magnanimous AI", "Host / client"],
      ["MCP protocol", "Shared connection language"],
      ["MCP servers", "Approved tool gateways"],
      ["APIs • databases • files", "Real capabilities"],
    ],
  },
  {
    key: "RAG",
    className: "rag",
    eyebrow: "KNOW",
    title: "RAG",
    summary: "Finds the most relevant knowledge before Magnanimous answers.",
    plain: "Think of RAG like checking the right pages in a library before answering a question.",
    href: "/knowledge",
    cta: "OPEN KNOWLEDGE",
    steps: [
      ["User question", "What do you want to know?"],
      ["Retriever", "Searches trusted sources"],
      ["Relevant context", "Keeps only useful pieces"],
      ["Magnanimous answer", "Uses question + context"],
    ],
  },
  {
    key: "AGENT",
    className: "agent",
    eyebrow: "ACT",
    title: "AI Agents",
    summary: "Uses reasoning, planning, tools, and feedback to pursue a goal.",
    plain: "Think of an agent like a worker that can make a plan, use tools, check what happened, and continue until the job is done.",
    href: "/agents",
    cta: "OPEN AGENT WORKSPACE",
    steps: [
      ["Goal", "What needs to happen?"],
      ["Plan", "Choose the next safe step"],
      ["Observe ↔ Act", "Use tools and check results"],
      ["Result", "Return the verified outcome"],
    ],
  },
];

export default function AIArchitecture() {
  return (
    <main className="page">
      <header className="topbar">
        <a href="/ai-apps">← AI Apps</a>
        <span>I AM MAGNANIMOUS WAY™ • AI ARCHITECTURE</span>
        <a href="/ai-chat">Open Magnanimous →</a>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <small>THREE DIFFERENT JOBS • ONE MAGNANIMOUS AI</small>
          <h1>
            <span className="blue">MCP</span>
            <i>vs</i>
            <span className="teal">RAG</span>
            <i>vs</i>
            <span className="purple">AI Agents</span>
          </h1>
          <p>
            MCP connects capabilities. RAG brings the right knowledge. AI agents plan and act.
            Magnanimous AI can combine all three while remaining the main brain, identity,
            orchestration, memory, and decision layer.
          </p>
        </div>
        <div className="brain" aria-hidden="true">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="core">M</div>
          <span className="node n1">MCP</span>
          <span className="node n2">RAG</span>
          <span className="node n3">AGENT</span>
        </div>
      </section>

      <section className="cards" aria-label="MCP, RAG and AI agents comparison">
        {cards.map((card) => (
          <article className={`card ${card.className}`} key={card.key}>
            <div className="cardHead">
              <small>{card.eyebrow}</small>
              <div className="badge">{card.key}</div>
              <h2>{card.title}</h2>
              <p>{card.summary}</p>
            </div>

            <div className="flow">
              {card.steps.map(([name, detail], index) => (
                <div className="flowStep" key={name}>
                  <div className="stepNumber">{index + 1}</div>
                  <div>
                    <b>{name}</b>
                    <span>{detail}</span>
                  </div>
                  {index < card.steps.length - 1 && <em>↓</em>}
                </div>
              ))}
            </div>

            <div className="simple">
              <b>Simple meaning</b>
              <p>{card.plain}</p>
            </div>

            <a className="open" href={card.href}>
              {card.cta} →
            </a>
          </article>
        ))}
      </section>

      <section className="together">
        <div className="togetherTitle">
          <small>HOW MAGNANIMOUS USES THEM TOGETHER</small>
          <h2>Connect → Know → Plan → Act → Verify</h2>
          <p>
            They are not replacements for each other. They solve different parts of the same job.
          </p>
        </div>
        <div className="pipeline">
          <div><b>1</b><strong>User goal</strong><span>Ask Magnanimous</span></div>
          <i>→</i>
          <div><b>2</b><strong>RAG</strong><span>Find trusted context</span></div>
          <i>→</i>
          <div><b>3</b><strong>Agent</strong><span>Plan the work</span></div>
          <i>→</i>
          <div><b>4</b><strong>MCP</strong><span>Use approved tools</span></div>
          <i>→</i>
          <div><b>5</b><strong>Magnanimous</strong><span>Verify and return result</span></div>
        </div>
      </section>

      <section className="quick">
        <a href="/ai-connectors"><span>01</span><b>MCP Connectors</b><small>Connect approved tools and services</small></a>
        <a href="/knowledge"><span>02</span><b>Knowledge / RAG</b><small>Search and ground answers in useful context</small></a>
        <a href="/agents"><span>03</span><b>AI Agents</b><small>Plan, act, observe, and complete goals</small></a>
        <a href="/ai-chat"><span>04</span><b>Magnanimous AI</b><small>Use the complete system from one place</small></a>
      </section>

      <footer>
        <b>I AM MAGNANIMOUS WAY™</b>
        <span>Magnanimous AI remains the public AI identity and command layer.</span>
      </footer>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#f6f8fb;color:#10202c;padding:18px 22px 42px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.topbar{max-width:1460px;margin:0 auto 18px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;color:#61717f;font-size:10px;font-weight:800;letter-spacing:.12em}.topbar a{color:#215ed9;text-decoration:none}.topbar a:last-child{text-align:right}.hero{max-width:1460px;margin:auto;border:1px solid #d8e0e7;border-radius:26px;padding:34px 38px;background:linear-gradient(135deg,#fff 0%,#f6fbff 52%,#f6f1ff 100%);display:grid;grid-template-columns:1fr 330px;align-items:center;box-shadow:0 22px 65px rgba(25,47,71,.08)}.heroCopy small,.together small{font-size:10px;letter-spacing:.18em;font-weight:900;color:#6a7f90}.hero h1{margin:10px 0 14px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:clamp(42px,7vw,86px);line-height:.95;letter-spacing:-.055em}.hero h1 i{font-style:normal;color:#18242e;font-size:.42em;letter-spacing:-.02em}.blue{color:#2d60e8}.teal{color:#159daf}.purple{color:#7d3ce3}.hero p{max-width:880px;margin:0;color:#586b79;font-size:15px;line-height:1.65}.brain{width:260px;height:260px;margin:auto;position:relative;display:grid;place-items:center}.orbit{position:absolute;border:1px solid #a5b5c2;border-radius:50%}.orbit.one{inset:23px;border-color:#7fcbd2}.orbit.two{inset:55px;border-style:dashed;border-color:#b59be7}.core{width:92px;height:92px;border-radius:26px;background:linear-gradient(145deg,#091725,#163e5a);color:#fff;display:grid;place-items:center;font:900 42px Georgia;box-shadow:0 18px 45px rgba(21,77,106,.3),inset 0 0 0 1px rgba(255,255,255,.14)}.node{position:absolute;padding:7px 10px;border-radius:9px;background:#fff;border:1px solid #d8e0e7;font-size:9px;font-weight:900;box-shadow:0 8px 22px rgba(35,51,65,.08)}.n1{top:16px;left:28px;color:#2d60e8}.n2{right:9px;top:103px;color:#159daf}.n3{bottom:11px;left:67px;color:#7d3ce3}.cards{max-width:1460px;margin:22px auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{--accent:#2d60e8;--soft:#eef4ff;background:#fff;border:1px solid #d6dee5;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(25,47,71,.07);display:flex;flex-direction:column}.card.rag{--accent:#159daf;--soft:#e9f8f6}.card.agent{--accent:#7d3ce3;--soft:#f4edff}.cardHead{padding:24px 24px 18px;background:linear-gradient(180deg,var(--soft),#fff)}.cardHead small{color:var(--accent);font-size:9px;letter-spacing:.18em;font-weight:900}.badge{margin:18px 0 8px;width:58px;height:58px;border-radius:17px;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:950;box-shadow:0 12px 28px color-mix(in srgb,var(--accent) 25%,transparent)}.cardHead h2{margin:0 0 8px;font-size:30px;letter-spacing:-.03em}.cardHead p{margin:0;color:#5c6d7a;line-height:1.5;font-size:13px;min-height:60px}.flow{padding:8px 22px 4px}.flowStep{display:grid;grid-template-columns:34px 1fr;gap:11px;align-items:center;position:relative;padding:10px 0}.flowStep em{position:absolute;left:13px;bottom:-7px;color:#a9b5be;font-style:normal;font-size:14px}.stepNumber{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--soft);color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 30%,#d9e0e6);font-size:10px;font-weight:950}.flowStep b,.flowStep span{display:block}.flowStep b{font-size:13px}.flowStep span{margin-top:2px;color:#7a8994;font-size:11px}.simple{margin:12px 22px;padding:14px 15px;border-radius:15px;background:#f8fafc;border:1px solid #e2e7eb}.simple b{font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.08em}.simple p{margin:6px 0 0;color:#61717c;font-size:12px;line-height:1.55}.open{margin:auto 22px 22px;padding:12px 14px;border-radius:11px;background:var(--accent);color:#fff;text-decoration:none;text-align:center;font-size:10px;font-weight:950;letter-spacing:.08em}.together{max-width:1460px;margin:22px auto;background:#0a121b;color:#effaff;border-radius:25px;padding:30px;border:1px solid #1d3445;box-shadow:0 22px 65px rgba(5,14,24,.18)}.together small{color:#6ecff0}.together h2{margin:7px 0;font-size:clamp(27px,4vw,48px);letter-spacing:-.04em}.together p{margin:0;color:#8da4b4}.pipeline{margin-top:24px;display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr auto 1fr;gap:10px;align-items:center}.pipeline>div{min-height:108px;padding:15px;border-radius:16px;background:#101f2b;border:1px solid #203e52}.pipeline>div b{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:#183a50;color:#72ddff;font-size:9px}.pipeline strong,.pipeline span{display:block}.pipeline strong{margin-top:13px;font-size:13px}.pipeline span{margin-top:4px;color:#7f98a8;font-size:10px;line-height:1.4}.pipeline>i{font-style:normal;color:#486578}.quick{max-width:1460px;margin:22px auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.quick a{padding:17px;border-radius:16px;border:1px solid #d6dee5;background:#fff;text-decoration:none;color:#13232f;box-shadow:0 10px 32px rgba(25,47,71,.05)}.quick span,.quick b,.quick small{display:block}.quick span{font-size:9px;font-weight:950;color:#6e7f8b}.quick b{margin:9px 0 5px;font-size:14px}.quick small{color:#7a8994;line-height:1.45}.quick a:hover{transform:translateY(-2px);box-shadow:0 16px 42px rgba(25,47,71,.1)}footer{max-width:1460px;margin:28px auto 0;padding:18px 2px;display:flex;justify-content:space-between;gap:20px;color:#70808c;font-size:10px;border-top:1px solid #dde4e9}footer b{color:#273745;letter-spacing:.08em}@media(max-width:1000px){.hero{grid-template-columns:1fr}.brain{margin-top:28px}.cards{grid-template-columns:1fr}.cardHead p{min-height:0}.pipeline{grid-template-columns:1fr}.pipeline>i{transform:rotate(90deg);text-align:center}.quick{grid-template-columns:1fr 1fr}}@media(max-width:640px){.page{padding:12px 12px 32px}.topbar{grid-template-columns:1fr 1fr}.topbar span{display:none}.hero{padding:24px 18px;border-radius:20px}.hero h1{gap:7px}.brain{width:220px;height:220px}.cards{gap:12px}.quick{grid-template-columns:1fr}.together{padding:22px 16px}footer{flex-direction:column}.topbar a:last-child{text-align:right}}
      `}</style>
    </main>
  );
}

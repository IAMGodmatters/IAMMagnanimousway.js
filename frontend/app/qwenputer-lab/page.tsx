'use client';

import { useEffect, useState } from 'react';
import { getPlatformAuthToken } from '../lib/magnanimous-session';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const upstream = 'https://github.com/divagr18/qwenputer';
const article = 'https://divagr.com/blog/qwenputer';
const model = 'https://huggingface.co/divagr1925/Qwen3.5-4B-Qwenputer';
const reportUrl = 'https://agent.tinyfish.ai/playground/research/share/01a1a184-17ad-7fd7-af31-efad4c962b30';

type ResearchDescriptor = {
  id: string;
  status: string;
  production_dispatch: boolean;
  actions: string[];
  resource_requirements?: {
    minimum_gpu_vram_gb?: number;
    checkpoint_size_gb?: number;
  };
};

type ResearchSummary = {
  identity?: string;
  model_internal_computing_capabilities?: ResearchDescriptor[];
};

export default function QwenputerLab() {
  const [summary, setSummary] = useState<ResearchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getPlatformAuthToken();
    if (!token) {
      location.replace('/login?returnTo=%2Fqwenputer-lab');
      return;
    }

    fetch(api + '/api/research/capabilities', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (response.status === 401) {
          location.replace('/login?returnTo=%2Fqwenputer-lab');
          return;
        }
        if (!response.ok) throw new Error(body.detail || 'Research capabilities are unavailable.');
        setSummary(body);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Research status could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  const descriptor = summary?.model_internal_computing_capabilities?.find(
    (item) => item.id === 'qwenputer-riscv-experimental',
  );

  return (
    <main className="lab">
      <header className="top">
        <a href="/ai-architecture">← AI Architecture</a>
        <span>I AM MAGNANIMOUS WAY™ • RESEARCH LAB</span>
        <a href="/ai-chat">Open Magnanimous →</a>
      </header>

      <section className="hero">
        <div className="eyebrow">OPTIONAL RESEARCH • LOCAL-FIRST • NO AUTOMATIC GPU SPEND</div>
        <h1>Model-internal computing</h1>
        <p>
          Explore Qwenputer: an experimental RISC-V processor compiled into a language model.
          Magnanimous AI remains the brain and decides whether any capability is ready to use.
        </p>
        <div className="status" role="status">
          <span className="dot" />
          {loading ? 'Checking the Magnanimous research registry…' : descriptor ? 'Registered • Research only' : 'Research registry not confirmed'}
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="grid">
        <article className="panel feature">
          <small>WHAT THE EXPERIMENT DOES</small>
          <h2>A processor inside model weights</h2>
          <p>
            Qwenputer adds compiler-generated transformer layers that implement a 32-bit
            RISC-V CPU. It uses the model's Gated DeltaNet recurrent state as addressable
            memory. That is a research demonstration, not a replacement for a normal CPU.
          </p>
          <div className="facts">
            <div><b>RV32IM</b><span>32-bit integer CPU</span></div>
            <div><b>Gated DeltaNet</b><span>State used as RAM</span></div>
            <div><b>18.8 GB</b><span>Main model checkpoint</span></div>
            <div><b>24 GB</b><span>Documented NVIDIA GPU class</span></div>
          </div>
        </article>

        <article className="panel">
          <small>MAGNANIMOUS EXECUTION POLICY</small>
          <h2>Safe by default</h2>
          <ul>
            <li>Research registry only; no production dispatch.</li>
            <li>No automatic model download or external GPU provisioning.</li>
            <li>No changes to core reasoning, memory, or existing tool routes.</li>
            <li>Any future adapter must be isolated, measured, and explicitly enabled.</li>
          </ul>
          <div className="policy">
            <span>Registry status</span><b>{descriptor?.status || 'Research-only default'}</b>
            <span>Production dispatch</span><b>{descriptor?.production_dispatch ? 'Enabled' : 'Disabled'}</b>
          </div>
        </article>
      </section>

      <section className="panel local">
        <small>YOUR COMPUTER • CPU-ONLY CHECKS</small>
        <h2>Start with the lightweight local lab</h2>
        <p>
          The companion kit tests the one-hot memory abstraction with ordinary Python.
          It does not install the 18.8 GB model. Run the preflight before considering the
          full checkpoint.
        </p>
        <pre>cd "$HOME\Documents\MagnanimousResearch\qwenputer-lab"{'\n'}.\run-local-checks.ps1 -CheckpointDirectory 'D:\Qwenputer\models'</pre>
        <p className="muted">
          The reference tests validate the memory model only. They do not claim to run
          the Qwenputer transformer or RISC-V instruction set.
        </p>
      </section>

      <section className="links">
        <a href={upstream} target="_blank" rel="noreferrer"><b>Source repository</b><span>Inspect the original MIT-licensed code →</span></a>
        <a href={article} target="_blank" rel="noreferrer"><b>Technical explanation</b><span>Read how Gated DeltaNet becomes RAM →</span></a>
        <a href={model} target="_blank" rel="noreferrer"><b>Model checkpoint</b><span>Review hardware and model details before downloading →</span></a>
        <a href={reportUrl} target="_blank" rel="noreferrer"><b>Full research report</b><span>Open the cited technical assessment →</span></a>
      </section>

      <footer>Magnanimous AI remains the owner of orchestration, memory, identity, and production decisions.</footer>

      <style jsx>{`
        *{box-sizing:border-box}.lab{min-height:100vh;padding:22px 26px 56px;background:radial-gradient(circle at 82% 0%,rgba(42,107,169,.22),transparent 30%),linear-gradient(145deg,#06111d,#0a1b2d 58%,#07111b);color:#eaf5ff;font-family:Inter,system-ui,sans-serif}
        .top,.hero,.grid,.local,.links,footer{max-width:1420px;margin-left:auto;margin-right:auto}.top{display:flex;justify-content:space-between;gap:12px;color:#90a9bd;font-size:10px;letter-spacing:.13em}.top a{color:#83c9ff;text-decoration:none}
        .hero{margin-top:28px;padding:36px;border:1px solid rgba(113,170,220,.25);border-radius:25px;background:linear-gradient(120deg,rgba(10,30,48,.94),rgba(14,43,69,.82));box-shadow:0 22px 60px rgba(0,0,0,.2)}
        .eyebrow,.panel>small{font-size:9px;font-weight:900;letter-spacing:.18em;color:#e4b85f}.hero h1{margin:12px 0;font-size:clamp(38px,6vw,72px);letter-spacing:-.05em;line-height:1}.hero p{max-width:900px;color:#b1c6d7;line-height:1.7;font-size:15px}.status{display:inline-flex;align-items:center;gap:9px;margin-top:8px;padding:9px 13px;border:1px solid rgba(227,184,95,.35);border-radius:999px;color:#f2d69a;background:rgba(117,78,24,.15);font-size:11px}.dot{width:7px;height:7px;border-radius:50%;background:#e7bd67;box-shadow:0 0 13px #d49c39}.error{color:#ffb5ad!important}
        .grid{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:14px}.panel{padding:24px;border:1px solid rgba(105,155,195,.22);border-radius:20px;background:rgba(8,24,39,.9);box-shadow:0 16px 44px rgba(0,0,0,.15)}.panel h2{margin:9px 0 10px;font-size:25px;letter-spacing:-.03em}.panel p,.panel li{color:#a8bdcc;font-size:13px;line-height:1.65}.panel ul{padding-left:18px}.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:22px}.facts div{padding:13px;border-radius:13px;background:#0d263b;border:1px solid rgba(111,169,216,.18)}.facts b,.facts span{display:block}.facts b{font-size:13px;color:#f0c66d}.facts span{margin-top:5px;color:#91aabd;font-size:10px}.policy{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(105,155,195,.2);font-size:11px;color:#9eb5c7}.policy b{color:#f0c66d;text-align:right}
        .local{margin-top:14px}.local pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:15px;border:1px solid rgba(226,183,92,.24);border-radius:12px;background:#040b12;color:#e9ca84;font-size:12px}.muted{font-size:11px!important;color:#7f9bad!important}.links{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.links a{padding:17px;border:1px solid rgba(105,155,195,.22);border-radius:14px;background:#0a1d2d;color:#eaf5ff;text-decoration:none}.links a:hover{border-color:#cda356;background:#102a40}.links b,.links span{display:block}.links b{font-size:13px}.links span{margin-top:8px;color:#98b2c5;font-size:10px;line-height:1.5}footer{margin-top:25px;padding-top:17px;border-top:1px solid rgba(105,155,195,.2);font-size:10px;color:#829daf}
        @media(max-width:900px){.grid{grid-template-columns:1fr}.links{grid-template-columns:1fr 1fr}.facts{grid-template-columns:1fr 1fr}}
        @media(max-width:580px){.lab{padding:14px 12px 40px}.top span{display:none}.hero{padding:24px 18px}.panel{padding:18px}.links{grid-template-columns:1fr}.facts{grid-template-columns:1fr 1fr}}
      `}</style>
    </main>
  );
}

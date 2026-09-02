'use client';

import { useEffect, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Agent = {
  id: string;
  name: string;
  instructions: string;
  opening_message: string;
  twilio_voice: string;
  tavus_replica_id: string;
  tavus_persona_id: string;
  active: number;
};

type Config = {
  free_browser_calling: boolean;
  ai_engine: boolean;
  twilio_configured: boolean;
  tavus_configured: boolean;
  full_business: boolean;
  platform_owner: boolean;
  inbound_twilio_webhook: string;
  note: string;
};

async function read(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { detail: text || `Request failed (${response.status})` }; }
}

export default function AIReceptionist() {
  const [token, setToken] = useState('');
  const [config, setConfig] = useState<Config | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState('');
  const [phone, setPhone] = useState('');
  const [opening, setOpening] = useState('');
  const [consent, setConsent] = useState(false);
  const [disclosure, setDisclosure] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationUrl, setConversationUrl] = useState('');
  const [agentName, setAgentName] = useState('AI Receptionist');
  const [instructions, setInstructions] = useState('Be a helpful, concise AI receptionist. Answer questions, qualify the caller, organize next steps, and never pretend to be human.');
  const [agentOpening, setAgentOpening] = useState('Hello. This is an automated AI assistant with I AM Magnanimous Way. I am not a human. How may I help you today?');

  function headers(json = false, activeToken = token) {
    const h: Record<string, string> = { Authorization: `Bearer ${activeToken}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async function load(activeToken: string) {
    const [configResponse, agentsResponse] = await Promise.all([
      fetch(`${api}/api/voice-agent/config`, { headers: headers(false, activeToken) }),
      fetch(`${api}/api/voice-agent/agents`, { headers: headers(false, activeToken) })
    ]);
    if (configResponse.status === 401 || agentsResponse.status === 401) {
      location.replace('/login');
      return;
    }
    const [configData, agentData] = await Promise.all([read(configResponse), read(agentsResponse)]);
    if (configResponse.ok) setConfig(configData);
    if (agentsResponse.ok) {
      const list = agentData.agents || [];
      setAgents(list);
      if (!agentId && list[0]?.id) setAgentId(list[0].id);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('odin_admin_token') || localStorage.getItem('iam_account_token') || '';
    if (!saved) {
      location.replace('/login');
      return;
    }
    setToken(saved);
    load(saved).catch(() => setMessage('Unable to load the AI receptionist workspace.'));
  }, []);

  async function placeCall() {
    if (!phone.trim() || busy) return;
    if (!consent) {
      setMessage('Confirm that this recipient may be contacted before placing an automated call.');
      return;
    }
    setBusy(true);
    setMessage('Placing the AI call…');
    try {
      const response = await fetch(`${api}/api/voice-agent/call`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({
          to: phone.trim(),
          agent_id: agentId || undefined,
          opening_message: opening.trim() || undefined,
          consent_confirmed: consent,
          ai_disclosure_accepted: disclosure
        })
      });
      const data = await read(response);
      if (!response.ok) throw new Error(data.detail || 'Unable to place the call.');
      setMessage(`Call started through ${data.provider}. Status: ${data.status}. Call ID: ${data.call_id}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to place the call.');
    } finally {
      setBusy(false);
    }
  }

  async function startAvatar() {
    if (busy) return;
    setBusy(true);
    setMessage('Starting the human-video AI conversation…');
    try {
      const response = await fetch(`${api}/api/voice-agent/avatar`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ agent_id: agentId || undefined })
      });
      const data = await read(response);
      if (!response.ok) throw new Error(data.detail || 'Unable to start the avatar conversation.');
      setConversationUrl(data.conversation_url || '');
      setMessage(`Human-video conversation started with ${data.agent?.name || 'the AI assistant'}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to start the avatar conversation.');
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    if (!agentName.trim() || busy) return;
    setBusy(true);
    setMessage('Creating AI agent…');
    try {
      const response = await fetch(`${api}/api/voice-agent/agents`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ name: agentName.trim(), instructions, opening_message: agentOpening })
      });
      const data = await read(response);
      if (!response.ok) throw new Error(data.detail || 'Unable to create the agent.');
      setMessage('AI agent created.');
      await load(token);
      if (data.id) setAgentId(data.id);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create the agent.');
    } finally {
      setBusy(false);
    }
  }

  const selected = agents.find(agent => agent.id === agentId);
  const externalReady = Boolean(config?.twilio_configured || config?.tavus_configured);

  return <main className="page">
    <header>
      <div><a href="/">← Dashboard</a><span>I AM • AI RECEPTIONIST</span></div>
      <nav><a href="/virtual-assistant">Virtual Assistant</a><a href="/phone">Call Center</a><a href="/pricing">Plans</a></nav>
    </header>

    <section className="hero">
      <div>
        <small>VOICE + HUMAN VIDEO</small>
        <h1>AI agents that can talk, call and appear on video.</h1>
        <p>Create multiple assistants for reception, follow-up, sales, customer service or scheduling. Free browser calling remains separate; ordinary telephone calls and photorealistic live video activate only when their external providers are securely connected.</p>
      </div>
      <div className="statusGrid">
        <Status label="Odin AI" ready={Boolean(config?.ai_engine)} detail="Cloudflare Workers AI" />
        <Status label="Free browser calling" ready={Boolean(config?.free_browser_calling)} detail="WebRTC" />
        <Status label="Phone carrier" ready={Boolean(config?.twilio_configured)} detail="Twilio" />
        <Status label="Human video" ready={Boolean(config?.tavus_configured)} detail="Tavus CVI" />
      </div>
    </section>

    {message && <div className="notice">{message}</div>}

    <section className="grid">
      <article className="panel">
        <small>AGENT</small>
        <h2>Select a digital worker</h2>
        <select value={agentId} onChange={event => setAgentId(event.target.value)}>
          {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
        </select>
        {selected && <div className="agentCard"><b>{selected.name}</b><p>{selected.instructions || 'General-purpose AI assistant.'}</p><span>{selected.opening_message}</span></div>}
        <div className="plan">{config?.platform_owner ? 'Platform owner access' : config?.full_business ? 'Full Business active' : 'Free tier active'}</div>
      </article>

      <article className="panel call">
        <small>OUTBOUND AI CALL</small>
        <h2>Call a mobile or landline</h2>
        <label>Phone number in international format</label>
        <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="+14155551212" />
        <label>Optional opening message</label>
        <textarea value={opening} onChange={event => setOpening(event.target.value)} placeholder="Leave blank to use the selected agent's greeting." />
        <label className="check"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>I confirm this recipient may be contacted and the outreach complies with applicable calling/consent rules.</span></label>
        <label className="check"><input type="checkbox" checked={disclosure} onChange={event => setDisclosure(event.target.checked)} /><span>The call will clearly disclose that the assistant is automated AI and is not a human.</span></label>
        <button onClick={placeCall} disabled={busy || !phone.trim() || !config?.twilio_configured}>{busy ? 'WORKING…' : config?.twilio_configured ? 'PLACE AI CALL →' : 'TWILIO CONNECTION REQUIRED'}</button>
        <p className="fine">Calls are not recorded by this feature by default. A caller who says “stop calling” or “do not call” is automatically added to the workspace do-not-call list.</p>
      </article>

      <article className="panel video">
        <small>LIVE HUMAN-LIKE VIDEO</small>
        <h2>Start a face-to-face AI conversation</h2>
        <p>Tavus CVI supplies the real-time photorealistic replica and WebRTC video room. The API key stays on the server and is never exposed to the browser.</p>
        <button onClick={startAvatar} disabled={busy || !config?.tavus_configured}>{config?.tavus_configured ? 'START HUMAN-VIDEO ASSISTANT →' : 'TAVUS CONNECTION REQUIRED'}</button>
        {conversationUrl && <div className="frame"><iframe src={conversationUrl} allow="camera; microphone; fullscreen; autoplay" title="AI human video conversation" /></div>}
      </article>
    </section>

    <section className="creator">
      <div>
        <small>MULTIPLE AGENTS</small>
        <h2>Create another assistant</h2>
        <p>Each workspace can keep multiple personalities and opening scripts. Provider-specific replica/persona IDs can be added later through the API without changing the platform architecture.</p>
      </div>
      <div className="form">
        <input value={agentName} onChange={event => setAgentName(event.target.value)} placeholder="Agent name" />
        <textarea value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="What this agent should do" />
        <textarea value={agentOpening} onChange={event => setAgentOpening(event.target.value)} placeholder="Opening greeting" />
        <button onClick={createAgent} disabled={busy || !agentName.trim()}>CREATE AGENT</button>
      </div>
    </section>

    <section className="inbound">
      <div><small>INBOUND PHONE SETUP</small><h3>Twilio Voice webhook</h3></div>
      <code>{config?.inbound_twilio_webhook || 'Available after sign-in'}</code>
      <p>When a Twilio number is connected, this is the server endpoint that answers incoming calls with the selected/default AI receptionist. Twilio-signed requests are validated before the assistant responds.</p>
    </section>

    {!externalReady && <section className="providerNote"><b>The core platform is still usable now.</b><span>Odin, the virtual assistant, CRM, AI tools and free browser calling do not depend on Twilio or Tavus. External provider usage is optional and may have its own charges.</span></section>}

    <style jsx>{`
      .page{min-height:100vh;background:#04070d;color:#eaf7ff;padding:24px 32px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 78% 10%,rgba(49,200,255,.12),transparent 28%),radial-gradient(circle at 12% 72%,rgba(255,174,54,.08),transparent 28%)}
      header{max-width:1450px;margin:auto;display:flex;justify-content:space-between;align-items:center;gap:18px;font-size:10px;letter-spacing:.08em}header div,nav{display:flex;gap:18px;align-items:center}header a{color:#92dff5;text-decoration:none}header span{color:#687e8c}nav a{color:#8196a5}
      .hero{max-width:1450px;margin:24px auto 12px;border:1px solid #18374b;border-radius:24px;background:linear-gradient(120deg,#08141f,#05080d 62%,#121016);padding:36px;display:grid;grid-template-columns:1.25fr .9fr;gap:30px}.hero small,.panel small,.creator small,.inbound small{font-size:9px;letter-spacing:.18em;color:#63dcff;font-weight:900}.hero h1{font-size:clamp(40px,6vw,72px);line-height:.98;margin:9px 0 16px;max-width:860px}.hero p{color:#8da3b2;line-height:1.6;max-width:760px}.statusGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;align-content:center}
      .notice{max-width:1450px;margin:10px auto;padding:13px 16px;border:1px solid #31546a;background:#071622;border-radius:12px;color:#ccefff}
      .grid{max-width:1450px;margin:auto;display:grid;grid-template-columns:.7fr 1fr 1fr;gap:10px}.panel{border:1px solid #173347;border-radius:18px;background:#071019;padding:20px;min-width:0}.panel h2{font-size:24px;margin:6px 0 15px}.panel label{display:block;color:#718998;font-size:10px;margin:10px 0 6px}.panel input,.panel select,.panel textarea,.form input,.form textarea{width:100%;box-sizing:border-box;background:#03080c;border:1px solid #1c4054;border-radius:10px;color:#eaf7ff;padding:11px;font:inherit}.panel textarea{min-height:76px;resize:vertical}.panel button,.form button{width:100%;border:0;border-radius:10px;padding:13px;background:linear-gradient(90deg,#1686b4,#b97a24);color:white;font-weight:900;cursor:pointer;margin-top:12px}.panel button:disabled,.form button:disabled{opacity:.42;cursor:not-allowed}.check{display:flex!important;gap:8px;align-items:flex-start;line-height:1.45}.check input{width:auto;margin-top:2px}.check span{color:#94a8b5}.fine{font-size:9px;color:#5f7585;line-height:1.5}.agentCard{margin-top:12px;border:1px solid #18374a;border-radius:12px;padding:13px;background:#040b10}.agentCard b{color:#f2c166}.agentCard p,.agentCard span{display:block;color:#7891a1;font-size:10px;line-height:1.5}.plan{margin-top:11px;padding:8px;border-radius:999px;background:#0d2632;color:#73e8b1;text-align:center;font-size:9px}.video p{color:#7e94a3;line-height:1.55}.frame{margin-top:12px;border:1px solid #23475d;border-radius:13px;overflow:hidden;aspect-ratio:16/10;background:#020406}.frame iframe{width:100%;height:100%;border:0}
      .creator{max-width:1450px;margin:10px auto;display:grid;grid-template-columns:.8fr 1.2fr;gap:16px;border:1px solid #1a3444;border-radius:18px;background:#081019;padding:22px}.creator h2{font-size:28px;margin:6px 0}.creator p{color:#718797;line-height:1.55}.form{display:grid;gap:8px}.form textarea{min-height:70px;resize:vertical}
      .inbound,.providerNote{max-width:1450px;margin:10px auto;border:1px solid #172f41;border-radius:14px;background:#061019;padding:18px}.inbound{display:grid;grid-template-columns:220px 1fr;gap:10px;align-items:center}.inbound h3{margin:5px 0}.inbound code{padding:10px;border-radius:8px;background:#02060a;color:#86d9f3;overflow:auto}.inbound p{grid-column:2;color:#637b8a;font-size:10px;line-height:1.5;margin:0}.providerNote{display:flex;gap:12px;align-items:center;color:#859bab}.providerNote b{color:#f1c06a}.providerNote span{font-size:10px}
      @media(max-width:1000px){.hero,.creator{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.inbound{grid-template-columns:1fr}.inbound p{grid-column:1}.statusGrid{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){.page{padding:17px 13px 50px}header,header div,nav{align-items:flex-start;flex-direction:column;gap:8px}.hero{padding:24px}.statusGrid{grid-template-columns:1fr}.providerNote{align-items:flex-start;flex-direction:column}}
    `}</style>
  </main>;
}

function Status({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return <div className="status"><span>{ready ? '● READY' : '○ OPTIONAL'}</span><b>{label}</b><small>{detail}</small><style jsx>{`.status{border:1px solid #17374b;border-radius:13px;background:#061019;padding:14px}.status span{display:block;color:${ready ? '#67e3a2' : '#7a8c98'};font-size:8px;letter-spacing:.13em}.status b{display:block;margin:5px 0 2px;font-size:13px}.status small{color:#627989;font-size:9px}`}</style></div>;
}

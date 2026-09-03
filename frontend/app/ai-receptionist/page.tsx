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
    load(saved).catch(() => setMessage('Unable to load this workspace. Please refresh or return to the dashboard.'));
  }, []);

  async function placeCall() {
    if (!phone.trim() || busy) return;
    if (!consent) {
      setMessage('Please confirm that this person may be contacted before placing an automated call.');
      return;
    }
    setBusy(true);
    setMessage('Starting the AI phone call…');
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
      setMessage(`Call started. Status: ${data.status}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to place the call.');
    } finally {
      setBusy(false);
    }
  }

  async function startAvatar() {
    if (busy) return;
    setBusy(true);
    setMessage('Starting the live video assistant…');
    try {
      const response = await fetch(`${api}/api/voice-agent/avatar`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ agent_id: agentId || undefined })
      });
      const data = await read(response);
      if (!response.ok) throw new Error(data.detail || 'Unable to start the video assistant.');
      setConversationUrl(data.conversation_url || '');
      setMessage(`Live video started with ${data.agent?.name || 'your AI assistant'}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to start the video assistant.');
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    if (!agentName.trim() || busy) return;
    setBusy(true);
    setMessage('Creating your assistant…');
    try {
      const response = await fetch(`${api}/api/voice-agent/agents`, {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ name: agentName.trim(), instructions, opening_message: agentOpening })
      });
      const data = await read(response);
      if (!response.ok) throw new Error(data.detail || 'Unable to create the assistant.');
      setMessage('Your assistant is ready.');
      await load(token);
      if (data.id) setAgentId(data.id);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create the assistant.');
    } finally {
      setBusy(false);
    }
  }

  const selected = agents.find(agent => agent.id === agentId);
  const phoneReady = Boolean(config?.twilio_configured && (config?.full_business || config?.platform_owner));
  const videoReady = Boolean(config?.tavus_configured && (config?.full_business || config?.platform_owner));

  return <main className="page">
    <header>
      <div><a href="/start">← Start Here</a><span>VOICE & VIDEO ASSISTANTS</span></div>
      <nav><a href="/agents">Talking Agents</a><a href="/phone">Call Center</a><a href="/">Dashboard</a></nav>
    </header>

    <section className="hero">
      <div>
        <small>EASY VOICE + VIDEO</small>
        <h1>Choose how you want your AI assistant to communicate.</h1>
        <p>You do not need to understand phone carriers, video providers or technical setup. Start with the free options. Real phone-number calling and photorealistic live video appear automatically when those optional services are available for your plan.</p>
      </div>
      <div className="legend">
        <div><span className="on">●</span><b>READY</b><p>You can use it now.</p></div>
        <div><span className="free">●</span><b>FREE</b><p>No outside phone/video provider required.</p></div>
        <div><span className="optional">○</span><b>OPTIONAL</b><p>Extra service that may have provider costs.</p></div>
      </div>
    </section>

    <section className="choices">
      <a href="/agents" className="choice ready"><span>01</span><div><small>FREE • READY</small><h2>Talk to an AI agent</h2><p>Use your microphone or type. The agent can answer out loud with the free browser voice system.</p><b>Talk to an agent →</b></div></a>
      <a href="/phone" className="choice ready"><span>02</span><div><small>FREE • READY</small><h2>Make a browser call</h2><p>Call another signed-in browser user without a phone carrier. Useful for teams and simple call-center communication.</p><b>Open free calling →</b></div></a>
      <button className={`choice ${phoneReady?'ready':'optionalChoice'}`} onClick={()=>document.getElementById('real-phone')?.scrollIntoView({behavior:'smooth'})}><span>03</span><div><small>{phoneReady?'READY':'OPTIONAL'}</small><h2>Call a real phone number</h2><p>Have an AI assistant call a mobile phone or landline for reception, follow-up, sales or scheduling.</p><b>{phoneReady?'Set up a call →':'See what is needed →'}</b></div></button>
      <button className={`choice ${videoReady?'ready':'optionalChoice'}`} onClick={()=>document.getElementById('live-video')?.scrollIntoView({behavior:'smooth'})}><span>04</span><div><small>{videoReady?'READY':'OPTIONAL'}</small><h2>Start human-like live video</h2><p>Open a face-to-face AI conversation with a photorealistic video assistant when the video service is available.</p><b>{videoReady?'Start video setup →':'See what is needed →'}</b></div></button>
    </section>

    {message && <div className="notice">{message}</div>}

    <section className="agentPicker">
      <div><small>STEP 1</small><h2>Choose who should speak</h2><p>Pick one of your assistants. You can create more for reception, customer service, sales, scheduling or other jobs.</p></div>
      <div>
        <select value={agentId} onChange={event => setAgentId(event.target.value)}>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
        {selected && <div className="selected"><b>{selected.name}</b><p>{selected.instructions || 'General-purpose AI assistant.'}</p><span>Greeting: “{selected.opening_message}”</span></div>}
      </div>
    </section>

    <section className="actionGrid">
      <article className="panel" id="real-phone">
        <div className="panelHead"><div><small>REAL PHONE CALL</small><h2>Call a mobile phone or landline</h2></div><Pill ready={phoneReady} label={phoneReady?'READY':'OPTIONAL'} /></div>
        {!phoneReady ? <div className="simpleExplain">
          <h3>This feature is not required to use I AM.</h3>
          <p>The free browser calling and talking AI agents still work. Real telephone calling becomes available when the platform phone service is connected and your workspace has access to Full Business.</p>
          {!config?.full_business && !config?.platform_owner && <a href="/pricing">See Full Business →</a>}
        </div> : <>
          <label>Phone number</label><span className="hint">Use international format, for example +1… or +63…</span>
          <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="+14155551212" />
          <label>What should the agent say first? <em>Optional</em></label>
          <textarea value={opening} onChange={event => setOpening(event.target.value)} placeholder="Leave blank to use the selected assistant's normal greeting." />
          <label className="check"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>I confirm this person may be contacted and this outreach follows the rules that apply to me.</span></label>
          <label className="check"><input type="checkbox" checked={disclosure} onChange={event => setDisclosure(event.target.checked)} /><span>The assistant will clearly say it is automated AI and is not a human.</span></label>
          <button onClick={placeCall} disabled={busy || !phone.trim()}>{busy ? 'Working…' : 'Start AI phone call →'}</button>
          <p className="fine">This feature does not record calls by default. If someone says “stop calling” or “do not call,” that number is automatically added to the workspace do-not-call list.</p>
        </>}
      </article>

      <article className="panel" id="live-video">
        <div className="panelHead"><div><small>LIVE HUMAN-LIKE VIDEO</small><h2>Face-to-face AI assistant</h2></div><Pill ready={videoReady} label={videoReady?'READY':'OPTIONAL'} /></div>
        {!videoReady ? <div className="simpleExplain">
          <h3>This is an optional premium-style feature.</h3>
          <p>Your normal Agent Mesh already talks using browser voice. Human-like video becomes available when the platform’s live-video service is connected and your workspace has access to Full Business.</p>
          <a href="/agents">Use free talking agents now →</a>
        </div> : <>
          <p className="intro">Press start and the selected assistant will open in a live camera-and-microphone conversation.</p>
          <button onClick={startAvatar} disabled={busy}>{busy ? 'Working…' : 'Start live video assistant →'}</button>
          {conversationUrl && <div className="frame"><iframe src={conversationUrl} allow="camera; microphone; fullscreen; autoplay" title="AI human video conversation" /></div>}
        </>}
      </article>
    </section>

    <section className="creator">
      <div><small>MAKE YOUR OWN</small><h2>Create another assistant</h2><p>Give the assistant a simple job, such as “answer new customer questions,” “schedule appointments,” or “follow up with leads.”</p></div>
      <div className="form">
        <label>Assistant name</label><input value={agentName} onChange={event => setAgentName(event.target.value)} placeholder="Example: Appointment Assistant" />
        <label>What should this assistant do?</label><textarea value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="Describe the job in normal words." />
        <label>How should it greet people?</label><textarea value={agentOpening} onChange={event => setAgentOpening(event.target.value)} placeholder="Opening greeting" />
        <button onClick={createAgent} disabled={busy || !agentName.trim()}>Create assistant →</button>
      </div>
    </section>

    <section className="bottomHelp"><div><small>REMEMBER</small><h2>You can use the core platform without the optional services.</h2><p>Talking agents, Magnanimous AI, the virtual assistant, CRM, AI tools, everyday helpers and free browser calling remain available independently.</p></div><a href="/start">Back to Start Here →</a></section>

    {config?.platform_owner && <details className="advanced">
      <summary>Platform owner: advanced phone/video setup</summary>
      <div className="advancedGrid"><div><b>Inbound phone endpoint</b><code>{config?.inbound_twilio_webhook || 'Available after sign-in'}</code><p>Use this only when configuring the platform phone carrier. Signed requests are validated by the server.</p></div><div><b>Provider status</b><p>Phone carrier: {config?.twilio_configured?'connected':'not connected'}<br/>Human video: {config?.tavus_configured?'connected':'not connected'}<br/>AI engine: {config?.ai_engine?'ready':'not ready'}</p><a href="/owner-integrations">Open Provider Vault →</a></div></div>
    </details>}

    <style jsx>{`
    *{box-sizing:border-box}.page{min-height:100vh;background:#04080c;color:#ecf9ff;padding:22px 30px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 80% 8%,rgba(50,211,255,.1),transparent 28%)}header,.hero,.choices,.notice,.agentPicker,.actionGrid,.creator,.bottomHelp,.advanced{max-width:1400px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;align-items:center;gap:18px;font-size:10px}header div,nav{display:flex;gap:15px}header a,nav a{color:#89dbea;text-decoration:none}header span{color:#627d88}.hero{margin-top:24px;border:1px solid #183944;border-radius:22px;padding:34px;display:grid;grid-template-columns:1.35fr .65fr;gap:30px;background:linear-gradient(135deg,#07151c,#070a0e)}.hero small,.agentPicker small,.panel small,.creator small,.bottomHelp small{font-size:9px;letter-spacing:.18em;color:#55cee3;font-weight:900}.hero h1{font-size:clamp(40px,5.5vw,72px);line-height:.98;margin:10px 0 15px;max-width:900px}.hero p{color:#8ca4ae;line-height:1.65;max-width:820px}.legend{display:grid;gap:7px;align-content:center}.legend>div{border:1px solid #203840;border-radius:12px;padding:12px;background:#081116}.legend span{float:left;margin-right:8px}.legend b{font-size:10px}.legend p{margin:4px 0 0;color:#718892;font-size:10px}.on{color:#75e5a0}.free{color:#64d8f3}.optional{color:#87969d}.choices{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:10px}.choice{appearance:none;text-align:left;border:1px solid #1a3741;border-radius:16px;padding:16px;background:#071117;color:#eefaff;text-decoration:none;display:grid;grid-template-columns:30px 1fr;gap:9px;cursor:pointer}.choice:hover{border-color:#3b7889}.choice>span{font-size:9px;color:#456d79}.choice small{font-size:8px;color:#72dda0;letter-spacing:.12em}.optionalChoice small{color:#b1a56d}.choice h2{font-size:18px;margin:6px 0}.choice p{color:#77919b;font-size:10px;line-height:1.55;min-height:48px}.choice b{font-size:9px;color:#6dd9e9}.notice{margin-top:10px;padding:12px 14px;border:1px solid #285468;border-radius:11px;background:#071721;color:#c8f0f7}.agentPicker{margin-top:10px;border:1px solid #1a3945;border-radius:17px;padding:20px;background:#071118;display:grid;grid-template-columns:.8fr 1.2fr;gap:20px}.agentPicker h2,.creator h2,.bottomHelp h2{font-size:28px;margin:6px 0}.agentPicker p,.creator p,.bottomHelp p{color:#7f98a2;line-height:1.55}.agentPicker select,.panel input,.panel textarea,.form input,.form textarea{width:100%;background:#03090d;border:1px solid #215064;border-radius:10px;color:#eaf8ff;padding:11px;font:inherit}.selected{margin-top:9px;border:1px solid #1b3e4b;border-radius:11px;padding:12px;background:#050d12}.selected b{color:#f0c46a}.selected p,.selected span{display:block;color:#78929d;font-size:10px;line-height:1.45}.actionGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.panel{border:1px solid #183844;border-radius:17px;background:#071118;padding:20px}.panelHead{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.panel h2{font-size:25px;margin:5px 0 15px}.panel label{display:block;margin:11px 0 5px;color:#adc2ca;font-size:10px}.panel label em{font-style:normal;color:#657b84}.hint{display:block;color:#617a85;font-size:9px;margin-bottom:6px}.panel textarea{min-height:78px;resize:vertical}.panel button,.form button{width:100%;border:0;border-radius:10px;padding:12px;background:linear-gradient(90deg,#168cb5,#b97a24);color:#fff;font-weight:900;cursor:pointer;margin-top:12px}.panel button:disabled,.form button:disabled{opacity:.45}.check{display:flex!important;gap:8px;align-items:flex-start;line-height:1.45}.check input{width:auto;margin-top:2px}.check span{color:#90a5ad}.fine{font-size:9px!important;color:#637b85!important}.simpleExplain{border:1px dashed #2a4c56;border-radius:12px;padding:16px}.simpleExplain h3{font-size:16px;margin:0 0 7px}.simpleExplain p,.intro{color:#7f98a2;font-size:11px;line-height:1.6}.simpleExplain a{display:inline-block;margin-top:8px;color:#74dceb;text-decoration:none;font-size:10px;font-weight:900}.frame{margin-top:12px;aspect-ratio:16/10;border:1px solid #234c5d;border-radius:13px;overflow:hidden}.frame iframe{width:100%;height:100%;border:0}.creator{margin-top:10px;border:1px solid #193944;border-radius:17px;background:#071118;padding:20px;display:grid;grid-template-columns:.75fr 1.25fr;gap:22px}.form label{display:block;color:#9db3bc;font-size:10px;margin:8px 0 5px}.form textarea{min-height:70px;resize:vertical}.bottomHelp{margin-top:10px;border:1px solid #274139;border-radius:17px;background:linear-gradient(135deg,#0b160f,#071118);padding:22px;display:flex;justify-content:space-between;gap:25px;align-items:center}.bottomHelp a{white-space:nowrap;border:1px solid #31515b;border-radius:9px;padding:11px 13px;color:#daf8ff;text-decoration:none;font-size:10px;font-weight:900}.advanced{margin-top:10px;border:1px solid #303c43;border-radius:14px;background:#080d10;padding:14px}.advanced summary{cursor:pointer;color:#9eb4bd;font-size:11px;font-weight:900}.advancedGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.advancedGrid>div{border:1px solid #23353b;border-radius:11px;padding:13px}.advancedGrid b{font-size:11px}.advancedGrid code{display:block;margin-top:9px;padding:9px;background:#020608;border-radius:7px;overflow:auto;color:#8bdcec;font-size:9px}.advancedGrid p{font-size:10px;color:#70858d;line-height:1.5}.advancedGrid a{font-size:10px;color:#72dbe9;text-decoration:none}@media(max-width:1000px){.choices{grid-template-columns:1fr 1fr}.hero{grid-template-columns:1fr}.actionGrid{grid-template-columns:1fr}}@media(max-width:700px){.page{padding:16px 14px 45px}header nav{display:none}.choices{grid-template-columns:1fr}.agentPicker,.creator{grid-template-columns:1fr}.bottomHelp{display:block}.bottomHelp a{display:inline-block;margin-top:12px}.advancedGrid{grid-template-columns:1fr}.hero{padding:24px}.hero h1{font-size:44px}}
    `}</style>
  </main>
}

function Pill({ready,label}:{ready:boolean;label:string}){
 return <span style={{border:`1px solid ${ready?'#2f7651':'#6b6132'}`,color:ready?'#86e8a9':'#c4b66f',padding:'6px 8px',borderRadius:999,fontSize:9,fontWeight:900,whiteSpace:'nowrap'}}>{ready?'●':'○'} {label}</span>
}
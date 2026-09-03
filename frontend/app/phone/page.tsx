'use client';

import { useEffect, useRef, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const rtcConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

type Summary = {
  agents: number;
  available: number;
  active_calls: number;
  calls_today: number;
  queues: number;
};

type Agent = {
  id: string;
  user_id?: string | null;
  name: string;
  extension: string;
  status: string;
  skills: string[];
  active: number;
};

type Queue = {
  id: string;
  name: string;
  strategy: string;
  member_count: number;
  max_wait_seconds: number;
  active: number;
};

type Call = {
  id: number;
  direction: string;
  caller: string;
  callee: string;
  status: string;
  provider: string;
  duration_seconds: number;
  disposition: string;
  notes: string;
  agent_name?: string;
  queue_name?: string;
  created_at: number;
};

const emptySummary: Summary = { agents: 0, available: 0, active_calls: 0, calls_today: 0, queues: 0 };
async function read(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { detail: text || `Request failed (${response.status})` }; }
}

function elapsed(seconds: number) {
  const total = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

function dateTime(timestamp: number) {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleString();
}

export default function Phone() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState('');
  const [joinId, setJoinId] = useState('');
  const [callStatus, setCallStatus] = useState('Ready');
  const [muted, setMuted] = useState(false);
  const [agentStatus, setAgentStatus] = useState('available');
  const [queueName, setQueueName] = useState('');
  const [queueStrategy, setQueueStrategy] = useState('longest_idle');

  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const lastSignal = useRef(0);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const signalTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('odin_admin_token') || localStorage.getItem('iam_account_token') || '';
    if (!saved) {
      const returnTo = `${location.pathname}${location.search}`;
      location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setToken(saved);
    const incomingSession = new URLSearchParams(location.search).get('call') || '';
    if (incomingSession) setJoinId(incomingSession);
    load(saved);
    refreshTimer.current = setInterval(() => load(saved, false), 15000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      stopLocalCall(false);
    };
  }, []);

  async function authed(path: string, options: RequestInit = {}, activeToken = token) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${activeToken}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(`${api}${path}`, { ...options, headers });
  }

  async function load(activeToken = token, showLoading = true) {
    if (!activeToken) return;
    if (showLoading) setLoading(true);
    try {
      const [meResponse, summaryResponse, agentsResponse, queuesResponse, callsResponse] = await Promise.all([
        authed('/api/auth/me', {}, activeToken),
        authed('/api/phone/summary', {}, activeToken),
        authed('/api/phone/agents', {}, activeToken),
        authed('/api/phone/queues', {}, activeToken),
        authed('/api/phone/calls', {}, activeToken)
      ]);
      if (meResponse.status === 401) {
        location.replace('/login');
        return;
      }
      const [me, phoneSummary, agentData, queueData, callData] = await Promise.all([
        read(meResponse), read(summaryResponse), read(agentsResponse), read(queuesResponse), read(callsResponse)
      ]);
      setUser(me.user || {});
      if (summaryResponse.ok) setSummary(phoneSummary);
      if (agentsResponse.ok) setAgents(agentData.agents || []);
      if (queuesResponse.ok) setQueues(queueData.queues || []);
      if (callsResponse.ok) setCalls(callData.calls || []);
      setError('');
    } catch {
      setError('Unable to load the live call-center workspace.');
    } finally {
      setLoading(false);
    }
  }

  async function signal(id: string, kind: string, payload: any) {
    const response = await authed(`/api/phone/session/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify({ kind, payload })
    });
    if (!response.ok) {
      const data = await read(response);
      throw new Error(data.detail || 'Phone signaling failed.');
    }
  }

  async function setupCall(id: string, caller: boolean) {
    try {
      setCallStatus('Requesting microphone…');
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const connection = new RTCPeerConnection(rtcConfig);
      peer.current = connection;
      media.getTracks().forEach(track => connection.addTrack(track, media));
      connection.ontrack = event => {
        if (remoteAudio.current) remoteAudio.current.srcObject = event.streams[0];
      };
      connection.onicecandidate = event => {
        if (event.candidate) signal(id, 'candidate', event.candidate).catch(() => {});
      };
      connection.onconnectionstatechange = () => {
        const labels: Record<string, string> = {
          new: 'Preparing call…', connecting: 'Connecting…', connected: 'Connected — you can talk now',
          disconnected: 'Connection interrupted', failed: 'Could not connect on this network', closed: 'Call ended'
        };
        setCallStatus(labels[connection.connectionState] || connection.connectionState);
        if (connection.connectionState === 'connected') load(token, false);
      };
      if (caller) {
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        await signal(id, 'offer', offer);
      } else {
        await signal(id, 'ready', null);
      }
      startPolling(id, caller, connection);
    } catch (caught: any) {
      setCallStatus(caught?.message || 'Microphone access or call setup failed.');
      stopLocalCall(false);
    }
  }

  function startPolling(id: string, caller: boolean, connection: RTCPeerConnection) {
    if (signalTimer.current) clearInterval(signalTimer.current);
    signalTimer.current = setInterval(async () => {
      try {
        const response = await authed(`/api/phone/session/${encodeURIComponent(id)}`);
        if (!response.ok) return;
        const data = await read(response);
        for (const item of data.signals || []) {
          if (item.id <= lastSignal.current) continue;
          lastSignal.current = item.id;
          const payload = JSON.parse(item.payload || 'null');
          if (item.kind === 'offer' && !caller && !connection.remoteDescription) {
            await connection.setRemoteDescription(payload);
            for (const candidate of pendingCandidates.current.splice(0)) await connection.addIceCandidate(candidate);
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            await signal(id, 'answer', answer);
          } else if (item.kind === 'answer' && caller && !connection.remoteDescription) {
            await connection.setRemoteDescription(payload);
            for (const candidate of pendingCandidates.current.splice(0)) await connection.addIceCandidate(candidate);
          } else if (item.kind === 'candidate' && payload) {
            if (connection.remoteDescription) await connection.addIceCandidate(payload);
            else pendingCandidates.current.push(payload);
          } else if (item.kind === 'hangup') {
            stopLocalCall(false);
          }
        }
      } catch {}
    }, 1000);
  }

  async function createBrowserCall() {
    setError('');
    lastSignal.current = 0;
    pendingCandidates.current = [];
    const response = await authed('/api/phone/session', { method: 'POST', body: '{}' });
    const data = await read(response);
    if (!response.ok) {
      setCallStatus(data.detail || 'Unable to create a call.');
      return;
    }
    setSession(data.session_id);
    setCallStatus('Invite created. Send the link to another signed-in I AM user.');
    await setupCall(data.session_id, true);
  }

  async function joinBrowserCall() {
    const id = joinId.trim();
    if (!id) return;
    setError('');
    lastSignal.current = 0;
    pendingCandidates.current = [];
    setSession(id);
    await setupCall(id, false);
  }

  async function stopLocalCall(sendSignal = true) {
    const activeSession = session;
    if (sendSignal && activeSession) {
      try { await signal(activeSession, 'hangup', null); } catch {}
    }
    if (signalTimer.current) clearInterval(signalTimer.current);
    signalTimer.current = null;
    peer.current?.close();
    stream.current?.getTracks().forEach(track => track.stop());
    peer.current = null;
    stream.current = null;
    setSession('');
    setMuted(false);
    setCallStatus('Call ended');
    load(token, false);
  }

  function inviteLink() {
    return `${location.origin}/phone?call=${encodeURIComponent(session)}`;
  }

  async function copySession() {
    if (!session) return;
    await navigator.clipboard.writeText(inviteLink());
    setNotice('Private call link copied. Send it to the person you want to call.');
    setTimeout(() => setNotice(''), 2500);
  }

  async function shareSession() {
    if (!session) return;
    if (navigator.share) await navigator.share({ title: 'Join my I AM call', text: 'Open this link, sign in, and press Answer call.', url: inviteLink() });
    else await copySession();
  }

  function toggleMute() {
    const next = !muted;
    stream.current?.getAudioTracks().forEach(track => { track.enabled = !next; });
    setMuted(next);
  }

  async function setPresence() {
    const response = await authed('/api/phone/agents/me', {
      method: 'PUT',
      body: JSON.stringify({ status: agentStatus })
    });
    const data = await read(response);
    if (!response.ok) {
      setError(data.detail || 'Unable to update agent status.');
      return;
    }
    setNotice(`Your agent status is now ${agentStatus}.`);
    load(token, false);
  }

  async function createQueue() {
    if (!queueName.trim()) return;
    const response = await authed('/api/phone/queues', {
      method: 'POST',
      body: JSON.stringify({ name: queueName.trim(), strategy: queueStrategy, agent_ids: agents.map(agent => agent.id) })
    });
    const data = await read(response);
    if (!response.ok) {
      setError(data.detail || 'Unable to create the queue.');
      return;
    }
    setQueueName('');
    setNotice('Call queue created and saved.');
    load(token, false);
  }

  async function saveDisposition(call: Call, disposition: string) {
    const response = await authed(`/api/phone/calls/${call.id}`, {
      method: 'PUT',
      body: JSON.stringify({ disposition })
    });
    const data = await read(response);
    if (!response.ok) {
      setError(data.detail || 'Unable to save the disposition.');
      return;
    }
    setCalls(current => current.map(item => item.id === call.id ? { ...item, disposition } : item));
    setNotice('Call result saved.');
  }

  return (
    <main className="callCenter">
      <audio ref={remoteAudio} autoPlay />
      <header>
        <div>
          <a href="/">← I AM Platform</a>
          <small>I AM MAGNANIMOUS WAY™ · COMMUNICATION COMMAND</small>
          <h1>Phone & Call Center</h1>
          <p>Working browser-to-browser voice calls for signed-in I AM users, with agent presence, queues, and call history.</p>
        </div>
        <div className="liveBadge"><i /> {loading ? 'CHECKING' : 'WORKSPACE ONLINE'}</div>
      </header>

      {error && <div className="error">{error}<button onClick={() => setError('')}>×</button></div>}
      {notice && <div className="notice">{notice}</div>}

      <section className="stats">
        <article><small>AGENTS</small><strong>{summary.agents}</strong><span>{summary.available} available</span></article>
        <article><small>ACTIVE CALLS</small><strong>{summary.active_calls}</strong><span>live or ringing</span></article>
        <article><small>TODAY</small><strong>{summary.calls_today}</strong><span>calls recorded</span></article>
        <article><small>QUEUES</small><strong>{summary.queues}</strong><span>routing groups</span></article>
      </section>

      <section className="workbench">
        <article className="panel browserPhone">
          <div className="panelTitle"><span>01</span><div><small>FREE CALLING</small><h2>I AM Internet Phone</h2></div></div>
          <p>Start a private voice call, send the invite link, and talk through both devices. Allow microphone access when asked.</p>
          <div className="statusLine"><i className={session ? 'connected' : ''} /> {callStatus}</div>
          {!session ? <>
            <button className="primary" onClick={createBrowserCall}>START FREE CALL</button>
            <div className="joinRow">
              <input value={joinId} onChange={event => setJoinId(event.target.value)} placeholder="Call code from an invite link" />
              <button onClick={joinBrowserCall}>ANSWER CALL</button>
            </div>
          </> : <div className="activeSession">
            <small>ACTIVE SESSION</small>
            <code>{inviteLink()}</code>
            <div className="callButtons">
              <button onClick={copySession}>COPY INVITE LINK</button>
              <button onClick={shareSession}>SHARE</button>
              <button onClick={toggleMute}>{muted ? 'UNMUTE' : 'MUTE'}</button>
              <button className="danger" onClick={() => stopLocalCall(true)}>HANG UP</button>
            </div>
          </div>}
        </article>

        <article className="panel instructions">
          <div className="panelTitle"><span>02</span><div><small>HOW IT WORKS</small><h2>Place a Free Call</h2></div></div>
          <ol>
            <li><b>Press Start Free Call.</b><span>Your browser asks for microphone access.</span></li>
            <li><b>Copy or share the invite link.</b><span>Send it by Messenger, email, or text.</span></li>
            <li><b>The other user signs in and answers.</b><span>Keep this page open while you talk.</span></li>
          </ol>
          <p className="networkNote">This calls I AM users over the Internet. It does not pretend to call ordinary mobile or landline numbers.</p>
        </article>
      </section>

      <section className="operations">
        <article className="panel agents">
          <div className="panelTitle"><span>03</span><div><small>TEAM</small><h2>Agents</h2></div></div>
          <div className="presence">
            <select value={agentStatus} onChange={event => setAgentStatus(event.target.value)}>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="break">On break</option>
              <option value="offline">Offline</option>
            </select>
            <button onClick={setPresence}>UPDATE MY STATUS</button>
          </div>
          <div className="agentList">
            {agents.map(agent => <div key={agent.id}>
              <b>{agent.name}</b><small>{agent.extension ? `Ext. ${agent.extension}` : 'Browser agent'}</small>
              <em className={agent.status}>{agent.status}</em>
            </div>)}
            {agents.length === 0 && <p className="empty">No agents registered. Update your status to become the first agent.</p>}
          </div>
        </article>

        <article className="panel queues">
          <div className="panelTitle"><span>04</span><div><small>ROUTING</small><h2>Call Queues</h2></div></div>
          {user?.role === 'owner' && <div className="queueForm">
            <input value={queueName} onChange={event => setQueueName(event.target.value)} placeholder="Queue name, e.g. Sales" />
            <select value={queueStrategy} onChange={event => setQueueStrategy(event.target.value)}>
              <option value="longest_idle">Longest idle agent</option>
              <option value="round_robin">Round robin</option>
              <option value="priority">Priority order</option>
            </select>
            <button onClick={createQueue}>CREATE</button>
          </div>}
          <div className="queueList">
            {queues.map(queue => <div key={queue.id}>
              <b>{queue.name}</b>
              <small>{queue.strategy.replace('_', ' ')} · {queue.member_count} agents</small>
              <span>{queue.max_wait_seconds}s max wait</span>
            </div>)}
            {queues.length === 0 && <p className="empty">No queues yet. Create Sales, Support, Ministry, or another routing group.</p>}
          </div>
        </article>
      </section>

      <section className="panel history">
        <div className="historyHeader">
          <div className="panelTitle"><span>05</span><div><small>CRM RECORD</small><h2>Call History</h2></div></div>
          <button onClick={() => load(token, false)}>REFRESH</button>
        </div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Time</th><th>Direction</th><th>From / To</th><th>Provider</th><th>Status</th><th>Duration</th><th>Agent / Queue</th><th>Result</th></tr></thead>
            <tbody>
              {calls.map(call => <tr key={call.id}>
                <td>{dateTime(call.created_at)}</td>
                <td>{call.direction}</td>
                <td><b>{call.caller || '—'}</b><small>{call.callee || '—'}</small></td>
                <td>{call.provider || 'browser'}</td>
                <td><em className={`callStatus ${call.status}`}>{call.status}</em></td>
                <td>{elapsed(call.duration_seconds)}</td>
                <td>{call.agent_name || call.queue_name || 'Unassigned'}</td>
                <td>
                  <select value={call.disposition || ''} onChange={event => saveDisposition(call, event.target.value)}>
                    <option value="">Not set</option>
                    <option value="answered">Answered</option>
                    <option value="follow-up">Follow up</option>
                    <option value="sale">Sale / completed</option>
                    <option value="donation">Donation / support</option>
                    <option value="no-answer">No answer</option>
                    <option value="do-not-call">Do not call</option>
                  </select>
                </td>
              </tr>)}
              {calls.length === 0 && <tr><td colSpan={8} className="empty">No calls recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <nav><a href="/crm">CRM</a><a href="/leads">Lead Generator</a><a href="/virtual-assistant">Virtual Assistant</a><a href="/connections">Connections</a></nav>

      <style jsx>{`
        .callCenter{min-height:100vh;background:#050b12;color:#eef8ff;padding:28px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 5%,rgba(37,175,235,.11),transparent 30%),linear-gradient(rgba(77,180,226,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(77,180,226,.025) 1px,transparent 1px);background-size:auto,38px 38px,38px 38px}header{max-width:1450px;margin:auto;display:flex;align-items:end;justify-content:space-between;gap:25px}header a{color:#6edaff;text-decoration:none;font-size:12px}header small,.panelTitle small{display:block;color:#53758b;font-size:9px;font-weight:900;letter-spacing:.18em;margin-top:10px}header h1{font-size:clamp(38px,5vw,68px);margin:5px 0;line-height:1}header p{color:#738d9d;max-width:800px;line-height:1.6}.liveBadge{border:1px solid #16495a;color:#75e8ba;border-radius:999px;padding:10px 14px;font-size:10px;letter-spacing:.12em}.liveBadge i{display:inline-block;width:7px;height:7px;background:#44e19d;border-radius:50%;box-shadow:0 0 14px #44e19d}.error,.notice{max-width:1450px;margin:16px auto 0;padding:12px 15px;border-radius:10px;font-size:12px}.error{background:#251015;border:1px solid #71313e;color:#ffb5c0}.notice{background:#0b251f;border:1px solid #23624e;color:#8aefd0}.error button{float:right;background:none;border:0;color:inherit}.stats{max-width:1450px;margin:24px auto 14px;display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.stats article{padding:17px;background:#08131d;border:1px solid #162c3b;border-radius:13px}.stats small{color:#547184;font-size:9px;letter-spacing:.14em}.stats strong{display:block;font-size:27px;margin:7px 0 2px}.stats span{color:#617e90;font-size:10px}.stats .ready{border-color:#21644f}.stats .ready strong{color:#68e2af}.stats .pending{border-color:#5b4820}.stats .pending strong{color:#f2ca64;font-size:20px}.workbench,.operations{max-width:1450px;margin:0 auto 14px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel{background:rgba(7,18,27,.96);border:1px solid #183345;border-radius:18px;padding:22px;box-shadow:0 14px 45px rgba(0,0,0,.2)}.panelTitle{display:flex;align-items:center;gap:12px}.panelTitle>span{width:35px;height:35px;display:grid;place-items:center;border:1px solid #28617a;border-radius:9px;color:#79dcff;font-size:10px}.panelTitle h2{margin:3px 0;font-size:25px}.panelTitle small{margin:0}.panel>p{color:#6f8999;line-height:1.55;font-size:12px}.statusLine{margin:18px 0;padding:11px;background:#071018;border:1px solid #162b38;border-radius:9px;color:#83a0b2;font-size:11px}.statusLine i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#5f7580;margin-right:7px}.statusLine i.connected{background:#4ce4a1;box-shadow:0 0 12px #4ce4a1}.primary{width:100%;padding:13px;border:0;border-radius:10px;background:linear-gradient(100deg,#58d3ff,#3c9cdb);color:#041018;font-weight:950;letter-spacing:.06em;cursor:pointer}.primary:disabled{background:#182a34;color:#617983;cursor:not-allowed}.joinRow,.split,.presence,.queueForm{display:flex;gap:8px;margin-top:10px}input,select,button{font:inherit}input,select{background:#050d14;border:1px solid #1d3a4b;color:#e8f6fd;border-radius:9px;padding:11px;box-sizing:border-box}.joinRow input{flex:1}.joinRow button,.callButtons button,.presence button,.queueForm button,.historyHeader>button{border:1px solid #2a5870;border-radius:9px;background:#0c2230;color:#8edfff;padding:10px 13px;font-size:10px;font-weight:900;cursor:pointer}.activeSession{padding:16px;background:#071018;border:1px solid #1f5266;border-radius:12px}.activeSession small{color:#5c8498;font-size:9px}.activeSession code{display:block;color:#89e6ff;word-break:break-all;margin:8px 0 14px}.callButtons{display:flex;gap:8px}.callButtons .danger{border-color:#6b2d39;color:#ff9dac;background:#251118}.dialer label{display:block;color:#6d8998;font-size:10px;margin:17px 0 6px}.dialer>input{width:100%;font-size:18px;letter-spacing:.05em}.split select{width:50%}.dialer .primary{margin-top:10px}.carrierState{display:flex;justify-content:space-between;margin-top:12px;color:#d3aa52;font-size:10px}.carrierState .on{color:#5ee0aa}.carrierState small{color:#5c7687}.presence select{flex:1}.agentList,.queueList{margin-top:14px;display:grid;gap:7px}.agentList>div,.queueList>div{display:grid;grid-template-columns:1fr auto;gap:3px;padding:11px;background:#061019;border:1px solid #132b39;border-radius:10px}.agentList b,.queueList b{font-size:12px}.agentList small,.queueList small,.queueList span{color:#607f91;font-size:9px}.agentList em{grid-row:1/3;grid-column:2;font-style:normal;font-size:9px;text-transform:uppercase;align-self:center;padding:5px 8px;border:1px solid #40505a;border-radius:999px}.agentList em.available{color:#65e7b0;border-color:#285f4c}.agentList em.busy{color:#ff9ea9;border-color:#71333d}.agentList em.break{color:#f2cb69;border-color:#665424}.queueList span{grid-column:2;grid-row:1/3;align-self:center}.queueForm input{flex:1}.empty{color:#597789;text-align:center;padding:18px}.history{max-width:1405px;margin:0 auto}.historyHeader{display:flex;justify-content:space-between;align-items:center}.tableWrap{overflow:auto;margin-top:16px}table{width:100%;border-collapse:collapse;min-width:1000px}th{text-align:left;color:#527486;font-size:8px;letter-spacing:.14em;padding:10px;border-bottom:1px solid #193443}td{padding:11px 10px;border-bottom:1px solid #102733;color:#92a9b6;font-size:10px}td b,td small{display:block}.callStatus{font-style:normal;text-transform:uppercase;font-size:8px;padding:4px 7px;border:1px solid #385164;border-radius:999px}.callStatus.connected{color:#5de6ae;border-color:#285e4b}.callStatus.failed,.callStatus.no-answer{color:#ff9eaa;border-color:#6b303a}td select{padding:7px;font-size:9px}nav{max-width:1450px;margin:16px auto;display:flex;gap:9px;flex-wrap:wrap}nav a{color:#79dcff;text-decoration:none;border:1px solid #21465a;border-radius:9px;padding:9px 12px;font-size:10px}@media(max-width:950px){.callCenter{padding:20px 14px 60px}.stats{grid-template-columns:repeat(2,1fr)}.workbench,.operations{grid-template-columns:1fr}header{display:block}.liveBadge{display:inline-block;margin-top:12px}}@media(max-width:560px){.stats{grid-template-columns:1fr 1fr}.stats article:last-child{grid-column:1/-1}.split,.presence,.queueForm{flex-direction:column}.split select{width:100%}.callButtons{flex-wrap:wrap}.callButtons button{flex:1}.carrierState{display:block}.carrierState small{display:block;margin-top:5px}}
        .stats{grid-template-columns:repeat(4,1fr)}
        .instructions ol{list-style:none;padding:0;margin:18px 0;display:grid;gap:10px;counter-reset:steps}.instructions li{counter-increment:steps;display:grid;grid-template-columns:34px 1fr;gap:2px 10px;padding:12px;background:#061019;border:1px solid #173242;border-radius:10px}.instructions li:before{content:counter(steps);grid-row:1/3;width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#0d3448;color:#7de0ff;font-weight:900}.instructions li b{font-size:12px}.instructions li span{color:#6f8999;font-size:11px}.networkNote{border-left:3px solid #58d3ff;padding-left:12px}
        @media(max-width:950px){.stats{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </main>
  );
}

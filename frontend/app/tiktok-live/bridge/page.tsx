'use client';

import { useEffect, useRef, useState } from 'react';
import { createLiveBridgeClient, type LiveBridgeStatus } from '../../../lib/live-studio/bridge-client';
import type { LiveEvent } from '../../../lib/live-studio/event-contract';

type CommandAction = 'scene.set' | 'overlay.show' | 'overlay.hide' | 'audio.cue' | 'host.speak';

export default function LiveEventBridgePage() {
  const [endpoint,setEndpoint]=useState('');
  const [pairingToken,setPairingToken]=useState('');
  const [companionToken,setCompanionToken]=useState('');
  const [pairId,setPairId]=useState('');
  const [revokeBusy,setRevokeBusy]=useState(false);
  const [pairBusy,setPairBusy]=useState(false);
  const [status,setStatus]=useState<LiveBridgeStatus>('disconnected');
  const [events,setEvents]=useState<LiveEvent[]>([]);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [action,setAction]=useState<CommandAction>('scene.set');
  const [target,setTarget]=useState('');
  const [speech,setSpeech]=useState('');
  const clientRef=useRef<ReturnType<typeof createLiveBridgeClient>|null>(null);

  useEffect(()=>()=>{clientRef.current?.disconnect();clientRef.current=null;},[]);

  function startClient(targetEndpoint:string,targetToken:string) {
    clientRef.current?.disconnect();
    const client=createLiveBridgeClient(targetEndpoint,targetToken,{
      onStatus:setStatus,
      onEvent:event=>setEvents(current=>[event,...current.filter(item=>item.eventId!==event.eventId)].slice(0,50)),
      onError:setError,
    });
    clientRef.current=client;
  }

  function connect() {
    setError('');setNotice('');
    try {
      startClient(endpoint,pairingToken);
      setPairingToken('');
      setNotice('Connection requested. Wait for the local companion to authenticate and report READY.');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error?cause.message:'The bridge could not be started.');
    }
  }

  async function createPair() {
    setPairBusy(true);setError('');setNotice('');
    try {
      const response=await fetch('/api/live-bridge/pair',{method:'POST',headers:{'content-type':'application/json'},body:'{}',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.detail||'Sign in to Magnanimous before creating a bridge pair.');
      if(pairId){await revokePairId(pairId);setPairId('');}
      setPairId(data.pairId);
      setEndpoint(data.endpoint);
      setPairingToken('');
      setCompanionToken(data.companionToken);
      startClient(data.endpoint,data.browserToken);
      setNotice('Browser side connected. Copy the companion token into Magnanimous Portable Creator within ten minutes.');
    } catch(cause) {
      setStatus('error');
      setError(cause instanceof Error?cause.message:'A secure pairing could not be created.');
    } finally {setPairBusy(false);}
  }

  async function copyCompanionToken() {
    if(!companionToken)return;
    try {await navigator.clipboard.writeText(companionToken);setNotice('Companion token copied. Paste it only into your local Magnanimous Portable Creator.');}
    catch {setError('Clipboard access was unavailable. Select and copy the companion token manually.');}
  }

  async function revokePairId(id:string) {
    const response=await fetch('/api/live-bridge/revoke',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pairId:id}),cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.detail||'The existing pairing could not be revoked. No new pair was created.');
  }

  async function revokePair() {
    if(!pairId)return;
    setRevokeBusy(true);setError('');setNotice('');
    try {
      await revokePairId(pairId);
      clientRef.current?.disconnect();clientRef.current=null;
      setPairId('');setPairingToken('');setCompanionToken('');setEndpoint('');
      setStatus('disconnected');
      setNotice('Pairing revoked. The local companion has lost access and must be paired again.');
    } catch(cause) {
      setError(cause instanceof Error?cause.message:'The pairing could not be revoked. Retry before creating another pair.');
    } finally {setRevokeBusy(false);}
  }

  function disconnect() {
    clientRef.current?.disconnect();
    clientRef.current=null;
    setStatus('disconnected');
    setNotice('Browser connection disconnected. Use Revoke pairing to stop the local companion and invalidate both tokens.');
  }

  function sendCommand() {
    if(action!=='scene.set'&&action!=='host.speak'){setNotice('Overlay and audio-cue commands are not enabled yet. No command was sent.');return;}
    const commandId=globalThis.crypto?.randomUUID?.()||String(Date.now());
    const payload=action==='scene.set'?{sceneName:target}
      :action==='overlay.show'||action==='overlay.hide'?{overlayId:target}
      :action==='audio.cue'?{cueId:target}
      :{text:speech};
    const sent=clientRef.current?.sendCommand({commandId,action,...payload})||false;
    setNotice(sent?'Command sent to the companion. Execution is not confirmed until the companion returns an acknowledgement.':'No command sent. Confirm that the companion is connected and that the command fields are valid.');
  }

  const connected=status==='connected';
  const needsTarget=action!=='host.speak';

  return (
    <main className="bridgePage">
      <header className="topbar">
        <a href="/tiktok-live">← AI Host</a>
        <span>I AM MAGNANIMOUS WAY™</span>
        <a href="/social-hub">Social Hub →</a>
      </header>
      <section className="intro">
        <small>MAGNANIMOUS AI • CREATOR CONNECTIONS</small>
        <h1>LIVE Event <em>Bridge</em></h1>
        <p>One safe event language for your live audience, OBS scenes, browser sources and supported games. Magnanimous stays the brain; each platform or app is a replaceable connection.</p>
      </section>
      <section className="boundary">
        <b>Implementation status: online relay pairing and the local companion connection path are being brought online in stages. Provider account adapters and public broadcasting are not yet connected.</b>
        <p>Create a secure pair here, then paste the separate companion token into Magnanimous Portable Creator on the computer running OBS. Do not enter TikTok, Google, Meta, Twitch, Zoom, OBS or game-account passwords here. These temporary pairing credentials are held in memory and are not saved in browser storage.</p>
      </section>
      <section className="panel">
        <div className="panelHead"><div><small>01 • PAIR YOUR COMPANION</small><h2>Secure connection</h2></div><span className={connected?'online':'offline'}>{status.toUpperCase()}</span></div>
        <button onClick={createPair} disabled={pairBusy}>{pairBusy?'Creating secure pair…':'Create secure pair'}</button>
        <p className="hint">Sign in to your Magnanimous account first. A pair is valid for ten minutes and the connected session lasts up to twelve hours.</p>
        <label>Magnanimous secure WebSocket address
          <input value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="wss://iammagnanimousway.com/api/live-bridge/ws/00000000-0000-4000-8000-000000000000" autoComplete="off" />
        </label>
        <label>Browser pairing token (optional manual entry)
          <input value={pairingToken} onChange={e=>setPairingToken(e.target.value)} type="password" placeholder="Use Create secure pair above or paste a browser token" autoComplete="new-password" />
        </label>
        {companionToken&&<label>Companion token — paste into the local USB Creator
          <input value={companionToken} readOnly type="password" autoComplete="off" />
          <button className="secondary" onClick={copyCompanionToken}>Copy companion token</button>
        </label>}
        <div className="actions">
          <button onClick={connect} disabled={!endpoint.trim()||pairingToken.trim().length<16}>Connect companion</button>
          <button className="secondary" onClick={disconnect} disabled={status==='disconnected'}>Disconnect browser</button>
          <button className="secondary" onClick={revokePair} disabled={!pairId||revokeBusy}>{revokeBusy?'Revoking…':'Revoke pairing'}</button>
        </div>
        <p className="hint">Remote connections require WSS. The browser and local companion use different temporary tokens. Tokens stay in memory and are never saved in browser storage or placed in the URL.</p>
      </section>
      <section className="grid">
        <div className="panel">
          <div className="panelHead"><div><small>02 • AUDIENCE + APP EVENTS</small><h2>Incoming events</h2></div><span className="count">{events.length} / 50</span></div>
          <p className="hint">Supported event types include chat, follows, subscriptions, gifts, poll votes, game events and OBS scene changes. Only events actually supplied by an authorized adapter appear here.</p>
          <div className="feed" aria-live="polite">
            {events.length===0?<p className="empty">Waiting for events from a paired companion.</p>:events.map(event=><article key={event.eventId}>
              <div><b>{event.provider.toUpperCase()} · {event.type}</b><time>{new Date(event.receivedAt).toLocaleTimeString()}</time></div>
              <strong>{event.actorName||'Audience / app event'}</strong>
              {event.text&&<p>{event.text}</p>}
              {typeof event.amount==='number'&&<small>{event.amount} {event.currency||''}</small>}
            </article>)}
          </div>
        </div>
        <div className="panel">
          <div className="panelHead"><div><small>03 • APPROVED STAGE CONTROLS</small><h2>Send a production command</h2></div></div>
          <label>Action
            <select value={action} onChange={e=>setAction(e.target.value as CommandAction)}>
              <option value="scene.set">Switch OBS scene</option>
              <option value="overlay.show" disabled>Show overlay (not available yet)</option>
              <option value="overlay.hide" disabled>Hide overlay (not available yet)</option>
              <option value="audio.cue" disabled>Play audio cue (not available yet)</option>
              <option value="host.speak">Ask host to speak</option>
            </select>
          </label>
          {needsTarget?<label>{action==='scene.set'?'Scene name':action.startsWith('overlay.')?'Overlay ID':'Audio cue ID'}
            <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Enter the exact name or ID" />
          </label>:<label>Words for the AI host
            <textarea value={speech} onChange={e=>setSpeech(e.target.value)} rows={4} maxLength={500} placeholder="Write what Magnanimous should say…" />
          </label>}
          <button onClick={sendCommand} disabled={!connected||(action!=='scene.set'&&action!=='host.speak')||(needsTarget?!target.trim():!speech.trim())}>Send approved command</button>
          <p className="hint">Currently supported: OBS scene changes and AI host speech after local operator approval. Overlay and audio-cue commands are disabled until their local engines are implemented and verified. The bridge cannot start or stop broadcasts, manage accounts, moderate viewers, spend money, run shell commands or execute arbitrary code.</p>
        </div>
      </section>
      {(error||notice)&&<div className={error?'error':'notice'} role="status">{error||notice}</div>}
      <footer><a href="/tiktok-live">Return to Magnanimous AI Host</a><span>Magnanimous remains the intelligence layer. Connections are optional and revocable.</span></footer>
      <style jsx>{`
        .bridgePage{min-height:100vh;background:#050a11;color:#eef8ff;padding:18px 24px 50px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 15% 8%,rgba(40,192,231,.12),transparent 28%),radial-gradient(circle at 92% 20%,rgba(190,150,58,.09),transparent 24%)}
        .topbar{max-width:1180px;margin:auto;display:flex;justify-content:space-between;gap:12px;align-items:center;color:#85a2b4;font-size:10px;letter-spacing:.13em}.topbar a,footer a{color:#73dff4;text-decoration:none}
        .intro,.panel,.boundary,.grid,footer,.notice,.error{max-width:1180px;margin-left:auto;margin-right:auto}.intro{margin-top:38px;margin-bottom:18px}.intro small,.panelHead small{font-size:9px;letter-spacing:.18em;color:#71dff0}.intro h1{font-size:clamp(42px,7vw,76px);letter-spacing:-.05em;margin:8px 0}.intro h1 em{font-style:normal;color:#e7c46a}.intro p{color:#91a9b7;max-width:760px;line-height:1.6;font-size:14px}
        .boundary{background:#251c10;border:1px solid #765b2c;border-radius:14px;padding:16px 18px;color:#f2d79f;font-size:12px;line-height:1.6}.boundary p{margin:6px 0 0;color:#d5c49e}
        .panel{background:#08121a;border:1px solid #203b4b;border-radius:16px;padding:18px;margin-top:16px}.panelHead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.panelHead h2{font-size:21px;margin:5px 0}.online,.offline,.count{font-size:9px;letter-spacing:.1em;padding:6px 9px;border-radius:30px;border:1px solid #345260;color:#a9c2cd}.online{border-color:#34745a;color:#88edb7}
        label{display:block;font-size:11px;color:#a9c0cb;font-weight:700;margin:12px 0}input,select,textarea{display:block;width:100%;margin-top:7px;background:#050d13;color:#e9f8ff;border:1px solid #2b4b5b;border-radius:9px;padding:11px;font:inherit;font-size:12px}textarea{resize:vertical}
        .actions{display:flex;gap:9px;flex-wrap:wrap}button{background:linear-gradient(110deg,#dcb75e,#8ee9f1);color:#07131b;border:0;border-radius:9px;padding:11px 15px;font-size:11px;font-weight:800;cursor:pointer}button.secondary{background:#123140;color:#c9f7ff;border:1px solid #2e6375}button:disabled{opacity:.42;cursor:not-allowed}.hint{font-size:10px;line-height:1.55;color:#7893a2;margin:12px 0 0}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.grid .panel{margin:0;min-width:0}.feed{max-height:460px;overflow:auto}.feed article{padding:11px;border:1px solid #254354;border-radius:9px;margin:8px 0;background:#0b1922}.feed article>div{display:flex;justify-content:space-between;gap:8px;color:#7bdff0;font-size:9px}.feed time{color:#829ba8}.feed strong{display:block;margin-top:7px;font-size:11px}.feed article p{font-size:11px;color:#c9dce3;white-space:pre-wrap;margin:5px 0}.empty{color:#829ba8;font-size:11px;padding:12px}.notice,.error{margin-top:16px;padding:12px;border-radius:9px;font-size:11px}.notice{background:#102b24;color:#a5edc8;border:1px solid #326b54}.error{background:#321b20;color:#ffb9c2;border:1px solid #6c3944}footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:20px;border-top:1px solid #203b4b;padding-top:14px;color:#7893a2;font-size:10px}
        @media(max-width:760px){.bridgePage{padding:14px 12px 38px}.grid{grid-template-columns:1fr}.intro{margin-top:25px}.topbar{font-size:8px}.panel{padding:13px}}
      `}</style>
    </main>
  );
}

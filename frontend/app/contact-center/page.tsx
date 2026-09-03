'use client';

import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Row=Record<string,any>;

async function read(r:Response){
  const text=await r.text();
  try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${r.status})`}}
}
function when(value:number){return value?new Date(value*1000).toLocaleString():'—'}
function elapsed(value:number){const n=Math.max(0,Number(value||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}

export default function ContactCenter(){
  const [token,setToken]=useState('');
  const [tab,setTab]=useState('overview');
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [overview,setOverview]=useState<Row>({});
  const [caps,setCaps]=useState<Row>({});
  const [campaigns,setCampaigns]=useState<Row[]>([]);
  const [callbacks,setCallbacks]=useState<Row[]>([]);
  const [voicemails,setVoicemails]=useState<Row[]>([]);
  const [dispositions,setDispositions]=useState<Row[]>([]);
  const [supervisor,setSupervisor]=useState<Row>({calls:[],agents:[],assist_rules:[]});
  const [flows,setFlows]=useState<Row[]>([]);
  const [calls,setCalls]=useState<Row[]>([]);
  const [inbox,setInbox]=useState<Row>({interactions:[]});
  const [selectedCampaign,setSelectedCampaign]=useState('');
  const [contacts,setContacts]=useState('');
  const [nextContact,setNextContact]=useState<Row|null>(null);
  const [newCampaign,setNewCampaign]=useState({name:'',mode:'preview',timezone:'Asia/Manila',daily_cap:100,hourly_cap:20});
  const [assist,setAssist]=useState({name:'',trigger_phrase:'',guidance:''});
  const activeFlow=flows.find(x=>Number(x.active)===1)||flows[0];
  const [ivrGreeting,setIvrGreeting]=useState('');
  const [ivrNodes,setIvrNodes]=useState<Record<string,any>>({});
  const recentCalls=useMemo(()=>calls.slice(0,30),[calls]);

  useEffect(()=>{
    const t=getPlatformAuthToken();
    if(!t){location.replace('/login');return}
    setToken(t);
    load(t,true);
    const timer=setInterval(()=>load(t,false),15000);
    return()=>clearInterval(timer);
  },[]);
  useEffect(()=>{
    if(activeFlow){setIvrGreeting(activeFlow.greeting||'');setIvrNodes(activeFlow.nodes||{})}
  },[activeFlow?.id]);

  async function authed(path:string,options:RequestInit={},active=token){
    const headers=new Headers(options.headers||{});
    headers.set('Authorization',`Bearer ${active}`);
    if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    return fetch(`${api}${path}`,{...options,headers});
  }
  async function get(path:string,active=token){
    const response=await authed(path,{},active),data=await read(response);
    if(!response.ok)throw new Error(data.detail||`Request failed (${response.status})`);
    return data;
  }
  async function send(path:string,body:any,method='POST'){
    const response=await authed(path,{method,body:JSON.stringify(body)}),data=await read(response);
    if(!response.ok)throw new Error(data.detail||`Request failed (${response.status})`);
    return data;
  }
  async function load(active=token,showBusy=false){
    if(!active)return;
    if(showBusy)setBusy('load');
    try{
      const [o,c,ca,cb,vm,di,su,iv,pc,ib]=await Promise.all([
        get('/api/contact-center/overview',active),get('/api/contact-center/capabilities',active),get('/api/contact-center/campaigns',active),get('/api/contact-center/callbacks',active),get('/api/contact-center/voicemails',active),get('/api/contact-center/dispositions',active),get('/api/contact-center/supervisor/live',active),get('/api/contact-center/ivr',active),get('/api/phone/calls',active),get('/api/contact-center/inbox',active)
      ]);
      setOverview(o);setCaps(c);setCampaigns(ca.campaigns||[]);setCallbacks(cb.callbacks||[]);setVoicemails(vm.voicemails||[]);setDispositions(di.dispositions||[]);setSupervisor(su);setFlows(iv.flows||[]);setCalls(pc.calls||[]);setInbox(ib);setError('');
    }catch(e:any){setError(e?.message||'Unable to load the contact center.')}finally{if(showBusy)setBusy('')}
  }
  async function createCampaign(){
    if(!newCampaign.name.trim())return;
    setBusy('campaign');setError('');
    try{const result=await send('/api/contact-center/campaigns',newCampaign);setSelectedCampaign(result.id);setNewCampaign({...newCampaign,name:''});setNotice('Campaign created. Add consented contacts, then activate it.');await load(token,false)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function setCampaignStatus(id:string,status:string){
    setBusy(`campaign-${id}`);setError('');
    try{await send(`/api/contact-center/campaigns/${id}`,{status},'PUT');setNotice(`Campaign ${status}.`);await load(token,false)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function enroll(){
    if(!selectedCampaign||!contacts.trim())return;
    const rows=contacts.split(/\n+/).map(line=>line.trim()).filter(Boolean).map(line=>{const parts=line.split(',').map(x=>x.trim());return{phone:parts[0],display_name:parts.slice(1).join(' ')||parts[0],consent_confirmed:true}});
    setBusy('enroll');setError('');
    try{const result=await send(`/api/contact-center/campaigns/${selectedCampaign}/enroll`,{contacts:rows,consent_confirmed:true});setNotice(`${result.added} contact(s) added; ${result.skipped} skipped.`);setContacts('');await load(token,false)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function getNext(){
    if(!selectedCampaign)return;
    setBusy('next');setError('');setNextContact(null);
    try{const result=await send(`/api/contact-center/campaigns/${selectedCampaign}/next`,{});setNextContact(result);setNotice(`Reserved: ${result.member.display_name||result.member.phone}. Consent, DNC, quiet hours and campaign caps passed.`)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function dialReserved(){
    if(!nextContact||!selectedCampaign)return;
    setBusy('dial');setError('');
    try{
      await send(`/api/contact-center/campaigns/${selectedCampaign}/dial-start`,{member_id:nextContact.member.id});
      const result=await send(nextContact.dial_endpoint,nextContact.required_payload);
      setNotice(`Call ${result.id||result.call_id||''} queued through ${result.provider||'the configured carrier'}. Save the disposition when the interaction ends.`);
      await load(token,false);
    }catch(e:any){
      await send(`/api/contact-center/campaigns/${selectedCampaign}/dial-cancel`,{member_id:nextContact.member.id}).catch(()=>{});
      setError(e.message);
    }finally{setBusy('')}
  }
  async function disposition(code:string){
    if(!nextContact||!selectedCampaign)return;
    setBusy('outcome');setError('');
    try{await send(`/api/contact-center/campaigns/${selectedCampaign}/result`,{member_id:nextContact.member.id,disposition:code});setNotice(`Disposition saved: ${code}.`);setNextContact(null);await load(token,false)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function saveIvr(){
    if(!activeFlow)return;
    setBusy('ivr');setError('');
    try{await send(`/api/contact-center/ivr/${activeFlow.id}`,{greeting:ivrGreeting,nodes:ivrNodes,active:true},'PUT');setNotice('Main IVR flow saved and active.');await load(token,false)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function addAssist(){
    if(!assist.trigger_phrase.trim()||!assist.guidance.trim())return;
    setBusy('assist');setError('');
    try{await send('/api/contact-center/agent-assist',assist);setAssist({name:'',trigger_phrase:'',guidance:''});setNotice('Live coaching rule added.');await load(token,false)}catch(e:any){setError(e.message)}finally{setBusy('')}
  }
  async function updateCallback(id:string){try{await send(`/api/contact-center/callbacks/${id}`,{status:'completed'},'PUT');setNotice('Callback completed.');await load(token,false)}catch(e:any){setError(e.message)}}
  async function updateVoicemail(id:string){try{await send(`/api/contact-center/voicemails/${id}`,{status:'completed'},'PUT');setNotice('Voicemail completed.');await load(token,false)}catch(e:any){setError(e.message)}}
  async function analyze(callId:number){setBusy(`analyze-${callId}`);try{const result=await send(`/api/contact-center/calls/${callId}/intelligence`,{});setNotice(`AI call analysis: ${result.summary}`)}catch(e:any){setError(e.message)}finally{setBusy('')}}

  const providerEntries=Object.entries(caps.providers||{});
  const tabs=[['overview','Command'],['dialer','Dialer'],['ivr','IVR'],['inbox','Inbox'],['supervisor','Supervisor'],['quality','QA + WFM'],['providers','Providers']];

  return <main className="cx-root">
    <header className="cx-head"><div><a href="/">← I AM Platform</a><small>I AM MAGNANIMOUS WAY™ · PROFESSIONAL CONTACT CENTER</small><h1>Magnanimous CX Command</h1><p>One workspace for ACD routing, browser and carrier phones, campaigns, IVR, AI reception, callbacks, voicemail, workforce, quality, analytics and digital service.</p></div><div className="cx-live"><i/>{busy==='load'?'SYNCING':'LIVE'}</div></header>
    {error&&<div className="cx-alert error">{error}<button onClick={()=>setError('')}>×</button></div>}
    {notice&&<div className="cx-alert notice">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    <nav className="cx-nav">{tabs.map(([id,label])=><button key={id} className={tab===id?'on':''} onClick={()=>setTab(id)}>{label}</button>)}</nav>

    {tab==='overview'&&<>
      <section className="cx-stats">
        <Stat label="Agents" value={overview.agents||0} sub={`${overview.available_agents||0} available`}/><Stat label="Active calls" value={overview.active_calls||0} sub="ringing / connected"/><Stat label="Calls · 24h" value={overview.calls_24h||0} sub="all voice calls"/><Stat label="Campaigns" value={overview.campaigns||0} sub="draft / live / paused"/><Stat label="Callbacks" value={overview.callbacks||0} sub="waiting"/><Stat label="Voicemails" value={overview.voicemails||0} sub="new / assigned"/>
      </section>
      <section className="cx-grid3">
        <Panel title="Agent desk"><Feature>Free browser-to-browser WebRTC</Feature><Feature>Optional Twilio PSTN browser softphone</Feature><Feature>Inbound queue ringing and outbound carrier calls</Feature><a className="cx-link" href="/softphone">Open Carrier Softphone →</a><a className="cx-link second" href="/phone">Open Free WebRTC Phone →</a></Panel>
        <Panel title="AI operations"><Feature>Magnanimous AI receptionist</Feature><Feature>Call summaries, sentiment, action items and QA flags</Feature><Feature>Live trigger-based coaching guidance</Feature><a className="cx-link" href="/ai-receptionist">AI Receptionist →</a></Panel>
        <Panel title="Workforce + quality"><Feature>Service level, ASA, AHT, abandonment, FCR and CSAT</Feature><Feature>Forecasting, schedules and adherence</Feature><Feature>Quality reviews and coaching backlog</Feature><a className="cx-link" href="/call-center-health">Open WFM / QA Health →</a></Panel>
      </section>
      <Panel title="Recent voice interactions"><table><thead><tr><th>Time</th><th>Direction</th><th>Party</th><th>Status</th><th>Agent</th><th>Duration</th><th>Magnanimous QA</th></tr></thead><tbody>{recentCalls.map(call=><tr key={call.id}><td>{when(call.created_at)}</td><td>{call.direction}</td><td>{call.direction==='inbound'?call.caller:call.callee}</td><td>{call.status}</td><td>{call.agent_name||'—'}</td><td>{elapsed(call.duration_seconds)}</td><td><button onClick={()=>analyze(Number(call.id))} disabled={busy===`analyze-${call.id}`}>{busy===`analyze-${call.id}`?'Analyzing…':'Analyze'}</button></td></tr>)}</tbody></table>{!recentCalls.length&&<Empty text="No calls yet."/>}</Panel>
    </>}

    {tab==='dialer'&&<section className="cx-two">
      <Panel title="Campaign control"><div className="cx-form"><input placeholder="Campaign name" value={newCampaign.name} onChange={e=>setNewCampaign({...newCampaign,name:e.target.value})}/><select value={newCampaign.mode} onChange={e=>setNewCampaign({...newCampaign,mode:e.target.value})}><option value="preview">Preview</option><option value="progressive">Progressive</option><option value="power">Power</option></select><input placeholder="Timezone" value={newCampaign.timezone} onChange={e=>setNewCampaign({...newCampaign,timezone:e.target.value})}/><button className="primary" onClick={createCampaign} disabled={busy==='campaign'}>Create</button></div><div className="campaign-list">{campaigns.map(c=><article key={c.id} className={selectedCampaign===c.id?'selected':''} onClick={()=>setSelectedCampaign(c.id)}><div><b>{c.name}</b><span>{c.mode} · {c.status}</span><small>{c.member_count||0} contacts · {c.completed_count||0} complete</small></div><button onClick={e=>{e.stopPropagation();setCampaignStatus(c.id,c.status==='active'?'paused':'active')}}>{c.status==='active'?'Pause':'Activate'}</button></article>)}</div></Panel>
      <Panel title="Consent-gated power dialer"><p className="muted">Paste one consented E.164 number per line. Optional name after a comma. The server checks permission, DNC, 08:00–20:00 campaign-local hours, retry limits and hourly/daily caps before reserving a contact.</p><textarea value={contacts} onChange={e=>setContacts(e.target.value)} placeholder={'+14155551212, Jane Doe\n+639171234567, Customer Two'}/><button onClick={enroll} disabled={!selectedCampaign||busy==='enroll'}>Add consented contacts</button><div className="dial-card"><button className="primary" onClick={getNext} disabled={!selectedCampaign||busy==='next'}>GET NEXT ELIGIBLE CONTACT</button>{nextContact&&<><strong>{nextContact.member.display_name||nextContact.member.phone}</strong><code>{nextContact.member.phone}</code><button className="call" onClick={dialReserved} disabled={busy==='dial'}>CALL RESERVED CONTACT</button><div className="outcomes">{dispositions.map(item=><button key={item.id} onClick={()=>disposition(item.code)}>{item.label}</button>)}</div></>}</div></Panel>
    </section>}

    {tab==='ivr'&&<section className="cx-two">
      <Panel title="Main line IVR"><p className="muted">Set the Twilio phone-number Voice webhook to <code>{caps.inbound_webhook||'the contact-center inbound endpoint'}</code>.</p><label>Greeting<textarea value={ivrGreeting} onChange={e=>setIvrGreeting(e.target.value)}/></label><div className="ivr-options">{['1','2','3','4'].map(key=><div key={key}><b>Press {key}</b><select value={ivrNodes[key]?.type||'message'} onChange={e=>setIvrNodes({...ivrNodes,[key]:{...(ivrNodes[key]||{}),type:e.target.value}})}><option value="ai">AI receptionist</option><option value="queue">Browser-agent queue</option><option value="callback">Callback</option><option value="voicemail">Voicemail</option><option value="forward">Forward number</option><option value="message">Message + hangup</option></select>{ivrNodes[key]?.type==='forward'&&<input value={ivrNodes[key]?.number||''} onChange={e=>setIvrNodes({...ivrNodes,[key]:{...(ivrNodes[key]||{}),number:e.target.value}})} placeholder="+14155551212"/>}<input value={ivrNodes[key]?.message||''} onChange={e=>setIvrNodes({...ivrNodes,[key]:{...(ivrNodes[key]||{}),message:e.target.value}})} placeholder="Optional prompt"/></div>)}</div><button className="primary" onClick={saveIvr} disabled={!activeFlow||busy==='ivr'}>Save active IVR</button></Panel>
      <Panel title="Professional inbound stack"><Feature>Signed Twilio webhook validation</Feature><Feature>DTMF and speech menu selection</Feature><Feature>AI receptionist handoff</Feature><Feature>Skills/queue routing into registered browser agents</Feature><Feature>External number forwarding</Feature><Feature>Automatic callback fallback</Feature><Feature>Voicemail recording capture</Feature><Feature>DNC screening and carrier cost guard</Feature><a className="cx-link" href="/softphone">Register an Agent Softphone →</a></Panel>
    </section>}

    {tab==='inbox'&&<section className="cx-grid3">
      <Panel title={`Callbacks · ${callbacks.length}`}>{callbacks.slice(0,30).map(item=><Item key={item.id} title={item.display_name||item.phone} sub={`${item.status} · ${when(item.scheduled_at||item.requested_at)}`} action={<button onClick={()=>updateCallback(item.id)}>Complete</button>}/>)}{!callbacks.length&&<Empty text="No callbacks waiting."/>}</Panel>
      <Panel title={`Voicemail · ${voicemails.length}`}>{voicemails.slice(0,30).map(item=><Item key={item.id} title={item.phone||'Caller'} sub={`${item.status} · ${when(item.created_at)}`} action={<>{item.recording_url?<a href={item.recording_url} target="_blank" rel="noreferrer">Play</a>:<span>No audio URL</span>}<button onClick={()=>updateVoicemail(item.id)}>Done</button></>}/>)}{!voicemails.length&&<Empty text="No voicemail waiting."/>}</Panel>
      <Panel title={`Digital work · ${(inbox.interactions||[]).length}`}>{(inbox.interactions||[]).slice(0,30).map((item:Row)=><Item key={item.id} title={item.customer_name||item.customer_key||item.channel} sub={`${item.channel} · ${item.status} · priority ${item.priority}`}/>)}{!(inbox.interactions||[]).length&&<Empty text="No open digital interactions yet."/>}<a className="cx-link" href="/connections">Connect email, social and commerce →</a></Panel>
    </section>}

    {tab==='supervisor'&&<>
      <section className="cx-stats"><Stat label="Live calls" value={(supervisor.calls||[]).length} sub="floor view"/><Stat label="Agents" value={(supervisor.agents||[]).length} sub={`${(supervisor.agents||[]).filter((x:Row)=>x.status==='available').length} available`}/><Stat label="Coach rules" value={(supervisor.assist_rules||[]).length} sub="live assist"/></section>
      <section className="cx-two"><Panel title="Live floor"><table><thead><tr><th>Call</th><th>Agent</th><th>Queue</th><th>Status</th><th>Party</th></tr></thead><tbody>{(supervisor.calls||[]).map((call:Row)=><tr key={call.id}><td>#{call.id}</td><td>{call.agent_name||'AI / unassigned'}</td><td>{call.queue_name||'—'}</td><td>{call.status}</td><td>{call.direction==='inbound'?call.caller:call.callee}</td></tr>)}</tbody></table>{!(supervisor.calls||[]).length&&<Empty text="No live calls."/>}<p className="muted">{supervisor.supervisor_audio?.note}</p></Panel><Panel title="Live AI coach"><input value={assist.name} onChange={e=>setAssist({...assist,name:e.target.value})} placeholder="Rule name"/><input value={assist.trigger_phrase} onChange={e=>setAssist({...assist,trigger_phrase:e.target.value})} placeholder="Trigger phrase, e.g. refund"/><textarea value={assist.guidance} onChange={e=>setAssist({...assist,guidance:e.target.value})} placeholder="Guidance shown to the agent in the moment"/><button className="primary" onClick={addAssist} disabled={busy==='assist'}>Add coaching rule</button>{(supervisor.assist_rules||[]).map((rule:Row)=><Item key={rule.id} title={rule.name} sub={`When “${rule.trigger_phrase}” → ${rule.guidance}`}/>)}</Panel></section>
    </>}

    {tab==='quality'&&<section className="cx-grid3"><Panel title="Quality management"><Feature>Magnanimous transcript analysis</Feature><Feature>Summary, sentiment, topics and action items</Feature><Feature>QA and compliance flags</Feature><a className="cx-link" href="/call-center-health">Quality reviews →</a></Panel><Panel title="Workforce management"><Feature>Contact and AHT forecasting</Feature><Feature>Required agents and schedules</Feature><Feature>Adherence and staffing health</Feature><a className="cx-link" href="/call-center-health">Forecast & schedule →</a></Panel><Panel title="Performance"><Feature>Service level, ASA and AHT</Feature><Feature>Abandonment, FCR and CSAT</Feature><Feature>QA, forecast accuracy and people cost</Feature><a className="cx-link" href="/call-center-health">Analytics dashboard →</a></Panel></section>}

    {tab==='providers'&&<section className="provider-grid">{providerEntries.map(([id,value])=>{const p=value as Row;return <article key={id} className={p.configured?'ready':''}><small>{id.replaceAll('_',' ').toUpperCase()}</small><strong>{p.configured?'READY':'OPTIONAL'}</strong><p>{p.note||[p.inbound&&'Inbound',p.outbound&&'Outbound',p.byoc&&'BYOC',p.ai_receptionist&&'AI receptionist'].filter(Boolean).join(' · ')||'Provider connector'}</p></article>})}</section>}

    <footer className="cx-footer"><a href="/softphone">Carrier Softphone</a><a href="/phone">Free WebRTC Phone</a><a href="/ai-receptionist">AI Receptionist</a><a href="/call-center-health">QA / WFM</a><a href="/crm">CRM</a><a href="/connections">Integrations</a><a href="/pricing">Plans</a></footer>
    <style jsx global>{`
      .cx-root{min-height:100vh;background:#07100e;color:#eafff6;padding:28px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 10% 10%,rgba(48,236,164,.09),transparent 24%),radial-gradient(circle at 92% 22%,rgba(89,122,255,.10),transparent 28%)}
      .cx-head{max-width:1500px;margin:auto;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.cx-head a,.cx-footer a,.cx-link{color:#79f0bd;text-decoration:none}.cx-head small{display:block;margin-top:18px;letter-spacing:.18em;color:#5fa287;font-size:10px}.cx-head h1{font-size:clamp(42px,6vw,76px);line-height:.92;margin:10px 0 14px;max-width:900px}.cx-head p{color:#8cae9f;max-width:850px}.cx-live{border:1px solid #285747;border-radius:999px;padding:10px 14px;font-size:11px;color:#9eeacb;white-space:nowrap}.cx-live i{display:inline-block;width:8px;height:8px;background:#4df1a9;border-radius:50%;margin-right:6px;box-shadow:0 0 14px #4df1a9}.cx-alert{max-width:1500px;margin:18px auto;padding:13px 16px;border-radius:12px;display:flex;justify-content:space-between}.cx-alert.error{background:#36151b;border:1px solid #71303a}.cx-alert.notice{background:#0d2a20;border:1px solid #245943}.cx-alert button{background:none;border:0;color:#fff;font-size:20px}.cx-nav{max-width:1500px;margin:22px auto;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #16362b;padding-bottom:12px}.cx-nav button,.cx-panel button{background:#10261e;border:1px solid #2b5b48;color:#dff8ed;border-radius:9px;padding:9px 11px;cursor:pointer}.cx-nav button{border-radius:999px}.cx-nav button.on,.cx-panel button.primary,.cx-panel button.call{background:#58efa9;border-color:#58efa9;color:#052016;font-weight:900}.cx-panel button:disabled{opacity:.45;cursor:not-allowed}.cx-stats{max-width:1500px;margin:16px auto;display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.cx-stat,.provider-grid article{border:1px solid #1b4435;background:#091915;border-radius:16px;padding:17px}.cx-stat small,.provider-grid small{font-size:9px;letter-spacing:.14em;color:#6f9e89}.cx-stat strong,.provider-grid strong{display:block;font-size:28px;margin:6px 0}.cx-stat span{color:#789b8b;font-size:11px}.cx-grid3,.cx-two,.provider-grid{max-width:1500px;margin:16px auto;display:grid;gap:14px}.cx-grid3{grid-template-columns:repeat(3,1fr)}.cx-two{grid-template-columns:1fr 1fr}.provider-grid{grid-template-columns:repeat(4,1fr)}.provider-grid article.ready{border-color:#3bbd83}.provider-grid p{color:#799b8b;font-size:12px;line-height:1.5}.cx-panel{max-width:1500px;margin:16px auto;border:1px solid #1d4939;background:rgba(7,24,18,.82);border-radius:20px;padding:22px;overflow:auto}.cx-panel h2{margin:0 0 14px;font-size:24px}.cx-panel .muted{color:#729584;font-size:12px;line-height:1.55}.cx-feature{padding:10px 0;border-bottom:1px solid #153229;color:#cfeade}.cx-feature:before{content:'✓';color:#58efa9;margin-right:9px}.cx-link{display:inline-block;margin-top:14px}.cx-link.second{margin-left:14px}.cx-form{display:grid;grid-template-columns:2fr 1fr 1.5fr auto;gap:8px}.cx-panel input,.cx-panel select,.cx-panel textarea{width:100%;background:#06100d;border:1px solid #24503f;color:#eafff6;border-radius:10px;padding:11px;font:inherit}.cx-panel textarea{min-height:110px;resize:vertical}.campaign-list{display:grid;gap:8px;margin-top:14px}.campaign-list article{padding:13px;border:1px solid #1d4637;border-radius:12px;cursor:pointer;display:flex;justify-content:space-between;gap:10px}.campaign-list article.selected{border-color:#5df0ab;background:#0c251b}.campaign-list span,.campaign-list small{display:block;color:#749888;font-size:11px;margin-top:4px}.dial-card{margin-top:18px;padding:16px;border:1px dashed #2c5b49;border-radius:14px;display:grid;gap:10px}.dial-card strong{font-size:24px}.dial-card code,.cx-panel code{color:#9cf1cc}.outcomes{display:flex;gap:6px;flex-wrap:wrap}.ivr-options{display:grid;gap:10px;margin:12px 0}.ivr-options>div{display:grid;grid-template-columns:80px 1fr 1fr;gap:8px;align-items:center}.cx-item{padding:12px 0;border-bottom:1px solid #17352b;display:flex;justify-content:space-between;gap:14px}.cx-item span{color:#779989;font-size:11px;display:block;margin-top:5px}.cx-item .actions{display:flex;gap:6px;align-items:center}.cx-item a{color:#79f0bd}.cx-panel table{width:100%;border-collapse:collapse;font-size:12px}.cx-panel th{text-align:left;color:#6d9a86;font-weight:600;padding:10px 8px;border-bottom:1px solid #214638}.cx-panel td{padding:11px 8px;border-bottom:1px solid #122c23;color:#cde8dc}.cx-empty{padding:30px;text-align:center;color:#658577}.cx-footer{max-width:1500px;margin:28px auto 0;display:flex;gap:18px;flex-wrap:wrap;border-top:1px solid #18372d;padding-top:18px;font-size:12px}
      @media(max-width:1100px){.cx-stats{grid-template-columns:repeat(3,1fr)}.provider-grid{grid-template-columns:repeat(2,1fr)}.cx-grid3{grid-template-columns:1fr 1fr}}
      @media(max-width:760px){.cx-root{padding:18px 13px 50px}.cx-head{display:block}.cx-live{display:inline-block;margin-top:10px}.cx-stats,.cx-grid3,.cx-two,.provider-grid{grid-template-columns:1fr}.cx-form{grid-template-columns:1fr}.ivr-options>div{grid-template-columns:1fr}.cx-head h1{font-size:44px}.cx-link.second{margin-left:0;display:block}}
    `}</style>
  </main>
}

function Stat({label,value,sub}:{label:string,value:any,sub:string}){return <article className="cx-stat"><small>{label.toUpperCase()}</small><strong>{value}</strong><span>{sub}</span></article>}
function Panel({title,children}:{title:string,children:any}){return <article className="cx-panel"><h2>{title}</h2>{children}</article>}
function Feature({children}:{children:any}){return <div className="cx-feature">{children}</div>}
function Empty({text}:{text:string}){return <div className="cx-empty">{text}</div>}
function Item({title,sub,action}:{title:string,sub:string,action?:any}){return <div className="cx-item"><div><b>{title}</b><span>{sub}</span></div>{action&&<div className="actions">{action}</div>}</div>}

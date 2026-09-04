'use client';

import {useEffect, useState} from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const accountToken = () => typeof window === 'undefined' ? '' : (
  localStorage.getItem('iam_account_token') ||
  localStorage.getItem('magnanimous_admin_token') ||
  localStorage.getItem('odin_admin_token') || ''
);

type Checkin = {mood?: number; energy?: number; sleep_hours?: number; movement_minutes?: number};
type WellnessSummary = {
  goals?: Array<{id: string | number; title: string}>;
  habits?: Array<{id: string | number; title: string}>;
  checkins?: Checkin[];
  plan?: {title?: string; plan?: {daily?: Array<{time: string; action: string}>; weekly?: string[]}} | null;
};
type ResearchResult = {query?: string; grounding_context?: string; sources?: Array<{title?: string; url?: string; source?: string}>; live_search_configured?: boolean};

async function call(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {'content-type': 'application/json', ...((init.headers || {}) as Record<string, string>)};
  const token = accountToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${api}${path}`, {...init, headers, cache: 'no-store'});
  const text = await response.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch {}
  if (response.status === 401) {
    location.replace('/login?returnTo=%2Fwellness');
    throw new Error('Your session has ended. Redirecting to sign in…');
  }
  if (!response.ok) throw new Error(data.detail || data.error || `Request failed (${response.status})`);
  return data;
}

export default function Wellness() {
  const [data, setData] = useState<WellnessSummary | null>(null);
  const [planGoal, setPlanGoal] = useState('Improve my overall wellness');
  const [newGoal, setNewGoal] = useState('');
  const [habit, setHabit] = useState('');
  const [research, setResearch] = useState('');
  const [checkin, setCheckin] = useState({mood: '', energy: '', sleep: '', movement: ''});
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('loading');

  const load = async () => {
    try {
      setData(await call('/api/wellness/summary'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(current => current === 'loading' ? '' : current);
    }
  };

  useEffect(() => { load(); }, []);

  const post = async (path: string, body: unknown, label: string, success: string) => {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      const result = await call(path, {method: 'POST', body: JSON.stringify(body)});
      if (label === 'research') setResearchResult(result);
      setMessage(success);
      await load();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setBusy('');
    }
  };

  const saveGoal = async () => {
    if (await post('/api/wellness/goals', {title: newGoal, category: 'wellness'}, 'goal', 'Goal saved to your private workspace.')) setNewGoal('');
  };
  const saveHabit = async () => {
    if (await post('/api/wellness/habits', {title: habit, frequency: 'daily'}, 'habit', 'Habit added to your daily list.')) setHabit('');
  };
  const saveCheckin = async () => {
    await post('/api/wellness/checkins', {
      mood: Number(checkin.mood || 0), energy: Number(checkin.energy || 0),
      sleep_hours: Number(checkin.sleep || 0), movement_minutes: Number(checkin.movement || 0)
    }, 'checkin', 'Today’s check-in was saved.');
  };

  const latest = data?.checkins?.[0];

  return <main>
    <header>
      <div><small>MAGNANIMOUS AI • PRIVATE WORKSPACE</small><h1>Wellness Command Center</h1><p>Build practical routines, record how you feel, and gather sourced educational research.</p></div>
      <a className="back" href="/">← Dashboard</a>
    </header>

    <section className="safety" aria-label="Important health information">
      <b>Educational support, not medical care</b>
      <p>This workspace does not diagnose conditions or replace a licensed clinician. If you may be in immediate danger or have severe symptoms, contact local emergency services now.</p>
    </section>

    <section className="hero">
      <div><span className="eyebrow">A GENTLER WAY TO BUILD CONSISTENCY</span><h2>Your plan should adapt to your real life.</h2><p>Keep goals, habits, check-ins, starter plans, and research together so you can notice patterns without all-or-nothing scoring.</p></div>
      <div className="snapshot"><small>LATEST CHECK-IN</small>{latest ? <><b>{latest.mood ?? 0}/10 mood</b><span>{latest.energy ?? 0}/10 energy · {latest.sleep_hours ?? 0}h sleep</span></> : <><b>No entry yet</b><span>Use the check-in below when you’re ready.</span></>}</div>
    </section>

    {message && <div className="notice success" role="status">✓ {message}</div>}
    {error && <div className="notice failure" role="alert">{error}</div>}

    <section className="grid" aria-busy={busy === 'loading'}>
      <article>
        <span className="step">01 • STARTER PLAN</span><h3>Create a simple plan</h3><p>Choose one broad direction. You’ll receive a flexible routine you can discuss with a qualified professional if needed.</p>
        <label htmlFor="plan-goal">What would you like to improve?</label><input id="plan-goal" value={planGoal} onChange={event => setPlanGoal(event.target.value)} maxLength={300}/>
        <button onClick={() => post('/api/wellness/plan', {goal: planGoal}, 'plan', 'Your starter plan is ready.')} disabled={!!busy || !planGoal.trim()}>{busy === 'plan' ? 'Creating…' : 'Build starter plan'}</button>
        {data?.plan?.plan && <div className="plan"><b>{data.plan.title}</b>{data.plan.plan.daily?.map((item, index) => <p key={`${item.time}-${index}`}><strong>{item.time}:</strong> {item.action}</p>)}</div>}
      </article>

      <article>
        <span className="step">02 • GOALS</span><h3>Name the next outcome</h3><p>Keep it specific enough to remember and small enough to revisit.</p>
        <label htmlFor="new-goal">New wellness goal</label><input id="new-goal" value={newGoal} onChange={event => setNewGoal(event.target.value)} placeholder="Example: Keep a consistent bedtime" maxLength={300}/>
        <button onClick={saveGoal} disabled={!!busy || !newGoal.trim()}>{busy === 'goal' ? 'Saving…' : 'Save goal'}</button>
        <div className="chips" aria-label="Active goals">{data?.goals?.length ? data.goals.map(goal => <span key={goal.id}>{goal.title}</span>) : <span className="empty">No saved goals yet</span>}</div>
      </article>

      <article>
        <span className="step">03 • HABITS</span><h3>Choose one repeatable action</h3><p>A modest action you can repeat is more useful than an ideal routine you cannot sustain.</p>
        <label htmlFor="new-habit">Daily habit</label><input id="new-habit" value={habit} onChange={event => setHabit(event.target.value)} placeholder="Example: Walk for 20 minutes" maxLength={300}/>
        <button onClick={saveHabit} disabled={!!busy || !habit.trim()}>{busy === 'habit' ? 'Adding…' : 'Add daily habit'}</button>
        <div className="chips" aria-label="Active habits">{data?.habits?.length ? data.habits.map(item => <span key={item.id}>{item.title}</span>) : <span className="empty">No saved habits yet</span>}</div>
      </article>

      <article>
        <span className="step">04 • CHECK-IN</span><h3>Record today without judgment</h3><p>These values are personal observations, not clinical measurements.</p>
        <div className="row"><label htmlFor="mood">Mood <em>0–10</em><input id="mood" inputMode="decimal" type="number" min="0" max="10" value={checkin.mood} onChange={event => setCheckin({...checkin, mood: event.target.value})}/></label><label htmlFor="energy">Energy <em>0–10</em><input id="energy" inputMode="decimal" type="number" min="0" max="10" value={checkin.energy} onChange={event => setCheckin({...checkin, energy: event.target.value})}/></label></div>
        <div className="row"><label htmlFor="sleep">Sleep <em>hours</em><input id="sleep" inputMode="decimal" type="number" min="0" max="24" step="0.5" value={checkin.sleep} onChange={event => setCheckin({...checkin, sleep: event.target.value})}/></label><label htmlFor="movement">Movement <em>minutes</em><input id="movement" inputMode="numeric" type="number" min="0" max="1440" value={checkin.movement} onChange={event => setCheckin({...checkin, movement: event.target.value})}/></label></div>
        <button onClick={saveCheckin} disabled={!!busy}>{busy === 'checkin' ? 'Saving…' : 'Save today’s check-in'}</button><small className="count">{data?.checkins?.length || 0} recent check-ins in this workspace</small>
      </article>
    </section>

    <section className="research">
      <div><span className="step">SOURCED EDUCATIONAL RESEARCH</span><h2>Explore a wellness question</h2><p>Magnanimous combines saved workspace knowledge with current sources when live search is configured. Review sources and consult a professional before making health decisions.</p></div>
      <div><label htmlFor="research-question">What would you like to understand?</label><textarea id="research-question" value={research} onChange={event => setResearch(event.target.value)} placeholder="Example: What does current evidence say about improving sleep consistency?" maxLength={600}/><button onClick={() => post('/api/wellness/research', {query: research, web: true, remember: true}, 'research', 'Research gathered. Review the sources below.')} disabled={!!busy || !research.trim()}>{busy === 'research' ? 'Researching…' : 'Gather sourced research'}</button></div>
    </section>

    {researchResult && <section className="results" aria-live="polite"><span className="step">RESEARCH RESULTS</span><h2>{researchResult.query}</h2>{researchResult.grounding_context && <p className="context">{researchResult.grounding_context}</p>}<h3>Sources</h3>{researchResult.sources?.length ? <ul>{researchResult.sources.map((source, index) => <li key={`${source.url}-${index}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.source || source.url}</a> : source.title || source.source || 'Workspace source'}</li>)}</ul> : <p>No external sources were returned. {researchResult.live_search_configured === false ? 'Live search is not configured for this workspace.' : 'Try a more specific question.'}</p>}</section>}

    <footer><b>Privacy note:</b> Wellness entries belong to the signed-in workspace. Avoid entering information you would not want stored in your account.</footer>
    <style jsx>{`
      *{box-sizing:border-box}main{min-height:100vh;background:radial-gradient(circle at 80% 0,rgba(60,198,187,.13),transparent 30%),#07101b;color:#edf8ff;font-family:Inter,system-ui,sans-serif;padding:32px;max-width:1440px;margin:auto}header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}header small,.eyebrow,.step{letter-spacing:.16em;color:#72e1dc;font-size:11px;font-weight:900}h1{font-size:clamp(38px,5vw,68px);line-height:1;margin:8px 0 12px}h2{font-size:clamp(25px,3vw,38px);margin:8px 0 10px}h3{font-size:21px;margin:7px 0}p{color:#a8bdca;line-height:1.6}.back{color:#a8fff1;text-decoration:none;border:1px solid #28565a;border-radius:999px;padding:11px 16px;min-height:44px;white-space:nowrap}.safety{margin:24px 0 14px;padding:16px 18px;border:1px solid #665126;border-radius:14px;background:#18150d}.safety b{color:#ffd88b}.safety p{display:inline;margin-left:10px;color:#d4c8ad}.hero{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(230px,.7fr);gap:24px;padding:28px;border:1px solid #28566a;border-radius:22px;background:linear-gradient(120deg,#0e2c3c,#17192d)}.hero h2{max-width:760px}.snapshot{display:grid;align-content:center;gap:6px;padding:18px;border-left:1px solid #37606d}.snapshot small{color:#89a9b4;letter-spacing:.14em}.snapshot b{font-size:22px;color:#9bffe0}.snapshot span{color:#a4b6c3;font-size:13px}.notice{margin-top:14px;padding:13px 15px;border-radius:11px}.success{background:#0d241c;border:1px solid #287455;color:#9ff2c9}.failure{background:#2b1116;border:1px solid #7b3847;color:#ffc0ca}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}.grid article,.research,.results{border:1px solid #213f55;background:#0b1927;border-radius:17px;padding:22px}article>p{margin-top:4px}label{display:block;color:#d9e9ef;font-size:13px;font-weight:800;margin-top:14px}label em{color:#7894a4;font-style:normal;font-weight:500;float:right}input,textarea{width:100%;background:#07111f;border:1px solid #31516a;color:#eef9ff;padding:12px 13px;border-radius:10px;margin-top:7px;font:inherit;min-height:46px}input:focus,textarea:focus{outline:3px solid rgba(114,225,220,.25);border-color:#72e1dc}textarea{min-height:124px;resize:vertical}button{border:0;background:linear-gradient(90deg,#70e6de,#bd89ff);color:#07101b;font-weight:900;padding:12px 17px;border-radius:10px;cursor:pointer;margin-top:11px;min-height:46px}button:hover{filter:brightness(1.08)}button:focus-visible,.back:focus-visible,a:focus-visible{outline:3px solid #fff;outline-offset:3px}button:disabled{opacity:.5;cursor:not-allowed}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.chips span{background:#102a3b;border:1px solid #2d5367;border-radius:999px;padding:7px 10px;font-size:12px}.chips .empty{color:#8198a5;background:transparent;border-style:dashed}.plan{margin-top:14px;padding:15px;background:#07131f;border:1px solid #1d3a4c;border-radius:12px}.plan p{font-size:13px;margin:8px 0}.count{display:block;color:#7f9cab;margin-top:11px}.research{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:16px}.results{margin-top:16px}.results .context{white-space:pre-wrap;padding:14px;background:#07131f;border-radius:11px}.results a{color:#8ceee9}.results li{margin:8px 0;color:#a8bdca}footer{margin-top:20px;padding:16px 0;color:#849aa9;font-size:12px;border-top:1px solid #1a3444}footer b{color:#a9c4ce}@media(max-width:820px){main{padding:18px}.grid,.research,.hero{grid-template-columns:1fr}header{display:block}.back{display:inline-block;margin-top:14px}.snapshot{border-left:0;border-top:1px solid #37606d;padding:18px 0 0}.safety p{display:block;margin:7px 0 0}.row{grid-template-columns:1fr}}
    `}</style>
  </main>;
}

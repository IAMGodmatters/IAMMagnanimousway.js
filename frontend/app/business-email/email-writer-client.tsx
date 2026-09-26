'use client';

import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import {postMagnanimousChat} from '../../lib/magnanimous-chat-transport';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Account={provider:string;external_account_id:string;display_name?:string};
type Draft={subject:string;body:string};

const modes=[
 {id:'new',label:'New email'},
 {id:'reply',label:'Reply'},
 {id:'follow-up',label:'Follow-up'},
 {id:'rewrite',label:'Rewrite my draft'}
];
const tones=['My normal voice','Professional','Warm and friendly','Short and direct','Formal'];

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}
function textResult(data:any){return String(data?.output??data?.reply??data?.answer??data?.response??data?.message??data?.result??'').trim()}
function stripFence(value:string){return value.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim()}
function parseDraft(value:string):Draft{
 const clean=stripFence(value);
 try{
  const data=JSON.parse(clean);
  if(data&&typeof data==='object')return{subject:String(data.subject||'').trim(),body:String(data.body||data.email||'').trim()};
 }catch{}
 const subject=clean.match(/^SUBJECT:\s*(.+)$/im)?.[1]?.trim()||'';
 const bodyMatch=clean.match(/^BODY:\s*([\s\S]*)$/im);
 return{subject,body:(bodyMatch?.[1]||clean.replace(/^SUBJECT:.*$/im,'')).trim()};
}
function validEmail(value:string){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim())}

export default function EmailWriterClient(){
 const[token,setToken]=useState(''),[mode,setMode]=useState('new'),[to,setTo]=useState(''),[purpose,setPurpose]=useState(''),[context,setContext]=useState(''),[tone,setTone]=useState('My normal voice'),[style,setStyle]=useState('Plain, natural English. Sound like me. Keep it clear and professional without sounding robotic.'),[subject,setSubject]=useState(''),[body,setBody]=useState(''),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[accounts,setAccounts]=useState<Account[]>([]),[accountKey,setAccountKey]=useState('');
 const selected=useMemo(()=>accounts.find(a=>`${a.provider}:${a.external_account_id}`===accountKey)||null,[accounts,accountKey]);

 useEffect(()=>{
  const t=getPlatformAuthToken();setToken(t);
  try{
   const saved=JSON.parse(localStorage.getItem('magnanimous_email_writer_draft')||'null');
   if(saved){setMode(saved.mode||'new');setTo(saved.to||'');setPurpose(saved.purpose||'');setContext(saved.context||'');setTone(saved.tone||'My normal voice');setStyle(saved.style||style);setSubject(saved.subject||'');setBody(saved.body||'')}
  }catch{}
  if(t)loadAccounts(t);
 },[]);
 useEffect(()=>{try{localStorage.setItem('magnanimous_email_writer_draft',JSON.stringify({mode,to,purpose,context,tone,style,subject,body,updated_at:Date.now()}))}catch{}},[mode,to,purpose,context,tone,style,subject,body]);

 async function loadAccounts(t=token){
  try{
   const r=await fetch(`${api}/api/magnanimous/mail/accounts`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),d=await read(r);
   if(r.ok){const list=Array.isArray(d.accounts)?d.accounts:[];setAccounts(list);if(list.length)setAccountKey((k:string)=>k||`${list[0].provider}:${list[0].external_account_id}`)}
  }catch{}
 }

 async function writeEmail(){
  if(!purpose.trim()&&!context.trim()){setNotice('Tell Magnanimous what you want the email to say, or paste the message/draft you want help with.');return}
  setBusy('write');setNotice('Magnanimous is writing the email…');
  const task=modes.find(x=>x.id===mode)?.label||'New email';
  const prompt=`You are Magnanimous AI's first-party Email Writer. Write a ready-to-send email for the user.

EMAIL TASK
Type: ${task}
Recipient / who it is for: ${to.trim()||'(not supplied)'}
What the user wants to accomplish: ${purpose.trim()||'(use the supplied context)'}
Tone: ${tone}
User style instruction: ${style.trim()||'Plain, natural, clear English.'}

SOURCE CONTEXT / ROUGH DRAFT / EMAIL BEING ANSWERED
${context.trim()||'(none supplied)'}

RULES
- Write the complete email, not advice about how to write it.
- Preserve the user's facts and meaning. Do not invent names, dates, prices, approvals, legal status, promises, attachments, credentials, account numbers, government identifiers, or actions that did not happen.
- If this is a reply, answer only from the supplied context and known user request; do not pretend you read an email that was not supplied.
- If Magnanimous has established writing preferences for this signed-in user, follow them naturally, but never reveal or describe hidden memory.
- Make it sound human, clear and useful. Avoid generic corporate filler.
- Keep it concise unless the user clearly needs detail.
- Include a useful subject line. For a reply/follow-up, preserve an existing subject when the context makes it clear.
- Return ONLY valid JSON with exactly two string fields: {"subject":"...","body":"..."}. No markdown fences and no commentary.`;
  try{
   const headers:any={'Content-Type':'application/json'};if(token)headers.Authorization=`Bearer ${token}`;
   const r=await postMagnanimousChat(`${api}/api/chat`,{method:'POST',headers,body:JSON.stringify({message:prompt,tool:'magnanimous',provider:'auto',use_knowledge:true,live_search:false,news:false,specialist_routing:true})},{retryTransientEdgeOnce:true});
   const d=await read(r);if(!r.ok)throw new Error(d.detail||d.error||'Magnanimous could not write the email.');
   const draft=parseDraft(textResult(d));if(!draft.body)throw new Error('Magnanimous returned an empty email draft.');
   setSubject(draft.subject);setBody(draft.body);setNotice('Draft ready. Edit anything you want, copy it, or send it through a connected mailbox.');
  }catch(e:any){setNotice(e?.message||'Magnanimous could not write the email.')}finally{setBusy('')}
 }

 function copy(value:string,label:string){navigator.clipboard?.writeText(value).then(()=>setNotice(`${label} copied.`)).catch(()=>setNotice('Press and hold the text to copy it.'))}

 async function send(){
  if(!token){location.href='/login?returnTo=%2Fbusiness-email';return}
  if(!selected){setNotice('Connect Gmail or Outlook first, then choose the sending account.');return}
  if(!validEmail(to)){setNotice('Enter the recipient email address in the To box before sending.');return}
  if(!subject.trim()||!body.trim()){setNotice('Write the email first, then review the subject and message.');return}
  if(!confirm(`Send this email now to ${to.trim()}? Magnanimous will use your connected ${selected.provider==='google'?'Gmail':'Outlook'} account.`))return;
  setBusy('send');setNotice('Sending through your connected mailbox…');
  try{
   const r=await fetch(`${api}/api/magnanimous/mail/send`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({confirm:true,provider:selected.provider,external_account_id:selected.external_account_id,to:to.trim(),subject:subject.trim(),body})}),d=await read(r);
   if(!r.ok)throw new Error(d.detail||d.error||'The email was not sent.');
   setNotice('Email sent successfully through your connected mailbox.');
  }catch(e:any){setNotice(e?.message||'The email was not sent.')}finally{setBusy('')}
 }

 function clearAll(){setMode('new');setTo('');setPurpose('');setContext('');setSubject('');setBody('');setNotice('Started a fresh email.');}

 return <section className="writerShell" aria-label="Magnanimous AI Email Writer">
  <div className="writer">
   <div className="writerHead">
    <div><small>MAGNANIMOUS AI • EMAIL WRITER</small><h1>Tell me what you want to say.<br/>I will write the email.</h1><p>Anyone using the platform can ask Magnanimous to write new emails, replies, follow-ups, and rewrites. Writing works on the free-first path; sending stays a separate signed-in action you approve.</p></div>
    <button className="fresh" onClick={clearAll}>+ NEW EMAIL</button>
   </div>

   {notice&&<div className="writerNotice" role="status">{notice}</div>}

   <div className="writerGrid">
    <div className="composeCard">
     <div className="modeRow">{modes.map(x=><button key={x.id} className={mode===x.id?'on':''} onClick={()=>setMode(x.id)}>{x.label}</button>)}</div>
     <label><span>Who is this for?</span><input value={to} onChange={e=>setTo(e.target.value)} placeholder="name@example.com or the person's name"/></label>
     <label><span>What do you want the email to say or accomplish?</span><textarea value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Example: Ask SEC whether one corporation can have BPO as the primary purpose and AI/software plus future NTC-authorized telecom as secondary purposes."/></label>
     <label><span>{mode==='reply'?'Paste the email you are answering':'Extra context or your rough draft'} <i>optional</i></span><textarea className="context" value={context} onChange={e=>setContext(e.target.value)} placeholder={mode==='reply'?'Paste the message here so Magnanimous can answer it accurately.':'Paste facts, notes, or a rough draft here. Magnanimous will not invent missing facts.'}/></label>
     <div className="two">
      <label><span>Tone</span><select value={tone} onChange={e=>setTone(e.target.value)}>{tones.map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span>How should it sound?</span><input value={style} onChange={e=>setStyle(e.target.value)} /></label>
     </div>
     <button className="writeBtn" onClick={writeEmail} disabled={!!busy}>{busy==='write'?'WRITING…':'WRITE THE EMAIL →'}</button>
    </div>

    <div className="resultCard">
     <div className="resultTop"><div><small>READY-TO-EDIT DRAFT</small><h2>Magnanimous wrote this for you.</h2></div><button onClick={()=>copy(`Subject: ${subject}\n\n${body}`,'Email')}>COPY ALL</button></div>
     <label><span>Subject</span><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject will appear here"/></label>
     <label><span>Email</span><textarea className="emailBody" value={body} onChange={e=>setBody(e.target.value)} placeholder="Your completed email will appear here."/></label>
     <div className="copyButtons"><button onClick={()=>copy(subject,'Subject')}>COPY SUBJECT</button><button onClick={()=>copy(body,'Message')}>COPY MESSAGE</button></div>

     <div className="sendBox">
      <div><small>OPTIONAL SEND</small><b>Send through your own connected mailbox</b><p>Magnanimous never sends this draft just because it wrote it. You press Send and confirm first.</p></div>
      {accounts.length?<><select value={accountKey} onChange={e=>setAccountKey(e.target.value)}>{accounts.map(a=><option key={`${a.provider}:${a.external_account_id}`} value={`${a.provider}:${a.external_account_id}`}>{a.display_name||a.external_account_id} • {a.provider==='google'?'Gmail':'Outlook'}</option>)}</select><button className="sendBtn" onClick={send} disabled={!!busy}>{busy==='send'?'SENDING…':'SEND THIS EMAIL →'}</button></>:<a href="/connections?category=email&source=business-email-writer">CONNECT GMAIL OR OUTLOOK →</a>}
     </div>
    </div>
   </div>

   <div className="truthRow"><span>✓ Magnanimous writes the copy</span><span>✓ Your facts stay authoritative</span><span>✓ No invented approvals or actions</span><span>✓ Sending requires your confirmation</span></div>
  </div>
  <style jsx>{`
   .writerShell{background:#03070b;color:#eefaff;padding:28px 30px 6px;font-family:Inter,system-ui,sans-serif}.writer{max-width:1240px;margin:auto;border:1px solid #365071;border-radius:24px;padding:28px;background:linear-gradient(135deg,#07131f,#07090d 60%,#100b18);box-shadow:0 18px 70px rgba(0,0,0,.3)}.writerHead{display:flex;justify-content:space-between;gap:22px;align-items:flex-start}.writerHead small,.resultTop small,.sendBox small{font-size:9px;letter-spacing:.16em;color:#92e8ff;font-weight:900}.writerHead h1{font-size:clamp(36px,5vw,64px);line-height:.98;margin:8px 0 12px}.writerHead p{color:#91a7b8;line-height:1.6;max-width:760px;font-size:12px}.fresh,.resultTop button,.copyButtons button{border:1px solid #334d6a;background:#0a1521;color:#cdecff;border-radius:9px;padding:10px 12px;font-size:9px;font-weight:900;cursor:pointer}.writerNotice{margin:14px 0;border:1px solid #2e617d;background:#071b28;border-radius:10px;padding:12px;color:#c7efff;font-size:12px}.writerGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.composeCard,.resultCard{border:1px solid #23364e;border-radius:17px;background:#070d14;padding:18px}.modeRow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.modeRow button{border:1px solid #33475f;background:#0a111b;color:#9eb5c7;border-radius:999px;padding:8px 10px;font-size:9px;font-weight:800;cursor:pointer}.modeRow button.on{background:#75dff8;color:#031015;border-color:#75dff8}label{display:grid;gap:6px;margin:10px 0}label span{font-size:10px;font-weight:900;color:#b9d4e2}label i{font-weight:400;color:#758c9b}input,textarea,select{width:100%;box-sizing:border-box;border:1px solid #2c425b;background:#03080e;color:#edf8ff;border-radius:9px;padding:11px;font:inherit;outline:none}input:focus,textarea:focus,select:focus{border-color:#6eddf7;box-shadow:0 0 0 2px rgba(110,221,247,.1)}textarea{min-height:105px;resize:vertical}.context{min-height:145px}.emailBody{min-height:350px;line-height:1.55}.two{display:grid;grid-template-columns:.7fr 1.3fr;gap:8px}.writeBtn,.sendBtn{border:0;border-radius:10px;background:linear-gradient(90deg,#2f77f2,#985de8);color:#fff;font-weight:900;padding:13px 16px;cursor:pointer;width:100%;margin-top:8px}.writeBtn:disabled,.sendBtn:disabled{opacity:.55;cursor:wait}.resultTop{display:flex;justify-content:space-between;gap:12px;align-items:start}.resultTop h2{margin:5px 0 8px;font-size:25px}.copyButtons{display:flex;gap:7px;flex-wrap:wrap}.sendBox{border:1px solid #3f3657;background:#0d0914;border-radius:12px;padding:13px;margin-top:14px;display:grid;gap:9px}.sendBox b{display:block;margin-top:4px}.sendBox p{font-size:10px;color:#938da0;line-height:1.45;margin:4px 0}.sendBox a{border:1px solid #56506d;border-radius:8px;padding:10px;color:#d9cfff;text-decoration:none;text-align:center;font-size:9px;font-weight:900}.truthRow{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}.truthRow span{border:1px solid #22364b;background:#071019;border-radius:9px;padding:10px;color:#8fb0c2;font-size:9px;text-align:center}@media(max-width:900px){.writerGrid{grid-template-columns:1fr}.truthRow{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}}@media(max-width:620px){.writerShell{padding:15px 14px 5px}.writer{padding:18px}.writerHead{display:grid}.writerHead h1{font-size:38px}.truthRow{grid-template-columns:1fr}}
  `}</style>
 </section>
}

"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getPlatformAuthToken } from "../lib/magnanimous-session";

const api=process.env.NEXT_PUBLIC_API_BASE_URL||"";
type Provider="youtube"|"tiktok"|"linkedin";
type Connection={id:string;name:string;connected:boolean;display_name:string;external_id:string};
type Item={
 id:string;provider:Provider;external_id:string;scheduled_at:number;timezone:string;status:string;
 payload:Record<string,unknown>;last_error?:string;created_at:number;approved_at?:number;
 provider_receipt_json?:string;
};
function localInputValue(date:Date){
 const pad=(n:number)=>String(n).padStart(2,"0");
 return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+"T"+pad(date.getHours())+":"+pad(date.getMinutes());
}
function readDate(value:number,timezone:string){
 try{return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short",timeZone:timezone}).format(new Date(value*1000));}
 catch{return new Date(value*1000).toLocaleString();}
}
async function read(r:Response){
 const t=await r.text();
 try{return JSON.parse(t)}catch{return{detail:t};}
}
function authHeaders(token:string){
 return{"Content-Type":"application/json",Authorization:"Bearer "+token};
}
export default function SocialCalendar(){
 const [token,setToken]=useState("");
 const [connections,setConnections]=useState<Connection[]>([]);
 const [items,setItems]=useState<Item[]>([]);
 const [provider,setProvider]=useState<Provider>("youtube");
 const [scheduledLocal,setScheduledLocal]=useState("");
 const [minimumTime,setMinimumTime]=useState("");
 const [idempotencyKey,setIdempotencyKey]=useState("");
 const [timezone,setTimezone]=useState("UTC");
 const [videoUrl,setVideoUrl]=useState("");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [linkedinText,setLinkedinText]=useState("");
 const [privacy,setPrivacy]=useState("private");
 const [aiGenerated,setAiGenerated]=useState(false);
 const [aiDisclosure,setAiDisclosure]=useState(false);
 const [mediaDisclosure,setMediaDisclosure]=useState(false);
 const [humanReviewed,setHumanReviewed]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState("");
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [approvals,setApprovals]=useState<Record<string,boolean>>({});
 const supported=useMemo(()=>connections.filter(c=>["youtube","tiktok","linkedin"].includes(c.id)&&c.connected),[connections]);
 const activeConnection=supported.find(c=>c.id===provider);
 useEffect(()=>{
  const t=getPlatformAuthToken();
  if(!t){location.replace("/login");return;}
  setToken(t);
  try{setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC");}catch{setTimezone("UTC");}
  setScheduledLocal(localInputValue(new Date(Date.now()+45*60*1000)));
  setMinimumTime(localInputValue(new Date(Date.now()+16*60*1000)));
  setIdempotencyKey(crypto.randomUUID());
  void load(t);
 },[]);
 async function load(t=token){
  if(!t)return;
  setLoading(true);setError("");
  try{
   const results=await Promise.all([
    fetch(api+"/api/social-connect/connections",{headers:{Authorization:"Bearer "+t},cache:"no-store"}),
    fetch(api+"/api/social-schedule?limit=80",{headers:{Authorization:"Bearer "+t},cache:"no-store"})
   ]);
   const c=await read(results[0]),s=await read(results[1]);
   if(!results[0].ok)throw new Error(c.detail||"Could not read connected social accounts.");
   if(!results[1].ok)throw new Error(s.detail||"Could not load the publishing calendar.");
   const connected=(c.connections||[]).filter((item:Connection)=>["youtube","tiktok","linkedin"].includes(item.id)&&item.connected);
   setConnections(c.connections||[]);setItems(s.items||[]);
   setProvider(current=>connected.some((item:Connection)=>item.id===current)?current:(connected[0]?.id||"youtube") as Provider);
  }catch(e:any){setError(e?.message||"The publishing calendar could not be loaded.");}
  finally{setLoading(false);}
 }
 async function createDraft(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!token||!activeConnection)return;
  setBusy("create");setNotice("");setError("");
  try{
   const chosen=new Date(scheduledLocal);
   if(!Number.isFinite(chosen.getTime()))throw new Error("Choose a valid publishing date and time.");
   if(chosen.getTime()<Date.now()+15*60*1000)throw new Error("Choose a time at least 15 minutes ahead.");
   const payload:Record<string,unknown>={
    provider,scheduled_at:chosen.toISOString(),timezone,
    idempotency_key:idempotencyKey||crypto.randomUUID(),
    ai_generated:aiGenerated,deepfake:false,public_interest:false,
    human_reviewed:humanReviewed,editorial_responsibility:humanReviewed,
    ai_disclosure_confirmed:aiDisclosure,visible_media_disclosure_confirmed:mediaDisclosure
   };
   if(provider==="linkedin")payload.text=linkedinText.trim();
   else{
    payload.video_url=videoUrl.trim();payload.title=title.trim();
    if(provider==="youtube"){payload.description=description.trim();payload.privacy_status=privacy;payload.made_for_kids=false;}
    if(provider==="tiktok"){payload.privacy_level="SELF_ONLY";payload.allow_duet=false;payload.allow_comment=true;payload.allow_stitch=false;}
   }
   const r=await fetch(api+"/api/social-schedule",{method:"POST",headers:authHeaders(token),body:JSON.stringify(payload)});
   const d=await read(r);
   if(!r.ok)throw new Error(d.detail||"Could not save the draft.");
   setNotice("Draft saved. Review its account, content and time below, then approve it to schedule publishing.");
   setIdempotencyKey(crypto.randomUUID());
   setApprovals({});
   await load(token);
  }catch(e:any){setError(e?.message||"Could not save the draft.");}
  finally{setBusy("");}
 }
 async function approve(item:Item){
  if(!approvals[item.id]){setError("Confirm the exact content, account and time before approving.");return;}
  setBusy("approve-"+item.id);setError("");setNotice("");
  try{
   const r=await fetch(api+"/api/social-schedule/"+encodeURIComponent(item.id)+"/approve",{method:"POST",headers:authHeaders(token),body:JSON.stringify({confirm:true})});
   const d=await read(r);
   if(!r.ok)throw new Error(d.detail||"The post could not be approved.");
   setNotice("Post approved and added to the automatic publishing queue.");
   setApprovals(old=>({...old,[item.id]:false}));
   await load(token);
  }catch(e:any){setError(e?.message||"Approval failed.");}
  finally{setBusy("");}
 }
 async function cancel(item:Item){
  setBusy("cancel-"+item.id);setError("");setNotice("");
  try{
   const r=await fetch(api+"/api/social-schedule/"+encodeURIComponent(item.id)+"/cancel",{method:"POST",headers:authHeaders(token),body:"{}"});
   const d=await read(r);
   if(!r.ok)throw new Error(d.detail||"The post could not be cancelled.");
   setNotice("Scheduled post cancelled.");
   await load(token);
  }catch(e:any){setError(e?.message||"Cancellation failed.");}
  finally{setBusy("");}
 }
 function content(item:Item){
  const p=item.payload||{};
  return String(p.text||p.title||"Scheduled post");
 }
 function accountName(item:Item){
  const current=connections.find(c=>c.id===item.provider&&c.connected);
  if(!current)return "Not connected";
  if(String(current.external_id||"")!==String(item.external_id||""))return "A different account is now connected";
  return current.display_name||"Connected account";
 }
 return <main className="socialCalendar">
  <header className="top">
   <a href="/social-media">← Social Studio</a>
   <a href="/social-connect">Connected accounts</a>
  </header>
  <section className="hero">
   <small>MAGNANIMOUS SOCIAL STUDIO</small>
   <h1>Publishing Calendar</h1>
   <p>Prepare a post, review the exact account and publishing time, then approve it. Magnanimous AI manages the schedule; your connected social account remains yours.</p>
   <div className="facts"><span>15-minute scheduler</span><span>Approval before every post</span><span>No automatic retry after uncertain results</span></div>
  </section>
  {notice&&<div className="notice" role="status">{notice}</div>}
  {error&&<div className="error" role="alert">{error}</div>}
  <section className="composer">
   <div className="sectionHeading"><div><small>NEW SCHEDULED DRAFT</small><h2>Prepare your post</h2></div><span>{timezone}</span></div>
   {supported.length===0?<div className="empty">No supported publishing account is connected yet. Connect YouTube, TikTok or LinkedIn first. <a href="/social-connect">Connect a social account →</a></div>:<form onSubmit={createDraft}>
    <label>Social account
     <select value={provider} onChange={e=>setProvider(e.target.value as Provider)}>
      {supported.map(c=><option key={c.id} value={c.id}>{c.name} — {c.display_name||"Connected"}</option>)}
     </select>
    </label>
    {provider==="linkedin"?<label>Post text<textarea required maxLength={3000} rows={6} value={linkedinText} onChange={e=>setLinkedinText(e.target.value)} placeholder="Write your LinkedIn post…" /></label>:<>
     <label>Public video URL<input required type="url" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="https://your-public-video-file.mp4" /></label>
     <label>{provider==="youtube"?"Video title":"TikTok caption"}<input required maxLength={provider==="youtube"?100:2200} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Write a clear title or caption…" /></label>
     {provider==="youtube"&&<><label>Description<textarea rows={4} maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Add the video description…" /></label>
      <label>Visibility<select value={privacy} onChange={e=>setPrivacy(e.target.value)}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label></>}
     {provider==="tiktok"&&<p className="hint">TikTok is set to SELF_ONLY for the initial safety default. The connected account and TikTok app must allow that privacy option.</p>}
    </>}
    <label>Publish date and time ({timezone})
     <input required type="datetime-local" min={minimumTime} value={scheduledLocal} onChange={e=>setScheduledLocal(e.target.value)} />
    </label>
    <div className="checks">
     <label className="check"><input type="checkbox" checked={aiGenerated} onChange={e=>setAiGenerated(e.target.checked)} /> This post contains AI-generated or AI-altered material.</label>
     {aiGenerated&&<><label className="check"><input type="checkbox" checked={humanReviewed} onChange={e=>setHumanReviewed(e.target.checked)} /> I have reviewed the content and accept editorial responsibility.</label>
      <label className="check"><input type="checkbox" checked={aiDisclosure} onChange={e=>setAiDisclosure(e.target.checked)} /> I included the required AI disclosure in the caption or post text.</label>
      {provider!=="linkedin"&&<label className="check"><input type="checkbox" checked={mediaDisclosure} onChange={e=>setMediaDisclosure(e.target.checked)} /> The video itself includes the required visible or audible disclosure.</label>}
     </>}
    </div>
    <button className="primary" type="submit" disabled={busy==="create"||!activeConnection}>{busy==="create"?"Saving draft…":"Save draft for approval"}</button>
   </form>}
  </section>
  <section className="calendar">
   <div className="sectionHeading"><div><small>YOUR WORKSPACE</small><h2>Scheduled posts and drafts</h2></div><button className="refresh" type="button" onClick={()=>void load(token)} disabled={loading}>Refresh</button></div>
   {loading?<p className="hint">Loading the publishing calendar…</p>:items.length===0?<div className="empty">No scheduled posts yet. Your saved drafts and approved posts will appear here.</div>:<div className="items">
    {items.map(item=><article className="item" key={item.id}>
     <div className="itemTop"><strong>{item.provider.toUpperCase()}</strong><span className={"status "+item.status}>{item.status.replaceAll("_"," ")}</span></div>
     <p className="preview">{content(item)}</p>
     <div className="reviewDetails">
      <p><span>Account</span><strong>{accountName(item)}</strong></p>
      <p><span>Publish time</span><strong>{readDate(item.scheduled_at,item.timezone)} · {item.timezone}</strong></p>
      {Boolean(item.payload?.video_url)&&<p><span>Video source</span><a href={String(item.payload.video_url)} target="_blank" rel="noopener noreferrer">{String(item.payload.video_url)}</a></p>}
      {Boolean(item.payload?.description)&&<p className="detailText"><span>Video description</span><strong>{String(item.payload.description)}</strong></p>}
      {Boolean(item.payload?.privacy_status)&&<p><span>Visibility</span><strong>{String(item.payload.privacy_status)}</strong></p>}
      {Boolean(item.payload?.privacy_level)&&<p><span>TikTok privacy</span><strong>{String(item.payload.privacy_level)}</strong></p>}
     </div>
     <div className="meta">Approval is bound to this exact content, account and scheduled time.</div>
     {item.status==="draft"&&<div className="approval">
      <label className="check"><input type="checkbox" checked={Boolean(approvals[item.id])} onChange={e=>setApprovals(old=>({...old,[item.id]:e.target.checked}))} /> I approve this exact content, connected account and publishing time for automatic posting.</label>
      <button className="primary" type="button" disabled={!approvals[item.id]||busy==="approve-"+item.id} onClick={()=>void approve(item)}>{busy==="approve-"+item.id?"Approving…":"Approve and schedule"}</button>
     </div>}
     {item.status==="scheduled"&&<p className="hint">Waiting for the next Worker scheduler run. It checks every 15 minutes; the post may publish after the selected time.</p>}
     {item.status==="processing"&&<p className="hint">TikTok accepted the request. Magnanimous is checking TikTok for the final result. This is not marked published until TikTok confirms it.</p>}
     {item.status==="outcome_unknown"&&<p className="error small">The provider result could not be confirmed. It was not retried to prevent duplicate publishing. Check the connected account before creating another post.</p>}
     {item.last_error&&item.status!=="outcome_unknown"&&<p className="error small">{item.last_error}</p>}
     {["draft","scheduled"].includes(item.status)&&<button className="cancel" type="button" disabled={busy==="cancel-"+item.id} onClick={()=>void cancel(item)}>{busy==="cancel-"+item.id?"Cancelling…":"Cancel"}</button>}
    </article>)}
   </div>}
  </section>
  <p className="footnote">Supported in this first release: YouTube, TikTok and LinkedIn connected through their official authorization flows. Posting is never automatic until you approve the exact draft. Social API access, media-host requirements, account permissions and platform review remain controlled by each provider.</p>
  <style jsx>{`
   .socialCalendar{min-height:100vh;padding:24px clamp(14px,3vw,40px) 64px;background:radial-gradient(circle at 80% 0,rgba(48,137,255,.22),transparent 32%),linear-gradient(155deg,#03152f,#020917 75%);color:#f2f7ff;font-family:Inter,system-ui,sans-serif}
   .top{max-width:1180px;margin:auto;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
   a{color:#a9eaff;text-decoration:none;font-weight:800}.hero,.composer,.calendar{max-width:1180px;margin:22px auto;padding:clamp(20px,3vw,34px);border:1px solid rgba(234,192,117,.48);border-radius:22px;background:linear-gradient(135deg,rgba(10,40,82,.94),rgba(3,13,31,.96));box-shadow:0 18px 44px rgba(0,0,0,.28)}
   .hero{border-width:2px;background:linear-gradient(120deg,rgba(6,34,72,.94),rgba(4,14,34,.92)),url('/magnanimous-social-palace-v1.svg') center/cover}
   small{color:#8ce8ff;font-weight:900;letter-spacing:.14em}h1{font-size:clamp(34px,5vw,60px);line-height:1.02;color:#ffe0a0;margin:12px 0}h2{font-size:clamp(21px,3vw,28px);color:#ffe0a0;margin:6px 0}
   .hero p{max-width:780px;line-height:1.6;color:#dbeaff}.facts{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.facts span{border:1px solid rgba(238,195,120,.55);border-radius:999px;padding:8px 12px;color:#f6dbac;font-size:12px;font-weight:800}
   .sectionHeading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:20px}.sectionHeading>span{color:#9feaff;font-size:12px;font-weight:800}
   form{display:grid;gap:15px;max-width:850px}form label{display:grid;gap:7px;color:#dcecff;font-weight:750;font-size:13px}
   input:not([type=checkbox]),select,textarea{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid rgba(157,205,255,.35);background:#06172e;color:#f4f8ff;padding:12px 13px;font:inherit;min-height:44px}
   textarea{resize:vertical}input[type=checkbox]{accent-color:#dfad5b;width:18px;height:18px;flex:0 0 auto}
   .checks{display:grid;gap:8px;padding:12px;border-radius:13px;background:rgba(2,12,29,.6);border:1px solid rgba(132,189,240,.19)}
   .check{display:flex;align-items:flex-start;gap:10px;font-weight:550!important;line-height:1.45}
   .primary,.refresh,.cancel{border:1px solid #e7bd75;border-radius:12px;padding:12px 16px;font-weight:900;cursor:pointer}
   .primary{background:linear-gradient(110deg,#ffdfa0,#81defb);color:#07182e;justify-self:start}
   .primary:disabled,.refresh:disabled,.cancel:disabled{opacity:.5;cursor:not-allowed}
   .refresh{background:#0b2d56;color:#e7f7ff}.cancel{background:transparent;color:#ffd9a0;margin-top:12px}
   .empty,.hint{padding:15px;border-radius:12px;background:rgba(2,13,31,.58);color:#c4d7ec;line-height:1.55}.empty a{display:inline-block;margin-left:6px}
   .items{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:13px}
   .item{border:1px solid rgba(231,189,117,.33);border-radius:16px;background:rgba(3,15,35,.74);padding:17px;min-width:0}
   .itemTop{display:flex;justify-content:space-between;align-items:center;gap:10px}.itemTop strong{color:#9feaff;font-size:12px;letter-spacing:.12em}
   .status{font-size:11px;font-weight:900;text-transform:uppercase;border:1px solid rgba(186,212,239,.38);border-radius:999px;padding:6px 9px;color:#e1edfc}
   .status.published{color:#8cf0c2;border-color:#4b9e79}.status.failed,.status.outcome_unknown{color:#ffb3a7;border-color:#ba625c}.status.scheduled{color:#ffdda3;border-color:#ad8447}.status.processing{color:#9feaff;border-color:#4e8eae}
   .preview{font-size:14px;line-height:1.5;overflow-wrap:anywhere;color:#eff6ff;white-space:pre-wrap}
   .reviewDetails{display:grid;gap:8px;margin:12px 0;padding:12px;border:1px solid rgba(157,205,255,.22);border-radius:12px;background:rgba(2,12,29,.5)}
   .reviewDetails p{display:grid;gap:4px;margin:0;font-size:12px;line-height:1.45;overflow-wrap:anywhere}
   .reviewDetails span{color:#9eb6d0;font-weight:800;text-transform:uppercase;font-size:10px;letter-spacing:.06em}
   .reviewDetails strong{color:#f0f6ff;font-weight:650;white-space:pre-wrap}
   .reviewDetails a{color:#8ce8ff;overflow-wrap:anywhere;font-weight:650}
   .detailText{padding-top:6px;border-top:1px solid rgba(157,205,255,.15)}
   .meta{font-size:11px;color:#a9c5e3}.approval{display:grid;gap:12px;margin-top:16px;padding-top:13px;border-top:1px solid rgba(222,185,121,.25)}
   .notice,.error{max-width:1180px;margin:12px auto;padding:12px 15px;border-radius:12px;line-height:1.45}.notice{border:1px solid #5e9e7a;color:#c7f7df;background:rgba(17,64,54,.45)}
   .error{border:1px solid #a95c5c;color:#ffd5d2;background:rgba(74,24,32,.48)}.small{font-size:12px;padding:10px}
   .footnote{max-width:1180px;margin:18px auto;color:#9eb6d0;font-size:12px;line-height:1.6}
   @media(max-width:640px){.socialCalendar{padding:14px 12px 40px}.hero,.composer,.calendar{border-radius:16px;margin:14px auto;padding:18px}.sectionHeading{align-items:flex-start}.top a{font-size:12px}}
  `}</style>
 </main>;
}

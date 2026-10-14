'use client';
import {useEffect,useState} from 'react';

type Indicator={line:number;type:string;classification:'static-inference'};
type Evidence={sha256:string;bytes:number;lineCount:number;kind:string;source:string;summary:{indicatorCount:number;types:string[]};indicators:Indicator[];executionPerformed:false;networkAccessPerformed:false;evidenceClassification:'static-analysis';jsonShape?:{valid:boolean;topLevel?:string;keys?:string[];error?:string}|null;generatedAt:string};

const MAX_BYTES=1024*1024;
const ALLOWED=new Set(['javascript','json','text','sourcemap']);
const hasOwnerSession=()=>typeof window!=='undefined'&&Boolean(localStorage.getItem('iam_account_token')||localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token'));
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer)).map(byte=>byte.toString(16).padStart(2,'0')).join('');

async function inspectLocally(content:string,kind:string,source:string,authorized:boolean):Promise<Evidence>{
 if(!authorized)throw new Error('Confirm that you own this target or are authorized to inspect it.');
 if(!ALLOWED.has(kind))throw new Error('Unsupported inspection type.');
 const encoded=new TextEncoder().encode(content);
 if(encoded.byteLength>MAX_BYTES)throw new Error('Input exceeds the 1 MiB local-inspection limit.');
 const digest=await crypto.subtle.digest('SHA-256',encoded);
 const lines=content.split(/\r?\n/),indicators:Indicator[]=[];
 const patterns:Array<[string,RegExp]>=[
  ['import',/\bimport\s*(?:\(|[{'*"\w])/],['export',/\bexport\s+(?:default|const|let|var|function|class|\{)/],
  ['function',/\b(?:async\s+)?function\s+[A-Za-z_$]/],['class',/\bclass\s+[A-Za-z_$]/],
  ['network-reference',/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/],['storage-reference',/\b(?:localStorage|sessionStorage|indexedDB)\b/],
  ['authentication-reference',/\b(?:authorization|bearer|session|oauth|token)\b/i],['endpoint-reference',/\/(?:api|v\d+)\/[A-Za-z0-9_./?=&-]+/],
  ['source-map-reference',/sourceMappingURL\s*=/]
 ];
 lines.forEach((line,index)=>patterns.forEach(([type,pattern])=>{if(pattern.test(line))indicators.push({line:index+1,type,classification:'static-inference'})}));
 let jsonShape:Evidence['jsonShape']=null;
 if(kind==='json'||kind==='sourcemap'){
  try{const parsed=JSON.parse(content) as unknown;const objectValue=parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed as Record<string,unknown>:null;jsonShape={valid:true,topLevel:Array.isArray(parsed)?'array':typeof parsed,keys:objectValue?Object.keys(objectValue).slice(0,50):[]}}
  catch{jsonShape={valid:false,error:'Invalid JSON'}}
 }
 const limited=indicators.slice(0,300);
 return {sha256:hex(digest),bytes:encoded.byteLength,lineCount:lines.length,kind,source:(source.trim()||'authorized-user-paste').slice(0,200),summary:{indicatorCount:limited.length,types:Array.from(new Set(limited.map(item=>item.type)))},indicators:limited,executionPerformed:false,networkAccessPerformed:false,evidenceClassification:'static-analysis',jsonShape,generatedAt:new Date().toISOString()};
}

export default function InvestigatePage(){
 const[kind,setKind]=useState('javascript'),[source,setSource]=useState('authorized-user-paste'),[content,setContent]=useState(''),[authorized,setAuthorized]=useState(false),[result,setResult]=useState<Evidence|null>(null),[message,setMessage]=useState(''),[signedIn,setSignedIn]=useState(false);
 useEffect(()=>setSignedIn(hasOwnerSession()),[]);
 const analyze=async()=>{setMessage('');setResult(null);try{setResult(await inspectLocally(content,kind,source,authorized))}catch(error){setMessage(error instanceof Error?error.message:'Inspection failed.')}};
 return <main>
  <header><div><small>MAGNANIMOUS AI • INVESTIGATION FOUNDRY</small><h1>Investigation Lab</h1><p>Inspect authorized code and evidence locally in your browser without executing the target or uploading its contents to Magnanimous or a third-party analysis service.</p></div><nav><a href="/tool-foundry">Tool Foundry</a><a href="/">Dashboard</a></nav></header>
  <section className="hero"><div><b>Magnanimous Native Inspector</b><span>ready • browser-local</span></div><p>Free-first static analysis • 1 MiB maximum • JavaScript, JSON, text and source maps.</p><p>REA remains an optional local specialist beneath Magnanimous AI. It is not enabled in production and does not own platform memory, policy, identity, or evidence authority.</p><p className="session">Workspace session: {signedIn?'detected':'not detected — analysis still stays on this device'}</p></section>
  <section className="grid"><article><h2>Authorized target</h2><label>Type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="javascript">JavaScript</option><option value="json">JSON</option><option value="sourcemap">Source map</option><option value="text">Text</option></select></label><label>Evidence source<input value={source} onChange={e=>setSource(e.target.value)} maxLength={200}/></label><label>Paste source or evidence<textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste code or text you own or are authorized to inspect."/></label><label className="check"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/><span>I own this target or have explicit authorization to inspect it.</span></label><button onClick={analyze} disabled={!authorized||!content}>Analyze Evidence Locally</button></article>
  <article><h2>Safety boundary</h2><ul><li>No target execution.</li><li>No automatic target network requests.</li><li>No target-content upload.</li><li>SHA-256 evidence fingerprint generated on-device.</li><li>Static inference is labeled separately from runtime observation.</li><li>No access-control, DRM, authentication, or consent bypass.</li></ul>{message&&<div className="error">{message}</div>}</article></section>
  {result&&<section className="panel"><h2>Evidence report</h2><div className="facts"><div><span>SHA-256</span><code>{result.sha256}</code></div><div><span>Size</span><b>{result.bytes} bytes</b></div><div><span>Lines</span><b>{result.lineCount}</b></div><div><span>Indicators</span><b>{result.summary.indicatorCount}</b></div></div><div className="tags">{result.summary.types.map(type=><span key={type}>{type}</span>)}</div>{result.jsonShape&&<p>JSON: {result.jsonShape.valid?'valid':'invalid'}{result.jsonShape.keys?.length?` • keys: ${result.jsonShape.keys.join(', ')}`:''}</p>}<div className="cards">{result.indicators.slice(0,100).map((item,i)=><div key={`${item.line}-${item.type}-${i}`}><b>{item.type}</b><span>line {item.line}</span><small>{item.classification}</small></div>)}</div><footer>Target execution: {String(result.executionPerformed)} • Network access: {String(result.networkAccessPerformed)} • {result.evidenceClassification} • generated {result.generatedAt}</footer></section>}
  <style jsx>{`*{box-sizing:border-box}main{min-height:100vh;background:radial-gradient(circle at 20% 0,#15385d 0,#07101b 34%,#040911 100%);color:#eef8ff;font-family:Inter,system-ui;padding:32px;max-width:1450px;margin:auto}header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}small{color:#7cecff;letter-spacing:.18em;font-weight:900}h1{font-size:clamp(42px,7vw,78px);margin:6px 0}p{color:#9fb5c8;line-height:1.55}nav{display:flex;gap:14px;flex-wrap:wrap}a{color:#8cefff;text-decoration:none}.hero,.panel,article{border:1px solid #244b68;background:linear-gradient(145deg,rgba(14,31,48,.96),rgba(6,15,26,.96));border-radius:20px;padding:22px;box-shadow:0 18px 70px rgba(0,0,0,.28)}.hero{margin:22px 0}.hero div{display:flex;gap:12px;align-items:center}.hero span,.tags span{background:#12364b;border:1px solid #2b6c83;border-radius:999px;padding:5px 10px;color:#8ff3ff;font-size:12px}.session{font-size:12px}.grid{display:grid;grid-template-columns:1.35fr .65fr;gap:16px}label{display:block;margin:12px 0;color:#cbe3f2;font-weight:700}input,select,textarea{width:100%;margin-top:6px;border:1px solid #2b4b62;border-radius:12px;background:#06111d;color:#fff;padding:12px}textarea{min-height:330px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.check{display:flex;gap:10px;align-items:flex-start}.check input{width:auto;margin-top:3px}button{border:0;border-radius:12px;padding:12px 16px;background:linear-gradient(90deg,#72edff,#c58aff);color:#041019;font-weight:900;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}li{margin:10px 0;color:#b7c9d7}.error{margin-top:14px;padding:12px;border:1px solid #7a3344;background:#2b1018;border-radius:10px}.panel{margin-top:16px}.facts{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:10px}.facts>div,.cards>div{background:#07121f;border:1px solid #1b3a52;border-radius:12px;padding:12px}.facts span,.facts code,.facts b,.cards b,.cards span,.cards small{display:block}.facts span,.cards small{color:#7793a7;font-size:11px}.facts code{overflow-wrap:anywhere;color:#9befff}.tags{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cards span{color:#89ddec;font-size:12px;margin:4px 0}footer{margin-top:16px;color:#7f98aa;font-size:12px}@media(max-width:900px){main{padding:18px}.grid,.facts,.cards{grid-template-columns:1fr}header{display:block}nav{margin-top:10px}}`}</style>
 </main>;
}

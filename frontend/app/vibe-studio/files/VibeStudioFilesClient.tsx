'use client';

import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../../lib/magnanimous-session';
import './vibe-files.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type ProjectCard={id:string;title:string;brief:string;template:string;revision:number;updated_at:number};
type Project=ProjectCard&{html:string};
type StoredFile={path:string;content:string;revision:number;created_at:number;updated_at:number;bytes?:number};
type StudioFile=StoredFile&{virtual?:boolean};
type Version={revision:number;note:string;created_at:number};
type ApiData={detail?:string;projects?:ProjectCard[];project?:Project;files?:StoredFile[];versions?:Version[];version?:{html?:string;content?:string;revision:number;note:string;created_at:number};file?:StoredFile;valid?:boolean;error?:string};

async function requestWithToken(token:string,path:string,options:RequestInit={}):Promise<ApiData>{
 const headers:Record<string,string>={Authorization:'Bearer '+token};
 if(options.body)headers['Content-Type']='application/json';
 const response=await fetch(api+path,{...options,headers:{...headers,...(options.headers as Record<string,string>||{})},cache:'no-store'});
 if(response.status===401||response.status===403){location.replace('/owner-login');throw new Error('Owner session expired or access was not authorized. Sign in again.');}
 const raw=await response.text();let data:ApiData;
 try{data=JSON.parse(raw)}catch{data={detail:raw.slice(0,300)||'Unexpected response'};}
 if(!response.ok)throw new Error(data.detail||('Magnanimous request failed (HTTP '+response.status+').'));
 return data;
}

function inlineScriptJson(value:unknown){
 const serialized=JSON.stringify(value);
 if(serialized===undefined)throw new Error('Preview data could not be serialized.');
 return serialized.replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}

function insertBeforeLastClosingTag(source:string,tag:'body'|'html',insertion:string){
 const matches=tag==='body'?[...source.matchAll(/<\/body\s*>/gi)]:[...source.matchAll(/<\/html\s*>/gi)];
 const match=matches[matches.length-1];
 if(!match||match.index===undefined)return null;
 return source.slice(0,match.index)+insertion+match[0]+source.slice(match.index+match[0].length);
}

function previewDocument(html:string,files:StoredFile[]){
 const csp='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39;; style-src &#39;unsafe-inline&#39;; img-src data: blob:; font-src data:; media-src data: blob:; connect-src &#39;none&#39;; form-action &#39;none&#39;; frame-src &#39;none&#39;; object-src &#39;none&#39;; base-uri &#39;none&#39;">';
 let output=String(html||'');
 if(!/<head\b[^>]*>/i.test(output))output=output.replace(/<html\b[^>]*>/i,match=>match+'<head></head>');
 output=output.replace(/<head\b[^>]*>/i,match=>match+csp);
 const cssFiles=files.filter(file=>file.path.toLowerCase().endsWith('.css')).sort((a,b)=>a.path.localeCompare(b.path)).map(file=>({path:file.path,content:file.content}));
 const jsFiles=files.filter(file=>file.path.toLowerCase().endsWith('.js')).sort((a,b)=>a.path.localeCompare(b.path)).map(file=>({path:file.path,content:file.content}));
 const fixtures:Record<string,unknown>=Object.create(null);
 for(const file of files.filter(item=>item.path.toLowerCase().endsWith('.json'))){
  try{fixtures[file.path]=JSON.parse(file.content)}catch{throw new Error('A saved JSON fixture is invalid. Reload the project before previewing.');}
 }
 // Serialize user-controlled values as JavaScript data, then create style/script
 // elements with textContent. User source never becomes markup in the iframe parser.
 const bootstrap='<script>(()=>{const fixtures='+inlineScriptJson(fixtures)+';window.MAGNANIMOUS_FIXTURES=fixtures;const styles='+inlineScriptJson(cssFiles)+';for(const file of styles){const style=document.createElement("style");style.setAttribute("data-vibe-file",file.path);style.textContent=file.content;document.head.appendChild(style);}const scripts='+inlineScriptJson(jsFiles)+';for(const file of scripts){const script=document.createElement("script");script.setAttribute("data-vibe-file",file.path);script.textContent=file.content;document.body.appendChild(script);}})();</script>';
 const withBody=insertBeforeLastClosingTag(output,'body',bootstrap);
 if(withBody!==null)output=withBody;
 else{
  const withHtml=insertBeforeLastClosingTag(output,'html',bootstrap+'</body>');
  if(withHtml!==null)output=withHtml;
  else output+=bootstrap+'</body></html>';
 }
 return output;
}

const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0;}return table;})();
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes)crc=(crc>>>8)^crcTable[(crc^byte)&0xff];return (crc^0xffffffff)>>>0;}
function zipStore(entries:Array<{path:string;content:string}>){
 const encoder=new TextEncoder(),locals:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 for(const entry of entries){
  const name=encoder.encode(entry.path),data=encoder.encode(entry.content),crc=crc32(data);
  const local=new Uint8Array(30+name.length),ld=new DataView(local.buffer);
  ld.setUint32(0,0x04034b50,true);ld.setUint16(4,20,true);ld.setUint16(6,0x0800,true);ld.setUint16(8,0,true);
  ld.setUint16(10,0,true);ld.setUint16(12,33,true);ld.setUint32(14,crc,true);ld.setUint32(18,data.length,true);
  ld.setUint32(22,data.length,true);ld.setUint16(26,name.length,true);ld.setUint16(28,0,true);local.set(name,30);
  locals.push(local,data);
  const header=new Uint8Array(46+name.length),cd=new DataView(header.buffer);
  cd.setUint32(0,0x02014b50,true);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint16(8,0x0800,true);
  cd.setUint16(10,0,true);cd.setUint16(12,0,true);cd.setUint16(14,33,true);cd.setUint32(16,crc,true);
  cd.setUint32(20,data.length,true);cd.setUint32(24,data.length,true);cd.setUint16(28,name.length,true);
  cd.setUint16(30,0,true);cd.setUint16(32,0,true);cd.setUint16(34,0,true);cd.setUint16(36,0,true);
  cd.setUint32(38,0,true);cd.setUint32(42,offset,true);header.set(name,46);central.push(header);
  offset+=local.length+data.length;
 }
 const centralSize=central.reduce((sum,item)=>sum+item.length,0),end=new Uint8Array(22),ed=new DataView(end.buffer);
 ed.setUint32(0,0x06054b50,true);ed.setUint16(4,0,true);ed.setUint16(6,0,true);
 ed.setUint16(8,entries.length,true);ed.setUint16(10,entries.length,true);ed.setUint32(12,centralSize,true);
 ed.setUint32(16,offset,true);ed.setUint16(20,0,true);
 const parts=[...locals,...central,end],total=parts.reduce((sum,part)=>sum+part.byteLength,0),combined=new Uint8Array(total);let cursor=0;
 for(const part of parts){combined.set(part,cursor);cursor+=part.byteLength;}
 return new Blob([combined.buffer as ArrayBuffer],{type:'application/zip'});
}
function slug(value:string){return (value||'magnanimous-project').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'magnanimous-project';}
function defaultContent(path:string){
 const ext=path.slice(path.lastIndexOf('.')).toLowerCase();
 if(ext==='.css')return '/* Magnanimous project styles */\n:root { color-scheme: light dark; }\n';
 if(ext==='.js')return '// Magnanimous project script\nconsole.log("Magnanimous static preview ready");\n';
 if(ext==='.json')return '{\n  "example": true\n}\n';
 return '# Project notes\n\nBuilt with Magnanimous Vibe Studio.\n';
}
function displayTime(value:number){return value?new Date(value*1000).toLocaleString():'—';}

export default function VibeStudioFilesClient(){
 const[token,setToken]=useState(''),[projects,setProjects]=useState<ProjectCard[]>([]);
 const[project,setProject]=useState<Project|null>(null),[files,setFiles]=useState<StoredFile[]>([]);
 const[projectVersions,setProjectVersions]=useState<Version[]>([]);
 const[selectedPath,setSelectedPath]=useState('index.html'),[content,setContent]=useState('');
 const[versions,setVersions]=useState<Version[]>([]),[newPath,setNewPath]=useState('styles.css');
 const[preview,setPreview]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const[notice,setNotice]=useState('Select a project to open its bounded multi-file workspace.');
 const allFiles=useMemo<StudioFile[]>(()=>project?[{path:'index.html',content:project.html,revision:project.revision,created_at:project.updated_at,updated_at:project.updated_at,virtual:true},...files]:[],[project,files]);
 const selected=allFiles.find(file=>file.path===selectedPath)||null;
 const dirty=Boolean(selected&&content!==selected.content);
 const totalBytes=allFiles.reduce((sum,file)=>sum+new TextEncoder().encode(file.content).length,0);

 async function loadProjects(t:string){
  const data=await requestWithToken(t,'/api/magnanimous/vibe-studio/projects');
  const rows=data.projects||[];setProjects(rows);
  if(rows.length&&!project)await loadProject(t,rows[0].id);
 }
 async function loadProject(t:string,id:string,focus='index.html'){
  setBusy('load');setError('');
  try{
   const [p,f]=await Promise.all([
    requestWithToken(t,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(id)),
    requestWithToken(t,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(id)+'/files')
   ]);
   if(!p.project)throw new Error('Project response was incomplete.');
   setProject(p.project);setFiles(f.files||[]);setProjectVersions(p.versions||[]);setSelectedPath(focus);
   const chosen=focus==='index.html'?p.project.html:(f.files||[]).find(file=>file.path===focus)?.content||'';
   setContent(chosen);setPreview('');
   if(focus==='index.html')setVersions(p.versions||[]);
   else{
    const history=await requestWithToken(t,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(id)+'/files/'+encodeURIComponent(focus)+'/versions');
    setVersions(history.versions||[]);
   }
   setNotice('Project loaded. Each file has its own revision history. Preview remains local to this isolated browser frame.');
  }catch(e){setError(e instanceof Error?e.message:'Project could not be loaded.')}finally{setBusy('');}
 }
 useEffect(()=>{
  const t=getPlatformAuthToken();
  if(!t){location.replace('/owner-login');return;}
  setToken(t);void loadProjects(t).catch(e=>setError(e instanceof Error?e.message:'Could not load projects.'));
  // The owner-only route is intentionally separate from customer Code Studio.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 async function selectFile(path:string){
  if(dirty&&!window.confirm('Discard the unsaved edit in '+selectedPath+' and open '+path+'?'))return;
  if(!project||!token)return;
  setSelectedPath(path);setPreview('');
  if(path==='index.html'){setContent(project.html);setVersions(projectVersions);return;}
  const file=files.find(item=>item.path===path);
  setContent(file?.content||'');
  try{
   const history=await requestWithToken(token,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(project.id)+'/files/'+encodeURIComponent(path)+'/versions');
   setVersions(history.versions||[]);
  }catch(e){setError(e instanceof Error?e.message:'File history could not be loaded.');}
 }

 async function saveFile(){
  if(!project||!selected||!dirty||!token)return;
  setBusy('save');setError('');
  try{
   if(selectedPath==='index.html'){
    await requestWithToken(token,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(project.id),{
     method:'PUT',body:JSON.stringify({html:content,expected_revision:project.revision,note:'Edited index.html in multi-file workspace'})
    });
   }else{
    await requestWithToken(token,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(project.id)+'/files/'+encodeURIComponent(selectedPath),{
     method:'PUT',body:JSON.stringify({content,expected_revision:selected.revision,note:'Edited '+selectedPath})
    });
   }
   await loadProject(token,project.id,selectedPath);
   setNotice('Saved '+selectedPath+' as a new immutable checkpoint. No deployment occurred.');
  }catch(e){setError(e instanceof Error?e.message:'File save failed. Existing checkpoints were preserved.');}finally{setBusy('');}
 }

 async function addFile(){
  if(!project||!token)return;
  if(dirty&&!window.confirm('Discard the unsaved edit in '+selectedPath+' before creating a new file?'))return;
  const path=newPath.trim(),initial=defaultContent(path);
  setBusy('add');setError('');
  try{
   await requestWithToken(token,'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(project.id)+'/files',{
    method:'POST',body:JSON.stringify({path,content:initial})
   });
   await loadProject(token,project.id,path);
   setNotice('Created '+path+'. It is stored privately with a revision checkpoint.');
  }catch(e){setError(e instanceof Error?e.message:'File could not be created.');}finally{setBusy('');}
 }

 async function loadVersion(revision:number){
  if(!project||!token||!selected)return;
  if(dirty&&!window.confirm('Loading this checkpoint will replace the current unsaved editor text. Continue?'))return;
  setBusy('restore');setError('');
  try{
   const path=selectedPath==='index.html'
    ?'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(project.id)+'/versions/'+revision
    :'/api/magnanimous/vibe-studio/projects/'+encodeURIComponent(project.id)+'/files/'+encodeURIComponent(selectedPath)+'/versions/'+revision;
   const data=await requestWithToken(token,path);
   setContent(selectedPath==='index.html'?String(data.version?.html||''):String(data.version?.content||''));
   setPreview('');setNotice('Loaded checkpoint '+revision+' into the editor. Save it only after reviewing.');
  }catch(e){setError(e instanceof Error?e.message:'Checkpoint could not be loaded.');}finally{setBusy('');}
 }

 async function runPreview(){
  if(!project||!token){setError('Select a project first.');return;}
  const html=selectedPath==='index.html'?content:project.html;
  const currentFiles=files.map(file=>file.path===selectedPath?{...file,content}:file);
  setBusy('preview');setError('');
  try{
   const checked=await requestWithToken(token,'/api/magnanimous/vibe-studio/review',{method:'POST',body:JSON.stringify({html,files:currentFiles.map(file=>({path:file.path,content:file.content}))})});
   if(!checked.valid)throw new Error(checked.error||'The index.html document did not pass structural validation.');
   setPreview(previewDocument(html,currentFiles));
   setNotice('Preview assembled from index.html, local CSS/JS files and JSON fixtures. It runs in an opaque-origin browser frame with a restrictive content policy; it is not a full-stack VM.');
  }catch(e){setError(e instanceof Error?e.message:'Preview validation failed.');}finally{setBusy('');}
 }
 function downloadZip(){
  if(!project)return;
  const entries=allFiles.map(file=>({path:file.path,content:file.path===selectedPath&&dirty?content:file.content}));
  const blob=zipStore(entries),url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=slug(project.title)+'.zip';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),5000);
  setNotice('Downloaded a local ZIP containing '+entries.length+' project files. Nothing was published.');
 }

 return <main className="vibeFilesShell">
  <header className="vibeFilesHeader">
   <div><a href="/vibe-studio">← Single-file Vibe Studio</a><small>I AM MAGNANIMOUS WAY™ · MAGNANIMOUS AI</small><h1>Multi-file workspace</h1><p>Keep HTML, CSS, JavaScript and local JSON fixtures together. Review every file before preview or export.</p></div>
   <div className="vibeFilesHeaderActions"><span>FREE-FIRST · OWNER WORKSPACE</span><button type="button" onClick={downloadZip} disabled={!project||!allFiles.length}>↓ Export ZIP</button></div>
  </header>
  <div className="vibeFilesNotice" role="status" aria-live="polite">{notice}</div>
  {error&&<div className="vibeFilesError" role="alert">{error}</div>}
  <section className="vibeFilesLayout">
   <aside className="vibeFilesSidebar">
    <section className="vibeFilesPanel"><small>01 / PROJECT</small><label>Choose a saved project<select value={project?.id||''} onChange={e=>{if(dirty&&!window.confirm("Discard the unsaved edit in "+selectedPath+" and open another project?"))return;void loadProject(token,e.target.value)}} disabled={!!busy||!projects.length}><option value="" disabled>Select project</option>{projects.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><p>{project?project.brief:'Create a prototype in the main Vibe Studio first.'}</p><div className="vibeFilesUsage">{allFiles.length} / 20 files · {totalBytes.toLocaleString()} / 262,144 bytes</div></section>
    <section className="vibeFilesPanel"><small>02 / FILE TREE</small><h2>Project files</h2>{allFiles.map(file=><button type="button" key={file.path} className={'vibeFileRow '+(selectedPath===file.path?'selected':'')} aria-current={selectedPath===file.path?'page':undefined} onClick={()=>void selectFile(file.path)} disabled={!!busy}><span>{file.path}</span><small>{file.virtual?'project file':'v'+file.revision}</small></button>)}
     <div className="vibeFilesAdd"><label>New file path<input value={newPath} onChange={e=>setNewPath(e.target.value)} placeholder="styles.css" maxLength={160}/></label><button type="button" onClick={()=>void addFile()} disabled={!project||!!busy||!newPath.trim()}>+ Add file</button><small>CSS, JS, JSON and Markdown · no arbitrary server files</small></div>
    </section>
   </aside>
   <section className="vibeFilesEditor">
    {!project?<div className="vibeFilesEmpty"><h2>Open a saved prototype</h2><p>Multi-file projects keep your existing single-file work intact. Start by creating or opening a project in Vibe Studio.</p><a href="/vibe-studio">Open Vibe Studio →</a></div>:<>
     <div className="vibeFilesToolbar"><div><small>03 / SOURCE EDITOR</small><h2>{selectedPath}</h2><span>Revision {selected?.revision||1}{dirty?' · Unsaved changes':''}</span></div><div><button type="button" onClick={runPreview} disabled={!!busy}>▶ Preview</button><button type="button" className="primary" onClick={()=>void saveFile()} disabled={!!busy||!dirty}>{busy==='save'?'Saving…':'Save file'}</button></div></div>
     <textarea className="vibeFilesCode" spellCheck={false} aria-keyshortcuts="Control+S Meta+S Control+Enter Meta+Enter" aria-describedby="vibe-files-editor-hint" value={content} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==='s'){e.preventDefault();if(dirty&&!busy)void saveFile();}else if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&e.key==='Enter'){e.preventDefault();if(!busy)void runPreview();}}} onChange={e=>{setContent(e.target.value);setPreview('');}} aria-label={'Edit '+selectedPath} disabled={!!busy} />
     <p className="vibeFilesHint" id="vibe-files-editor-hint">Ctrl/⌘+S saves a new checkpoint. Ctrl/⌘+Enter refreshes the isolated preview. The editor stores text only: no terminal, package installation, server execution, external network access or production secrets are available in this phase.</p>
     <div className="vibeFilesHistory"><div><small>04 / FILE CHECKPOINTS</small><h3>Revision history</h3></div>{versions.length?versions.map(version=><div className="vibeFilesVersion" key={version.revision}><span><strong>v{version.revision}</strong><small>{version.note} · {displayTime(version.created_at)}</small></span><button type="button" onClick={()=>void loadVersion(version.revision)} disabled={!!busy}>Load</button></div>):<p>No saved revisions for this file yet.</p>}</div>
     <div className="vibeFilesPreview"><div><small>05 / ISOLATED PREVIEW</small><h3>Local project preview</h3></div>{preview?<iframe title="Magnanimous multi-file preview" srcDoc={preview} sandbox="allow-scripts" referrerPolicy="no-referrer"/>:<p>Choose Preview to assemble index.html with local styles, scripts and JSON fixtures. The preview uses an opaque-origin frame and restrictive CSP.</p>}</div>
    </>}
   </section>
  </section>
  <footer className="vibeFilesFooter"><a href="/owner-center">Owner Center</a><span>Magnanimous AI owns project policy and checkpoints. Export is local; deployment remains a separate approved workflow.</span></footer>
 </main>;
}

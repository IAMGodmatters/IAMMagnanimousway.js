const $=id=>document.getElementById(id);
const state={modelReady:false,vaultUnlocked:false,projects:[]};
async function api(path,options={}){
 const response=await fetch(path,{...options,cache:'no-store',headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>({detail:'The local service returned an invalid response.'}));
 if(!response.ok)throw new Error(data.detail||'The local operation failed.');
 return data;
}
function message(id,text,kind='info'){const el=$(id);el.textContent=text;el.className='message '+kind;}
function updateControls(){
 $('generateButton').disabled=!state.modelReady;
 $('saveButton').disabled=!state.vaultUnlocked||!$('output').value.trim();
 $('lockButton').disabled=!state.vaultUnlocked;
 $('vaultStatus').textContent=state.vaultUnlocked?'Encrypted workspace unlocked':'Workspace locked';
 $('vaultStatus').className='status '+(state.vaultUnlocked?'ready':'');
}
async function refresh(){
 try{
  const data=await api('/api/health');
  state.modelReady=Boolean(data.model?.ready);
  $('modelStatus').textContent=state.modelReady?'Local AI ready: '+data.model.name:'Local AI not installed';
  $('modelStatus').className='status '+(state.modelReady?'ready':'warning');
  $('generateStatus').textContent=state.modelReady?'Generation stays on this device.':'Add a compatible GGUF model and llama-server to enable generation.';
  const vault=await api('/api/vault/status');
  state.vaultUnlocked=Boolean(vault.unlocked);
  if(state.vaultUnlocked)await loadProjects();
  updateControls();
 }catch(error){message('creatorMessage',error.message,'error');}
}
async function unlock(){
 const passphrase=$('passphrase').value;
 if(passphrase.length<12){message('vaultMessage','Use a passphrase with at least 12 characters.','error');return;}
 $('unlockButton').disabled=true;
 try{
  const result=await api('/api/vault/unlock',{method:'POST',body:JSON.stringify({passphrase})});
  $('passphrase').value='';
  state.vaultUnlocked=true;
  message('vaultMessage',result.created?'Your encrypted workspace has been created on this USB drive.':'Your encrypted workspace is unlocked.','success');
  await loadProjects();updateControls();
 }catch(error){message('vaultMessage',error.message,'error');}
 finally{$('unlockButton').disabled=false;}
}
async function lock(){
 try{await api('/api/vault/lock',{method:'POST',body:'{}'});state.vaultUnlocked=false;state.projects=[];$('projectList').innerHTML='<p class="muted">Unlock the workspace to see your projects.</p>';updateControls();message('vaultMessage','Workspace locked. The encryption key was cleared from memory.','success');}
 catch(error){message('vaultMessage',error.message,'error');}
}
async function loadProjects(){
 const data=await api('/api/projects');state.projects=data.projects||[];
 $('projectCount').textContent=String(state.projects.length);
 const list=$('projectList');list.replaceChildren();
 if(!state.projects.length){const p=document.createElement('p');p.className='muted';p.textContent='No projects saved yet.';list.append(p);return;}
 for(const project of state.projects){
  const button=document.createElement('button');button.className='project-item';button.type='button';
  const title=document.createElement('strong');title.textContent=project.title;
  const meta=document.createElement('small');meta.textContent=String(project.type||'project').replaceAll('-',' ')+' • '+new Date(project.updatedAt).toLocaleString();
  button.append(title,meta);
  button.addEventListener('click',()=>{$('outputTitle').value=project.title;$('output').value=project.content;updateControls();message('creatorMessage','Loaded '+project.title+'.','success');});
  list.append(button);
 }
}
async function generate(){
 const prompt=$('prompt').value.trim();
 if(!prompt){message('creatorMessage','Describe what you want to create first.','error');return;}
 $('generateButton').disabled=true;$('generateStatus').textContent='Magnanimous is creating locally…';
 try{
  const kind=$('contentType').selectedOptions[0].textContent;
  const result=await api('/api/chat',{method:'POST',body:JSON.stringify({prompt:'Create: '+kind+'\n\n'+prompt+'\n\nMake the result structured, practical and ready to edit. Do not invent source facts or pretend this is an online broadcast.'})});
  $('output').value=result.answer;
  $('outputTitle').value=$('outputTitle').value.trim()||kind;
  message('creatorMessage','Created by the local model. Nothing was sent to the cloud.','success');
 }catch(error){message('creatorMessage',error.message,'error');}
 finally{$('generateButton').disabled=!state.modelReady;$('generateStatus').textContent=state.modelReady?'Generation stays on this device.':'Add a compatible local model and llama-server to enable generation.';updateControls();}
}
async function save(){
 const title=$('outputTitle').value.trim(),content=$('output').value;
 if(!title||!content.trim()){message('creatorMessage','Add a title and content before saving.','error');return;}
 try{
  await api('/api/projects',{method:'POST',body:JSON.stringify({title,content,type:$('contentType').value})});
  await loadProjects();message('creatorMessage','Saved inside the encrypted USB workspace.','success');
 }catch(error){message('creatorMessage',error.message,'error');}
}
function exportCopy(){
 const title=$('outputTitle').value.trim()||'Magnanimous project',content=$('output').value;
 if(!content.trim())return;
 const safe=title.replace(/[^a-z0-9-_ ]/gi,'').trim().replace(/\s+/g,'-').slice(0,80)||'magnanimous-project';
 const blob=new Blob(['# '+title+'\n\n'+content],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download=safe+'.md';anchor.click();URL.revokeObjectURL(url);
 message('creatorMessage','Exported a separate Markdown copy. Choose the USB drive as the save location.','success');
}
$('unlockButton').addEventListener('click',unlock);
$('lockButton').addEventListener('click',lock);
$('generateButton').addEventListener('click',generate);
$('saveButton').addEventListener('click',save);
$('exportButton').addEventListener('click',exportCopy);
$('output').addEventListener('input',updateControls);
refresh();

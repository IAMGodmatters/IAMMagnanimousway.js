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
 $('generateButton').disabled=!$('prompt').value.trim();
 $('saveButton').disabled=!state.vaultUnlocked||!$('output').value.trim();
 $('exportButton').disabled=!$('output').value.trim();
 $('lockButton').disabled=!state.vaultUnlocked;
 $('vaultStatus').textContent=state.vaultUnlocked?'Encrypted workspace unlocked':'Workspace locked';
 $('vaultStatus').className='status '+(state.vaultUnlocked?'ready':'');
}
function updateGenerationStatus(){
 $('modelStatus').textContent=state.modelReady?'Local AI ready: '+state.modelName:'Offline draft builder ready • Local AI not installed';
 $('modelStatus').className='status '+(state.modelReady?'ready':'warning');
 $('generateStatus').textContent=state.modelReady?'AI generation stays on this device.':'Create useful drafts offline now; add a compatible GGUF model for generative AI.';
}
function buildOfflineDraft(kind,prompt){
 const topic=prompt.trim().replace(/\s+/g,' ').slice(0,6000);
 const common=[
  'CREATOR PROMISE',
  'Make the experience welcoming, useful and honest. Do not pretend to be a real person, claim live audience numbers, invent facts or promise outcomes.',
  'ACCESSIBILITY',
  'Use clear language, readable captions, spoken descriptions for important visuals and a calm pace. Keep key information understandable without sound.',
  'PRIVACY AND RIGHTS',
  'Use only media, music, images, game content and voices you have permission to use. Do not display private messages or personal details without consent.',
  'NEXT ACTION',
  'Review this draft, replace placeholders with verified details, rehearse once and save a copy before publishing.'
 ];
 const plans={
  'live-show':[
   ['SHOW FORMAT','Faceless creator-led live show. Use an on-screen title, avatar or visual scene; the host may speak live, use an authorized synthetic voice, or combine both. Selling is optional.'],
   ['OPENING — 0:00–2:00','Welcome viewers. State the topic: '+topic+'. Explain what people will learn or enjoy and invite them to participate without sharing private information.'],
   ['MAIN SEGMENT — 2:00–10:00','Deliver three short, clearly separated points. Show one example or demonstration for each. Add captions and a visual change between sections.'],
   ['AUDIENCE MOMENT — 10:00–13:00','Ask one simple question. Offer a poll or chat prompt. Read only suitable comments and never pressure viewers to disclose personal details.'],
   ['INTERACTIVE GAME — 13:00–18:00','Run a quick trivia, guessing, word, drawing or audience-choice round. Explain the rules first, keep scoring transparent and provide a non-participation option.'],
   ['RESET AND RECAP — 18:00–20:00','Summarize the best points, answer one or two questions and explain what comes next.'],
   ['CLOSING','Thank viewers, invite a follow or return only if appropriate, and state where the next session will be announced.'],
   ['PRODUCER CHECKLIST','Check microphone, camera/virtual camera, captions, scene transitions, music rights, moderation, network stability, platform eligibility and a backup still-image scene.']
  ],
  'script':[
   ['OPENING','Hello and welcome. Today we are exploring: '+topic+'. You can listen, watch the visuals or join the conversation.'],
   ['SET THE CONTEXT','Explain why this subject matters in two or three plain-language sentences. Define unfamiliar words.'],
   ['KEY POINTS','Point one: introduce the first useful idea and give a concrete example.\nPoint two: explain a second idea and compare it with the first.\nPoint three: give viewers a practical action they can try.'],
   ['AUDIENCE CUES','Ask: “Which part would you like me to explain further?” Pause for responses. If chat is quiet, continue with the prepared example.'],
   ['TRANSITIONS','Use a short verbal summary before changing topic, visual scene or activity.'],
   ['CLOSING','Recap the three points, thank the audience and invite a respectful question or suggestion.']
  ],
  'lesson':[
   ['LEARNING GOAL','By the end, learners should be able to explain or demonstrate one practical result related to: '+topic+'.'],
   ['STARTER','Ask learners what they already know. Accept different experience levels without embarrassment.'],
   ['TEACH','Break the topic into three small steps. Explain each step, demonstrate it and define key terms.'],
   ['GUIDED PRACTICE','Work through one example together. Pause after each step and explain common mistakes.'],
   ['CHECK UNDERSTANDING','Ask three questions: one recall question, one “why” question and one practical application.'],
   ['INDEPENDENT PRACTICE','Give learners a short task they can complete with the tools they already have.'],
   ['RECAP','Repeat the learning goal, summarize the steps and suggest one next lesson.']
  ],
  'storyboard':[
   ['SCENE 1 — HOOK','Show a strong title card or visual question about: '+topic+'. Add a concise voiceover and readable captions.'],
   ['SCENE 2 — CONTEXT','Show the problem, setting or background. Use licensed images or original graphics.'],
   ['SCENE 3 — EXPLANATION','Use a simple diagram, screen capture or animated sequence to explain the main idea.'],
   ['SCENE 4 — EXAMPLE','Show a practical example or demonstration. Keep the important action in frame.'],
   ['SCENE 5 — INTERACTION','Invite viewers to answer a question, try a short challenge or choose the next topic.'],
   ['SCENE 6 — RESOLUTION','Summarize the message and finish with a clear closing card.'],
   ['EDITING NOTES','Use consistent audio levels, captions, legible text, safe margins for vertical video and a rights-cleared music track or silence.']
  ],
  'idea':[
   ['CORE CONCEPT','Create a useful, entertaining or educational experience about: '+topic+'.'],
   ['AUDIENCE','Describe who would benefit and what they should feel, learn or be able to do afterward.'],
   ['HOOK','Open with a surprising question, a visible transformation or a relatable problem. Do not use misleading claims.'],
   ['FORMAT OPTIONS','Try a short video, a faceless live session, an avatar-led explainer, an interactive quiz or a multi-part series.'],
   ['INTERACTION','Let viewers vote on a topic, solve a challenge, submit a safe question or choose between two next steps.'],
   ['LOW-COST PRODUCTION','Start with a phone or computer, a quiet room, original visuals, captions and free editing tools already available. Add paid tools only when their value and cost are clear.'],
   ['TEST','Show a small draft to a few trusted viewers. Ask what was clear, useful and confusing before making a larger version.']
  ]
 };
 const sections=plans[kind]||plans.idea;
 const body=sections.map(([heading,content])=>'## '+heading+'\n'+content).join('\n\n');
 return '# Magnanimous Offline Creator Draft\n\n**Topic / brief:** '+topic+'\n\n'+body+'\n\n'+common.map((line,i)=>i%2===0?'## '+line+'\n'+common[i+1]:'').filter(Boolean).join('\n\n')+'\n\n---\n**Draft type:** Local structured template, not generated by an AI model. Edit and verify before use.';
}
async function refresh(){
 try{
  const data=await api('/api/health');
  state.modelReady=Boolean(data.model?.ready);
  state.modelName=String(data.model?.name||'Local model');
  updateGenerationStatus();
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
 try{await api('/api/vault/lock',{method:'POST',body:'{}'});state.vaultUnlocked=false;state.projects=[];$('projectList').replaceChildren();const p=document.createElement('p');p.className='muted';p.textContent='Unlock the workspace to see your projects.';$('projectList').append(p);updateControls();message('vaultMessage','Workspace locked. The encryption key was cleared from memory.','success');}
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
 const prompt=$('prompt').value.trim(),kind=$('contentType').value,kindLabel=$('contentType').selectedOptions[0].textContent;
 if(!prompt){message('creatorMessage','Describe what you want to create first.','error');return;}
 $('generateButton').disabled=true;$('generateStatus').textContent='Magnanimous is preparing your draft on this device…';
 let usedLocalModel=false;
 try{
  if(state.modelReady){
   try{
    const result=await api('/api/chat',{method:'POST',body:JSON.stringify({prompt:'Create: '+kindLabel+'\n\n'+prompt+'\n\nMake the result structured, practical and ready to edit. Do not invent source facts or pretend this is an online broadcast.'})});
    $('output').value=result.answer;usedLocalModel=true;
   }catch(error){
    $('output').value=buildOfflineDraft(kind,prompt);
    message('creatorMessage','The local AI was unavailable ('+error.message+'). A structured offline draft was created instead.','warning');
   }
  }else{
   $('output').value=buildOfflineDraft(kind,prompt);
   message('creatorMessage','Created with the built-in offline draft planner. This is a structured template, not AI-generated text.','success');
  }
  $('outputTitle').value=$('outputTitle').value.trim()||kindLabel+' — '+prompt.slice(0,48);
  if(usedLocalModel)message('creatorMessage','Created by the local AI model. Nothing was sent to the cloud.','success');
 }catch(error){message('creatorMessage','The offline draft could not be created: '+error.message,'error');}
 finally{$('generateStatus').textContent=state.modelReady?'AI generation stays on this device; offline draft planning is also available.':'Offline draft planner ready. Add a compatible local model for generative AI.';updateControls();}
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
$('prompt').addEventListener('input',updateControls);
refresh();

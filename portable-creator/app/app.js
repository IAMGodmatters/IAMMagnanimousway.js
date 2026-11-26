const $=id=>document.getElementById(id);
const state={modelReady:false,vaultUnlocked:false,projects:[],obsConnected:false,obsRecording:false,autonomyActive:false,bridgeConnected:false,bridgeStatus:'disconnected',activeSpeechCount:0,lastBridgeStopCommandId:''};
let autonomyTimer=null;
let autonomyHeartbeatTimer=null;
let autonomyTickBusy=false;
let autonomySpeechBusy=false;
let autonomyCancellingSpeech=false;
async function api(path,options={}){
 const response=await fetch(path,{...options,cache:'no-store',headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>({detail:'The local service returned an invalid response.'}));
 if(!response.ok)throw new Error(data.detail||'The local operation failed.');
 return data;
}
function message(id,text,kind='info'){const el=$(id);el.textContent=text;el.className='message '+kind;}
function renderBridgeCommands(commands=[]){
 const list=$('bridgeCommandList');list.replaceChildren();
 $('bridgePendingCount').textContent=commands.length+' pending';
 if(!commands.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='No remote actions waiting for approval.';list.append(empty);return;}
 for(const command of commands){
  const card=document.createElement('article');card.className='bridge-command';
  const title=document.createElement('strong');
  title.textContent=command.action==='host.speak'?'AI host wants to speak':command.action==='scene.set'?'AI host requests an OBS scene change':'Unsupported remote action';
  const detail=document.createElement('p');
  detail.textContent=command.action==='host.speak'?String(command.text||'').slice(0,500):'Switch OBS to the scene: '+String(command.sceneName||'');
  const meta=document.createElement('small');meta.textContent='Command '+String(command.commandId||'').slice(0,32)+' · '+new Date(command.receivedAt||Date.now()).toLocaleTimeString();
  const actions=document.createElement('div');actions.className='actions';
  const approve=document.createElement('button');approve.type='button';approve.className='secondary';approve.textContent=command.action==='host.speak'?'Approve & speak':'Approve & switch scene';
  approve.addEventListener('click',()=>reviewBridgeCommand(command.commandId,true));
  const reject=document.createElement('button');reject.type='button';reject.className='quiet';reject.textContent='Reject';
  reject.addEventListener('click',()=>reviewBridgeCommand(command.commandId,false));
  actions.append(approve,reject);card.append(title,detail,meta,actions);list.append(card);
 }
}
async function refreshBridgeStatus(){
 try{
  const data=await api('/api/bridge/status');
  state.bridgeConnected=Boolean(data.connected);state.bridgeStatus=String(data.status||'disconnected');
  state.activeSpeechCount=Number.isFinite(data.activeSpeechCount)?Math.max(0,Math.min(20,Number(data.activeSpeechCount))):0;
  const stopCommandId=typeof data.stopRequest?.commandId==='string'?data.stopRequest.commandId:'';
  if(stopCommandId&&stopCommandId!==state.lastBridgeStopCommandId){
   state.lastBridgeStopCommandId=stopCommandId;
   try{
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    if(state.autonomyActive)await stopLiveAutonomy('remote_emergency_stop');
    await api('/api/bridge/command/result',{method:'POST',body:JSON.stringify({commandId:stopCommandId,outcome:'completed'})});
    message('bridgeMessage','Emergency stop confirmed. Device speech has been cancelled.','success');
   }catch(error){
    state.lastBridgeStopCommandId='';
    message('bridgeMessage','Emergency stop received but could not be confirmed: '+error.message,'error');
   }
  }
  const status=$('bridgeStatus');
  status.textContent=state.bridgeConnected?'SECURE COMPANION CONNECTED · '+(data.pendingCommands||[]).length+' pending'
   :state.bridgeStatus==='connecting'?'PAIRING · WAITING FOR OTHER DEVICE'
   :data.workspaceUnlocked?'DISCONNECTED · NO REMOTE ACCESS':'WORKSPACE LOCKED · NO REMOTE ACCESS';
  status.className='status '+(state.bridgeConnected?'ready':state.bridgeStatus==='connecting'?'warning':'');
  renderBridgeCommands(data.pendingCommands||[]);
  if(data.error)message('bridgeMessage',data.error,'warning');
  updateControls();
 }catch(error){
  state.bridgeConnected=false;state.bridgeStatus='error';
  $('bridgeStatus').textContent='Companion status unavailable';
  $('bridgeStatus').className='status warning';
  updateControls();
 }
}
async function connectBridge(){
 const endpoint=$('bridgeEndpoint').value.trim(),token=$('bridgeToken').value.trim();
 if(!endpoint||!token){message('bridgeMessage','Enter the official bridge address and one-time companion token.','error');return;}
 $('bridgeConnectButton').disabled=true;
 try{
  const result=await api('/api/bridge/connect',{method:'POST',body:JSON.stringify({endpoint,token})});
  $('bridgeToken').value='';
  message('bridgeMessage',result.status==='connected'?'Secure companion connected.':'Pairing started. Keep the online Bridge tab open while the USB companion authenticates.','success');
  await refreshBridgeStatus();
 }catch(error){$('bridgeToken').value='';message('bridgeMessage',error.message,'error');}
 finally{updateControls();}
}
async function disconnectBridge(){
 try{
  await api('/api/bridge/disconnect',{method:'POST',body:'{}'});
  $('bridgeToken').value='';state.bridgeConnected=false;state.bridgeStatus='disconnected';state.activeSpeechCount=0;state.lastBridgeStopCommandId='';
  await refreshBridgeStatus();
  message('bridgeMessage','Companion disconnected. Pending remote approvals were cleared.','success');
 }catch(error){message('bridgeMessage',error.message,'error');}
}
async function stopDeviceSpeech(){
 try{
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  if(state.autonomyActive)await stopLiveAutonomy('operator_emergency_stop');
  const result=await api('/api/bridge/command/stop',{method:'POST',body:'{}'});
  state.activeSpeechCount=0;
  message('bridgeMessage','Device speech stopped. '+Number(result.stopped||0)+' remote host speech request(s) cancelled.','success');
  await refreshBridgeStatus();
 }catch(error){message('bridgeMessage','Device speech cancellation could not be confirmed: '+error.message,'error');}
}
async function finishBridgeSpeech(commandId,outcome){
 try{await api('/api/bridge/command/result',{method:'POST',body:JSON.stringify({commandId,outcome})});}
 catch(error){message('bridgeMessage','Local voice finished, but the online completion receipt could not be sent: '+error.message,'warning');}
 await refreshBridgeStatus();
}
async function reviewBridgeCommand(commandId,approved){
 try{
  const result=await api('/api/bridge/command/review',{method:'POST',body:JSON.stringify({commandId,approved})});
  if(!approved){message('bridgeMessage','Remote action rejected. Nothing was executed.','success');}
  else if(result.action==='host.speak'){
   if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){
    await finishBridgeSpeech(result.commandId,'failed');
    message('bridgeMessage','This browser has no supported speech engine. The request was marked failed.','error');
    return;
   }
   const utterance=new SpeechSynthesisUtterance(String(result.speechText||'').slice(0,500));
   utterance.rate=1;utterance.pitch=1;utterance.volume=1;
   utterance.onend=()=>{message('bridgeMessage','Approved host speech completed on this device.','success');finishBridgeSpeech(result.commandId,'completed');};
   utterance.onerror=()=>{message('bridgeMessage','The device voice could not complete the approved host line.','warning');finishBridgeSpeech(result.commandId,'failed');};
   window.speechSynthesis.speak(utterance);
   message('bridgeMessage','Approved. The local device is speaking the Magnanimous AI host line.','success');
  }else{
   message('bridgeMessage','Approved OBS scene change completed: '+String(result.sceneName||'scene changed')+'.','success');
  }
  await refreshBridgeStatus();await refreshObsStatus();
 }catch(error){message('bridgeMessage',error.message,'error');await refreshBridgeStatus();}
}
function updateControls(){
 $('generateButton').disabled=!$('prompt').value.trim();
 $('saveButton').disabled=!state.vaultUnlocked||!$('output').value.trim();
 $('exportButton').disabled=!$('output').value.trim();
 $('lockButton').disabled=!state.vaultUnlocked;
 $('vaultStatus').textContent=state.vaultUnlocked?'Encrypted workspace unlocked':'Workspace locked';
 $('vaultStatus').className='status '+(state.vaultUnlocked?'ready':'');
 $('bridgeConnectButton').disabled=!state.vaultUnlocked||state.bridgeConnected||state.bridgeStatus==='connecting'||!$('bridgeEndpoint').value.trim()||!$('bridgeToken').value.trim();
 $('bridgeDisconnectButton').disabled=!state.bridgeConnected&&state.bridgeStatus!=='connecting';
 $('bridgeStopSpeechButton').disabled=!state.bridgeConnected&&!state.autonomyActive&&state.activeSpeechCount===0;
 $('obsConnectButton').disabled=state.obsConnected;
 $('obsDisconnectButton').disabled=!state.obsConnected;
 $('obsRefreshButton').disabled=!state.obsConnected;
 $('obsSceneSelect').disabled=!state.obsConnected;
 $('obsSwitchButton').disabled=!state.obsConnected||!$('obsSceneSelect').value;
 $('obsStartRecordButton').disabled=!state.obsConnected||state.obsRecording;
 $('obsStopRecordButton').disabled=!state.obsConnected||!state.obsRecording;
 $('livePullButton').disabled=false;
 $('liveSendButton').disabled=!$('liveTestText').value.trim();
}
function updateAutonomyControls(){
 const speechSelected=$('liveAutonomySpeech').checked;
 const scenesSelected=$('liveAutonomyScenes').checked;
 const selected=speechSelected||scenesSelected;
 const speechAvailable=!speechSelected||(state.modelReady&&window.speechSynthesis&&typeof SpeechSynthesisUtterance!=='undefined');
 const scenesAvailable=!scenesSelected||state.obsConnected;
 $('liveAutonomyStart').disabled=state.autonomyActive||!$('liveAutonomyConsent').checked||!selected||!speechAvailable||!scenesAvailable;
 $('liveAutonomyStop').disabled=!state.autonomyActive;
 $('liveAutonomySpeech').disabled=state.autonomyActive;
 $('liveAutonomyScenes').disabled=state.autonomyActive;
 $('liveAutonomyConsent').disabled=state.autonomyActive;
 $('liveAutonomyDuration').disabled=state.autonomyActive;
 ['autonomyChatScene','autonomyWelcomeScene','autonomyGameScene','autonomyPollScene'].forEach(id=>$(id).disabled=state.autonomyActive);
}
async function loadAutonomyScenes(){
 try{
  const data=await api('/api/obs/scenes');
  const mapping=[['autonomyChatScene'],['autonomyWelcomeScene'],['autonomyGameScene'],['autonomyPollScene']];
  for(const [id] of mapping){
   const select=$(id),current=select.value;
   select.replaceChildren(new Option('No automatic scene',''));
   for(const scene of data.scenes||[])select.add(new Option(scene.sceneName,scene.sceneName));
   if([...select.options].some(option=>option.value===current))select.value=current;
  }
  $('liveAutonomyMessage').textContent='Choose only the scenes that Magnanimous may switch to automatically.';
 }catch(error){
  $('liveAutonomyScenes').checked=false;
  $('liveAutonomySceneMap').hidden=true;
  message('liveAutonomyMessage',error.message,'error');
 }
 updateAutonomyControls();
}
async function refreshAutonomyStatus(){
 try{
  const data=await api('/api/live/autonomy/status');
  state.autonomyActive=Boolean(data.enabled);
  const status=$('liveAutonomyStatus');
  status.textContent=state.autonomyActive
   ?'AI TAKEOVER ACTIVE · Expires '+new Date(data.expiresAt).toLocaleTimeString()
   :'Manual mode · takeover off';
  status.className='status '+(state.autonomyActive?'warning':'');
  updateAutonomyControls();
  if(state.autonomyActive)startAutonomyPolling();
  else stopAutonomyPolling(true);
 }catch(error){
  $('liveAutonomyStatus').textContent='Autonomy status unavailable';
 }
}
async function startLiveAutonomy(){
 const permissions=[];
 if($('liveAutonomySpeech').checked)permissions.push('host_speech');
 if($('liveAutonomyScenes').checked)permissions.push('obs_scene_switch');
 if(!permissions.length){message('liveAutonomyMessage','Select at least one show ability first.','error');return;}
 if(permissions.includes('host_speech')&&(!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined')){
  message('liveAutonomyMessage','This browser does not expose a speech engine. Turn off spoken responses or use a supported browser voice.','error');return;
 }
 const sceneMap={
  chat:$('autonomyChatScene').value,
  welcome:$('autonomyWelcomeScene').value,
  game:$('autonomyGameScene').value,
  poll:$('autonomyPollScene').value
 };
 $('liveAutonomyStart').disabled=true;
 try{
  const result=await api('/api/live/autonomy/enable',{method:'POST',body:JSON.stringify({
   acknowledged:$('liveAutonomyConsent').checked,
   permissions,
   sceneMap,
   durationMinutes:Number($('liveAutonomyDuration').value)
  })});
  state.autonomyActive=true;
  autonomyCancellingSpeech=false;
  $('liveAutonomyStatus').textContent='AI TAKEOVER ACTIVE · Expires '+new Date(result.session.expiresAt).toLocaleTimeString();
  $('liveAutonomyStatus').className='status warning';
  $('liveAutonomyOutput').textContent='Magnanimous is now running the abilities you selected. The STOP AI TAKEOVER control remains available.';
  message('liveAutonomyMessage','Takeover enabled for this session. Only the selected permissions are active.','success');
  updateAutonomyControls();
  startAutonomyPolling();
 }catch(error){
  state.autonomyActive=false;
  message('liveAutonomyMessage',error.message,'error');
  updateAutonomyControls();
 }
}
function stopAutonomyPolling(cancelSpeech=true){
 if(autonomyTimer){clearInterval(autonomyTimer);autonomyTimer=null;}
 if(autonomyHeartbeatTimer){clearInterval(autonomyHeartbeatTimer);autonomyHeartbeatTimer=null;}
 autonomyTickBusy=false;
 if(cancelSpeech){autonomyCancellingSpeech=true;if(window.speechSynthesis)window.speechSynthesis.cancel();}
 autonomySpeechBusy=false;
}
async function stopLiveAutonomy(reason='operator_stop'){
 stopAutonomyPolling(true);
 try{
  await api('/api/live/autonomy/stop',{method:'POST',body:JSON.stringify({reason})});
 }catch(error){
  message('liveAutonomyMessage','Stop request could not be confirmed: '+error.message,'error');
 }
 state.autonomyActive=false;
 $('liveAutonomyStatus').textContent='Manual mode · takeover stopped';
 $('liveAutonomyStatus').className='status';
 $('liveAutonomyOutput').textContent='Magnanimous has returned control to the operator.';
 updateAutonomyControls();
}
async function recordAutonomySpeech(reservationId,outcome,detail='browser_speech_engine'){
 try{await api('/api/live/autonomy/action-result',{method:'POST',body:JSON.stringify({reservationId,outcome,detail})});}
 catch(error){message('liveAutonomyMessage','Speech receipt was not confirmed: '+error.message,'error');}
}
function speakAutonomyLine(speech,eventType){
 if(!speech?.line||!speech?.reservationId)return;
 autonomyCancellingSpeech=false;
 $('liveAutonomyOutput').textContent='MAGNANIMOUS · '+eventType+'\n'+speech.line;
 if(!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined'){
  recordAutonomySpeech(speech.reservationId,'unavailable','speech_engine_unavailable');
  return;
 }
 autonomySpeechBusy=true;
 const utterance=new SpeechSynthesisUtterance(speech.line);
 utterance.rate=1;
 utterance.pitch=1;
 utterance.onend=()=>{autonomySpeechBusy=false;if(!autonomyCancellingSpeech)recordAutonomySpeech(speech.reservationId,'succeeded');};
 utterance.onerror=()=>{autonomySpeechBusy=false;if(!autonomyCancellingSpeech)recordAutonomySpeech(speech.reservationId,'failed','speech_engine_error');};
 window.speechSynthesis.speak(utterance);
}
async function runAutonomyCycle(){
 if(!state.autonomyActive||autonomyTickBusy||autonomySpeechBusy)return;
 autonomyTickBusy=true;
 try{
  const data=await api('/api/live/autonomy/next',{method:'POST',body:'{}'});
  if(data.scene?.outcome==='succeeded')$('liveAutonomyOutput').textContent='Magnanimous changed OBS to the approved "'+data.scene.sceneName+'" scene.';
  else if(data.scene?.outcome==='unavailable')$('liveAutonomyOutput').textContent='OBS scene change unavailable. Magnanimous will continue only with other enabled abilities.';
  if(data.speech?.line)speakAutonomyLine(data.speech,data.event?.type||'show moment');
  else if(data.idle)$('liveAutonomyOutput').textContent='AI takeover is active and waiting for the next audience or game event.';
  if(data.autonomy?.enabled===false){state.autonomyActive=false;stopAutonomyPolling(false);await refreshAutonomyStatus();updateAutonomyControls();}
 }catch(error){
  if(error.message.includes('AI takeover is not active')){state.autonomyActive=false;stopAutonomyPolling(false);await refreshAutonomyStatus();}
  else if(!error.message.includes('still running'))message('liveAutonomyMessage',error.message,'error');
 }finally{autonomyTickBusy=false;}
}
async function sendAutonomyHeartbeat(){
 if(!state.autonomyActive)return;
 try{await api('/api/live/autonomy/heartbeat',{method:'POST',body:'{}'});}
 catch(error){
  if(error.message.includes('AI takeover is not active')){
   state.autonomyActive=false;
   stopAutonomyPolling(false);
   await refreshAutonomyStatus();
  }else message('liveAutonomyMessage','AI takeover connection needs attention: '+error.message,'error');
 }
}
function startAutonomyPolling(){
 if(!autonomyTimer){runAutonomyCycle();autonomyTimer=setInterval(runAutonomyCycle,1800);}
 if(!autonomyHeartbeatTimer){autonomyHeartbeatTimer=setInterval(sendAutonomyHeartbeat,10000);}
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
async function refreshObsScenes(){
 const data=await api('/api/obs/scenes'),select=$('obsSceneSelect'),previous=select.value;
 select.replaceChildren();
 for(const scene of data.scenes||[]){
  const option=document.createElement('option');option.value=scene.sceneName;option.textContent=scene.sceneName;select.append(option);
 }
 if((data.scenes||[]).some(scene=>scene.sceneName===previous))select.value=previous;
 else if(data.currentProgramSceneName)select.value=data.currentProgramSceneName;
 $('obsCurrentScene').textContent=data.currentProgramSceneName?'Program scene: '+data.currentProgramSceneName:'No program scene reported';
 updateControls();
}
async function refreshObsStatus(){
 try{
  const data=await api('/api/obs/status');
  state.obsConnected=Boolean(data.connected);state.obsRecording=Boolean(data.recording);
  $('obsStatus').textContent=state.obsConnected?'OBS connected on this computer':'OBS not connected';
  $('obsStatus').className='status '+(state.obsConnected?'ready':'warning');
  if(state.obsConnected)await refreshObsScenes();
  else{$('obsSceneSelect').replaceChildren();$('obsCurrentScene').textContent='Open OBS and enable its WebSocket server to connect.';}
 }catch(error){state.obsConnected=false;state.obsRecording=false;$('obsStatus').textContent='OBS connection unavailable';$('obsCurrentScene').textContent=error.message;}
 updateControls();
}
async function connectObs(){
 $('obsConnectButton').disabled=true;
 try{
  const password=$('obsPassword').value;
  const result=await api('/api/obs/connect',{method:'POST',body:JSON.stringify({password})});
  $('obsPassword').value='';
  state.obsConnected=Boolean(result.connected);
  message('obsMessage','Connected to OBS locally. Your password was not saved.','success');
  await refreshObsStatus();
  await refreshAutonomyStatus();
  await refreshReviewReceipts();
 }catch(error){$('obsPassword').value='';message('obsMessage',error.message,'error');}
 finally{updateControls();}
}
async function disconnectObs(){
 try{await api('/api/obs/disconnect',{method:'POST',body:'{}'});state.obsConnected=false;state.obsRecording=false;$('obsSceneSelect').replaceChildren();$('obsCurrentScene').textContent='OBS disconnected.';message('obsMessage','OBS disconnected.','success');}
 catch(error){message('obsMessage',error.message,'error');}
 updateControls();
}
async function switchObsScene(){
 try{const result=await api('/api/obs/scene',{method:'POST',body:JSON.stringify({sceneName:$('obsSceneSelect').value})});$('obsCurrentScene').textContent='Program scene: '+result.sceneName;message('obsMessage','Switched OBS to '+result.sceneName+'.','success');}
 catch(error){message('obsMessage',error.message,'error');}
}
async function setObsRecording(start){
 const path=start?'/api/obs/recording/start':'/api/obs/recording/stop';
 try{
  const result=await api(path,{method:'POST',body:'{}'});
  state.obsRecording=Boolean(result.recording);
  message('obsMessage',start?'OBS recording started.':'OBS recording stopped. '+(result.outputPath?'Saved to '+result.outputPath:''),'success');
 }catch(error){message('obsMessage',error.message,'error');}
 updateControls();
}
async function decideReviewCue(cue,decision,card,actions,status){
 const controls=[...actions.querySelectorAll('button')];
 controls.forEach(button=>button.disabled=true);
 try{
  const result=await api('/api/live/cues/decision',{method:'POST',body:JSON.stringify({cueId:cue.cueId,decision})});
  status.textContent=result.receipt?.decision==='approve'
   ?'APPROVED FOR OPERATOR USE · NO ACTION EXECUTED'
   :'DISMISSED · NO ACTION EXECUTED';
  card.classList.add('review-complete');
  actions.remove();
  message('liveEventMessage','Operator decision recorded locally. No speech, scene, publishing, moderation or game action was executed.','success');
  await refreshReviewReceipts();
 }catch(error){
  controls.forEach(button=>button.disabled=false);
  message('liveEventMessage',error.message,'error');
 }
}
function renderReviewReceipts(receipts=[]){
 const list=$('liveReviewReceipts');list.replaceChildren();
 if(!receipts.length){
  const empty=document.createElement('p');empty.className='muted';
  empty.textContent='No decisions recorded in this session.';list.append(empty);return;
 }
 for(const receipt of receipts){
  const item=document.createElement('article');item.className='review-receipt';
  const title=document.createElement('strong');
  title.textContent=(receipt.decision==='approve'?'APPROVED':'DISMISSED')+' · '+(receipt.title||'Show cue');
  const details=document.createElement('small');
  const when=Number.isFinite(Date.parse(receipt.decidedAt))?new Date(receipt.decidedAt).toLocaleString():'time unavailable';
  details.textContent=(receipt.kind||'review cue')+' · '+when+' · No action executed';
  item.append(title,details);list.append(item);
 }
}
async function refreshReviewReceipts(){
 try{
  const data=await api('/api/live/cues/receipts');
  renderReviewReceipts(data.receipts||[]);
 }catch{
  const list=$('liveReviewReceipts');list.textContent='Session receipts are unavailable.';
 }
}
function renderLiveEvents(events,cues=[]){
 const cueByEvent=new Map(cues.map(cue=>[cue.cueId,cue]));
 const list=$('liveEventList');list.replaceChildren();
 if(!events.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='No events in this batch. Connect an authorized provider adapter later, or send a local test event.';list.append(empty);return;}
 for(const event of events){
  const item=document.createElement('article');item.className='live-event';
  const meta=document.createElement('strong');meta.textContent=event.provider+' · '+event.type;
  const actor=document.createElement('small');actor.textContent=event.actorName||event.actorId||'Viewer';
  const body=document.createElement('p');body.textContent=event.text||'(No message text)';
  item.append(meta,actor,body);
  const cue=cueByEvent.get(event.provider+':'+event.eventId);
  if(cue){
   const review=document.createElement('section');review.className='director-cue';
   const title=document.createElement('strong');title.textContent='MAGNANIMOUS SUGGESTION · '+cue.title;
   const prompt=document.createElement('p');prompt.textContent=cue.prompt;
   const note=document.createElement('small');note.textContent='Short-lived review cue · operator decision required · never executes an action by itself';
   const status=document.createElement('small');status.className='director-decision';status.textContent='AWAITING OPERATOR DECISION';
   const actions=document.createElement('div');actions.className='director-actions';
   const approve=document.createElement('button');approve.type='button';approve.className='secondary';approve.textContent='Approve for operator use';
   approve.addEventListener('click',()=>decideReviewCue(cue,'approve',item,actions,status));
   const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='quiet';dismiss.textContent='Dismiss';
   dismiss.addEventListener('click',()=>decideReviewCue(cue,'dismiss',item,actions,status));
   actions.append(approve,dismiss);review.append(title,prompt,note,status,actions);item.append(review);
  }
  list.append(item);
 }
}
async function refreshLiveQueue(){
 try{
  const data=await api('/api/live/events/status');
  const warning=data.journalError||data.journalWarning;
  $('liveQueueStatus').textContent=warning?warning:data.recoveryLocked?'Unlock the workspace to recover queued events':data.queued+' queued · '+data.capacity+' capacity';
  $('liveQueueStatus').className='status '+(warning||data.recoveryLocked?'warning':data.queued?'ready':'');
 }catch(error){$('liveQueueStatus').textContent='Local event queue unavailable';}
}
async function sendLocalEvent(){
 const text=$('liveTestText').value.trim(),type=$('liveTestType').value;
 if(!text){message('liveEventMessage','Enter a short test event first.','error');return;}
 $('liveSendButton').disabled=true;
 const event={protocolVersion:1,eventId:'manual-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),provider:'manual',type,occurredAt:new Date().toISOString(),actorName:'Local test',text,tags:{source:'operator-test',category:type==='game.event'?'game':'audience'}};
 try{await api('/api/live/events/ingest',{method:'POST',body:JSON.stringify({event})});message('liveEventMessage','Local test event added to the queue. Pull it when ready.','success');await refreshLiveQueue();
window.addEventListener('beforeunload',()=>{if(state.autonomyActive){stopAutonomyPolling(true);fetch('/api/live/autonomy/stop',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reason:'control_surface_closed'}),keepalive:true}).catch(()=>{});}});}
 catch(error){message('liveEventMessage',error.message,'error');}
 finally{updateControls();}
}
let pendingLiveDelivery=null;
async function pullLiveEvents(){
 $('livePullButton').disabled=true;
 try{
  if(pendingLiveDelivery){
   const pending=pendingLiveDelivery;
   const retry=await api('/api/live/events/ack',{method:'POST',body:JSON.stringify({deliveryId:pending.deliveryId,eventKeys:pending.eventKeys})});
   if(!['acknowledged','duplicate'].includes(retry.status))throw new Error('The displayed batch is still in the encrypted journal. Retry this acknowledgement before pulling another batch.');
   pendingLiveDelivery=null;
   message('liveEventMessage',pending.count+' previously displayed event(s) are now durably acknowledged.','success');
   return;
  }
  const data=await api('/api/live/events/consume',{method:'POST',body:JSON.stringify({limit:20})});
  const events=data.events||[];
  renderLiveEvents(events,data.reviewCues||[]);
  if(data.deliveryId&&Array.isArray(data.eventKeys)&&data.eventKeys.length){
   pendingLiveDelivery={deliveryId:data.deliveryId,eventKeys:data.eventKeys,count:events.length};
   const ack=await api('/api/live/events/ack',{method:'POST',body:JSON.stringify({deliveryId:data.deliveryId,eventKeys:data.eventKeys})});
   if(!['acknowledged','duplicate'].includes(ack.status))throw new Error('The displayed batch remains in the encrypted journal. Retry its acknowledgement before pulling another batch.');
   pendingLiveDelivery=null;
   message('liveEventMessage',events.length+' event(s) displayed and durably acknowledged.','success');
  }else{
   message('liveEventMessage',events.length?'Events displayed; no delivery acknowledgement was required.':'No unclaimed events are waiting.','success');
  }
 }catch(error){message('liveEventMessage',error.message,'error');}
 finally{$('livePullButton').disabled=false;await refreshLiveQueue();}
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
  await refreshObsStatus();
  await refreshBridgeStatus();
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
$('bridgeConnectButton').addEventListener('click',connectBridge);
$('bridgeDisconnectButton').addEventListener('click',disconnectBridge);
$('bridgeStopSpeechButton').addEventListener('click',stopDeviceSpeech);
$('bridgeEndpoint').addEventListener('input',updateControls);
$('bridgeToken').addEventListener('input',updateControls);
$('obsConnectButton').addEventListener('click',connectObs);
$('obsDisconnectButton').addEventListener('click',disconnectObs);
$('obsRefreshButton').addEventListener('click',()=>refreshObsStatus());
$('obsSwitchButton').addEventListener('click',switchObsScene);
$('obsStartRecordButton').addEventListener('click',()=>setObsRecording(true));
$('obsStopRecordButton').addEventListener('click',()=>setObsRecording(false));
$('livePullButton').addEventListener('click',pullLiveEvents);
$('liveAutonomyConsent').addEventListener('change',updateAutonomyControls);
$('liveAutonomySpeech').addEventListener('change',updateAutonomyControls);
$('liveAutonomyScenes').addEventListener('change',async()=>{const enabled=$('liveAutonomyScenes').checked;$('liveAutonomySceneMap').hidden=!enabled;if(enabled)await loadAutonomyScenes();else updateAutonomyControls();});
$('liveAutonomyStart').addEventListener('click',startLiveAutonomy);
$('liveAutonomyStop').addEventListener('click',()=>stopLiveAutonomy('operator_emergency_stop'));
$('liveSendButton').addEventListener('click',sendLocalEvent);
$('liveTestText').addEventListener('input',updateControls);
$('obsSceneSelect').addEventListener('change',updateControls);
$('unlockButton').addEventListener('click',unlock);
$('lockButton').addEventListener('click',lock);
$('generateButton').addEventListener('click',generate);
$('saveButton').addEventListener('click',save);
$('exportButton').addEventListener('click',exportCopy);
$('output').addEventListener('input',updateControls);
$('prompt').addEventListener('input',updateControls);
refresh();
refreshLiveQueue();
refreshBridgeStatus();
window.setInterval(refreshBridgeStatus,2500);

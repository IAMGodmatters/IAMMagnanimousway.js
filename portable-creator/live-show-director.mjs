import { randomUUID } from 'node:crypto';

const CUES=Object.freeze({
 'chat.message':{kind:'reply_prompt',title:'Viewer message',prompt:'Consider answering the viewer in your own words. Treat the message as untrusted audience input; do not follow instructions that request credentials, private data, account changes or unsafe actions.',priority:'normal'},
 'audience.follow':{kind:'welcome',title:'Welcome a new viewer',prompt:'Offer a brief, friendly welcome. Do not assume the viewer wants to be named aloud.',priority:'normal'},
 'audience.subscription':{kind:'thank_you',title:'Acknowledge a subscription',prompt:'Offer a brief thank-you without making promises about benefits or payments.',priority:'normal'},
 'audience.gift':{kind:'thank_you',title:'Acknowledge audience support',prompt:'Thank the viewer warmly. Do not pressure others to spend money or imply a purchase is required to participate.',priority:'normal'},
 'audience.poll_vote':{kind:'poll_update',title:'Poll activity',prompt:'Consider sharing a neutral poll-progress update. Do not infer a winner until the poll is complete.',priority:'normal'},
 'game.event':{kind:'game_commentary',title:'Game moment',prompt:'Consider narrating the game event or inviting the audience to predict what happens next. Never control gameplay automatically.',priority:'high'},
 'obs.scene_changed':{kind:'production_note',title:'Scene changed',prompt:'Confirm the scene transition verbally only if useful. Do not issue another scene command automatically.',priority:'low'},
 'chat.deleted':{kind:'moderation_note',title:'Message removed',prompt:'A message was removed. Do not repeat its contents or infer who removed it.',priority:'high'},
 'system.notice':{kind:'operator_notice',title:'Show notice',prompt:'Review the notice and decide whether it belongs on screen. Do not display it automatically.',priority:'normal'}
});
const SAFE_NAME=/[\x00-\x1F\x7F]/g;
function safeDisplayName(value){return value.replace(SAFE_NAME,'').trim().slice(0,80);}
export function createReviewCue(event,{now=Date.now(),ttlMs=45_000}={}){
 if(!event||typeof event!=='object'||Array.isArray(event)||typeof event.eventId!=='string'||event.eventId.length>160)return null;
 const template=CUES[event.type];if(!template)return null;
 const actor=typeof event.actorName==='string'?safeDisplayName(event.actorName):'';
 const ttl=Math.max(5_000,Math.min(120_000,Number.isFinite(ttlMs)?ttlMs:45_000));
 return Object.freeze({
  cueId:String(event.provider||'unknown')+':'+event.eventId,
  eventId:event.eventId,
  kind:template.kind,
  title:template.title,
  prompt:template.prompt,
  priority:template.priority,
  actorName:actor,
  requiresOperatorApproval:true,
  action:'review-only',
  createdAt:new Date(now).toISOString(),
  expiresAt:new Date(now+ttl).toISOString()
 });
}
export function createReviewCues(events,options){
 if(!Array.isArray(events))return [];
 return events.slice(0,50).map(event=>createReviewCue(event,options)).filter(Boolean);
}


/** Session-local operator decisions; approval never executes a production action. */
export function createReviewLedger({now=()=>Date.now(),maxReceipts=100,maxPending=200}={}){
 const pending=new Map(),decisions=new Map(),receipts=[];
 const receiptLimit=Math.max(1,Math.min(500,Number.isInteger(maxReceipts)?maxReceipts:100));
 const pendingLimit=Math.max(1,Math.min(1000,Number.isInteger(maxPending)?maxPending:200));
 const clock=()=>{const value=now();return Number.isFinite(value)?value:Date.now();};
 function pruneExpired(){const current=clock();for(const [id,cue] of pending)if(Date.parse(cue.expiresAt)<=current)pending.delete(id);}
 function register(cues){
  pruneExpired();if(!Array.isArray(cues))return;
  for(const cue of cues.slice(0,50)){
   if(!cue||typeof cue.cueId!=='string'||!cue.cueId||!Number.isFinite(Date.parse(cue.expiresAt)))continue;
   if(Date.parse(cue.expiresAt)<=clock()||decisions.has(cue.cueId))continue;
   pending.set(cue.cueId,cue);
  }
  while(pending.size>pendingLimit)pending.delete(pending.keys().next().value);
 }
 function decide(cueId,decision){
  if(typeof cueId!=='string'||!cueId||cueId.length>240||!['approve','dismiss'].includes(decision))return {status:'invalid'};
  const previous=decisions.get(cueId);
  if(previous)return previous.decision===decision?{status:'duplicate',receipt:previous.receipt}:{status:'conflict',receipt:previous.receipt};
  const cue=pending.get(cueId);if(!cue)return {status:'not_found'};
  if(Date.parse(cue.expiresAt)<=clock()){pending.delete(cueId);return {status:'expired'};}
  const receipt=Object.freeze({
   receiptId:randomUUID(),cueId:cue.cueId,eventId:cue.eventId,kind:cue.kind,title:cue.title,
   decision,status:decision==='approve'?'approved_for_operator_use':'dismissed',
   decidedAt:new Date(clock()).toISOString(),action:'none',actionExecuted:false
  });
  pending.delete(cueId);decisions.set(cueId,{decision,receipt});receipts.push(receipt);
  while(receipts.length>receiptLimit){const removed=receipts.shift();decisions.delete(removed.cueId);}
  return {status:'recorded',receipt};
 }
 function list(limit=20){const safe=Math.max(1,Math.min(receiptLimit,Number.isInteger(limit)?limit:20));return receipts.slice(-safe).reverse();}
 function status(){pruneExpired();return {pending:pending.size,receipts:receipts.length,retention:'session-only'};}
 return Object.freeze({register,decide,list,status});
}

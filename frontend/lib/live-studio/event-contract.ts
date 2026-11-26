export const LIVE_PROVIDERS = ['manual', 'tiktok', 'youtube', 'twitch', 'obs', 'game', 'browser'] as const;
export type LiveProvider = typeof LIVE_PROVIDERS[number];
export const LIVE_EVENT_TYPES = ['chat.message','chat.deleted','audience.follow','audience.subscription','audience.gift','audience.poll_vote','game.event','obs.scene_changed','system.notice'] as const;
export type LiveEventType = typeof LIVE_EVENT_TYPES[number];
export type LiveEvent = { protocolVersion: 1; eventId: string; provider: LiveProvider; type: LiveEventType; occurredAt: string; receivedAt: string; roomId?: string; actorId?: string; actorName?: string; text?: string; amount?: number; currency?: string; tags?: Record<string,string|number|boolean> };
const CONTROL_CHARS=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, EVENT_ID=/^[A-Za-z0-9._:-]{1,160}$/, SAFE_TAG=/^[a-zA-Z][a-zA-Z0-9_.-]{0,39}$/;
function cleanText(value:unknown,max:number):string|undefined { if(typeof value!=='string')return; const s=value.replace(CONTROL_CHARS,'').trim(); return s?s.slice(0,max):undefined; }
function safeTags(value:unknown):Record<string,string|number|boolean>|undefined { if(!value||typeof value!=='object'||Array.isArray(value))return; const out:Record<string,string|number|boolean>={}; for(const [key,raw] of Object.entries(value as Record<string,unknown>).slice(0,8)){ if(!SAFE_TAG.test(key)||/token|secret|password|cookie|authorization|credential/i.test(key))continue; if(typeof raw==='string')out[key]=raw.replace(CONTROL_CHARS,'').slice(0,120); else if(typeof raw==='number'&&Number.isFinite(raw))out[key]=raw; else if(typeof raw==='boolean')out[key]=raw; } return Object.keys(out).length?out:undefined; }
/** Convert an untrusted adapter payload into the small, safe event shape used by Magnanimous. */
export function normalizeLiveEvent(input:unknown,now=Date.now()):LiveEvent|null {
 if(!input||typeof input!=='object'||Array.isArray(input))return null; const v=input as Record<string,unknown>;
 if(v.protocolVersion!==1||typeof v.eventId!=='string'||!EVENT_ID.test(v.eventId)||!LIVE_PROVIDERS.includes(v.provider as LiveProvider)||!LIVE_EVENT_TYPES.includes(v.type as LiveEventType))return null;
 const stamp=typeof v.occurredAt==='string'?Date.parse(v.occurredAt):NaN, occurredAt=Number.isFinite(stamp)&&Math.abs(now-stamp)<=7*86400000?new Date(stamp).toISOString():new Date(now).toISOString();
 const e:LiveEvent={protocolVersion:1,eventId:v.eventId,provider:v.provider as LiveProvider,type:v.type as LiveEventType,occurredAt,receivedAt:new Date(now).toISOString()};
 const roomId=cleanText(v.roomId,120),actorId=cleanText(v.actorId,120),actorName=cleanText(v.actorName,80),text=cleanText(v.text,500),currency=cleanText(v.currency,8);
 if(roomId)e.roomId=roomId;if(actorId)e.actorId=actorId;if(actorName)e.actorName=actorName;if(text)e.text=text;
 if(typeof v.amount==='number'&&Number.isFinite(v.amount)&&v.amount>=0&&v.amount<=1000000)e.amount=v.amount;
 if(currency&&/^[A-Z]{3}$/.test(currency))e.currency=currency; const tags=safeTags(v.tags);if(tags)e.tags=tags;
 if(e.type==='chat.message'&&!e.text)return null;return e;
}
export type LiveBridgeCommand={commandId:string;action:'scene.set';sceneName:string}|{commandId:string;action:'host.speak';text:string};
/** Restrict remote execution to the two actions the local companion can actually approve and confirm. */
export function normalizeLiveBridgeCommand(input:unknown):LiveBridgeCommand|null {
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const v=input as Record<string,unknown>;
 if(typeof v.commandId!=='string'||!EVENT_ID.test(v.commandId))return null;
 if(v.action==='scene.set'){const sceneName=cleanText(v.sceneName,80);return sceneName?{commandId:v.commandId,action:'scene.set',sceneName}:null;}
 if(v.action==='host.speak'){const text=cleanText(v.text,500);return text?{commandId:v.commandId,action:'host.speak',text}:null;}
 return null;
}

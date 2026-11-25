import { randomUUID } from 'node:crypto';

const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const LOOPBACK_ENDPOINT='http://127.0.0.1:3219/api/integrations/game/event';
const CONTROL=/[\u0000-\u001f\u007f]/g;
const clean=(value,max)=>typeof value==='string'?value.replace(CONTROL,' ').trim().slice(0,max):'';

/**
 * Send a small, authenticated game/app event to the local Magnanimous Creator.
 * This adapter is event-only: it never reads game memory, injects input or controls gameplay.
 * The destination is deliberately fixed to loopback; callers cannot redirect the bearer token.
 */
export async function sendLocalGameEvent({token,gameName,actorName='Game integration',text,eventId=randomUUID(),occurredAt=new Date().toISOString()},{fetchImpl=globalThis.fetch,timeoutMs=3000}={}) {
 if(typeof token!=='string'||!TOKEN.test(token))throw new Error('A current 256-bit local game integration token is required.');
 const safeText=clean(text,500),safeGame=clean(gameName,80),safeActor=clean(actorName,48);
 if(!safeText)throw new Error('A short game event description is required.');
 if(typeof eventId!=='string'||!/^[A-Za-z0-9._:-]{1,160}$/.test(eventId))throw new Error('The event ID is invalid.');
 if(typeof occurredAt!=='string'||!Number.isFinite(Date.parse(occurredAt))||Math.abs(Date.now()-Date.parse(occurredAt))>7*86400000)throw new Error('The event timestamp is invalid or too old.');
 if(typeof fetchImpl!=='function')throw new Error('This runtime does not provide a fetch implementation.');
 const event={protocolVersion:1,eventId,occurredAt,gameName:safeGame,actorName:safeActor||'Game integration',text:safeText};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(500,Math.min(10000,timeoutMs)));
 try {
  const response=await fetchImpl(LOOPBACK_ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify(event),signal:controller.signal,redirect:'error'});
  if(!response.ok){let detail='The local Creator rejected the game event ('+response.status+').';try{const body=await response.json();if(typeof body.detail==='string')detail=body.detail.slice(0,240);}catch{}throw new Error(detail);}
  return await response.json();
 } catch(error) {
  if(error?.name==='AbortError')throw new Error('The local Creator did not respond before the game event timed out.');
  throw error;
 } finally {clearTimeout(timer);}
}

export const LOCAL_GAME_EVENT_ENDPOINT=LOOPBACK_ENDPOINT;

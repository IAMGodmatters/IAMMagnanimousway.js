import { normalizeLiveBridgeCommand, normalizeLiveEvent, type LiveBridgeCommand, type LiveEvent } from './event-contract';
export type LiveBridgeStatus='connecting'|'connected'|'reconnecting'|'disconnected'|'error';
export type LiveCommandReceiptStatus='received'|'approved'|'rejected'|'completed'|'failed';
export type LiveBridgeCommandReceipt={commandId:string;status:LiveCommandReceiptStatus};
export type LiveBridgeHandlers={onStatus?:(status:LiveBridgeStatus)=>void;onEvent?:(event:LiveEvent)=>void;onCommandReceipt?:(receipt:LiveBridgeCommandReceipt)=>void;onError?:(message:string)=>void};
type Envelope={kind:'event';event:unknown}|{kind:'ready';protocolVersion:1}|{kind:'command.receipt';protocolVersion:1;receipt:unknown}|{kind:'error';code?:string;message?:string}|{kind:'pong'};
function validBridgeUrl(raw:string):URL {
 let url:URL;try{url=new URL(raw);}catch{throw new Error('Enter a valid secure Magnanimous bridge address.');}
 const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 const local=url.protocol==='ws:'&&loopback&&!url.port?.includes('0')&&!url.username&&!url.password&&!url.search&&!url.hash;
 const remote=url.protocol==='wss:'&&url.hostname==='iammagnanimousway.com'&&(!url.port||url.port==='443')&&/^\/api\/live-bridge\/ws\/[0-9a-f-]{36}$/i.test(url.pathname)&&!url.username&&!url.password&&!url.search&&!url.hash;
 if(!local&&!remote)throw new Error('Use the official wss://iammagnanimousway.com live-bridge address, or ws:// only for a local loopback companion.');
 return url;
}
/** Pairing credentials stay in memory; the companion must bind the token to one tenant and approved adapters. */
export function createLiveBridgeClient(endpoint:string,pairingToken:string,handlers:LiveBridgeHandlers={}) {
 const url=validBridgeUrl(endpoint),token=pairingToken.trim();if(token.length<16||token.length>512)throw new Error('The one-time pairing token must contain 16–512 characters.');
 let socket:WebSocket|null=null,retryTimer:ReturnType<typeof setTimeout>|null=null,retryCount=0,stopped=false,fatal=false;
 const status=(s:LiveBridgeStatus)=>handlers.onStatus?.(s),clearRetry=()=>{if(retryTimer)clearTimeout(retryTimer);retryTimer=null;};
 const scheduleRetry=()=>{if(stopped||fatal||retryTimer)return;if(retryCount>=5){status('error');handlers.onError?.('The bridge could not reconnect after five attempts. Check the companion and reconnect manually.');return;}const delay=Math.min(15000,750*2**retryCount);retryCount++;status('reconnecting');retryTimer=setTimeout(()=>{retryTimer=null;connect();},delay);};
 const connect=()=>{if(stopped||fatal)return;status(retryCount?'reconnecting':'connecting');try{socket=new WebSocket(url.toString());}catch{status('error');handlers.onError?.('The browser could not open the bridge connection.');scheduleRetry();return;}
 socket.onopen=()=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({kind:'auth',protocolVersion:1,token}));};
 socket.onmessage=message=>{let e:Envelope;try{e=JSON.parse(String(message.data)) as Envelope;}catch{handlers.onError?.('The bridge sent an unreadable message; it was ignored.');return;}
 if(e?.kind==='ready'&&e.protocolVersion===1){retryCount=0;status('connected');return;}
 if(e?.kind==='event'){const event=normalizeLiveEvent(e.event);if(event)handlers.onEvent?.(event);else handlers.onError?.('An invalid or unsupported bridge event was ignored.');return;}
 if(e?.kind==='command.receipt'&&e.protocolVersion===1){
  const value=e.receipt as Record<string,unknown>|null;
  const statuses:LiveCommandReceiptStatus[]=['received','approved','rejected','completed','failed'];
  if(value&&typeof value.commandId==='string'&&/^[A-Za-z0-9._:-]{1,160}$/.test(value.commandId)&&statuses.includes(value.status as LiveCommandReceiptStatus)){
   handlers.onCommandReceipt?.({commandId:value.commandId,status:value.status as LiveCommandReceiptStatus});
  }else handlers.onError?.('The bridge sent an invalid command receipt; it was ignored.');
  return;
 }
 if(e?.kind==='error'){handlers.onError?.(typeof e.message==='string'?e.message.slice(0,240):'The bridge reported an error.');if(e.code==='AUTH_FAILED'||e.code==='PAIRING_REVOKED'){fatal=true;status('error');socket?.close(4001,'Pairing rejected');}}
 };
 socket.onerror=()=>handlers.onError?.('The live bridge connection encountered a network error.');
 socket.onclose=()=>{socket=null;if(!stopped&&!fatal)scheduleRetry();else status('disconnected');};
 };connect();
 return {sendCommand(input:unknown):boolean{const command:LiveBridgeCommand|null=normalizeLiveBridgeCommand(input);if(!command||!socket||socket.readyState!==WebSocket.OPEN)return false;socket.send(JSON.stringify({kind:'command',protocolVersion:1,command}));return true;},disconnect(){stopped=true;clearRetry();socket?.close(1000,'Operator disconnected');socket=null;status('disconnected');}};
}
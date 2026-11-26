import { normalizeLiveBridgeCommand, normalizeLiveEvent, type LiveBridgeCommand, type LiveEvent } from './event-contract';

export type LiveBridgeStatus='connecting'|'connected'|'reconnecting'|'disconnected'|'error';
export type LiveCommandReceiptStatus='received'|'approved'|'rejected'|'completed'|'failed';
export type LiveBridgeCommandReceipt={commandId:string;status:LiveCommandReceiptStatus};
export type LiveBridgeHandlers={
  onStatus?:(status:LiveBridgeStatus)=>void;
  onEvent?:(event:LiveEvent)=>void|Promise<void>;
  onCommandReceipt?:(receipt:LiveBridgeCommandReceipt)=>void;
  onEventReceipt?:(receipt:{provider:string;eventId:string;status:'acknowledged'})=>void;
  onError?:(message:string)=>void;
};
type Envelope=
  |{kind:'event';protocolVersion:1;event:unknown;deliveryKey?:string}
  |{kind:'event.receipt';protocolVersion:1;provider:string;eventId:string;status:'acknowledged'}
  |{kind:'command.receipt';protocolVersion:1;receipt:unknown}
  |{kind:'ready';protocolVersion:1}
  |{kind:'waiting';protocolVersion:1;detail?:string}
  |{kind:'error';code?:string;message?:string}
  |{kind:'pong'};

function validBridgeUrl(raw:string):URL {
  let url:URL;
  try{url=new URL(raw);}catch{throw new Error('Use the official Magnanimous live bridge address.');}
  const prefix='/api/live-bridge/ws/';
  if(url.protocol!=='wss:'||url.hostname!=='iammagnanimousway.com'||url.username||url.password||url.search||url.hash||!url.pathname.startsWith(prefix)||! /^[0-9a-f-]{36}$/i.test(url.pathname.slice(prefix.length))){
    throw new Error('Only the official secure Magnanimous live bridge can receive this pairing token.');
  }
  return url;
}

/** Temporary role token stays in memory. The caller owns durable event handoff and explicit acknowledgements. */
export function createLiveBridgeClient(endpoint:string,pairingToken:string,handlers:LiveBridgeHandlers={}) {
  const url=validBridgeUrl(endpoint),token=pairingToken.trim();
  if(token.length<32||token.length>256)throw new Error('The one-time pairing token is invalid.');
  let socket:WebSocket|null=null,retryTimer:ReturnType<typeof setTimeout>|null=null,retryCount=0,stopped=false,fatal=false;
  const status=(value:LiveBridgeStatus)=>handlers.onStatus?.(value);
  const clearRetry=()=>{if(retryTimer)clearTimeout(retryTimer);retryTimer=null;};
  const scheduleRetry=()=>{
    if(stopped||fatal||retryTimer)return;
    if(retryCount>=5){status('error');handlers.onError?.('The bridge could not reconnect after five attempts. Check the companion and reconnect manually.');return;}
    const delay=Math.min(15000,750*2**retryCount);retryCount++;status('reconnecting');
    retryTimer=setTimeout(()=>{retryTimer=null;connect();},delay);
  };
  const send=(value:unknown):boolean=>{
    if(!socket||socket.readyState!==WebSocket.OPEN)return false;
    try{socket.send(JSON.stringify(value));return true;}catch{return false;}
  };
  const connect=()=>{
    if(stopped||fatal)return;
    status(retryCount?'reconnecting':'connecting');
    try{socket=new WebSocket(url.toString());}
    catch{status('error');handlers.onError?.('The browser could not open the bridge connection.');scheduleRetry();return;}
    const active=socket;
    active.onopen=()=>{if(active.readyState===WebSocket.OPEN)active.send(JSON.stringify({kind:'auth',protocolVersion:1,token}));};
    active.onmessage=message=>{
      if(socket!==active)return;
      let envelope:Envelope;
      try{envelope=JSON.parse(String(message.data)) as Envelope;}
      catch{handlers.onError?.('The bridge sent an unreadable message; it was ignored.');return;}
      if(envelope?.kind==='ready'&&envelope.protocolVersion===1){retryCount=0;status('connected');return;}
      if(envelope?.kind==='waiting'&&envelope.protocolVersion===1){status('connecting');return;}
      if(envelope?.kind==='event'&&envelope.protocolVersion===1){
        const event=normalizeLiveEvent(envelope.event);
        if(!event){handlers.onError?.('An invalid or unsupported bridge event was ignored and not acknowledged.');return;}
        Promise.resolve().then(()=>handlers.onEvent?.(event)).then(()=>{
          if(socket===active)send({kind:'event.ack',protocolVersion:1,provider:event.provider,eventId:event.eventId});
        }).catch(error=>{
          handlers.onError?.(error instanceof Error?error.message:'The browser could not persist the incoming event; the relay will retry it.');
        });
        return;
      }
      if(envelope?.kind==='event.receipt'&&envelope.protocolVersion===1&&envelope.status==='acknowledged'){
        handlers.onEventReceipt?.({provider:envelope.provider,eventId:envelope.eventId,status:'acknowledged'});
        return;
      }
      if(envelope?.kind==='command.receipt'&&envelope.protocolVersion===1){
        const receipt=envelope.receipt as Record<string,unknown>|null;
        const statuses:LiveCommandReceiptStatus[]=['received','approved','rejected','completed','failed'];
        if(receipt&&typeof receipt.commandId==='string'&&statuses.includes(receipt.status as LiveCommandReceiptStatus)){
          handlers.onCommandReceipt?.({commandId:receipt.commandId,status:receipt.status as LiveCommandReceiptStatus});
        }
        return;
      }
      if(envelope?.kind==='error'){
        handlers.onError?.(typeof envelope.message==='string'?envelope.message.slice(0,240):'The bridge reported an error.');
        if(envelope.code==='AUTH_FAILED'||envelope.code==='PAIRING_REVOKED'){fatal=true;status('error');active.close(4001,'Pairing rejected');}
      }
    };
    active.onerror=()=>{if(socket===active)handlers.onError?.('The live bridge connection encountered a network error.');};
    active.onclose=()=>{if(socket===active)socket=null;if(!stopped&&!fatal)scheduleRetry();else status('disconnected');};
  };
  connect();
  return {
    sendCommand(input:unknown):boolean{
      const command:LiveBridgeCommand|null=normalizeLiveBridgeCommand(input);
      return command?send({kind:'command',protocolVersion:1,command}):false;
    },
    ackEvent(provider:LiveEvent['provider'],eventId:string):boolean{
      if(typeof eventId!=='string'||! /^[A-Za-z0-9._:-]{1,160}$/.test(eventId))return false;
      return send({kind:'event.ack',protocolVersion:1,provider,eventId});
    },
    disconnect(){
      stopped=true;clearRetry();
      const active=socket;socket=null;
      try{active?.close(1000,'Operator disconnected');}catch{}
      status('disconnected');
    }
  };
}

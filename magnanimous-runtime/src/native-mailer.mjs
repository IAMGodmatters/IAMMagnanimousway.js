import dns from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import crypto from "node:crypto";

const now=()=>Math.floor(Date.now()/1000);
const clean=value=>String(value??"").trim();
const yes=value=>["1","true","yes","on"].includes(clean(value).toLowerCase());
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
const domainOf=value=>clean(value).split("@").pop()?.toLowerCase()||"";
const header=value=>clean(value).replace(/[\r\n]+/g," ");
const b64=value=>Buffer.from(String(value),"utf8").toString("base64");

function config(env=process.env){
  const relayHost=clean(env.MAGNANIMOUS_SMTP_HOST);
  const directMx=yes(env.MAGNANIMOUS_MAIL_DIRECT_MX);
  return{
    relayHost,
    relayPort:Math.max(1,Math.min(65535,Number(env.MAGNANIMOUS_SMTP_PORT||587))),
    relaySecure:yes(env.MAGNANIMOUS_SMTP_SECURE),
    relayStartTls:String(env.MAGNANIMOUS_SMTP_STARTTLS??"true").toLowerCase()!=="false",
    relayUser:clean(env.MAGNANIMOUS_SMTP_USER),
    relayPassword:String(env.MAGNANIMOUS_SMTP_PASSWORD||""),
    directMx,
    fromAddress:clean(env.MAGNANIMOUS_MAIL_FROM||"Godmattersinc@iammagnanimousway.com"),
    fromName:header(env.MAGNANIMOUS_MAIL_FROM_NAME||"I AM MAGNANIMOUS WAY"),
    helo:clean(env.MAGNANIMOUS_MAIL_HELO||"mail.iammagnanimousway.com"),
    timeoutMs:Math.max(3000,Math.min(30000,Number(env.MAGNANIMOUS_SMTP_TIMEOUT_MS||12000)))
  };
}

function sha(value){return crypto.createHash("sha256").update(String(value)).digest("hex")}

function mime(cfg,message){
  const boundary="magnanimous-"+crypto.randomBytes(10).toString("hex");
  const lines=[
    "From: "+(cfg.fromName?cfg.fromName+" <"+cfg.fromAddress+">":"<"+cfg.fromAddress+">"),
    "To: <"+message.to+">",
    "Subject: "+header(message.subject),
    "Date: "+new Date().toUTCString(),
    "Message-ID: <"+crypto.randomUUID()+"@"+domainOf(cfg.fromAddress)+">",
    "MIME-Version: 1.0"
  ];
  if(message.replyTo&&validEmail(message.replyTo))lines.push("Reply-To: <"+message.replyTo+">");
  if(message.html){
    lines.push('Content-Type: multipart/alternative; boundary="'+boundary+'"');
    return lines.join("\r\n")+"\r\n\r\n"
      +"--"+boundary+"\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n"+String(message.text||"")+"\r\n"
      +"--"+boundary+"\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n"+String(message.html)+"\r\n"
      +"--"+boundary+"--\r\n";
  }
  lines.push("Content-Type: text/plain; charset=UTF-8");
  return lines.join("\r\n")+"\r\n\r\n"+String(message.text||"")+"\r\n";
}

class Reader{
  constructor(socket,timeoutMs){
    this.socket=socket;this.buffer="";this.lines=[];this.queue=[];this.waiters=[];this.error=null;
    socket.setTimeout(timeoutMs,()=>socket.destroy(new Error("SMTP timed out.")));
    socket.on("data",chunk=>this.consume(chunk));
    socket.on("error",error=>this.fail(error));
    socket.on("close",()=>this.fail(new Error("SMTP connection closed.")));
  }
  consume(chunk){
    this.buffer+=chunk.toString("utf8");
    for(;;){
      const i=this.buffer.indexOf("\n");if(i<0)break;
      const line=this.buffer.slice(0,i+1).replace(/\r?\n$/,"");this.buffer=this.buffer.slice(i+1);
      this.lines.push(line);
      if(/^\d{3} /.test(line)){
        const response={code:Number(line.slice(0,3)),lines:this.lines.splice(0)};
        const waiter=this.waiters.shift();if(waiter)waiter.resolve(response);else this.queue.push(response);
      }
    }
  }
  fail(error){
    if(this.error)return;this.error=error;
    while(this.waiters.length)this.waiters.shift().reject(error);
  }
  read(){
    if(this.queue.length)return Promise.resolve(this.queue.shift());
    if(this.error)return Promise.reject(this.error);
    return new Promise((resolve,reject)=>this.waiters.push({resolve,reject}));
  }
  async command(line,allowed){
    if(line!=null)this.socket.write(String(line)+"\r\n");
    const response=await this.read();
    if(!allowed.includes(response.code))throw new Error("SMTP "+response.code+": "+response.lines.join(" | ").slice(0,500));
    return response;
  }
}

function openSocket(host,port,secure,timeoutMs){
  return new Promise((resolve,reject)=>{
    const socket=secure
      ?tls.connect({host,port,servername:host,rejectUnauthorized:true,minVersion:"TLSv1.2"})
      :net.connect({host,port});
    const event=secure?"secureConnect":"connect";
    const timer=setTimeout(()=>socket.destroy(new Error("SMTP connect timed out.")),timeoutMs);
    socket.once(event,()=>{clearTimeout(timer);resolve(socket)});
    socket.once("error",error=>{clearTimeout(timer);reject(error)});
  });
}

async function ehlo(reader,helo){
  try{return await reader.command("EHLO "+helo,[250])}
  catch{return await reader.command("HELO "+helo,[250])}
}

async function upgrade(reader,host,cfg){
  await reader.command("STARTTLS",[220]);
  const socket=await new Promise((resolve,reject)=>{
    const secure=tls.connect({socket:reader.socket,servername:host,rejectUnauthorized:true,minVersion:"TLSv1.2"});
    const timer=setTimeout(()=>secure.destroy(new Error("SMTP TLS handshake timed out.")),cfg.timeoutMs);
    secure.once("secureConnect",()=>{clearTimeout(timer);resolve(secure)});
    secure.once("error",error=>{clearTimeout(timer);reject(error)});
  });
  return new Reader(socket,cfg.timeoutMs);
}

async function smtpSend(cfg,message,target){
  let reader=new Reader(await openSocket(target.host,target.port,target.secure,cfg.timeoutMs),cfg.timeoutMs);
  try{
    await reader.command(null,[220]);
    let hello=await ehlo(reader,cfg.helo);
    let caps=hello.lines.join("\n").toUpperCase();
    if(!target.secure&&caps.includes("STARTTLS")){
      reader=await upgrade(reader,target.host,cfg);
      hello=await ehlo(reader,cfg.helo);
      caps=hello.lines.join("\n").toUpperCase();
    }else if(!target.secure&&target.requireStartTls){
      throw new Error("SMTP server did not offer STARTTLS.");
    }
    if(target.user){
      if(!target.password)throw new Error("SMTP password is missing.");
      if(caps.includes("PLAIN")){
        await reader.command("AUTH PLAIN "+b64("\u0000"+target.user+"\u0000"+target.password),[235]);
      }else{
        await reader.command("AUTH LOGIN",[334]);
        await reader.command(b64(target.user),[334]);
        await reader.command(b64(target.password),[235]);
      }
    }
    await reader.command("MAIL FROM:<"+cfg.fromAddress+">",[250]);
    await reader.command("RCPT TO:<"+message.to+">",[250,251]);
    await reader.command("DATA",[354]);
    const raw=mime(cfg,message).replace(/^\./gm,"..").replace(/\r?\n/g,"\r\n").replace(/\r\n$/,"");
    reader.socket.write(raw+"\r\n.\r\n");
    const accepted=await reader.read();
    if(accepted.code!==250)throw new Error("SMTP "+accepted.code+": "+accepted.lines.join(" | ").slice(0,500));
    try{await reader.command("QUIT",[221,250])}catch{}
    return{ok:true,receipt:(accepted.lines.at(-1)||"smtp-accepted").slice(0,240)};
  }finally{
    try{reader.socket.end()}catch{}
  }
}

async function directMx(cfg,message){
  const mx=(await dns.resolveMx(domainOf(message.to))).sort((a,b)=>a.priority-b.priority).slice(0,4);
  if(!mx.length)throw new Error("Recipient domain has no MX record.");
  let last;
  for(const item of mx){
    try{
      const result=await smtpSend(cfg,message,{host:item.exchange,port:25,secure:false,requireStartTls:false,user:"",password:""});
      return{...result,provider:"magnanimous-direct-mx"};
    }catch(error){last=error}
  }
  throw last||new Error("Direct MX delivery failed.");
}

export class MagnanimousNativeMailer{
  constructor({db,env=process.env}={}){
    this.db=db;this.cfg=config(env);
    this.mode=this.cfg.relayHost?"smtp-relay":this.cfg.directMx?"direct-mx":"unconfigured";
    this.configured=Boolean(validEmail(this.cfg.fromAddress)&&(this.cfg.relayHost||this.cfg.directMx));
  }
  status(){
    return{configured:this.configured,mode:this.mode,from_address:this.cfg.fromAddress,helo:this.cfg.helo,direct_mx:this.cfg.directMx,relay_host:this.cfg.relayHost||null,relay_port:this.cfg.relayHost?this.cfg.relayPort:null};
  }
  async audit(id,message,status,provider="",error=""){
    if(!this.db)return;
    const t=now(),sensitive=message.sensitive?1:0;
    await this.db.prepare("INSERT INTO magnanimous_mail_outbox(id,kind,to_address,from_address,subject,sensitive,status,provider,attempts,last_error,created_at,updated_at,sent_at) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,provider=excluded.provider,attempts=magnanimous_mail_outbox.attempts+1,last_error=excluded.last_error,updated_at=excluded.updated_at,sent_at=excluded.sent_at")
      .bind(id,String(message.kind||"transactional").slice(0,80),message.to,this.cfg.fromAddress,header(message.subject).slice(0,998),sensitive,status,String(provider||""),String(error||"").slice(0,1000),t,t,status==="sent"?t:null).run();
  }
  async send(message={}){
    const to=clean(message.to),subject=header(message.subject);
    if(!validEmail(to))return{ok:false,code:"MAGNANIMOUS_MAIL_INVALID_RECIPIENT"};
    if(!subject)return{ok:false,code:"MAGNANIMOUS_MAIL_INVALID_SUBJECT"};
    if(!this.configured)return{ok:false,code:"MAGNANIMOUS_MAIL_NOT_CONFIGURED"};
    const id="mail_"+sha(message.idempotencyKey||crypto.randomUUID()).slice(0,48);
    if(this.db){
      const prior=await this.db.prepare("SELECT status,provider FROM magnanimous_mail_outbox WHERE id=?").bind(id).first();
      if(prior?.status==="sent")return{ok:true,provider:prior.provider||"magnanimous-native",receipt:id,deduplicated:true};
    }
    const payload={...message,to,subject};
    try{
      const delivered=this.cfg.relayHost
        ?await smtpSend(this.cfg,payload,{host:this.cfg.relayHost,port:this.cfg.relayPort,secure:this.cfg.relaySecure,requireStartTls:!this.cfg.relaySecure&&this.cfg.relayStartTls,user:this.cfg.relayUser,password:this.cfg.relayPassword})
        :await directMx(this.cfg,payload);
      const provider=this.cfg.relayHost?"magnanimous-native-smtp":delivered.provider;
      await this.audit(id,payload,"sent",provider,"");
      return{ok:true,provider,receipt:delivered.receipt||id};
    }catch(error){
      await this.audit(id,payload,"failed","",String(error?.message||error));
      return{ok:false,code:"MAGNANIMOUS_MAIL_DELIVERY_FAILED",error:String(error?.message||error||"Native mail delivery failed.")};
    }
  }
}

export function openMagnanimousMailer(options){return new MagnanimousNativeMailer(options)}

import {hasGrowthEmailSender,sendGrowthEmail} from './growth-email-transport.js';

const clean=value=>String(value??'').trim();
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
const now=()=>Math.floor(Date.now()/1000);
const enabled=value=>['1','true','yes','on'].includes(clean(value).toLowerCase());

async function sha256Hex(value){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function audit(env,id,message,status,provider='',error=''){
  if(!env?.DB)return;
  const t=now();
  try{
    await env.DB.prepare(`INSERT INTO magnanimous_mail_outbox(
      id,kind,to_address,from_address,subject,sensitive,status,provider,attempts,last_error,created_at,updated_at,sent_at
    ) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status,provider=excluded.provider,attempts=magnanimous_mail_outbox.attempts+1,
      last_error=excluded.last_error,updated_at=excluded.updated_at,sent_at=excluded.sent_at`)
      .bind(
        id,
        clean(message.kind||'transactional').slice(0,80),
        clean(message.to).slice(0,320),
        clean(env.MAGNANIMOUS_MAIL_FROM||'Godmattersinc@iammagnanimousway.com').slice(0,320),
        clean(message.subject).replace(/[\r\n]+/g,' ').slice(0,998),
        message.sensitive?1:0,
        status,
        clean(provider).slice(0,120),
        clean(error).slice(0,1000),
        t,t,status==='sent'?t:null
      ).run();
  }catch(err){
    console.warn('Magnanimous mail audit unavailable',String(err?.message||err).slice(0,240));
  }
}

function mailerFor(env,{cloudflareReady=false,connectedReady=false}={}){
  const binding=cloudflareReady&&env?.MAGNANIMOUS_EMAIL&&typeof env.MAGNANIMOUS_EMAIL.send==='function'?env.MAGNANIMOUS_EMAIL:null;
  if(!binding&&!connectedReady)return null;
  const fromAddress=clean(env.MAGNANIMOUS_MAIL_FROM||'Godmattersinc@iammagnanimousway.com');
  const fromName=clean(env.MAGNANIMOUS_MAIL_FROM_NAME||'I AM MAGNANIMOUS WAY');
  return{
    provider:binding?'cloudflare-email-service':'connected-email-https',
    configured:validEmail(fromAddress),
    async send(message={}){
      const to=clean(message.to),subject=clean(message.subject).replace(/[\r\n]+/g,' ');
      if(!validEmail(to))return{ok:false,code:'MAGNANIMOUS_MAIL_INVALID_RECIPIENT'};
      if(!subject)return{ok:false,code:'MAGNANIMOUS_MAIL_INVALID_SUBJECT'};
      if(!validEmail(fromAddress))return{ok:false,code:'MAGNANIMOUS_MAIL_INVALID_SENDER'};
      const id='mail_'+(await sha256Hex(message.idempotencyKey||crypto.randomUUID())).slice(0,48);
      if(env?.DB){
        try{
          const prior=await env.DB.prepare('SELECT status,provider FROM magnanimous_mail_outbox WHERE id=?').bind(id).first();
          if(prior?.status==='sent')return{ok:true,provider:prior.provider||'magnanimous-mail',receipt:id,deduplicated:true};
        }catch(_){}
      }

      let cloudflareFailure=null;
      if(binding){
        try{
          const payload={
            to,
            from:fromName?{email:fromAddress,name:fromName}:fromAddress,
            subject,
            text:String(message.text||''),
            html:String(message.html||'')
          };
          if(validEmail(message.replyTo))payload.replyTo=clean(message.replyTo);
          const result=await binding.send(payload);
          const receipt=clean(result?.messageId||id);
          await audit(env,id,{...message,to,subject},'sent','cloudflare-email-service','');
          return{ok:true,provider:'cloudflare-email-service',receipt};
        }catch(error){
          cloudflareFailure={code:clean(error?.code||'CLOUDFLARE_EMAIL_DELIVERY_FAILED'),error:clean(error?.message||error||'Email delivery failed.')};
          await audit(env,id,{...message,to,subject},'failed','cloudflare-email-service',`${cloudflareFailure.code}: ${cloudflareFailure.error}`);
        }
      }

      if(connectedReady){
        try{
          const fallback=await sendGrowthEmail(env,{
            scopeTenantId:'__platform__',to,subject,text:String(message.text||''),
            replyTo:validEmail(message.replyTo)?clean(message.replyTo):'',senderName:fromName
          });
          if(fallback?.ok){
            await audit(env,id,{...message,to,subject},'sent','connected-email-https','');
            return{ok:true,provider:'connected-email-https',receipt:clean(fallback.receipt||id),fallback_from:binding?'cloudflare-email-service':''};
          }
          const code=clean(fallback?.code||'CONNECTED_EMAIL_DELIVERY_FAILED');
          const error=clean(fallback?.error||'Connected email delivery failed.');
          await audit(env,id,{...message,to,subject},'failed','connected-email-https',`${code}: ${error}`);
          return{ok:false,code,error};
        }catch(error){
          const detail=clean(error?.message||error||'Connected email delivery failed.');
          await audit(env,id,{...message,to,subject},'failed','connected-email-https',detail);
          return{ok:false,code:'CONNECTED_EMAIL_EXCEPTION',error:detail};
        }
      }

      return cloudflareFailure?{ok:false,...cloudflareFailure}:{ok:false,code:'MAGNANIMOUS_MAIL_NOT_CONFIGURED',error:'No free connected email sender is available.'};
    }
  };
}

export async function withCloudflareNativeMail(env){
  if(!env||env.MAGNANIMOUS_MAIL)return env;
  const cloudflareReady=enabled(env.MAGNANIMOUS_MAIL_DELIVERY_AVAILABLE)&&Boolean(env?.MAGNANIMOUS_EMAIL&&typeof env.MAGNANIMOUS_EMAIL.send==='function');
  const connectedReady=await hasGrowthEmailSender(env,'__platform__').catch(()=>false);
  const mailer=mailerFor(env,{cloudflareReady,connectedReady});
  if(!mailer)return{...env,MAGNANIMOUS_MAIL_DELIVERY_AVAILABLE:'false'};
  return{
    ...env,
    MAGNANIMOUS_MAIL:mailer,
    MAGNANIMOUS_MAIL_DELIVERY_AVAILABLE:'true'
  };
}

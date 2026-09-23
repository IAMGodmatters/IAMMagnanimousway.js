import crypto from 'node:crypto';
import { openMagnanimousDb } from '../src/d1-compat.mjs';

const origin=String(process.env.MAGNANIMOUS_SMOKE_ORIGIN||'http://127.0.0.1:8788').replace(/\/$/,'');
const dbPath=String(process.env.MAGNANIMOUS_DB_PATH||'/app/data/iam-magnanimous.sqlite');
const unique=Date.now().toString(36)+'-'+crypto.randomUUID().slice(0,8);
const email=`agency-paid-smoke-${unique}@example.invalid`;
const password='Magnanimous-Smoke-Only-2026!'+unique;
let token='';
let tenantId='';

async function call(path,{method='GET',body,expected=[200],auth=true}={}){
  const headers={'accept':'application/json'};
  if(body!==undefined)headers['content-type']='application/json';
  if(auth&&token)headers.authorization=`Bearer ${token}`;
  const response=await fetch(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data={raw:text}}
  if(!expected.includes(response.status))throw new Error(`${method} ${path} -> HTTP ${response.status}: ${text.slice(0,800)}`);
  return data;
}

const signup=await call('/api/auth/signup',{
  method:'POST',auth:false,expected:[201],
  body:{name:'Agency Paid Depth Smoke',email,password,workspace:'Agency Paid Depth Smoke'}
});
token=String(signup?.token||'');
tenantId=String(signup?.user?.tenant_id||'');
if(!token||!tenantId)throw new Error('Standalone Agency smoke signup did not return token and tenant.');

const db=openMagnanimousDb(dbPath);
try{
  const ts=Math.floor(Date.now()/1000);
  await db.prepare(`INSERT INTO billing_subscriptions(tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(tenant_id) DO UPDATE SET plan=excluded.plan,status='active',updated_at=excluded.updated_at`)
    .bind(tenantId,'agency',null,null,'active',null,ts,ts).run();
  try{await db.prepare("UPDATE tenants SET plan='agency' WHERE id=?").bind(tenantId).run()}catch{}

  const billing=await call('/api/billing/status');
  if(billing?.plan!=='agency'||billing?.white_label_enabled!==true||Number(billing?.managed_client_limit)!==25||billing?.usage_rebilling!==true){
    throw new Error('Agency billing entitlement did not activate expected White Label capabilities: '+JSON.stringify(billing));
  }

  const client=await call('/api/bpo/clients',{method:'POST',expected:[201],body:{name:'Standalone Agency Smoke Client',industry:'QA',service_lines:['Customer Service','Marketing']}});
  const clientId=String(client?.id||'');if(!clientId)throw new Error('Agency client creation returned no id.');

  await call(`/api/agency/clients/${encodeURIComponent(clientId)}/settings`,{method:'PUT',body:{brand_name:'Standalone Smoke Brand',accent_color:'#22c55e',white_label_enabled:true,monthly_platform_fee_usd:25,default_markup_percent:20}});

  const apps=await call(`/api/white-label-os/client-apps?client_id=${encodeURIComponent(clientId)}`);
  const catalog=Array.isArray(apps?.apps)?apps.apps:[];
  if(catalog.length<1)throw new Error('Client Apps catalog is empty.');
  const selected=catalog.map(app=>({...app,enabled:['branded-ai','crm','inbox','booking','funnel','automations','work-engine','business-ai:sticky-notes'].includes(app.app_id)}));
  await call(`/api/white-label-os/client-apps?client_id=${encodeURIComponent(clientId)}`,{method:'PUT',body:{apps:selected}});

  const now=Math.floor(Date.now()/1000);
  await call('/api/agency/bookings',{method:'POST',expected:[201],body:{client_id:clientId,contact_name:'Standalone Smoke Booking',contact_email:email,service:'Consultation',start_at:now+3600,end_at:now+5400}});

  await call('/api/agency/reputation',{method:'POST',expected:[201],body:{client_id:clientId,source:'isolated-smoke',customer_name:'Standalone Reviewer',rating:5,review_text:'Great service.'}});

  const usage=await call('/api/agency/usage',{method:'POST',expected:[201],body:{client_id:clientId,period:'2026-09',category:'Standalone smoke usage',units:2,cost_usd:1,markup_percent:20}});
  if(Number(usage?.customer_charge_usd)!==1.2)throw new Error('Agency usage rebilling math failed: '+JSON.stringify(usage));

  const automation=await call('/api/agency/automations',{method:'POST',expected:[201],body:{client_id:clientId,name:'Standalone Work Automation',trigger_type:'manual',action_type:'create-work',action_config:{title:'Standalone automated work',goal:'Verify isolated Agency automation to Work Engine.'},status:'active'}});
  const automationId=String(automation?.id||'');if(!automationId)throw new Error('Agency automation creation returned no id.');
  const run=await call(`/api/agency/automations/${encodeURIComponent(automationId)}/run`,{method:'POST',body:{payload:{subject:'Standalone manual run'}}});
  if(run?.ok!==true||!run?.work_id)throw new Error('Agency automation did not create durable work: '+JSON.stringify(run));

  const inbox=await call('/api/inbox/capture',{method:'POST',expected:[201],body:{client_id:clientId,channel:'email',source:'isolated-smoke',customer_name:'Standalone Inbox Smoke',subject:'White Label inbox smoke',content:'Inbound isolated smoke message',priority:80}});
  const threadId=String(inbox?.id||'');if(!threadId)throw new Error('Unified Inbox capture returned no thread id.');
  const messages=await call(`/api/inbox/threads/${encodeURIComponent(threadId)}/messages`);
  if(!Array.isArray(messages?.messages)||messages.messages.length!==1)throw new Error('Unified Inbox message persistence failed.');

  const project=await call('/api/white-label-os/projects',{method:'POST',expected:[201],body:{client_id:clientId,name:'Standalone Smoke Project',status:'planned',owner:'QA'}});
  const projectId=String(project?.id||'');if(!projectId)throw new Error('White Label Studio project creation returned no id.');
  await call(`/api/white-label-os/projects/${encodeURIComponent(projectId)}`,{method:'PATCH',body:{status:'working',owner:'Smoke Owner'}});
  await call(`/api/white-label-os/projects/${encodeURIComponent(projectId)}`,{method:'DELETE'});

  const brain=await call('/api/white-label/brain/status');
  if(brain?.access!==true||brain?.plan!=='agency')throw new Error('White Label brain did not honor Agency entitlement: '+JSON.stringify(brain));

  await call(`/api/bpo/clients/${encodeURIComponent(clientId)}`,{method:'PATCH',body:{status:'archived'}});
  await call(`/api/bpo/clients/${encodeURIComponent(clientId)}`,{method:'PATCH',body:{status:'active'}});

  console.log('Isolated paid Agency depth smoke PASS: entitlement, client workspace, branding, Client Apps, booking, reputation, rebilling, automation→Work Engine, Unified Inbox, Studio CRUD, brain access and client lifecycle.');
}finally{
  db.close();
}

const now=()=>Math.floor(Date.now()/1000);
const clip=(value,n=5000)=>String(value??'').slice(0,n);
const uid=prefix=>`${prefix}_${crypto.randomUUID()}`;

function normalized(value){
  if(value===null||value===undefined)return value??null;
  if(Array.isArray(value))return value.map(normalized);
  if(typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort())out[key]=normalized(value[key]);
    return out;
  }
  if(typeof value==='number'&&!Number.isFinite(value))return String(value);
  return value;
}

export function canonicalReceiptJson(value){
  return JSON.stringify(normalized(value));
}

async function sha256(value){
  const bytes=new TextEncoder().encode(String(value??''));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function hmacSha256(secret,value){
  const raw=new TextEncoder().encode(String(secret||''));
  const key=await crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(String(value??'')));
  return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export async function ensureBrowserReceiptSchema(env){
  if(!env?.DB)return false;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_browser_receipts(
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    occurred_at INTEGER NOT NULL,
    previous_chain_hash TEXT NOT NULL DEFAULT '',
    content_hash TEXT NOT NULL,
    chain_hash TEXT NOT NULL UNIQUE,
    signature TEXT NOT NULL DEFAULT '',
    signature_alg TEXT NOT NULL DEFAULT '',
    signing_state TEXT NOT NULL DEFAULT 'unsigned',
    receipt_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_browser_receipts_tenant_device_created ON magnanimous_browser_receipts(tenant_id,device_id,created_at DESC)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_browser_receipts_task ON magnanimous_browser_receipts(task_id)').run();
  return true;
}

function publicReceipt(row){
  if(!row)return null;
  return{
    id:row.id,
    task_id:row.task_id,
    device_id:row.device_id,
    action:row.action,
    status:row.status,
    occurred_at:Number(row.occurred_at||0),
    previous_chain_hash:row.previous_chain_hash||'',
    content_hash:row.content_hash||'',
    chain_hash:row.chain_hash||'',
    signature:row.signature||'',
    signature_alg:row.signature_alg||'',
    signing_state:row.signing_state||'unsigned',
    tamper_evident:true,
    signed:Boolean(row.signature),
    created_at:Number(row.created_at||0)
  };
}

export async function createBrowserTaskReceipt(env,task,{status,result,error,completed_at}={}){
  if(!env?.DB||!task?.id||!task?.tenant_id||!task?.device_id)return null;
  await ensureBrowserReceiptSchema(env);
  const existing=await env.DB.prepare('SELECT * FROM magnanimous_browser_receipts WHERE task_id=? AND tenant_id=?').bind(String(task.id),String(task.tenant_id)).first();
  if(existing)return publicReceipt(existing);

  const tenantId=String(task.tenant_id),deviceId=String(task.device_id),ts=Number(completed_at||now());
  const previous=await env.DB.prepare('SELECT chain_hash FROM magnanimous_browser_receipts WHERE tenant_id=? AND device_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(tenantId,deviceId).first();
  const previousHash=clip(previous?.chain_hash,128);
  const resultJson=canonicalReceiptJson(result??{});
  const payload={
    version:1,
    identity:'Magnanimous AI',
    receipt_type:'native-browser-task',
    tenant_id:tenantId,
    device_id:deviceId,
    task_id:String(task.id),
    action:clip(task.action,120),
    status:clip(status,40),
    risk_class:clip(task.risk_class,40),
    confirmed_at:Number(task.confirmed_at||0),
    occurred_at:ts,
    result_hash:await sha256(resultJson),
    error_hash:error?await sha256(clip(error,20000)):'',
    previous_chain_hash:previousHash
  };
  const canonical=canonicalReceiptJson(payload),contentHash=await sha256(canonical);
  const chainHash=await sha256(`${previousHash}\n${contentHash}`);
  const signingKey=clip(env.MAGNANIMOUS_RECEIPT_SIGNING_KEY,20000);
  const signature=signingKey?await hmacSha256(signingKey,chainHash):'';
  const signatureAlg=signature?'HMAC-SHA-256':'';
  const signingState=signature?'signed':'signing-key-not-configured';
  const id=uid('mbr'),created=now();
  await env.DB.prepare(`INSERT INTO magnanimous_browser_receipts(
    id,tenant_id,device_id,task_id,action,status,occurred_at,previous_chain_hash,content_hash,chain_hash,signature,signature_alg,signing_state,receipt_json,created_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    id,tenantId,deviceId,String(task.id),clip(task.action,120),clip(status,40),ts,previousHash,contentHash,chainHash,signature,signatureAlg,signingState,canonical,created
  ).run();
  return publicReceipt({id,task_id:String(task.id),device_id:deviceId,action:clip(task.action,120),status:clip(status,40),occurred_at:ts,previous_chain_hash:previousHash,content_hash:contentHash,chain_hash:chainHash,signature,signature_alg:signatureAlg,signing_state:signingState,created_at:created});
}

export async function getBrowserTaskReceipt(env,tenantId,taskId){
  if(!env?.DB||!tenantId||!taskId)return null;
  await ensureBrowserReceiptSchema(env);
  const row=await env.DB.prepare('SELECT * FROM magnanimous_browser_receipts WHERE tenant_id=? AND task_id=?').bind(String(tenantId),String(taskId)).first();
  return publicReceipt(row);
}

export async function verifyBrowserReceiptChain(env,tenantId,{device_id='',limit=200}={}){
  if(!env?.DB||!tenantId)return{ok:false,verified:0,detail:'Database and tenant are required.'};
  await ensureBrowserReceiptSchema(env);
  const deviceId=clip(device_id,160),cap=Math.max(1,Math.min(Number(limit)||200,1000));
  const rows=deviceId
    ?(await env.DB.prepare('SELECT * FROM magnanimous_browser_receipts WHERE tenant_id=? AND device_id=? ORDER BY created_at ASC,id ASC LIMIT ?').bind(String(tenantId),deviceId,cap).all())?.results||[]
    :(await env.DB.prepare('SELECT * FROM magnanimous_browser_receipts WHERE tenant_id=? ORDER BY device_id ASC,created_at ASC,id ASC LIMIT ?').bind(String(tenantId),cap).all())?.results||[];
  const previousByDevice=new Map();
  let verified=0,signatureFailures=0,chainFailures=0;
  const signingKey=clip(env.MAGNANIMOUS_RECEIPT_SIGNING_KEY,20000);
  for(const row of rows){
    const key=String(row.device_id||''),previousHash=previousByDevice.get(key)||'';
    const expectedContent=await sha256(String(row.receipt_json||''));
    const expectedChain=await sha256(`${previousHash}\n${expectedContent}`);
    if(expectedContent!==row.content_hash||expectedChain!==row.chain_hash||String(row.previous_chain_hash||'')!==previousHash)chainFailures++;
    if(row.signature){
      if(!signingKey||(await hmacSha256(signingKey,row.chain_hash))!==row.signature)signatureFailures++;
    }
    previousByDevice.set(key,String(row.chain_hash||''));verified++;
  }
  return{
    ok:chainFailures===0&&signatureFailures===0,
    verified,
    devices:[...previousByDevice.keys()].length,
    chain_failures:chainFailures,
    signature_failures:signatureFailures,
    signing_key_configured:Boolean(signingKey),
    last_chain_hashes:Object.fromEntries(previousByDevice),
    note:signingKey?'Per-device hash chains and configured HMAC signatures were verified.':'Per-device hash chains verified where intact; signatures require MAGNANIMOUS_RECEIPT_SIGNING_KEY.'
  };
}

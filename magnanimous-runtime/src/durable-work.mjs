import crypto from 'node:crypto';
const now=()=>Math.floor(Date.now()/1000);
const id=()=>crypto.randomUUID();
const sha256=value=>crypto.createHash('sha256').update(String(value??''),'utf8').digest('hex');
const hmac256=(key,value)=>crypto.createHmac('sha256',String(key)).update(String(value??''),'utf8').digest('hex');

function receiptContent(row){
  return JSON.stringify({
    subject_type:String(row.subject_type||''),
    subject_id:String(row.subject_id||''),
    action:String(row.action||''),
    detail_json:String(row.detail_json||'{}'),
    occurred_at:Number(row.occurred_at||0)
  });
}

export class MagnanimousDurableWork{
  constructor(db,{signingKey=''}={}){
    this.db=db;
    this.signingKey=String(signingKey||'');
    db.db.exec(`CREATE TABLE IF NOT EXISTS magnanimous_jobs(
      id TEXT PRIMARY KEY,queue TEXT NOT NULL,payload_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued',
      idempotency_key TEXT NOT NULL DEFAULT '',available_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,
      consumer TEXT NOT NULL DEFAULT '',attempts INTEGER NOT NULL DEFAULT 0,max_attempts INTEGER NOT NULL DEFAULT 5,
      last_error TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_magnanimous_job_idempotency ON magnanimous_jobs(queue,idempotency_key) WHERE idempotency_key!='';
    CREATE INDEX IF NOT EXISTS idx_magnanimous_job_claim ON magnanimous_jobs(queue,status,available_at,lease_until);
    CREATE TABLE IF NOT EXISTS magnanimous_workflows(
      id TEXT PRIMARY KEY,name TEXT NOT NULL,idempotency_key TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'running',
      input_json TEXT NOT NULL DEFAULT '{}',state_json TEXT NOT NULL DEFAULT '{}',output_json TEXT NOT NULL DEFAULT '{}',
      error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,completed_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_magnanimous_workflow_idempotency ON magnanimous_workflows(name,idempotency_key) WHERE idempotency_key!='';
    CREATE TABLE IF NOT EXISTS magnanimous_work_receipts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      action TEXT NOT NULL,
      detail_json TEXT NOT NULL DEFAULT '{}',
      occurred_at INTEGER NOT NULL,
      previous_chain_hash TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL,
      chain_hash TEXT NOT NULL,
      signature TEXT NOT NULL DEFAULT '',
      signature_algorithm TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_magnanimous_work_receipt_subject ON magnanimous_work_receipts(subject_type,subject_id,id);
    CREATE INDEX IF NOT EXISTS idx_magnanimous_work_receipt_action ON magnanimous_work_receipts(action,id);`);
  }
  _boundedDetail(detail){
    let raw='{}';
    try{raw=JSON.stringify(detail??{})}catch{raw=JSON.stringify({unserializable:true})}
    if(Buffer.byteLength(raw,'utf8')<=12000)return raw;
    return JSON.stringify({truncated:true,original_sha256:sha256(raw),original_bytes:Buffer.byteLength(raw,'utf8')});
  }
  async _receipt(subjectType,subjectId,action,detail={}){
    const occurredAt=now(),detailJson=this._boundedDetail(detail);
    const previous=this.db.db.prepare('SELECT chain_hash FROM magnanimous_work_receipts ORDER BY id DESC LIMIT 1').get()?.chain_hash||'';
    const base={subject_type:String(subjectType||''),subject_id:String(subjectId||''),action:String(action||''),detail_json:detailJson,occurred_at:occurredAt};
    const contentHash=sha256(receiptContent(base));
    const chainHash=sha256(`${previous}\n${contentHash}`);
    const signature=this.signingKey?hmac256(this.signingKey,chainHash):'';
    const algorithm=this.signingKey?'HMAC-SHA-256':'SHA-256-chain';
    const result=this.db.db.prepare(`INSERT INTO magnanimous_work_receipts(
      subject_type,subject_id,action,detail_json,occurred_at,previous_chain_hash,content_hash,chain_hash,signature,signature_algorithm
    ) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(base.subject_type,base.subject_id,base.action,detailJson,occurredAt,previous,contentHash,chainHash,signature,algorithm);
    return{id:Number(result.lastInsertRowid||0),...base,previous_chain_hash:previous,content_hash:contentHash,chain_hash:chainHash,signature,signature_algorithm:algorithm};
  }
  async listReceipts({subjectType='',subjectId='',limit=100}={}){
    const clauses=[],params=[];
    if(subjectType){clauses.push('subject_type=?');params.push(String(subjectType))}
    if(subjectId){clauses.push('subject_id=?');params.push(String(subjectId))}
    const where=clauses.length?'WHERE '+clauses.join(' AND '):'';
    const max=Math.max(1,Math.min(Number(limit)||100,1000));
    const rows=this.db.db.prepare(`SELECT * FROM magnanimous_work_receipts ${where} ORDER BY id DESC LIMIT ?`).all(...params,max);
    return rows.map(row=>{let detail={};try{detail=JSON.parse(row.detail_json||'{}')}catch{}return{...row,detail}});
  }
  async verifyReceiptChain({limit=10000}={}){
    const max=Math.max(1,Math.min(Number(limit)||10000,100000));
    const rows=this.db.db.prepare('SELECT * FROM magnanimous_work_receipts ORDER BY id ASC LIMIT ?').all(max);
    let previous='',verified=0,chain_failures=0,content_failures=0,signature_failures=0,signatures_unverifiable=0;
    for(const row of rows){
      const expectedContent=sha256(receiptContent(row));
      if(expectedContent!==row.content_hash)content_failures++;
      const expectedChain=sha256(`${previous}\n${row.content_hash}`);
      if(row.previous_chain_hash!==previous||row.chain_hash!==expectedChain)chain_failures++;
      if(row.signature){
        if(this.signingKey){if(hmac256(this.signingKey,row.chain_hash)!==row.signature)signature_failures++}
        else signatures_unverifiable++;
      }
      previous=row.chain_hash||'';
      verified++;
    }
    return{
      ok:chain_failures===0&&content_failures===0&&signature_failures===0,
      verified,
      chain_failures,
      content_failures,
      signature_failures,
      signatures_unverifiable,
      signed:rows.some(row=>Boolean(row.signature)),
      head_chain_hash:previous
    };
  }
  async send(message,{queue='default',delaySeconds=0,idempotencyKey='',maxAttempts=5}={}){
    const when=now()+Math.max(0,Number(delaySeconds)||0),jobId=id(),stamp=now();
    await this.db.prepare(`INSERT INTO magnanimous_jobs(id,queue,payload_json,status,idempotency_key,available_at,max_attempts,created_at,updated_at)
      VALUES(?,?,?,'queued',?,?,?,?,?) ON CONFLICT(queue,idempotency_key) WHERE idempotency_key!='' DO NOTHING`)
      .bind(jobId,String(queue),JSON.stringify(message??null),String(idempotencyKey||''),when,Math.max(1,Number(maxAttempts)||5),stamp,stamp).run();
    let effectiveId=jobId;
    if(idempotencyKey){
      const row=await this.db.prepare('SELECT id FROM magnanimous_jobs WHERE queue=? AND idempotency_key=?').bind(String(queue),String(idempotencyKey)).first();
      effectiveId=row?.id||jobId;
    }
    await this._receipt('job',effectiveId,'queued',{queue:String(queue),idempotency_key:Boolean(idempotencyKey),available_at:when,max_attempts:Math.max(1,Number(maxAttempts)||5)});
    return{id:effectiveId};
  }
  async sendBatch(messages,options={}){const out=[];for(const message of messages||[])out.push(await this.send(message,options));return out}
  async claim({queue='default',limit=10,leaseSeconds=60,consumer='magnanimous-worker'}={}){
    const stamp=now(),max=Math.max(1,Math.min(Number(limit)||10,100));
    const {results=[]}=await this.db.prepare(`SELECT id FROM magnanimous_jobs WHERE queue=? AND available_at<=? AND
      ((status='queued') OR (status='running' AND lease_until<=?)) AND attempts<max_attempts ORDER BY created_at LIMIT ?`)
      .bind(String(queue),stamp,stamp,max).all();
    const claimed=[];
    for(const row of results){
      const lease=stamp+Math.max(5,Number(leaseSeconds)||60);
      const result=await this.db.prepare(`UPDATE magnanimous_jobs SET status='running',lease_until=?,consumer=?,attempts=attempts+1,updated_at=?
        WHERE id=? AND ((status='queued') OR (status='running' AND lease_until<=?))`).bind(lease,String(consumer),stamp,row.id,stamp).run();
      if(Number(result?.meta?.changes||0)===1){
        const job=await this.db.prepare('SELECT * FROM magnanimous_jobs WHERE id=?').bind(row.id).first();
        if(job){
          let payload=null;try{payload=JSON.parse(job.payload_json)}catch{}
          claimed.push({...job,payload});
          await this._receipt('job',row.id,'claimed',{queue:String(queue),consumer:String(consumer),lease_until:lease,attempts:Number(job.attempts||0)});
        }
      }
    }
    return claimed;
  }
  async ack(jobId){
    await this.db.prepare("UPDATE magnanimous_jobs SET status='completed',lease_until=0,updated_at=? WHERE id=?").bind(now(),String(jobId)).run();
    await this._receipt('job',jobId,'completed',{});
  }
  async fail(jobId,error,{retryDelaySeconds=0}={}){
    const stamp=now(),row=await this.db.prepare('SELECT attempts,max_attempts FROM magnanimous_jobs WHERE id=?').bind(String(jobId)).first();
    const terminal=Number(row?.attempts||0)>=Number(row?.max_attempts||0);
    const retryAt=stamp+Math.max(0,Number(retryDelaySeconds)||0);
    const message=String(error||'').slice(0,2000);
    await this.db.prepare('UPDATE magnanimous_jobs SET status=?,available_at=?,lease_until=0,last_error=?,updated_at=? WHERE id=?')
      .bind(terminal?'failed':'queued',retryAt,message,stamp,String(jobId)).run();
    await this._receipt('job',jobId,terminal?'failed':'retry-scheduled',{retry_at:retryAt,error_sha256:sha256(message),attempts:Number(row?.attempts||0),max_attempts:Number(row?.max_attempts||0)});
    return{terminal};
  }
  async stats(queue='default'){
    const {results=[]}=await this.db.prepare('SELECT status,COUNT(*) count FROM magnanimous_jobs WHERE queue=? GROUP BY status').bind(String(queue)).all();
    return Object.fromEntries(results.map(r=>[r.status,Number(r.count||0)]));
  }
  async startWorkflow(name,input={},options={}){
    const workflowId=id(),stamp=now(),key=String(options.idempotencyKey||'');
    await this.db.prepare(`INSERT INTO magnanimous_workflows(id,name,idempotency_key,status,input_json,state_json,created_at,updated_at)
      VALUES(?,?,?,'running',?,'{}',?,?) ON CONFLICT(name,idempotency_key) WHERE idempotency_key!='' DO NOTHING`)
      .bind(workflowId,String(name),key,JSON.stringify(input??{}),stamp,stamp).run();
    let effectiveId=workflowId;
    if(key){const row=await this.db.prepare('SELECT id FROM magnanimous_workflows WHERE name=? AND idempotency_key=?').bind(String(name),key).first();effectiveId=row?.id||workflowId}
    await this._receipt('workflow',effectiveId,'started',{name:String(name),idempotency_key:Boolean(key),input_sha256:sha256(JSON.stringify(input??{}))});
    return{id:effectiveId};
  }
  async checkpoint(workflowId,state){
    const stateJson=JSON.stringify(state??{});
    await this.db.prepare("UPDATE magnanimous_workflows SET state_json=?,status='running',updated_at=? WHERE id=?").bind(stateJson,now(),String(workflowId)).run();
    await this._receipt('workflow',workflowId,'checkpoint',{state_sha256:sha256(stateJson)});
  }
  async complete(workflowId,output={}){
    const stamp=now(),outputJson=JSON.stringify(output??{});
    await this.db.prepare("UPDATE magnanimous_workflows SET output_json=?,status='completed',completed_at=?,updated_at=? WHERE id=?").bind(outputJson,stamp,stamp,String(workflowId)).run();
    await this._receipt('workflow',workflowId,'completed',{output_sha256:sha256(outputJson)});
  }
  async failWorkflow(workflowId,error){
    const stamp=now(),message=String(error||'').slice(0,4000);
    await this.db.prepare("UPDATE magnanimous_workflows SET error_text=?,status='failed',completed_at=?,updated_at=? WHERE id=?").bind(message,stamp,stamp,String(workflowId)).run();
    await this._receipt('workflow',workflowId,'failed',{error_sha256:sha256(message)});
  }
  async getWorkflow(workflowId){
    const row=await this.db.prepare('SELECT * FROM magnanimous_workflows WHERE id=?').bind(String(workflowId)).first();if(!row)return null;
    const parse=(v,fallback)=>{try{return JSON.parse(v||'')}catch{return fallback}};
    return{...row,input:parse(row.input_json,{}),state:parse(row.state_json,{}),output:parse(row.output_json,{})};
  }
}

export function openMagnanimousDurableWork(db,options={}){return new MagnanimousDurableWork(db,options)}
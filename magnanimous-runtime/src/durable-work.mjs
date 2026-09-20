import crypto from 'node:crypto';
const now=()=>Math.floor(Date.now()/1000);
const id=()=>crypto.randomUUID();

export class MagnanimousDurableWork{
  constructor(db){
    this.db=db;
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
    CREATE UNIQUE INDEX IF NOT EXISTS idx_magnanimous_workflow_idempotency ON magnanimous_workflows(name,idempotency_key) WHERE idempotency_key!='';`);
  }
  async send(message,{queue='default',delaySeconds=0,idempotencyKey='',maxAttempts=5}={}){
    const when=now()+Math.max(0,Number(delaySeconds)||0),jobId=id(),stamp=now();
    await this.db.prepare(`INSERT INTO magnanimous_jobs(id,queue,payload_json,status,idempotency_key,available_at,max_attempts,created_at,updated_at)
      VALUES(?,?,?,'queued',?,?,?,?,?) ON CONFLICT(queue,idempotency_key) WHERE idempotency_key!='' DO NOTHING`)
      .bind(jobId,String(queue),JSON.stringify(message??null),String(idempotencyKey||''),when,Math.max(1,Number(maxAttempts)||5),stamp,stamp).run();
    if(idempotencyKey){
      const row=await this.db.prepare('SELECT id FROM magnanimous_jobs WHERE queue=? AND idempotency_key=?').bind(String(queue),String(idempotencyKey)).first();
      return{id:row?.id||jobId};
    }
    return{id:jobId};
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
        if(job){let payload=null;try{payload=JSON.parse(job.payload_json)}catch{}claimed.push({...job,payload})}
      }
    }
    return claimed;
  }
  async ack(jobId){await this.db.prepare("UPDATE magnanimous_jobs SET status='completed',lease_until=0,updated_at=? WHERE id=?").bind(now(),String(jobId)).run()}
  async fail(jobId,error,{retryDelaySeconds=0}={}){
    const stamp=now(),row=await this.db.prepare('SELECT attempts,max_attempts FROM magnanimous_jobs WHERE id=?').bind(String(jobId)).first();
    const terminal=Number(row?.attempts||0)>=Number(row?.max_attempts||0);
    await this.db.prepare('UPDATE magnanimous_jobs SET status=?,available_at=?,lease_until=0,last_error=?,updated_at=? WHERE id=?')
      .bind(terminal?'failed':'queued',stamp+Math.max(0,Number(retryDelaySeconds)||0),String(error||'').slice(0,2000),stamp,String(jobId)).run();
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
    if(key){const row=await this.db.prepare('SELECT id FROM magnanimous_workflows WHERE name=? AND idempotency_key=?').bind(String(name),key).first();return{id:row?.id||workflowId}}
    return{id:workflowId};
  }
  async checkpoint(workflowId,state){await this.db.prepare("UPDATE magnanimous_workflows SET state_json=?,status='running',updated_at=? WHERE id=?").bind(JSON.stringify(state??{}),now(),String(workflowId)).run()}
  async complete(workflowId,output={}){const stamp=now();await this.db.prepare("UPDATE magnanimous_workflows SET output_json=?,status='completed',completed_at=?,updated_at=? WHERE id=?").bind(JSON.stringify(output??{}),stamp,stamp,String(workflowId)).run()}
  async failWorkflow(workflowId,error){const stamp=now();await this.db.prepare("UPDATE magnanimous_workflows SET error_text=?,status='failed',completed_at=?,updated_at=? WHERE id=?").bind(String(error||'').slice(0,4000),stamp,stamp,String(workflowId)).run()}
  async getWorkflow(workflowId){
    const row=await this.db.prepare('SELECT * FROM magnanimous_workflows WHERE id=?').bind(String(workflowId)).first();if(!row)return null;
    const parse=(v,fallback)=>{try{return JSON.parse(v||'')}catch{return fallback}};
    return{...row,input:parse(row.input_json,{}),state:parse(row.state_json,{}),output:parse(row.output_json,{})};
  }
}

export function openMagnanimousDurableWork(db){return new MagnanimousDurableWork(db)}

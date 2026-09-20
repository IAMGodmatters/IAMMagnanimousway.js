import crypto from 'node:crypto';
export class MagnanimousPipeline{
  constructor({objectStore,work,analytics}){this.objectStore=objectStore;this.work=work;this.analytics=analytics}
  async send(records,{pipeline='default',idempotencyKey=''}={}){
    const rows=Array.isArray(records)?records:[records],batchId=crypto.randomUUID();
    const key='pipelines/'+String(pipeline).replace(/[^a-z0-9._-]+/gi,'-')+'/'+batchId+'.jsonl';
    const body=rows.map(row=>JSON.stringify(row??null)).join('\n')+'\n';
    await this.objectStore.put(key,body,{httpMetadata:{contentType:'application/x-ndjson'},customMetadata:{pipeline:String(pipeline),records:String(rows.length)}});
    await this.analytics.writeDataPoint({indexes:[String(pipeline),'ingest'],doubles:[rows.length,Buffer.byteLength(body)],blobs:[key]},'pipeline');
    const job=await this.work.send({type:'pipeline-batch',pipeline:String(pipeline),object_key:key,records:rows.length},{
      queue:'pipeline',idempotencyKey:idempotencyKey||('pipeline:'+pipeline+':'+batchId),maxAttempts:8
    });
    return{batch_id:batchId,object_key:key,records:rows.length,job_id:job.id};
  }
  async readBatch(objectKey){
    const object=await this.objectStore.get(objectKey);if(!object)return null;
    const text=await object.text();
    return text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
  }
}
export function openMagnanimousPipeline(deps){return new MagnanimousPipeline(deps)}

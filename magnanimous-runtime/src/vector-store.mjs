const now=()=>Math.floor(Date.now()/1000);
function toVector(value){
  if(!Array.isArray(value)&&!ArrayBuffer.isView(value))throw new TypeError('Vector must be an array of numbers.');
  const out=Array.from(value,Number);
  if(!out.length||out.some(x=>!Number.isFinite(x)))throw new TypeError('Vector contains invalid numbers.');
  return out;
}
function cosine(a,b){
  if(a.length!==b.length)return Number.NEGATIVE_INFINITY;
  let dot=0,aa=0,bb=0;
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}
  if(!aa||!bb)return 0;
  return dot/(Math.sqrt(aa)*Math.sqrt(bb));
}
export class MagnanimousVectorStore{
  constructor(db,namespace='default'){
    this.db=db;this.namespace=String(namespace||'default');
    db.db.exec(`CREATE TABLE IF NOT EXISTS magnanimous_vectors(
      namespace TEXT NOT NULL,id TEXT NOT NULL,values_json TEXT NOT NULL,dimensions INTEGER NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
      PRIMARY KEY(namespace,id)
    );CREATE INDEX IF NOT EXISTS idx_magnanimous_vectors_namespace ON magnanimous_vectors(namespace,updated_at DESC);`);
  }
  async upsert(records=[]){
    const stamp=now(),ids=[];
    for(const record of records){
      const id=String(record?.id||'');if(!id)throw new Error('Vector id is required.');
      const values=toVector(record.values||record.vector||[]);
      await this.db.prepare(`INSERT INTO magnanimous_vectors(namespace,id,values_json,dimensions,metadata_json,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(namespace,id) DO UPDATE SET values_json=excluded.values_json,dimensions=excluded.dimensions,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`)
        .bind(this.namespace,id,JSON.stringify(values),values.length,JSON.stringify(record.metadata||{}),stamp,stamp).run();
      ids.push(id);
    }
    return{count:ids.length,ids};
  }
  async getByIds(ids=[]){
    const out=[];
    for(const id of ids){
      const row=await this.db.prepare('SELECT id,values_json,metadata_json,dimensions FROM magnanimous_vectors WHERE namespace=? AND id=?').bind(this.namespace,String(id)).first();
      if(row){let values=[],metadata={};try{values=JSON.parse(row.values_json)}catch{}try{metadata=JSON.parse(row.metadata_json)}catch{}out.push({id:row.id,values,metadata,dimensions:Number(row.dimensions||0)})}
    }
    return out;
  }
  async deleteByIds(ids=[]){for(const id of ids)await this.db.prepare('DELETE FROM magnanimous_vectors WHERE namespace=? AND id=?').bind(this.namespace,String(id)).run()}
  async query(vector,{topK=10,returnValues=false,returnMetadata=true,filter}={}){
    const target=toVector(vector),{results=[]}=await this.db.prepare('SELECT id,values_json,metadata_json,dimensions FROM magnanimous_vectors WHERE namespace=?').bind(this.namespace).all();
    const matches=[];
    for(const row of results){
      if(Number(row.dimensions)!==target.length)continue;
      let values=[],metadata={};try{values=JSON.parse(row.values_json)}catch{}try{metadata=JSON.parse(row.metadata_json)}catch{}
      if(filter&&typeof filter==='object'&&!Object.entries(filter).every(([k,v])=>metadata?.[k]===v))continue;
      const score=cosine(target,values);
      if(!Number.isFinite(score))continue;
      matches.push({id:row.id,score,...(returnValues?{values}:{}),...(returnMetadata?{metadata}:{})});
    }
    matches.sort((a,b)=>b.score-a.score);
    return{matches:matches.slice(0,Math.max(1,Math.min(Number(topK)||10,100)))};
  }
}
export function openMagnanimousVectorStore(db,namespace='default'){return new MagnanimousVectorStore(db,namespace)}

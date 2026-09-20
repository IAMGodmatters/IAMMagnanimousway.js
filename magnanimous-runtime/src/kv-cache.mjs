const nowSeconds=()=>Math.floor(Date.now()/1000);

function encoded(value){
  if(value instanceof ArrayBuffer)return JSON.stringify({kind:'base64',value:Buffer.from(value).toString('base64')});
  if(ArrayBuffer.isView(value))return JSON.stringify({kind:'base64',value:Buffer.from(value.buffer,value.byteOffset,value.byteLength).toString('base64')});
  if(typeof value==='string')return JSON.stringify({kind:'text',value});
  return JSON.stringify({kind:'json',value});
}
function decoded(raw,type='text'){
  const row=JSON.parse(String(raw||'{}'));
  const buffer=row.kind==='base64'?Buffer.from(row.value||'','base64'):Buffer.from(row.kind==='json'?JSON.stringify(row.value):String(row.value??''));
  if(type==='arrayBuffer')return buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
  if(type==='json')return row.kind==='json'?row.value:JSON.parse(buffer.toString('utf8'));
  if(type==='stream')return new ReadableStream({start(controller){controller.enqueue(buffer);controller.close()}});
  return buffer.toString('utf8');
}

export class MagnanimousKvStore{
  constructor(db,namespace='default'){
    this.db=db;this.namespace=String(namespace||'default');
    db.db.exec(`CREATE TABLE IF NOT EXISTS magnanimous_kv_store(
      namespace TEXT NOT NULL,key TEXT NOT NULL,value_json TEXT NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}',
      expires_at INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
      PRIMARY KEY(namespace,key)
    );CREATE INDEX IF NOT EXISTS idx_magnanimous_kv_expiry ON magnanimous_kv_store(namespace,expires_at);`);
  }
  _key(key){const k=String(key||'');if(!k)throw new Error('Magnanimous KV key is required.');return k}
  async put(key,value,options={}){
    const k=this._key(key),now=nowSeconds();
    const expiresAt=Number(options.expiration||0)||((Number(options.expirationTtl||0)>0)?now+Number(options.expirationTtl):0);
    await this.db.prepare(`INSERT INTO magnanimous_kv_store(namespace,key,value_json,metadata_json,expires_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(namespace,key) DO UPDATE SET value_json=excluded.value_json,metadata_json=excluded.metadata_json,expires_at=excluded.expires_at,updated_at=excluded.updated_at`)
      .bind(this.namespace,k,encoded(value),JSON.stringify(options.metadata||{}),expiresAt,now,now).run();
  }
  async _row(key){
    const k=this._key(key);
    const row=await this.db.prepare('SELECT value_json,metadata_json,expires_at FROM magnanimous_kv_store WHERE namespace=? AND key=?').bind(this.namespace,k).first();
    if(!row)return null;
    if(Number(row.expires_at||0)>0&&Number(row.expires_at)<=nowSeconds()){
      await this.delete(k);return null;
    }
    return row;
  }
  async get(key,type='text'){const row=await this._row(key);return row?decoded(row.value_json,type):null}
  async getWithMetadata(key,type='text'){
    const row=await this._row(key);if(!row)return{value:null,metadata:null};
    let metadata={};try{metadata=JSON.parse(row.metadata_json||'{}')}catch{}
    return{value:decoded(row.value_json,type),metadata};
  }
  async delete(key){await this.db.prepare('DELETE FROM magnanimous_kv_store WHERE namespace=? AND key=?').bind(this.namespace,this._key(key)).run()}
  async list({prefix='',limit=1000,cursor=''}={}){
    const max=Math.max(1,Math.min(Number(limit)||1000,1000));
    const {results=[]}=await this.db.prepare(`SELECT key,metadata_json,expires_at FROM magnanimous_kv_store
      WHERE namespace=? AND key>? AND key LIKE ? AND (expires_at=0 OR expires_at>?) ORDER BY key LIMIT ?`)
      .bind(this.namespace,String(cursor||''),String(prefix||'')+'%',nowSeconds(),max+1).all();
    const rows=results.slice(0,max);
    return{keys:rows.map(r=>{let metadata={};try{metadata=JSON.parse(r.metadata_json||'{}')}catch{}return{name:r.key,metadata,expiration:Number(r.expires_at||0)||undefined}}),list_complete:results.length<=max,cursor:rows.at(-1)?.key||''};
  }
}

export function openMagnanimousKvStore(db,namespace='default'){return new MagnanimousKvStore(db,namespace)}

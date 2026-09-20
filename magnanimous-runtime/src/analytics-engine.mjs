import crypto from 'node:crypto';
const nowMs=()=>Date.now();
export class MagnanimousAnalyticsEngine{
  constructor(db){
    this.db=db;
    db.db.exec(`CREATE TABLE IF NOT EXISTS magnanimous_analytics(
      id TEXT PRIMARY KEY,dataset TEXT NOT NULL,ts INTEGER NOT NULL,index1 TEXT NOT NULL DEFAULT '',
      index2 TEXT NOT NULL DEFAULT '',index3 TEXT NOT NULL DEFAULT '',blobs_json TEXT NOT NULL DEFAULT '[]',
      doubles_json TEXT NOT NULL DEFAULT '[]',created_at INTEGER NOT NULL
    );CREATE INDEX IF NOT EXISTS idx_magnanimous_analytics_dataset_ts ON magnanimous_analytics(dataset,ts DESC);
    CREATE INDEX IF NOT EXISTS idx_magnanimous_analytics_index1 ON magnanimous_analytics(dataset,index1,ts DESC);`);
  }
  async writeDataPoint(point={},dataset='default'){
    const indexes=Array.isArray(point.indexes)?point.indexes:[],blobs=Array.isArray(point.blobs)?point.blobs:[],doubles=Array.isArray(point.doubles)?point.doubles.map(Number):[];
    const id=crypto.randomUUID(),ts=Number(point.timestamp||nowMs());
    await this.db.prepare(`INSERT INTO magnanimous_analytics(id,dataset,ts,index1,index2,index3,blobs_json,doubles_json,created_at)
      VALUES(?,?,?,?,?,?,?,?,?)`).bind(id,String(dataset||'default'),ts,String(indexes[0]||''),String(indexes[1]||''),String(indexes[2]||''),JSON.stringify(blobs),JSON.stringify(doubles),Math.floor(nowMs()/1000)).run();
    return{id,ts};
  }
  async query({dataset='default',since=0,until=Number.MAX_SAFE_INTEGER,index1='',limit=1000}={}){
    const max=Math.max(1,Math.min(Number(limit)||1000,5000));
    const sql=index1
      ?'SELECT * FROM magnanimous_analytics WHERE dataset=? AND index1=? AND ts>=? AND ts<=? ORDER BY ts DESC LIMIT ?'
      :'SELECT * FROM magnanimous_analytics WHERE dataset=? AND ts>=? AND ts<=? ORDER BY ts DESC LIMIT ?';
    const stmt=this.db.prepare(sql);
    const {results=[]}=index1
      ?await stmt.bind(String(dataset),String(index1),Number(since)||0,Number(until)||Number.MAX_SAFE_INTEGER,max).all()
      :await stmt.bind(String(dataset),Number(since)||0,Number(until)||Number.MAX_SAFE_INTEGER,max).all();
    return results.map(row=>{let blobs=[],doubles=[];try{blobs=JSON.parse(row.blobs_json)}catch{}try{doubles=JSON.parse(row.doubles_json)}catch{}return{...row,blobs,doubles}});
  }
  async aggregateCount({dataset='default',since=0,index1=''}={}){
    const row=index1
      ?await this.db.prepare('SELECT COUNT(*) count FROM magnanimous_analytics WHERE dataset=? AND index1=? AND ts>=?').bind(String(dataset),String(index1),Number(since)||0).first()
      :await this.db.prepare('SELECT COUNT(*) count FROM magnanimous_analytics WHERE dataset=? AND ts>=?').bind(String(dataset),Number(since)||0).first();
    return Number(row?.count||0);
  }
}
export function openMagnanimousAnalyticsEngine(db){return new MagnanimousAnalyticsEngine(db)}

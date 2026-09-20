const now=()=>Math.floor(Date.now()/1000);

export class MagnanimousEventHub{
  constructor(db){
    this.db=db;this.listeners=new Map();
    db.db.exec(`CREATE TABLE IF NOT EXISTS magnanimous_events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,channel TEXT NOT NULL,payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL DEFAULT 0
    );CREATE INDEX IF NOT EXISTS idx_magnanimous_events_channel ON magnanimous_events(channel,id);`);
  }
  async publish(channel,payload,{ttlSeconds=86400}={}){
    const ch=String(channel||'default'),stamp=now(),expires=ttlSeconds>0?stamp+Number(ttlSeconds):0;
    const result=await this.db.prepare('INSERT INTO magnanimous_events(channel,payload_json,created_at,expires_at) VALUES(?,?,?,?)')
      .bind(ch,JSON.stringify(payload??null),stamp,expires).run();
    const event={id:Number(result?.meta?.last_row_id||0),channel:ch,payload,created_at:stamp};
    for(const fn of this.listeners.get(ch)||[])try{fn(event)}catch{}
    return event;
  }
  async since(channel,afterId=0,{limit=100}={}){
    const {results=[]}=await this.db.prepare(`SELECT id,channel,payload_json,created_at FROM magnanimous_events
      WHERE channel=? AND id>? AND (expires_at=0 OR expires_at>?) ORDER BY id LIMIT ?`)
      .bind(String(channel||'default'),Number(afterId)||0,now(),Math.max(1,Math.min(Number(limit)||100,1000))).all();
    return results.map(row=>{let payload=null;try{payload=JSON.parse(row.payload_json)}catch{}return{...row,payload}});
  }
  subscribe(channel,handler){
    const ch=String(channel||'default'),set=this.listeners.get(ch)||new Set();set.add(handler);this.listeners.set(ch,set);
    return()=>{set.delete(handler);if(!set.size)this.listeners.delete(ch)};
  }
  async compact(){await this.db.prepare('DELETE FROM magnanimous_events WHERE expires_at>0 AND expires_at<=?').bind(now()).run()}
}
export function openMagnanimousEventHub(db){return new MagnanimousEventHub(db)}

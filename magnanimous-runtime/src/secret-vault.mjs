import crypto from 'node:crypto';
const now=()=>Math.floor(Date.now()/1000);
function keyFrom(secret){
  const raw=String(secret||'');
  if(raw.length<16)throw new Error('MAGNANIMOUS_SECRETS_KEY must contain at least 16 characters.');
  return crypto.createHash('sha256').update(raw).digest();
}
export class MagnanimousSecretVault{
  constructor(db,masterSecret){
    this.db=db;this.key=keyFrom(masterSecret);
    db.db.exec(`CREATE TABLE IF NOT EXISTS magnanimous_secrets(
      scope TEXT NOT NULL,name TEXT NOT NULL,ciphertext TEXT NOT NULL,iv TEXT NOT NULL,tag TEXT NOT NULL,
      created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(scope,name)
    );`);
  }
  _encrypt(value){
    const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);
    const ciphertext=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
    return{ciphertext:ciphertext.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64')};
  }
  _decrypt(row){
    const decipher=crypto.createDecipheriv('aes-256-gcm',this.key,Buffer.from(row.iv,'base64'));
    decipher.setAuthTag(Buffer.from(row.tag,'base64'));
    return Buffer.concat([decipher.update(Buffer.from(row.ciphertext,'base64')),decipher.final()]).toString('utf8');
  }
  async put(name,value,{scope='platform'}={}){
    const secretName=String(name||'');if(!secretName)throw new Error('Secret name is required.');
    const encrypted=this._encrypt(value),stamp=now();
    await this.db.prepare(`INSERT INTO magnanimous_secrets(scope,name,ciphertext,iv,tag,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(scope,name) DO UPDATE SET ciphertext=excluded.ciphertext,iv=excluded.iv,tag=excluded.tag,updated_at=excluded.updated_at`)
      .bind(String(scope),secretName,encrypted.ciphertext,encrypted.iv,encrypted.tag,stamp,stamp).run();
  }
  async get(name,{scope='platform'}={}){
    const row=await this.db.prepare('SELECT ciphertext,iv,tag FROM magnanimous_secrets WHERE scope=? AND name=?').bind(String(scope),String(name)).first();
    return row?this._decrypt(row):null;
  }
  async delete(name,{scope='platform'}={}){await this.db.prepare('DELETE FROM magnanimous_secrets WHERE scope=? AND name=?').bind(String(scope),String(name)).run()}
  async list({scope='platform'}={}){
    const {results=[]}=await this.db.prepare('SELECT name,created_at,updated_at FROM magnanimous_secrets WHERE scope=? ORDER BY name').bind(String(scope)).all();
    return results;
  }
}
export function openMagnanimousSecretVault(db,masterSecret){return new MagnanimousSecretVault(db,masterSecret)}

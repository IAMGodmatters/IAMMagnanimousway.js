import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleTvCompanion,validateTvCommand} from '../../worker/src/tv-companion-runtime.js';

const origin='https://iammagnanimousway.com';
function database(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(readFileSync(new URL('../../worker/migrations/0108_tv_companion.sql',import.meta.url),'utf8'));
 return {
  prepare(sql){
   const statement=sqlite.prepare(sql);
   return {
    bind(...values){
     return {
      async first(){return statement.get(...values)||null},
      async run(){const r=statement.run(...values);return{meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},
      async all(){return{results:statement.all(...values)}}
     };
    }
   };
  }
 };
}
async function api(env,path,{method='GET',body,token,ip='127.0.0.1'}={}){
 const headers={'cf-connecting-ip':ip};
 if(token)headers.authorization=`Bearer ${token}`;
 if(body)headers['content-type']='application/json';
 const request=new Request(origin+'/api/tv-companion/'+path,{method,headers,body:body?JSON.stringify(body):undefined});
 const response=await handleTvCompanion(request,env);
 return{status:response.status,data:await response.json()};
}

test('remote navigation accepts HTTPS and blocks executable or credential-bearing URLs',()=>{
 assert.deepEqual(validateTvCommand({action:'navigate',value:'https://drive.google.com/drive/my-drive'}),{
  action:'navigate',value:'https://drive.google.com/drive/my-drive'
 });
 for(const value of ['javascript:alert(1)','http://example.com','file:///etc/passwd',
  'https://user:password@example.com','https://localhost','https://localhost./',
  'https://printer.local./','https://camera.internal./','https://router./',
  'https://ok.test/?access_token=private']){
  assert.equal(validateTvCommand({action:'navigate',value}),null,value);
 }
 assert.equal(validateTvCommand({action:'shell'}),null);
});

test('TV pairing, one-time code, permissions, command queue and revocation',async()=>{
 const env={DB:database()};
 const created=await api(env,'session',{method:'POST',body:{},ip:'1.1.1.1'});
 assert.equal(created.status,201);
 assert.match(created.data.pairing_code,/^[A-HJ-NP-Z2-9]{10}$/);
 assert.match(created.data.tv_token,/^[a-f0-9]{64}$/);
 const id=created.data.session_id;

 const before=await api(env,`poll?session_id=${id}`,{token:created.data.tv_token});
 assert.equal(before.status,200);
 assert.equal(before.data.paired,false);
 const wrong=await api(env,'pair',{method:'POST',body:{code:'AAAAAAAAAA'},ip:'2.2.2.2'});
 assert.equal(wrong.status,404);

 const paired=await api(env,'pair',{method:'POST',body:{code:created.data.pairing_code},ip:'2.2.2.2'});
 assert.equal(paired.status,200);
 assert.equal(paired.data.expires_at,created.data.expires_at,'phone and TV must use the same session expiry');
 assert.match(paired.data.remote_token,/^[a-f0-9]{64}$/);
 assert.equal((await api(env,'pair',{method:'POST',body:{code:created.data.pairing_code},ip:'2.2.2.2'})).status,404);
 assert.equal((await api(env,'command',{method:'POST',body:{session_id:id,action:'home'},token:'0'.repeat(64)})).status,401);
 assert.equal((await api(env,'command',{method:'POST',body:{session_id:id,action:'navigate',value:'javascript:alert(1)'},token:paired.data.remote_token})).status,400);

 const queued=await api(env,'command',{method:'POST',body:{session_id:id,action:'navigate',value:'https://drive.google.com/drive/u/0/my-drive'},token:paired.data.remote_token});
 assert.equal(queued.status,201);
 const pending=await api(env,`poll?session_id=${id}&after=0`,{token:created.data.tv_token});
 assert.equal(pending.data.paired,true);
 assert.equal(pending.data.command.action,'navigate');
 assert.equal(pending.data.command.value,'https://drive.google.com/drive/u/0/my-drive');
 const acknowledged=await api(env,`poll?session_id=${id}&after=${pending.data.command.id}`,{token:created.data.tv_token});
 assert.equal(acknowledged.data.command,null);
 assert.equal((await api(env,`poll?session_id=${id}`,{token:paired.data.remote_token})).status,401);

 assert.equal((await api(env,'disconnect',{method:'POST',body:{session_id:id},token:paired.data.remote_token})).status,200);
 assert.equal((await api(env,`poll?session_id=${id}`,{token:created.data.tv_token})).status,401);
});

test('failed pairing attempts are rate limited without a global account login',async()=>{
 const env={DB:database()};
 for(let i=0;i<6;i++){
  assert.equal((await api(env,'pair',{method:'POST',body:{code:'AAAAAAAAAA'},ip:'3.3.3.3'})).status,404);
 }
 assert.equal((await api(env,'pair',{method:'POST',body:{code:'AAAAAAAAAA'},ip:'3.3.3.3'})).status,429);
});

test('TV disconnect never reports success if the session deletion write has not completed',async()=>{
 const base=database();
 const created=await api({DB:base},'session',{method:'POST',body:{}});
 const paired=await api({DB:base},'pair',{method:'POST',body:{code:created.data.pairing_code}});
 assert.equal(paired.status,200);
 const sabotaged={DB:{prepare(sql){
  if(sql.includes('DELETE FROM tv_companion_sessions WHERE id=?'))return{bind(){return{async run(){return{meta:{changes:0}}}}}};
  return base.prepare(sql);
 }}};
 const failed=await api(sabotaged,'disconnect',{method:'POST',body:{session_id:created.data.session_id},token:paired.data.remote_token});
 assert.equal(failed.status,503);
 assert.notEqual(failed.data.disconnected,true);
 const stillValid=await api({DB:base},'command',{method:'POST',body:{session_id:created.data.session_id,action:'home'},token:paired.data.remote_token});
 assert.equal(stillValid.status,201,'A non-committed disconnect must leave the still-valid remote visible for retry');
 const successful=await api({DB:base},'disconnect',{method:'POST',body:{session_id:created.data.session_id},token:paired.data.remote_token});
 assert.equal(successful.status,200);
 assert.equal((await api({DB:base},'command',{method:'POST',body:{session_id:created.data.session_id,action:'home'},token:paired.data.remote_token})).status,401);
});

test('phone disconnect distinguishes an expired remote from an unconfirmed write',()=>{
 const source=readFileSync(new URL('../../frontend/app/tv-remote/page.tsx',import.meta.url),'utf8');
 assert(source.includes('if(response.status===401){'),'revoked token allows return to pairing screen');
 assert(source.includes('TV pairing is no longer active. Enter a new code to reconnect.'),'authorization loss is not labeled successful revocation');
 assert(source.includes("if(!response.ok||data.disconnected!==true)throw"),'other failed revocations retain pairing for retry');
 assert(!source.includes('}catch{}\\n  sessionStorage.removeItem(STORAGE_KEY)'),'network failure cannot silently clear pairing');
});

test('TV receiver fails closed when prior pairing revocation cannot be confirmed',()=>{
 const java=readFileSync(new URL('../../android-tv-browser/app/src/main/java/com/iammagnanimousway/tv/MainActivity.java',import.meta.url),'utf8');
 const newCode=java.slice(java.indexOf('private void createSession()'),java.indexOf('private void poll('));
 assert(newCode.includes('if (!result.optBoolean("disconnected", false)) throw'),'HTTP success alone is not proof the old remote was revoked');
 assert(newCode.includes('if (failure.status != 401) throw failure'),'only verified revocation or an already-invalid token permits replacement');
 assert(newCode.indexOf('if (failure.status != 401) throw failure')<newCode.indexOf('request("POST", "/session", null'),'new credentials are not created before old revocation succeeds');
 assert(newCode.includes('pairing.setText(previousLabel)'),'failed revocation retains the old pairing for retry');
 assert(newCode.includes('sessionId = null;')&&newCode.includes('pairing.setText("No active pairing")'),'a failed new-code request does not resurrect a revoked pairing');
 assert(java.includes('private static final class HttpFailure extends Exception'),'HTTP 401 must be distinguished from a service-write failure');
});

test('Android TV and phone favorites normalize trailing-dot local hosts like the relay',()=>{
 const java=readFileSync(new URL('../../android-tv-browser/app/src/main/java/com/iammagnanimousway/tv/MainActivity.java',import.meta.url),'utf8');
 const phone=readFileSync(new URL('../../frontend/app/tv-remote/page.tsx',import.meta.url),'utf8');
 assert(java.includes('replaceFirst("\\\\.+$", "")'),'receiver must remove terminal DNS dots before applying LAN restrictions');
 assert(phone.includes("replace(/\\.+$/,'')"),'phone must not save an address the secure relay rejects');
 for(const url of ['https://printer.local./','https://router./','https://camera.internal./']){
  assert.equal(validateTvCommand({action:'navigate',value:url}),null,'relay rejects '+url);
 }
});

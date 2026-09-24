import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { currentUser } from '../../worker/src/integrations.js';

if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;

const opaque='ms1_'+ 'A'.repeat(48);
const secret='opaque-downstream-auth-lock-secret';
const t=Math.floor(Date.now()/1000);
const user={id:'user-lock-1',tenant_id:'tenant-lock-1',name:'Session Lock',email:'lock@example.com',role:'owner',active:1};

const db={
  prepare(sql){
    const statement={
      params:[],
      bind(...params){this.params=params;return this;},
      async first(){
        if(sql.includes('SELECT 1 FROM auth_sessions LIMIT 1'))return {ok:1};
        if(sql.includes('FROM auth_sessions s JOIN users u'))return {
          user_id:user.id,tenant_id:user.tenant_id,role:user.role,
          created_at:t-30,expires_at:t+3600,revoked_at:null,current_role:user.role,active:1
        };
        if(sql.includes('SELECT id,tenant_id,name,email,role,active FROM users'))return user;
        if(sql.includes("SELECT value FROM auth_config WHERE key='session_secret'"))return {value:secret};
        return null;
      },
      async run(){return {success:true,meta:{changes:1}};}
    };
    return statement;
  }
};

const request=new Request('https://iammagnanimousway.com/api/agents/chat',{
  method:'POST',
  headers:{authorization:`Bearer ${opaque}`,'content-type':'application/json'},
  body:JSON.stringify({agent_id:'bobby',message:'opaque session downstream auth lock'})
});

const resolved=await currentUser(request,{DB:db,SESSION_SECRET:secret});
assert.deepEqual(resolved,user);
assert.equal(request.bodyUsed,false,'opaque authentication must not consume the original request body');
assert.deepEqual(await request.json(),{agent_id:'bobby',message:'opaque session downstream auth lock'});

console.log('Opaque downstream session auth and POST-body preservation lock: PASS');

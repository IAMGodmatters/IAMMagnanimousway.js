import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {decryptTotpSecret,encryptTotpSecret,generateTotpSecret,totpAuthUri,verifyTotpCode} from '../../worker/src/totp-auth.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};

function base32Decode(value){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 const clean=String(value||'').toUpperCase().replace(/[^A-Z2-7]/g,'');
 let bits=0,buffer=0,out=[];
 for(const char of clean){
  const v=alphabet.indexOf(char);if(v<0)continue;
  buffer=(buffer<<5)|v;bits+=5;
  if(bits>=8){out.push((buffer>>>(bits-8))&255);bits-=8}
 }
 return Buffer.from(out);
}
function expectedCode(secret,time){
 const counter=Math.floor(Number(time)/30);
 const buf=Buffer.alloc(8);buf.writeBigUInt64BE(BigInt(counter));
 const mac=crypto.createHmac('sha1',base32Decode(secret)).update(buf).digest();
 const offset=mac[mac.length-1]&15;
 const bin=((mac[offset]&127)<<24)|((mac[offset+1]&255)<<16)|((mac[offset+2]&255)<<8)|(mac[offset+3]&255);
 return String(bin%1000000).padStart(6,'0');
}

const fixedTime=1700000000;
const knownSecret='JBSWY3DPEHPK3PXP';
const expected=expectedCode(knownSecret,fixedTime);
const verified=await verifyTotpCode(knownSecret,expected,{time:fixedTime,window:0,lastCounter:-1});
must(verified.ok&&Number.isInteger(verified.counter),'TOTP must verify an independently generated RFC 6238 SHA-1 code');
const replay=await verifyTotpCode(knownSecret,expected,{time:fixedTime,window:0,lastCounter:verified.counter});
must(!replay.ok,'TOTP must reject reuse of an already accepted time-step code');

const generated=generateTotpSecret();
must(/^[A-Z2-7]{32}$/.test(generated),'generated TOTP secret must be a 20-byte Base32 key');
const uri=totpAuthUri({secret:generated,email:'person@example.test'});
must(uri.startsWith('otpauth://totp/')&&uri.includes('issuer=I+AM+MAGNANIMOUS+WAY')&&uri.includes('digits=6')&&uri.includes('period=30'),'TOTP enrollment URI must be authenticator-compatible');

const env={MAGNANIMOUS_SECRETS_KEY:'verification-secret-material-0123456789abcdef0123456789abcdef'};
const encrypted=await encryptTotpSecret(generated,env);
must(encrypted.startsWith('v1.')&&!encrypted.includes(generated),'TOTP secret must be encrypted at rest');
must(await decryptTotpSecret(encrypted,env)===generated,'encrypted TOTP secret must decrypt with the platform key');

const auth=read('worker/src/admin-compat-entrypoint.js');
const session=read('worker/src/session-authority.js');
const security=read('worker/src/security-hardening.js');
const login=read('frontend/app/login/page.tsx');
const account=read('frontend/app/account/page.tsx');
const signup=read('frontend/app/signup/page.tsx');
const migration=read('worker/migrations/0087_totp_authentication.sql');

must(auth.includes("mfa_required:true")&&auth.includes("mfa_method:'totp'"),'password login must stop for a TOTP challenge when enabled');
must(auth.includes('auth_mfa_challenges')&&auth.includes('sha256Hex(token)'),'MFA challenge tokens must be stored by hash');
must(auth.includes('Number(row.attempts||0)>=5')&&auth.includes("attempts>=5?'Too many invalid codes."),'TOTP login must cap invalid attempts');
must(auth.includes('last_counter')&&auth.includes('verifyTotpCode'),'TOTP login must enforce replay protection');
must(auth.includes("globalPlatformOwner(env,user)"),'customer TOTP enrollment must keep platform-owner authentication separate');
must(auth.includes("enabled=1,verified_at=?"),'TOTP must not become active until a code is verified');
must(session.includes("'/api/auth/totp/login'"),'verified TOTP login must upgrade to the opaque session authority');
must(security.includes("'totp-login'")&&security.includes("'totp-management'"),'TOTP login and management must be rate limited');
must(login.includes('/api/auth/totp/login')&&login.includes('GOOGLE AUTHENTICATOR VERIFICATION'),'customer login must render and submit the authenticator challenge');
must(account.includes('/api/auth/totp/enroll')&&account.includes('/api/auth/totp/confirm'),'account page must support authenticator enrollment and confirmation');
must(account.includes('SET UP GOOGLE AUTHENTICATOR'),'account page must expose authenticator setup');
must(signup.includes("iam_totp_setup_prompt")&&signup.includes("/account?setup=recovery"),'new accounts must be guided through recovery setup with authenticator enrollment prompted');
must(migration.includes('user_totp')&&migration.includes('secret_ciphertext'),'TOTP migration must store encrypted secret ciphertext');
must(migration.includes('auth_mfa_challenges')&&migration.includes('token_hash TEXT PRIMARY KEY'),'MFA challenge migration must store challenge hashes');

if(failures.length){
 console.error(`TOTP AUTH LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error('- '+failure);
 process.exit(1);
}
console.log('TOTP auth lock: PASS — RFC 6238 compatible, encrypted at rest, replay protected, rate limited, enrollment-safe, and customer-login enforced after verification.');

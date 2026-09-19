import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const recovery=read('worker/src/password-recovery.js');
const security=read('worker/src/security-hardening.js');
const template=read('frontend/app/template.tsx');
const overlay=read('frontend/app/password-recovery-overlay.tsx');
const customerLogin=read('frontend/app/login/page.tsx');
const ownerLogin=read('frontend/app/owner-login/page.tsx');
const migration=read('worker/migrations/0069_password_recovery.sql');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};

must(recovery.includes("'/api/auth/forgot-password'"),'forgot-password API route must exist');
must(recovery.includes("'/api/auth/reset-password'"),'reset-password API route must exist');
must(recovery.includes("crypto.getRandomValues(new Uint8Array(32))"),'reset tokens must use 256-bit cryptographic randomness');
must(recovery.includes('token_hash')&&recovery.includes("crypto.subtle.digest('SHA-256'"),'reset tokens must be stored and matched by hash');
must(!/INSERT[^\n]+password_reset_tokens[^\n]+\btoken\b(?!_hash)/i.test(recovery),'plaintext reset tokens must never be inserted into D1');
must(recovery.includes('expires_at')&&recovery.includes('used_at'),'reset tokens must expire and be single use');
must(recovery.includes('createPasswordRecord(password,env)'),'new passwords must use the platform password KDF');
must(recovery.includes("revoke_reason='password_reset'"),'successful reset must revoke active opaque sessions');
must(recovery.includes('GENERIC_MESSAGE'),'forgot-password response must use a generic anti-enumeration message');
must(security.includes("'password-recovery'")&&security.includes("'password-reset'"),'recovery endpoints must be rate limited');
must(security.includes('handlePasswordRecovery(request, env)'),'recovery routes must pass through the security preflight');
must(template.includes('<PasswordRecoveryOverlay'),'shared template must mount password recovery on login portals');
must(template.includes("path==='/login'")&&template.includes("path==='/owner-login'"),'both customer and owner login portals must expose recovery');
must(overlay.includes('/api/auth/forgot-password')&&overlay.includes('/api/auth/reset-password'),'recovery UI must call both recovery APIs');
must(overlay.includes('history.replaceState'),'reset token must be removed from the visible URL after capture');
must(overlay.includes("params.get('forgot')==='1'")&&overlay.includes("setMode('forgot')"),'visible forgot-password links must open the recovery flow');
must(customerLogin.includes('href="/login?forgot=1"')&&customerLogin.includes('Forgot password?'),'customer login must show an inline forgot-password link');
must(ownerLogin.includes('href="/owner-login?forgot=1"')&&ownerLogin.includes('Forgot password?'),'owner login must show an inline forgot-password link');
must(migration.includes('password_reset_tokens')&&migration.includes('token_hash TEXT PRIMARY KEY'),'D1 migration must create hashed reset-token storage');

if(failures.length){
 console.error(`PASSWORD RECOVERY LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Password recovery lock: PASS — customer and owner portals share expiring one-time reset tokens, protected delivery, rate limits, KDF reuse, and session revocation.');

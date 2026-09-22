import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const recovery=read('worker/src/password-recovery.js');
const security=read('worker/src/security-hardening.js');
const securityEntrypoint=read('worker/src/security-entrypoint.js');
const template=read('frontend/app/template.tsx');
const overlay=read('frontend/app/password-recovery-overlay.tsx');
const customerLogin=read('frontend/app/login/page.tsx');
const ownerLogin=read('frontend/app/owner-login/page.tsx');
const dedicatedRecovery=read('frontend/app/forgot-password/page.tsx');
const account=read('frontend/app/account/page.tsx');
const migration=read('worker/migrations/0069_password_recovery.sql');
const nativeRecoveryMigration=read('worker/migrations/0086_native_account_recovery.sql');
const nativeMailer=read('magnanimous-runtime/src/native-mailer.mjs');
const standalone=read('magnanimous-runtime/src/server.mjs');
const mailMigration=read('worker/migrations/0085_magnanimous_native_mail.sql');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};

must(recovery.includes("'/api/auth/forgot-password'"),'forgot-password API route must exist');
must(recovery.includes("'/api/auth/reset-password'"),'reset-password API route must exist');
must(recovery.includes("'/api/auth/recovery-codes'"),'native recovery-code API route must exist');
must(recovery.includes("crypto.getRandomValues(new Uint8Array(32))"),'reset tokens must use 256-bit cryptographic randomness');
must(recovery.includes('token_hash')&&recovery.includes("crypto.subtle.digest('SHA-256'"),'reset tokens must be stored and matched by hash');
must(!/INSERT[^\n]+password_reset_tokens[^\n]+\btoken\b(?!_hash)/i.test(recovery),'plaintext reset tokens must never be inserted into storage');
must(recovery.includes('expires_at')&&recovery.includes('used_at'),'reset tokens must expire and be single use');
must(recovery.includes('createPasswordRecord(password,env)'),'new passwords must use the platform password KDF');
must(recovery.includes("revoke_reason='password_reset'"),'successful reset must revoke active opaque sessions');
must(recovery.includes('GENERIC_MESSAGE'),'forgot-password response must use generic anti-enumeration wording');

must(recovery.includes('RECOVERY_ALPHABET')&&recovery.includes('crypto.getRandomValues(new Uint8Array(24))'),'native recovery codes must use cryptographic randomness');
must(recovery.includes('account_recovery_codes')&&recovery.includes('sha256(normalizeRecoveryCode(code))'),'native recovery codes must be stored as hashes');
must(recovery.includes('currentUser(request,env)'),'trusted signed-in sessions must support provider-free recovery');
must(recovery.includes("recovery_method:String(source||'magnanimous-native')"),'provider-free recovery must identify its native Magnanimous method');

must(security.includes("'password-recovery'")&&security.includes("'password-reset'")&&security.includes("'recovery-codes'"),'all recovery endpoints must be rate limited');
must(security.includes("SECURITY_PASSWORD_RECOVERY_LIMIT || 8"),'password recovery must allow repeated attempts while preserving rate limiting');
must(security.includes('localRateLimit')&&security.includes('durable rate limiter unavailable; using bounded local fallback'),'recovery rate limiting must survive temporary D1 write-capacity failures');
must(!securityEntrypoint.includes('LOCAL_SECURITY_API_PATHS')&&securityEntrypoint.includes('proxyApiToStandalone(request,env)'),'password recovery must follow the same first-party standalone API data plane as login');
must(security.includes('handlePasswordRecovery(request, env)'),'recovery routes must pass through security preflight');

must(template.includes('<PasswordRecoveryOverlay'),'shared template must mount password recovery on login portals');
must(template.includes("path==='/login'")&&template.includes("path==='/owner-login'"),'both customer and owner login portals must expose recovery');
must(overlay.includes('/api/auth/forgot-password')&&overlay.includes('/api/auth/reset-password'),'recovery overlay must call both recovery APIs');
must(overlay.includes('recovery_code')&&overlay.includes('getPlatformAuthToken'),'recovery overlay must support native recovery codes and trusted sessions');
must(overlay.includes('history.replaceState'),'reset token must be removed from the visible URL after capture');
must(dedicatedRecovery.includes('/api/auth/forgot-password')&&dedicatedRecovery.includes('/api/auth/reset-password'),'dedicated recovery page must call both recovery APIs');
must(dedicatedRecovery.includes('recovery_code')&&dedicatedRecovery.includes('getPlatformAuthToken'),'dedicated recovery page must support native recovery codes and trusted sessions');
must(dedicatedRecovery.includes('CONTINUE SECURE RECOVERY')&&!dedicatedRecovery.includes('SEND RESET LINK'),'dedicated recovery UI must not depend on an external reset-mail promise');
must(dedicatedRecovery.includes("const brandLogo='data:image/webp;base64,")&&dedicatedRecovery.includes('src={brandLogo}'),'dedicated reset page must show the approved I AM MAGNANIMOUS WAY brand logo');
must(account.includes('/api/auth/recovery-codes')&&account.includes('CREATE RECOVERY CODES'),'signed-in users must be able to create one-time Magnanimous recovery codes');
must(customerLogin.includes('href="/forgot-password?portal=customer"')&&customerLogin.includes('Forgot password?'),'customer login must link to dedicated recovery');
must(ownerLogin.includes('href="/forgot-password?portal=owner"')&&ownerLogin.includes('Forgot password?'),'owner login must link to dedicated recovery');

must(migration.includes('password_reset_tokens')&&migration.includes('token_hash TEXT PRIMARY KEY'),'reset-token migration must create hashed token storage');
must(nativeRecoveryMigration.includes('account_recovery_codes')&&nativeRecoveryMigration.includes('code_hash TEXT NOT NULL UNIQUE'),'native recovery migration must create hashed recovery-code storage');
must(recovery.includes("SELECT 1 FROM password_reset_tokens LIMIT 1")&&recovery.includes("SELECT 1 FROM account_recovery_codes LIMIT 1"),'runtime recovery must verify migrated schemas');
must(!recovery.includes('CREATE TABLE IF NOT EXISTS'),'runtime recovery must not spend writes on DDL');

must(recovery.includes('sendWithMagnanimousMail')&&recovery.includes('env?.MAGNANIMOUS_MAIL'),'password recovery must use the native Magnanimous mail capability');
must(!recovery.includes('sendGrowthEmail')&&!recovery.includes('scopeTenantId')&&!recovery.includes('INKBOX_')&&!recovery.includes('inkbox.ai')&&!recovery.includes('sendWithCommunications'),'password recovery must not depend on outside mailbox or plug-in transports');
must(recovery.includes("'PASSWORD_RESET_DELIVERY_FAILED'"),'native mail failures must remain diagnosable');
must(nativeMailer.includes('node:dns/promises')&&nativeMailer.includes('node:net')&&nativeMailer.includes('node:tls'),'Magnanimous native mail must implement protocol-level SMTP/direct-MX capability without a plug-in SDK');
must(nativeMailer.includes('sensitive')&&mailMigration.includes('sensitive INTEGER'),'native mail audit must mark sensitive messages without persisting reset message bodies');
must(mailMigration.includes('magnanimous_mail_outbox')&&!mailMigration.includes('body_text')&&!mailMigration.includes('body_html'),'native password-reset audit must not create plaintext email-body storage');
must(standalone.includes('MAGNANIMOUS_MAIL: mailer')&&standalone.includes('native_transactional_mail: mailer.configured'),'standalone Magnanimous runtime must own the native mail binding and capability status');

if(failures.length){
 console.error(`PASSWORD RECOVERY LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Password recovery lock: PASS — Magnanimous-owned native mail plus trusted-session and hashed one-time recovery codes; no external mail plug-in dependency.');

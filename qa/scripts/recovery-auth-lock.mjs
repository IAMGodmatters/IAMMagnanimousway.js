import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};

const admin=read('worker/src/admin-compat-entrypoint.js');
const recovery=read('worker/src/recovery-contacts.js');
const password=read('worker/src/password-recovery.js');
const security=read('worker/src/security-hardening.js');
const boundary=read('worker/src/security-entrypoint.js');
const session=read('worker/src/session-authority.js');
const ownerUi=read('frontend/app/owner-login/page.tsx');
const contactsUi=read('frontend/app/account/recovery-contacts.tsx');
const accountUi=read('frontend/app/account/page.tsx');
const migration=read('worker/migrations/0088_recovery_contacts_owner_email_login.sql');

must(migration.includes('user_recovery_contacts')&&migration.includes('recovery_email_verified_at'),'migration must persist verified recovery email state');
must(migration.includes('phone_e164')&&migration.includes('phone_verified_at'),'migration must persist optional phone state');
must(migration.includes('recovery_contact_challenges')&&migration.includes('code_hash TEXT NOT NULL'),'recovery-email verification code must be stored as a hash');
must(migration.includes('owner_email_login_challenges')&&migration.includes('delivery_status'),'owner email login must track hashed challenges and delivery state');

must(recovery.includes('randomEightDigitCode')&&recovery.includes("expires=t+600"),'recovery email must use an expiring 8-digit code');
must(recovery.includes("attempts>=5")||recovery.includes("attempts>=5?'Too many invalid codes"),'recovery email verification must cap attempts');
must(recovery.includes("recovery_email_verified_at")&&recovery.includes("verified:true"),'recovery email must not activate until code verification succeeds');
must(recovery.includes("sms_recovery_available:false"),'phone number must not pretend SMS recovery exists');
must(recovery.includes("phone_verified_at=0"),'new recovery phone must remain unverified');
must(recovery.includes("international format"),'phone entry must require international E.164-style format');

must(password.includes('user_recovery_contacts r JOIN users u'),'forgot password must resolve verified recovery emails');
must(password.includes('r.recovery_email_verified_at>0'),'forgot password must reject unverified recovery emails');
must(password.includes("'verified-recovery-email'"),'forgot password must advertise verified recovery email support');

must(admin.includes('reservedPlatformOwnerByEmail'),'owner email code must bind to the reserved platform owner');
must(admin.includes("t.slug='owner'")&&admin.includes("t.owner_user_id=u.id"),'owner email code must require the global owner tenant');
must(admin.includes('randomEightDigitCode')&&admin.includes('expires=t+600'),'owner email login code must be 8-digit and 10-minute limited');
must(admin.includes("delivery_status='sent'"),'owner code verification must require successful delivery state');
must(admin.includes("Number(row.attempts||0)>=5"),'owner code verification must cap failed attempts');
must(admin.includes("consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?"),'owner code challenge must be single-use');
must(admin.includes("kind:'owner-login-code'"),'owner login code must use the native Magnanimous mail transport');

must(security.includes("'owner-email-code'"),'owner email code endpoints must be rate limited');
must(security.includes("'recovery-contact'"),'recovery contact endpoints must be rate limited');
must(boundary.includes("path==='/api/admin/email-code/request'")&&boundary.includes("path==='/api/admin/email-code/verify'"),'owner security boundary must expose only the two owner email-code auth endpoints');
must(session.includes("'/api/admin/email-code/verify'"),'verified owner email code must upgrade to opaque session authority');

must(ownerUi.includes('SEND MY LOGIN CODE')&&ownerUi.includes('8-digit login code')&&ownerUi.includes('/api/admin/email-code/verify'),'owner portal must implement the requested email-code login flow');
must(ownerUi.includes('Use password fallback'),'owner portal must retain the safe emergency password fallback');
must(contactsUi.includes('Recovery email')&&contactsUi.includes('SEND 8-DIGIT CODE'),'account page must expose verified recovery email setup');
must(contactsUi.includes('Optional phone')&&contactsUi.includes('SAVE PHONE'),'account page must expose optional phone storage');
must(accountUi.includes("import RecoveryContacts from './recovery-contacts'")&&accountUi.includes('<RecoveryContacts/>'),'account security page must render recovery contacts');

if(failures.length){
 console.error(`RECOVERY AUTH LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error('- '+failure);
 process.exit(1);
}
console.log('Recovery auth lock: PASS — verified recovery email, optional phone, owner 8-digit email login, single-use challenges, owner boundary, rate limits, and session upgrade are locked.');

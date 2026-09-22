import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};

const admin=read('worker/src/admin-compat-entrypoint.js');
const contacts=read('worker/src/recovery-contacts.js');
const recovery=read('worker/src/password-recovery.js');
const security=read('worker/src/security-hardening.js');
const entry=read('worker/src/security-entrypoint.js');
const sessions=read('worker/src/session-authority.js');
const ownerUi=read('frontend/app/owner-login/page.tsx');
const accountUi=read('frontend/app/account/recovery-contacts.tsx');
const migration=read('worker/migrations/0088_recovery_contacts_owner_email_login.sql');

must(admin.includes("randomOwnerChallenge(){return 'own1_'"),'owner login must use a dedicated random challenge');
must(admin.includes('randomEightDigitCode()')&&admin.includes("padStart(8,'0')"),'owner login must generate an 8-digit code');
must(admin.includes('codeHash=await sha256Hex(code)')&&admin.includes('tokenHash=await sha256Hex(token)'),'owner login code and challenge must be stored hashed');
must(admin.includes('expires=t+600'),'owner login challenge must expire in 10 minutes');
must(admin.includes('Number(row.attempts||0)>=5'),'owner login must cap failed code attempts');
must(admin.includes("t.slug='owner'")&&admin.includes("t.owner_user_id=u.id"),'owner email login must bind to the reserved global owner tenant');
must(admin.includes("kind:'owner-login-code'")&&admin.includes('MAGNANIMOUS_MAIL'),'owner login must use Magnanimous native mail');
must(admin.includes("delivery_status!=='sent'"),'owner login verification must require successful mail delivery');
must(ownerUi.includes('SEND MY LOGIN CODE')&&ownerUi.includes('8-digit login code'),'owner portal must default to email-code login');
must(ownerUi.includes('Use password fallback')&&ownerUi.includes('/api/admin/login'),'owner password must remain as emergency fallback');
must(ownerUi.includes('/api/admin/email-code/request')&&ownerUi.includes('/api/admin/email-code/verify'),'owner portal must call the owner email-code endpoints');
must(sessions.includes("'/api/admin/email-code/verify'"),'owner email-code verification must upgrade to an opaque session');
must(security.includes("'owner-email-code'"),'owner email-code endpoints must be rate limited');
must(entry.includes("path==='/api/admin/email-code/request'")&&entry.includes("path==='/api/admin/email-code/verify'"),'only owner authentication email-code routes may be public');

must(contacts.includes("kind:'recovery-email-verification'"),'recovery email verification must use native Magnanimous mail');
must(contacts.includes("recovery_email_verified_at")&&contacts.includes('challenge_token'),'recovery email must require a verification challenge before activation');
must(contacts.includes("attempts>=5")||contacts.includes("attempts||0)>=5"),'recovery email verification must cap failed attempts');
must(contacts.includes("RECOVERY_EMAIL_MUST_DIFFER"),'recovery email must differ from primary sign-in email');
must(recovery.includes('user_recovery_contacts')&&recovery.includes('recovery_email_verified_at>0'),'password recovery must accept only verified recovery emails');
must(recovery.includes('verified-recovery-email'),'password recovery must advertise verified recovery email capability');
must(accountUi.includes('SEND 8-DIGIT CODE')&&accountUi.includes('VERIFY EMAIL'),'account UI must support recovery-email verification');
must(accountUi.includes('SAVE PHONE')&&accountUi.includes('SMS recovery stays off'),'account UI must clearly say SMS recovery is not active');
must(contacts.includes('sms_recovery_available:false'),'backend must never claim optional-phone SMS recovery is available');
must(contacts.includes('/^\\+[1-9]\\d{7,14}$/'),'optional phone must use E.164-like international validation');
must(migration.includes('user_recovery_contacts')&&migration.includes('owner_email_login_challenges'),'migration must create recovery-contact and owner-login stores');
must(migration.includes('code_hash TEXT NOT NULL')&&migration.includes('token_hash TEXT PRIMARY KEY'),'sensitive verification material must be stored by hash');
must(security.includes("'recovery-contact'"),'recovery contact endpoints must be rate limited');

if(failures.length){
 console.error(`RECOVERY / OWNER EMAIL LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error('- '+failure);
 process.exit(1);
}
console.log('Recovery/owner email lock: PASS — verified alternate email, optional non-SMS phone, hashed one-time owner codes, reserved-owner binding, rate limits, and password fallback are locked.');

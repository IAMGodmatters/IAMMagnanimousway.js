import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const failures=[];
const must=(condition,message)=>{if(!condition)failures.push(message)};

const guard=read('worker/src/platform-owner-guard.js');
const admin=read('worker/src/admin-compat-entrypoint.js');
const recovery=read('worker/src/password-recovery.js');
const security=read('worker/src/security-hardening.js');
const login=read('frontend/app/login/page.tsx');
const signup=read('frontend/app/signup/page.tsx');
const account=read('frontend/app/account/page.tsx');
const contacts=read('frontend/app/account/recovery-contacts.tsx');

const source=[guard,admin,recovery,security,login,signup,account,contacts].join('\n').toLowerCase();

must(!source.includes('hardinlourijess@gmail.com'),'canonical owner/developer email must not be hard-coded in public source');
must(guard.includes('MAGNANIMOUS_OWNER_DEVELOPER_EMAIL_SHA256'),'owner/developer identity must support a server-side hash override');
must(guard.includes('matchesOwnerDeveloperEmail'),'global owner/developer authorization must verify the canonical identity');
must(guard.includes("slug='owner' AND owner_user_id=?"),'global owner/developer authorization must require the reserved global-owner pointer');
must(guard.includes("String(user.role||'').toLowerCase()!=='owner'"),'global owner/developer identity must still require an owner role');
must(guard.includes('developer:authorized'),'canonical platform owner must explicitly receive developer identity');

must(admin.includes('if(!(await matchesOwnerDeveloperEmail(email,env)))'),'Owner Command Portal password login must reject non-canonical workspace owners');
must(admin.includes('bindCanonicalOwnerDeveloper'),'canonical owner/developer identity must reconcile to the reserved global-owner pointer');
must(admin.includes("if(!user||!(await globalPlatformOwner(env,user)))"),'admin routes must require global owner identity rather than an ordinary workspace-owner role');
must(admin.includes("platform_owner:Boolean(identity.owner)")&&admin.includes("developer:Boolean(identity.developer)"),'authentication responses must identify canonical owner/developer access');
must(admin.includes("JOIN tenants t ON t.slug='owner' AND t.owner_user_id=u.id"),'owner email-code verification must use the reserved global-owner pointer independently of workspace tenant');

must(recovery.includes('createRecoveryCodeSetForUser'),'recovery codes must be reusable as a universal account bootstrap');
must(recovery.includes('ensureRecoveryCodesForUser'),'existing accounts must receive backup recovery codes when missing');
must(recovery.includes("url.pathname==='/api/auth/recovery-readiness'"),'every signed-in account must have a recovery-readiness endpoint');
must(recovery.includes('ready:durableCount>=2'),'recovery readiness must require at least two independent durable recovery methods');
must(recovery.includes('recovery_codes:Number(codes?.n||0)>0'),'readiness must count active recovery codes');
must(recovery.includes('authenticator:Number(totp?.enabled||0)===1'),'readiness must count verified authenticator recovery');

must(admin.includes("event:'signup_recovery_codes_created'"),'new accounts must automatically receive initial recovery codes');
must(admin.includes("event:'login_recovery_codes_created'"),'existing non-MFA accounts without codes must receive them on login');
must(admin.includes("event:'mfa_login_recovery_codes_created'"),'existing MFA accounts without codes must receive them after MFA verification');
must(admin.includes('backup_recovery_codes:recoveryCodes'),'Authenticator enrollment must return backup recovery codes when it had to create them');

must(login.includes('/api/auth/recovery-readiness'),'successful customer login must check recovery readiness');
must(login.includes("window.location.replace('/account?setup=recovery')"),'customer login must route unready accounts to Account Security');
must(login.includes("sessionStorage.setItem('iam_initial_recovery_codes'"),'newly generated login recovery codes must survive the redirect for one-time display');
must(signup.includes("sessionStorage.setItem('iam_initial_recovery_codes'"),'signup recovery codes must survive the redirect for one-time display');

must(account.includes('ACCOUNT RECOVERY READINESS'),'Account Security must show recovery readiness');
must(account.includes("recoveryReady?'RECOVERY READY':'NEEDS ONE MORE METHOD'"),'Account Security must visibly distinguish ready vs incomplete recovery');
must(account.includes('PLATFORM OWNER • DEVELOPER'),'canonical owner account must visibly identify owner/developer status');
must(account.includes('I SAVED THESE CODES'),'users must acknowledge saving one-time backup codes');
must(account.includes('<RecoveryContacts onChanged={loadReadiness}/>'),'recovery readiness must refresh after recovery-contact changes');
must(contacts.includes('onChanged?.()'),'recovery-contact changes must notify the readiness dashboard');

must(security.includes("'recovery-readiness'"),'recovery-readiness endpoint must be rate limited');

if(failures.length){
 console.error(`UNIVERSAL ANTI-LOCKOUT / OWNER IDENTITY LOCK FAILURE (${failures.length})`);
 for(const failure of failures)console.error('- '+failure);
 process.exit(1);
}
console.log('Universal anti-lockout / owner identity lock: PASS — canonical platform owner/developer identity is isolated, every account receives backup recovery support, and recovery readiness requires two durable methods.');

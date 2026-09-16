import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function must(condition,message){if(!condition)throw new Error(message)}
function mustContain(text,value,message){must(text.includes(value),message)}
function mustNotContain(text,value,message){must(!text.includes(value),message)}
function packageJson(path){return JSON.parse(read(path))}

const password=read('worker/src/password-security.js');
const admin=read('worker/src/admin-compat-entrypoint.js');
const entry=read('worker/src/entrypoint.js');
const security=read('worker/src/security-hardening.js');
const securityEntry=read('worker/src/security-entrypoint.js');
const revocation=read('worker/src/session-revocation.js');
const authority=read('worker/src/session-authority.js');
const authorityMigration=read('worker/migrations/0057_opaque_auth_sessions.sql');
const observability=read('worker/src/request-observability.js');
const layout=read('frontend/app/layout.tsx');
const runtime=read('frontend/app/platform-runtime-script.tsx');
const template=read('frontend/app/template.tsx');
const robots=read('frontend/public/robots.txt');
const sitemap=read('frontend/public/sitemap.xml');
const wrangler=read('worker/wrangler.jsonc');
const deploy=read('.github/workflows/deploy.yml');

mustContain(password,"const PBKDF2_PREFIX = 'pbkdf2-sha256'",'Modern password algorithm identifier is missing.');
mustContain(password,'const DEFAULT_ITERATIONS = 600000','PBKDF2 default work factor regressed.');
mustContain(password,"name: 'PBKDF2'",'Password derivation is no longer PBKDF2.');
mustContain(password,"algorithm: 'legacy-sha256'",'Legacy password compatibility/upgrade path is missing.');
mustContain(password,'upgradePasswordIfNeeded','Transparent legacy-password upgrade helper is missing.');

mustContain(admin,"from './password-security.js'",'Account runtime must use the password-security module.');
mustContain(admin,'verifyPassword(password','Login must verify through the hardened password module.');
mustContain(admin,'upgradePasswordIfNeeded','Successful legacy logins must upgrade their stored hash.');
mustContain(admin,'password.length < 10','New-account minimum password length regressed.');
mustNotContain(admin,'async function passwordHash(','Fast local password hashing must not return to the account runtime.');
mustNotContain(admin,"return json({ detail: e?.message",'Unexpected account-service errors must not be reflected directly to clients.');

mustContain(entry,"from './password-security.js'",'Owner bootstrap must use hardened password storage.');
mustContain(entry,'ensureRuntimeBootstrap','Runtime bootstrap caching is missing.');
mustContain(entry,'bootstrapReady=true','Runtime bootstrap must mark successful initialization.');
mustNotContain(entry,"digest('SHA-256',new TextEncoder().encode(`${salt}:${password}`))",'Fast owner-password hashing must not return.');

mustContain(revocation,'auth_revoked_sessions','Server-side revoked-session registry is missing.');
mustContain(revocation,"await sha256(token)",'Revocation registry must fingerprint bearer tokens before persistence.');
mustNotContain(revocation,'INSERT INTO auth_revoked_sessions(token,','Raw bearer tokens must never be stored in the revocation table.');
mustContain(revocation,'expires_at<=?','Expired session-revocation rows must be cleanable.');
mustContain(security,"from './session-revocation.js'",'Central security boundary must import session revocation.');
mustContain(security,'await isRequestSessionRevoked(request, env)','Every authorized legacy API request must honor revoked sessions.');
mustContain(security,"code: 'SESSION_REVOKED'",'Revoked legacy sessions must return an explicit safe error code.');
mustContain(security,"url.pathname === '/api/auth/logout'",'Legacy logout must remain intercepted at the central security boundary.');
mustContain(security,"await revokeRequestSession(request, env, 'logout')",'Legacy logout must revoke the presented bearer session.');

mustContain(authority,"const OPAQUE_PREFIX='ms1_'",'Versioned opaque session identifier is missing.');
mustContain(authority,'crypto.getRandomValues(new Uint8Array(32))','Opaque session IDs must use at least 256 bits of CSPRNG material.');
mustContain(authority,"await sha256(token)",'Opaque session persistence must fingerprint tokens before storage.');
mustNotContain(authority,'INSERT INTO auth_sessions(token,','Raw opaque bearer tokens must never be persisted.');
mustContain(authority,'JOIN users u ON u.id=s.user_id AND u.tenant_id=s.tenant_id','Opaque sessions must revalidate user and tenant identity server-side.');
mustContain(authority,"revoke_reason='role_changed'",'Privilege changes must force opaque-session renewal.');
mustContain(authority,'now()+60','Legacy compatibility credentials must remain short-lived and internal only.');
mustContain(authority,"['/api/auth/signup','/api/auth/login','/api/admin/login']",'Successful account authentication must be upgraded to opaque browser sessions.');
mustContain(authorityMigration,'CREATE TABLE IF NOT EXISTS auth_sessions','Opaque session migration is missing.');
mustContain(authorityMigration,'token_hash TEXT PRIMARY KEY','Opaque session table must persist only a token fingerprint.');
mustNotContain(authorityMigration,'token TEXT','Opaque session schema must never include a raw token column.');
mustContain(securityEntry,"from './session-authority.js'",'Production entrypoint must mount the opaque session authority.');
mustContain(securityEntry,'resolveSessionRequest(request,env,requestId)','Opaque sessions must resolve before legacy feature routing.');
mustContain(securityEntry,"revokeOpaqueSession(request,env,'logout')",'Opaque logout must revoke the server-side session directly.');
mustContain(securityEntry,'upgradeAuthResponseToOpaque(request,resilientResponse,env)','New browser sessions must be replaced with opaque tokens before responses leave the Worker.');

mustContain(observability,'x-request-id','Every production response must expose a correlation identifier.');
mustContain(observability,"console.error('unhandled platform request failure'",'Unhandled failures must be correlated and logged server-side.');
mustContain(observability,"code:'INTERNAL_ERROR'",'Unhandled API failures must use the safe public error contract.');
mustContain(observability,"x-robots-tag','noindex, nofollow, noarchive, nosnippet'",'Private page routes must emit route-level noindex headers.');
mustContain(observability,"'/owner-'",'Owner surfaces must remain in the route-level noindex boundary.');
mustContain(observability,"'/mux'",'Mux workspace must remain in the route-level noindex boundary.');
mustContain(observability,"if(prefix.endsWith('-'))",'Prefix-only private route families must be explicit rather than overmatching unrelated public routes.');
mustContain(securityEntry,"from './request-observability.js'",'Production entrypoint must mount request observability.');
mustContain(securityEntry,'unhandledRequestFailure(request,error)','Production entrypoint must convert unhandled failures into safe correlated responses.');
mustContain(securityEntry,'finalizeResponse(request','Production responses must pass through the observability/indexing boundary.');

mustContain(layout,"import PlatformRuntimeScript from './platform-runtime-script'",'Root layout must use the hardened platform runtime.');
mustNotContain(layout,'new MutationObserver','Root layout must not reintroduce its old inline full-DOM observer.');
mustContain(runtime,"var sessionPrefix='iam_session_draft:'",'Generic draft recovery must default to session storage.');
mustContain(runtime,"data-persist-draft",'Persistent draft storage must be explicit opt-in.');
mustContain(runtime,'mutation.addedNodes.forEach','DOM cleanup must remain incremental.');
mustContain(runtime,"fetch('/api/auth/me'",'Protected client sessions must be periodically revalidated.');
mustContain(runtime,"script[data-iam-adsense=\"true\"],#iam-adsense",'Global ad loading must remain deduplicated.');
mustContain(runtime,"var publicPaths=['/'",'Homepage must remain a public discovery surface.');
mustContain(runtime,"'/business-plan'",'Public business-plan discovery route is missing.');
mustContain(template,"const publicPaths=new Set(['/','/teach'",'Template public/private chrome must align with discovery routing.');

for(const path of ['/api/','/owner-','/owner-center/','/crm/','/telecom/','/assistant-actions/','/mux/'])mustContain(robots,`Disallow: ${path}`,`Crawler boundary missing for ${path}`);
for(const path of ['/white-label/','/shop/','/teach/','/advertise/'])mustContain(sitemap,`https://iammagnanimousway.com${path}`,`Public sitemap entry missing for ${path}`);
mustContain(wrangler,'"main": "src/security-entrypoint.js"','Production Worker must remain behind the central security entrypoint.');

mustContain(deploy,'run: npm ci --no-audit --no-fund','Production deploy must install from committed lockfiles with npm ci.');
mustNotContain(deploy,'run: npm install\n','Production deploy must not resolve dependencies with npm install.');
mustContain(deploy,"assert token.startswith('ms1_')",'Production smoke test must prove new sessions are opaque.');
mustContain(deploy,"assert '|' not in token",'Production smoke test must prove browser session tokens do not embed legacy identity fields.');
mustContain(deploy,'Opaque-session logout returned HTTP','Production smoke test must exercise opaque logout.');
mustContain(deploy,'Revoked opaque session expected HTTP 401','Production smoke test must prove logout invalidates the session server-side.');

for(const dir of ['frontend','worker','video-gateway','qa']){
  const pkg=packageJson(`${dir}/package.json`);
  for(const section of ['dependencies','devDependencies']){
    for(const [name,value] of Object.entries(pkg[section]||{})){
      must(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(value)),`${dir} ${section}.${name} must use an exact version, got ${value}`);
    }
  }
}

console.log('Full-platform hardening contracts verified.');

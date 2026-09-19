import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const base=read('worker/src/index.js');
const security=read('worker/src/security-hardening.js');
const sessions=read('worker/src/session-authority.js');
const obs=read('worker/src/request-observability.js');
const adminCompat=read('worker/src/admin-compat-entrypoint.js');
const migration=read('worker/migrations/0080_runtime_bootstrap_quota_hardening.sql');
const authMigration=read('worker/migrations/0081_admin_auth_quota_hardening.sql');
const deploy=read('.github/workflows/deploy.yml');
const maintenance=read('.github/workflows/d1-deferred-maintenance.yml');

const checks=[];
const add=(name,ok)=>checks.push([name,Boolean(ok)]);

const initStart=base.indexOf('async function init(env){');
const initEnd=base.indexOf('function tenantRequired',initStart);
const initBlock=initStart>=0&&initEnd>initStart?base.slice(initStart,initEnd):'';
add('base runtime init exists',Boolean(initBlock));
add('base runtime init is memoized per isolate',base.includes('let initPromise=null;')&&initBlock.includes('if(initPromise)return initPromise'));
add('base runtime init does not create tables',!initBlock.includes('CREATE TABLE'));
add('base runtime init does not create indexes',!initBlock.includes('CREATE INDEX'));
add('base runtime init does not seed default settings on every request',!initBlock.includes('INSERT OR IGNORE INTO settings'));
add('legacy tenant repair is conditional on a read probe',initBlock.includes('WHERE tenant_id IS NULL LIMIT 1'));

const rateStart=security.indexOf('async function ensureRateSchema');
const rateEnd=security.indexOf('async function rateLimit',rateStart);
const rateBlock=security.slice(rateStart,rateEnd);
add('rate-limit schema is migration-owned',rateBlock.includes("SELECT 1 FROM security_rate_limits LIMIT 1")&&!rateBlock.includes('CREATE TABLE'));

const sessionStart=sessions.indexOf('async function ensureSchema');
const sessionEnd=sessions.indexOf('function parseLegacyToken',sessionStart);
const sessionBlock=sessions.slice(sessionStart,sessionEnd);
add('opaque-session schema is migration-owned',sessionBlock.includes("SELECT 1 FROM auth_sessions LIMIT 1")&&!sessionBlock.includes('CREATE TABLE'));

add('migration owns tenant settings',migration.includes('CREATE TABLE IF NOT EXISTS tenant_settings'));
add('migration owns settings',migration.includes('CREATE TABLE IF NOT EXISTS settings'));
add('migration owns rate-limit table',migration.includes('CREATE TABLE IF NOT EXISTS security_rate_limits'));
add('auth migration owns auth events',authMigration.includes('CREATE TABLE IF NOT EXISTS auth_events'));
add('auth migration owns auth config',authMigration.includes('CREATE TABLE IF NOT EXISTS auth_config'));
add('auth migration owns auth events index',authMigration.includes('CREATE INDEX IF NOT EXISTS idx_auth_events_user'));

add('D1 row write limit has explicit 503 code',obs.includes("D1_DAILY_ROW_WRITE_LIMIT"));
add('D1 row read limit has explicit 503 code',obs.includes("D1_DAILY_ROW_READ_LIMIT"));
add('quota response reports UTC reset',obs.includes('resets_at_utc:nextUtcReset()'));
add('generic internal errors remain 500',obs.includes("code:'INTERNAL_ERROR'"));

const compatTablesStart=adminCompat.indexOf('async function ensureTables');
const compatTablesEnd=adminCompat.indexOf('async function ensureLegacyCompatibility',compatTablesStart);
const compatTables=adminCompat.slice(compatTablesStart,compatTablesEnd);
const compatLegacyStart=adminCompat.indexOf('async function ensureLegacyCompatibility');
const compatLegacyEnd=adminCompat.indexOf('async function logAuth',compatLegacyStart);
const compatLegacy=adminCompat.slice(compatLegacyStart,compatLegacyEnd);
const authSecretStart=adminCompat.indexOf('async function authSecret');
const authSecretEnd=adminCompat.indexOf('async function makeSession',authSecretStart);
const authSecretBlock=adminCompat.slice(authSecretStart,authSecretEnd);
add('admin compatibility runtime imports shared quota-aware failure handler',adminCompat.includes("import {unhandledRequestFailure} from './request-observability.js'"));
add('admin compatibility outer catch delegates quota errors to shared handler',adminCompat.includes('return unhandledRequestFailure(request,e);'));
add('admin compatibility table checks are read-only',compatTables.includes('SELECT id,name,slug')&&!compatTables.includes('CREATE TABLE')&&!compatTables.includes('CREATE INDEX'));
add('admin legacy compatibility is read-only',compatLegacy.includes('SELECT id,tenant_id,name')&&!compatLegacy.includes('ALTER TABLE')&&!compatLegacy.includes('UPDATE users'));
add('auth secret lookup no longer creates schema at request time',authSecretBlock.includes('SELECT value FROM auth_config')&&!authSecretBlock.includes('CREATE TABLE'));
add('admin auth accepts persistent Worker SESSION_SECRET without auth_config table',compatTables.includes("if (!String(env.SESSION_SECRET || '').trim())")&&compatTables.includes("SELECT key,value FROM auth_config LIMIT 1")&&authSecretBlock.includes("const configured = String(env.SESSION_SECRET || '').trim()"));

add('deploy defers only exact D1 quota auth codes',deploy.includes('D1_DAILY_ROW_WRITE_LIMIT')&&deploy.includes('D1_DAILY_ROW_READ_LIMIT')&&deploy.includes('Production auth mutation smoke deferred because Cloudflare D1 reported'));
add('migration defer requires exact Cloudflare D1 write-limit text',deploy.includes("exceeded D1's free tier daily row write limit")&&deploy.includes('Cannot defer pending runtime migrations'));
add('migration confirmation is noninteractive without unsupported Wrangler flags',deploy.includes("printf 'y\\n' | npx wrangler d1 migrations apply iam-magnanimous-db --remote")&&!deploy.includes('migrations apply iam-magnanimous-db --remote --yes'));
add('deploy ensures a persistent server-side session secret before migrations',deploy.includes('Ensure persistent Worker session secret')&&deploy.includes('wrangler secret list --format json')&&deploy.includes('openssl rand -hex 48')&&deploy.includes('wrangler secret put SESSION_SECRET'));
add('migration defer requires core runtime tables while allowing migration-owned auth_config to catch up later',deploy.includes("required={'tenant_settings','ads','settings','security_rate_limits','auth_events'}")&&deploy.includes("auth_config_present='auth_config' in names")&&deploy.includes('SESSION_SECRET is ensured as the stable server-side auth signing source'));
add('deferred D1 maintenance retries after UTC quota reset',maintenance.includes("cron: '17 0 * * *'")&&maintenance.includes('Apply deferred D1 migrations')&&maintenance.includes('materialize-full-brain-d1.mjs'));
add('deferred D1 maintenance is idempotent and verifies the full brain digest',maintenance.includes('Production D1 already matches the checked-in full-brain digest')&&maintenance.includes("assert row['source_digest'] == os.environ['DIGEST']")&&maintenance.includes("assert row['status'] == 'complete'"));
add('non-quota migration failures still stop deployment',deploy.includes('else\n              exit "$rc"'));
add('ordinary signup failures still fail deployment',deploy.includes('Signup smoke test returned HTTP $status')&&deploy.includes('exit 1'));
add('quota branch never claims signup passed',deploy.includes('This is an external daily Free-plan limit, not a passing signup result.'));

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`D1 quota resilience lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`D1 quota resilience lock: ${checks.length} checks passed.`);

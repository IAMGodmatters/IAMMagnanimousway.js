import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const base=read('worker/src/index.js');
const security=read('worker/src/security-hardening.js');
const sessions=read('worker/src/session-authority.js');
const obs=read('worker/src/request-observability.js');
const adminCompat=read('worker/src/admin-compat-entrypoint.js');
const securityEntry=read('worker/src/security-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
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

add('Cloudflare API edge routes to standalone Magnanimous data plane before D1 work',securityEntry.includes('proxyApiToStandalone(request,env)')&&securityEntry.indexOf('proxyApiToStandalone(request,env)')<securityEntry.indexOf('requestCorrelationId(request)'));
add('standalone runtime never self-proxies through the Cloudflare edge',securityEntry.includes("MAGNANIMOUS_RUNTIME||''")&&securityEntry.includes("==='standalone-node'"));
add('standalone proxy has explicit loop protection',securityEntry.includes("x-magnanimous-standalone-proxy")&&securityEntry.includes("==='1'"));
add('credential vault rewrap remains on the Cloudflare source vault instead of the standalone target',securityEntry.includes("if(url.pathname==='/api/internal/migration/rewrap-platform-credentials')return null;")&&securityEntry.indexOf("if(url.pathname==='/api/internal/migration/rewrap-platform-credentials')return null;")<securityEntry.indexOf('const origin=configuredStandaloneApiOrigin(env);'));
add('standalone proxy keeps Cloudflare as a truthful rollback path',securityEntry.includes('retaining Cloudflare rollback path')&&securityEntry.includes('return null;'));
add('Cloudflare production config points API traffic at the Magnanimous standalone origin',wrangler.includes('"MAGNANIMOUS_STANDALONE_API_ORIGIN": "https://magnanimous-production.up.railway.app"'));

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
add('auth_config fallback table is not required on every request when SESSION_SECRET is configured',!compatTables.includes("SELECT key,value FROM auth_config"));
add('admin legacy compatibility is read-only',compatLegacy.includes('SELECT id,tenant_id,name')&&!compatLegacy.includes('ALTER TABLE')&&!compatLegacy.includes('UPDATE users'));
add('auth secret lookup no longer creates schema at request time',authSecretBlock.includes('SELECT value FROM auth_config')&&!authSecretBlock.includes('CREATE TABLE'));

add('deploy defers only exact D1 quota auth codes',deploy.includes('D1_DAILY_ROW_WRITE_LIMIT')&&deploy.includes('D1_DAILY_ROW_READ_LIMIT')&&deploy.includes('Production auth mutation smoke deferred because Cloudflare D1 reported'));
add('migration defer requires exact Cloudflare D1 write-limit text',deploy.includes("exceeded D1's free tier daily row write limit")&&deploy.includes('Cannot defer pending runtime migrations'));
add('migration confirmation is noninteractive without unsupported Wrangler flags',deploy.includes("printf 'y\\n' | npx wrangler d1 migrations apply iam-magnanimous-db --remote")&&!deploy.includes('migrations apply iam-magnanimous-db --remote --yes'));
add('migration defer proves all always-required runtime/auth tables already exist',deploy.includes("required={'tenant_settings','ads','settings','security_rate_limits','auth_events'}")&&deploy.includes('required production tables already exist'));
add('auth_config remains migration-owned but optional during quota deferral when SESSION_SECRET is configured',authMigration.includes('CREATE TABLE IF NOT EXISTS auth_config')&&deploy.includes('auth_config may remain pending because SESSION_SECRET'));
add('deploy guarantees a persistent Worker SESSION_SECRET without exposing its value',deploy.includes('Ensure persistent Worker session secret')&&deploy.includes('wrangler secret list --format json')&&deploy.includes('openssl rand -hex 48')&&deploy.includes('wrangler secret put SESSION_SECRET')&&deploy.includes('without exposing its value'));
add('deferred D1 maintenance retries after the UTC quota reset',maintenance.includes("cron: '5 0 * * *'")&&maintenance.includes('Apply deferred D1 migrations')&&maintenance.includes('materialize-full-brain-d1.mjs'));
add('full-brain D1 materialization skips immediately when migration access was deferred',deploy.includes('D1_MIGRATION_DEFERRED:-0')&&deploy.includes('Skipping durable full-brain D1 materialization')&&deploy.includes('deferred maintenance will reconcile the durable cache later'));
add('stale-row pruning retries transient D1 import locks',deploy.includes('Transient Cloudflare D1 failure during stale-row pruning')&&deploy.includes('Currently processing a long-running import')&&deploy.includes('prune_attempt'));
add('stale-row pruning can defer after bounded transient retries',deploy.includes('Durable cleanup is deferred; Worker deployment will continue with the checked-in Magnanimous brain manifest.'));
add('deferred maintenance remains idempotent and verifies the checked-in brain digest',maintenance.includes('Production D1 already matches full-brain digest')&&maintenance.includes("assert row['source_digest'] == os.environ['DIGEST']")&&maintenance.includes("assert row['status'] == 'complete'"));
add('transient D1 migration failures use bounded retry',deploy.includes('Transient Cloudflare D1 migration failure. Retrying migration application')&&deploy.includes('if [ "$attempt" -lt 4 ]'));
add('transient migration defer is forbidden when migration files changed',deploy.includes('if [ "$migration_files_changed" -eq 0 ]')&&deploy.includes('this commit does not change worker/migrations'));
const fetchDepth=Number((deploy.match(/fetch-depth:\\s*(\\d+)/)||[])[1]||0);
add('deploy checkout includes parent commit for migration diff safety',fetchDepth>=2&&deploy.includes('git -C .. diff --quiet HEAD^ HEAD -- worker/migrations'));
add('schema-changing or non-transient migration failures still stop deployment',deploy.includes('migration_files_changed=1')&&deploy.includes('exit "$rc"'));
add('ordinary signup failures still fail deployment',deploy.includes('Signup smoke test returned HTTP $status')&&deploy.includes('exit 1'));
add('quota branch never claims signup passed',deploy.includes('This is an external daily Free-plan limit, not a passing signup result.'));

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`D1 quota resilience lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`D1 quota resilience lock: ${checks.length} checks passed.`);

import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const base=read('worker/src/index.js');
const security=read('worker/src/security-hardening.js');
const sessions=read('worker/src/session-authority.js');
const obs=read('worker/src/request-observability.js');
const migration=read('worker/migrations/0080_runtime_bootstrap_quota_hardening.sql');
const deploy=read('.github/workflows/deploy.yml');

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

add('D1 row write limit has explicit 503 code',obs.includes("D1_DAILY_ROW_WRITE_LIMIT"));
add('D1 row read limit has explicit 503 code',obs.includes("D1_DAILY_ROW_READ_LIMIT"));
add('quota response reports UTC reset',obs.includes('resets_at_utc:nextUtcReset()'));
add('generic internal errors remain 500',obs.includes("code:'INTERNAL_ERROR'"));

add('deploy defers only exact D1 quota auth codes',deploy.includes('D1_DAILY_ROW_WRITE_LIMIT')&&deploy.includes('D1_DAILY_ROW_READ_LIMIT')&&deploy.includes('Production auth mutation smoke deferred because Cloudflare D1 reported'));
add('ordinary signup failures still fail deployment',deploy.includes('Signup smoke test returned HTTP $status')&&deploy.includes('exit 1'));
add('quota branch never claims signup passed',deploy.includes('This is an external daily Free-plan limit, not a passing signup result.'));

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`D1 quota resilience lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`D1 quota resilience lock: ${checks.length} checks passed.`);

import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const security = read('worker/src/security-entrypoint.js');
const admin = read('worker/src/admin-compat-entrypoint.js');
const wrangler = read('worker/wrangler.jsonc');
const deploy = read('.github/workflows/deploy.yml');
const railway = read('.github/workflows/magnanimous-railway-deploy.yml');
const dataStage = read('.github/workflows/magnanimous-production-data-stage.yml');

const checks = [
  ['Cloudflare Worker + D1 are production authority', !wrangler.includes('MAGNANIMOUS_STANDALONE_API_ORIGIN')],
  ['standalone proxy has no configured production origin', security.includes('configuredStandaloneApiOrigin') && !wrangler.includes('magnanimous-production.up.railway.app')],
  ['Railway deploy is manual opt-in only', !railway.includes('  push:\n') && railway.includes("MAGNANIMOUS_ENABLE_OPTIONAL_RAILWAY == 'true'")],
  ['D1-to-standalone production data staging is manual opt-in only', !dataStage.includes('  push:\n') && dataStage.includes("MAGNANIMOUS_ENABLE_OPTIONAL_RAILWAY == 'true'")],
  ['signup checks every existing email including inactive rows', admin.includes("SELECT id,active FROM users WHERE lower(email)=? ORDER BY created_at ASC LIMIT 1")],
  ['signup never silently recreates an inactive identity', admin.includes("'ACCOUNT_RECOVERY_REQUIRED'") && admin.includes('account_preserved: true')],
  ['deploy captures a D1 Time Travel restore point before migrations', deploy.includes('d1 time-travel info iam-magnanimous-db --json') && deploy.includes('D1_PRE_MIGRATION_BOOKMARK')],
  ['deploy snapshots durable user and tenant IDs before migrations', deploy.includes('/tmp/d1-users-before.json') && deploy.includes('/tmp/d1-tenants-before.json')],
  ['deploy snapshots email/password credential state without logging plaintext credentials', deploy.includes('/tmp/d1-auth-before.json') && deploy.includes('password_hash, password_salt, active FROM users ORDER BY id')],
  ['deploy verifies all pre-deploy identities remain after migrations', deploy.includes('missing_users=before_users-after_users') && deploy.includes('missing_tenants=before_tenants-after_tenants')],
  ['deploy rejects email/password credential drift and restores the database', deploy.includes('credential_drift={uid for uid,credential in before_auth.items()') && deploy.includes('Durable identity or credential loss detected after migrations')],
  ['deploy automatically restores D1 if identity rows disappear', deploy.includes('d1 time-travel restore iam-magnanimous-db --bookmark') && deploy.includes('Deployment stopped and D1 was restored')],
  ['platform owner identity is included in the migration guard', deploy.includes('platform_owner_id') && deploy.includes('platform_owner_lost')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
if (failed.length) {
  console.error(`Account persistence lock failed: ${failed.length} check(s).`);
  process.exit(1);
}
console.log(`Account persistence lock: ${checks.length} checks passed.`);

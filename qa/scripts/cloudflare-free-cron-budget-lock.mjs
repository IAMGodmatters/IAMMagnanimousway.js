import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const ops = read('worker/src/operations-entrypoint.js');
const routines = read('worker/src/magnanimous-skill-routine-runtime.js');
const nativeWeb = read('worker/src/magnanimous-native-web-runtime.js');
const emailWatch = read('worker/src/magnanimous-telecom-email-watch.js');
const attentionWatch = read('worker/src/magnanimous-native-attention-watch.js');
const wrangler = read('worker/wrangler.jsonc');
const pkg = JSON.parse(read('frontend/package.json'));
const start = ops.indexOf(' async scheduled(controller,env,ctx){');
const end = ops.indexOf('\n }\n};', start);
const scheduled = start >= 0 && end > start ? ops.slice(start, end + 3) : '';

const checks = [
  ['scheduled handler exists and uses deterministic scheduledTime slots', scheduled.includes('controller?.scheduledTime') && scheduled.includes('/900000)%4')],
  ['four cron lanes are present', ['slot===0','slot===1','slot===2','slot===3'].every(slot => scheduled.includes(slot))],
  ['meeting retention cleanup remains on every 15-minute tick', scheduled.includes('pruneExpiredMeetingRooms(env)')],
  ['social publishing remains on every 15-minute tick', scheduled.includes('scheduledSocialPublishing(env)')],
  ['store commerce is retained in two lanes', (scheduled.match(/scheduledNativeStoreCommerce\(env\)/g)||[]).length === 2],
  ['growth recovery remains scheduled', scheduled.includes('scheduledGrowth(env,origin)')],
  ['native web monitoring remains scheduled', scheduled.includes('scheduledNativeWeb(env)')],
  ['capability mesh checks remain scheduled', scheduled.includes('scheduledMagnanimousCapabilityMesh(env)')],
  ['routines remain scheduled in two lanes', (scheduled.match(/scheduledMagnanimousRoutines\(env\)/g)||[]).length === 2],
  ['self-healing remains scheduled', scheduled.includes('scheduledSelfHealing(env,origin)')],
  ['Telecom email watch remains scheduled', scheduled.includes('scheduledTelecomEmailWatch(env)')],
  ['native attention watch remains scheduled', scheduled.includes('scheduledMagnanimousAttentionWatch(env)')],
  ['continuous learning remains scheduled when the native fallback owns it', scheduled.includes('continuousLearningRunsLocally(env)') && scheduled.includes('runContinuousLearningCycle(env,{source:\'cron\'})')],
  ['routine retries are processed in a bounded batch', routines.includes("status IN ('waiting_external','retry_wait') ORDER BY updated_at ASC LIMIT 4")],
  ['routine starts are processed in a bounded batch', routines.includes("status='active' AND next_run_at<=? ORDER BY next_run_at ASC LIMIT 3")],
  ['native web pending monitor batch is bounded', nativeWeb.includes("last_task_id IS NOT NULL LIMIT 10")],
  ['native web due monitor batch is bounded', nativeWeb.includes("next_run_at<=? ORDER BY next_run_at ASC LIMIT 5")],
  ['Telecom email watch fetches a bounded page', emailWatch.includes('messages?maxResults=10&q=')],
  ['attention email scan is bounded', attentionWatch.includes('messages?maxResults=10&q=')],
  ['attention message/call/voicemail/work scans are bounded', (attentionWatch.match(/LIMIT 20/g)||[]).length >= 4],
  ['free-tier cron cadence remains 15 minutes', wrangler.includes('"crons": ["*/15 * * * *"]')],
  ['the budget lock is part of the platform contract audit', pkg.scripts['platform-contract-audit'].includes('cloudflare-free-cron-budget-lock.mjs')],
];

const failures = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length) {
  console.error(`Cloudflare free CPU budget lock failed: ${failures.length} check(s).`);
  process.exit(1);
}
console.log('Cloudflare free CPU budget contract passed.');

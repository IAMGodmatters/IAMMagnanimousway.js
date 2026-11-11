import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep this manifest explicit: every suite here is deterministic, uses local
// fixtures/mocks, and must never place paid calls or mutate production services.
const testFiles = [
  'qa/scripts/home-health.test.mjs',
  'qa/scripts/prepaid-wallet.test.mjs',
  'qa/scripts/tv-companion-lock.mjs',
  'worker/test/magnanimous-model-calibration.test.js',
  'video-gateway/test/security.test.mjs',
  'tools/native-investigation/inspect.test.mjs',
  'research-core/model-calibration-lab/test/evaluator.test.mjs',
];

const missing = testFiles.filter((file) => !existsSync(resolve(process.cwd(), file)));
if (missing.length) {
  console.error('Native regression test files are missing:');
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (!Number.isInteger(nodeMajor) || nodeMajor < 22) {
  console.error(`Node.js 22 or newer is required for the native regression suite (found ${process.versions.node}).`);
  process.exit(1);
}

// Node 22 requires the experimental type stripper for the existing frontend
// TypeScript unit test. Node 24+ enables type stripping without this flag.
const args = nodeMajor === 22
  ? ['--experimental-strip-types', '--test', ...testFiles]
  : ['--test', ...testFiles];

console.log(`Running ${testFiles.length} deterministic native unit/integration suites on Node ${process.versions.node}.`);
const result = spawnSync(process.execPath, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error('Unable to start the native regression test runner:', result.error.message);
  process.exit(1);
}
process.exit(Number.isInteger(result.status) ? result.status : 1);

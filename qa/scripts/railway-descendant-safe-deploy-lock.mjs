import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=fs.readFileSync(path.join(root,'.github/workflows/magnanimous-railway-deploy.yml'),'utf8');

for(const needle of [
  'Wait for verified main auto-deploy or detect safe newer main revision',
  'is_safe_main_lineage',
  'compare/${TARGET_SHA}...${candidate}',
  'compare/${candidate}...${main_sha}',
  'Refusing to roll production backward to stale target',
  'stale=true',
  "steps.already-live.outputs.stale != 'true'",
  'Verify live standalone runtime contains the target without rollback',
  'Magnanimous Railway descendant-safe deployment PASS',
  '"success" if "success" in states',
  'All matching Full Platform QA runs are terminal and none succeeded',
  'base="$parent"',
  'magnanimous-impact-health.json',
  'git fetch --no-tags --depth=1 origin "$live"',
  'git diff --name-only "$base" "$TARGET_SHA"',
  'for attempt in $(seq 1 12); do',
  'attempt $attempt/12',
  'fallback_unconfigured=0',
  '::warning::Magnanimous Railway deploy gateway is not configured with its optional production-scoped Railway project token.',
  'Optional Railway token fallback unavailable; final live-revision verification remains authoritative.'
]) assert(source.includes(needle),'Railway descendant-safe deployment contract missing: '+needle);

assert(!source.includes('Verify the live standalone runtime is this exact commit'),'stale exact-only verification must not return');
assert(!source.includes('::error::Magnanimous Railway deploy gateway is not configured with its production-scoped Railway project token.'),'an unavailable optional Railway token must not fail before final live-revision verification');
assert(source.includes('timeout-minutes: 60'),'Railway exact-commit workflow must allow QA, bounded auto-deploy detection, fallback deployment, and final verification.');
assert(!source.includes('for attempt in $(seq 1 120); do'),'Railway promotion must not idle for twenty minutes before its configured exact-commit fallback.');
console.log('Railway descendant-safe deploy lock passed — newer verified main descendants satisfy old workflow runs and stale targets cannot trigger rollback.');

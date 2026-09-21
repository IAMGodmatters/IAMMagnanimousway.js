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
  'Magnanimous Railway descendant-safe deployment PASS'
]) assert(source.includes(needle),'Railway descendant-safe deployment contract missing: '+needle);

assert(!source.includes('Verify the live standalone runtime is this exact commit'),'stale exact-only verification must not return');
console.log('Railway descendant-safe deploy lock passed — newer verified main descendants satisfy old workflow runs and stale targets cannot trigger rollback.');

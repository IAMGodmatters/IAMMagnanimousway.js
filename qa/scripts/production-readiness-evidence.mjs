/**
 * I AM MAGNANIMOUS WAY™ source-evidence inventory for 13 public production
 * engineering domains. Original implementation; no proprietary code.
 * Presence of a path does not establish production readiness.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const domains=[
  {
    "id": "01",
    "name": "Frontend foundations",
    "paths": [
      "frontend/app/layout.tsx",
      "qa/scripts/public-surface-lock.mjs"
    ],
    "followup": "Browser and accessibility tests on phone and desktop."
  },
  {
    "id": "02",
    "name": "APIs and backend logic",
    "paths": [
      "worker/src/security-entrypoint.js",
      "qa/scripts/product-contract-locks.mjs"
    ],
    "followup": "Contract and negative authorization tests against deployed APIs."
  },
  {
    "id": "03",
    "name": "Database and storage",
    "paths": [
      "qa/scripts/magnanimous-storage-capacity-lock.mjs",
      "magnanimous-runtime/src/kv-cache.mjs"
    ],
    "followup": "Two-tenant isolation, migration, restore, and durability tests."
  },
  {
    "id": "04",
    "name": "Authentication and permissions",
    "paths": [
      "qa/scripts/opaque-session-downstream-auth-lock.mjs",
      "qa/scripts/white-label-brain-lock.mjs"
    ],
    "followup": "Live role matrix, session revocation, and cross-tenant denial tests."
  },
  {
    "id": "05",
    "name": "Hosting and deployment",
    "paths": [
      ".github/workflows/deploy.yml",
      "qa/scripts/magnanimous-standalone-health-gate-lock.mjs"
    ],
    "followup": "Verify successful deployed commit and low-volume post-deploy smoke."
  },
  {
    "id": "06",
    "name": "Cloud and compute",
    "paths": [
      "worker/wrangler.jsonc",
      "qa/scripts/magnanimous-cloud-edge-lock.mjs"
    ],
    "followup": "Check actual quota, isolation, capacity, and no-spend fallback."
  },
  {
    "id": "07",
    "name": "CI/CD and version control",
    "paths": [
      ".github/workflows/full-platform-qa.yml",
      "qa/scripts/proprietary-security-invariants-lock.mjs"
    ],
    "followup": "Verify required checks, immutable actions, and least-privilege tokens."
  },
  {
    "id": "08",
    "name": "Security and tenant row boundaries",
    "paths": [
      "worker/src/security-hardening.js",
      "qa/scripts/white-label-brain-lock.mjs"
    ],
    "followup": "Independent scoped security assessment and tenant-row negative tests."
  },
  {
    "id": "09",
    "name": "Rate limiting",
    "paths": [
      "magnanimous-runtime/src/rate-limit.mjs",
      "qa/scripts/password-recovery-lock.mjs"
    ],
    "followup": "Bounded, consented staging abuse tests and rate-limit telemetry."
  },
  {
    "id": "10",
    "name": "Caching and CDN",
    "paths": [
      "magnanimous-runtime/src/kv-cache.mjs",
      "worker/wrangler.jsonc"
    ],
    "followup": "Verify cache privacy, expiry, purge, and edge behavior after quota recovery."
  },
  {
    "id": "11",
    "name": "Load balancing and scaling",
    "paths": [
      "worker/src/provider-entrypoint.js",
      "qa/scripts/provider-reliability-readiness-lock.mjs"
    ],
    "followup": "Controlled staging load/failover evidence and cost ceiling."
  },
  {
    "id": "12",
    "name": "Error tracking and logs",
    "paths": [
      "worker/src/request-observability.js",
      "qa/scripts/full-platform-hardening-lock.mjs"
    ],
    "followup": "Verify redaction, retention, correlation IDs, alerts, and incident response."
  },
  {
    "id": "13",
    "name": "Availability and recovery",
    "paths": [
      "qa/scripts/magnanimous-standalone-health-gate-lock.mjs",
      "worker/src/self-healing-runtime.js"
    ],
    "followup": "Restore drill, recovery time evidence, and verified rollback."
  }
];
export function inspect(base,items=domains){
  return items.map(({id,name,paths,followup})=>{
    const missing=paths.filter(p=>!fs.existsSync(path.join(base,p)));
    return {id,name,source_evidence:missing.length?'MISSING':'PATHS_PRESENT_ONLY',
      paths,missing,production_verification:'NOT_VERIFIED',next_verification:followup};
  });
}
export function selfTest(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'magnanimous-evidence-'));
  try{
    for(const d of domains)for(const p of d.paths){
      const target=path.join(temp,p);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,'test fixture\n');
    }
    const present=inspect(temp);
    assert.equal(present.length,13);
    assert.equal(present.filter(x=>x.source_evidence==='PATHS_PRESENT_ONLY').length,13);
    assert.equal(present.filter(x=>x.production_verification==='NOT_VERIFIED').length,13);
    fs.unlinkSync(path.join(temp,domains[0].paths[0]));
    const missing=inspect(temp);
    assert.equal(missing[0].source_evidence,'MISSING');
    assert.deepEqual(missing[0].missing,[domains[0].paths[0]]);
    assert.equal(missing.slice(1).filter(x=>x.source_evidence==='MISSING').length,0);
    console.log('Production evidence inventory self-test PASS: 13 domains; missing-path fail-closed; no production attestation.');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--self-test'))selfTest();
  else{
    const records=inspect(root);
    const missing=records.filter(x=>x.source_evidence==='MISSING');
    const output={schema:'magnanimous-production-evidence-v1',
      commit:process.env.GITHUB_SHA||'local-checkout',
      scope:'source-path-inventory-only',
      disclaimer:'Not a runtime, security, scalability, accessibility, disaster-recovery, penetration-test, or independent audit certification.',
      domains:records,source_domains_present:13-missing.length,production_domains_verified:0,
      missing_domains:missing.map(x=>x.id)};
    if(process.argv.includes('--json'))console.log(JSON.stringify(output,null,2));
    else{
      for(const x of records)console.log((x.source_evidence==='MISSING'?'MISSING':'INDEXED')+' '+x.id+' '+x.name+(x.missing.length?' ['+x.missing.join(', ')+']':''));
      console.log('Source evidence indexed: '+output.source_domains_present+'/13. Production domains verified by this check: 0/13.');
      console.log(output.disclaimer);
    }
    if(process.argv.includes('--strict')&&missing.length)process.exitCode=1;
  }
}

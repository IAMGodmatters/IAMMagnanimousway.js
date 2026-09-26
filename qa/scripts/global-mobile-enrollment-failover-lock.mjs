import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync('worker/src/magnanimous-telecom-network-runtime.js','utf8');
const migration=fs.readFileSync('worker/migrations/0089_global_mobile_enrollment_and_failover.sql','utf8');

for(const needle of [
 "crypto.getRandomValues(new Uint8Array(32))",
 "sha256Hex(token)",
 "stored_as_hash_only:true",
 "carrier_activation_secret:false",
 "redeemed?.meta?.changes",
 "SET status='revoked' WHERE tenant_id=? AND profile_id=? AND purpose=? AND status='active'",
 "provider_activation_required",
 "telecom_mobile_enrollment_tokens",
 "telecom_mobile_failover_proofs",
 "independent_network_verified",
 "observed_failover",
 "trigger_event_id",
 "backup_event_id"
]) assert.ok(runtime.includes(needle),'Missing runtime contract: '+needle);

assert.ok(!migration.includes('raw_activation_secret'),'Migration must not persist raw carrier activation secrets.');
assert.ok(migration.includes('token_hash TEXT PRIMARY KEY'),'Enrollment tokens must be stored only by hash.');
assert.ok(runtime.includes("expires_at>?"),'Atomic redemption must also enforce token expiry in the write condition.');
assert.ok(migration.includes("CHECK(purpose IN ('profile_enrollment','backup_enrollment'))"),'Enrollment purpose must be constrained.');
assert.ok(runtime.includes("if(!['detach','failover'].includes(String(trigger.event_type)))"),'Primary failover trigger must be observed.');
assert.ok(runtime.includes("if(!['attach','quality','recovery'].includes(String(backupEvent.event_type))"),'Backup service must be positively observed.');
assert.ok(runtime.includes("String(primary.network_group)===String(backup.network_group)"),'Backup proof must reject the same network group.');
assert.ok(runtime.includes("Number(backupEvent.created_at||0)<Number(trigger.created_at||0)"),'Backup evidence must occur after the primary trigger.');

console.log('Magnanimous mobile enrollment and independent backup evidence locks passed.');

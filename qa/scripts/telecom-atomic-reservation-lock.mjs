import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const runtime=read('worker/src/magnanimous-telecom-charging-runtime.js');
const migration=read('worker/migrations/0060_magnanimous_telecom_atomic_reservation.sql');

must(migration.includes('trg_telecom_atomic_balance_reservation'),'Atomic Telecom reservation trigger is missing.');
must(migration.includes("RAISE(ABORT, 'telecom_insufficient_balance')"),'Insufficient balance must abort the reservation statement.');
must(migration.includes('remaining_units = remaining_units - NEW.reserved_units'),'Balance decrement must occur inside the atomic reservation trigger.');
must(migration.includes("'reserve:' || NEW.charging_session_id || ':' || NEW.bucket_id"),'Atomic reservation must write an idempotent reserve-ledger record.');
must(migration.includes('atomic_reservation_trigger'),'Reserve ledger must identify the atomic reservation source.');

must(runtime.includes('reserveBucket(env,tenant,bucketId,sessionId,wanted)'),'Charging runtime must reserve against a charging-session-aware atomic helper.');
must(runtime.includes('INSERT INTO telecom_balance_reservations'),'Runtime must create reservations through the trigger-backed insert.');
must(!runtime.includes('remaining_units=remaining_units-?'),'Runtime must not pre-decrement bucket balances outside the atomic reservation statement.');
must(!runtime.includes("`reserve:${sessionId}:${bucket.id}`"),'Runtime must not duplicate the trigger-owned reserve-ledger write.');
must(runtime.includes("telecom_insufficient_balance|UNIQUE constraint failed"),'Atomic reservation contention must be retryable without corrupting balances.');

console.log('Magnanimous Telecom atomic reservation source contract verified.');

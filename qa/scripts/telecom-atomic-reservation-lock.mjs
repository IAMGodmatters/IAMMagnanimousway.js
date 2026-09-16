import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const runtime=read('worker/src/magnanimous-telecom-charging-runtime.js');
const legacyMigration=read('worker/migrations/0060_magnanimous_telecom_atomic_reservation.sql');
const exactMigration=read('worker/migrations/0062_magnanimous_telecom_atomic_micros.sql');

must(legacyMigration.includes('trg_telecom_atomic_balance_reservation'),'Original atomic Telecom reservation trigger is missing.');
must(exactMigration.includes('DROP TRIGGER IF EXISTS trg_telecom_atomic_balance_reservation'),'Exact-micros migration must replace the original atomic trigger.');
must(exactMigration.includes('CREATE TRIGGER trg_telecom_atomic_balance_reservation'),'Exact-micros atomic Telecom reservation trigger is missing.');
must(exactMigration.includes("RAISE(ABORT, 'telecom_insufficient_balance')"),'Insufficient balance must abort the reservation statement.');
must(exactMigration.includes('remaining_units_micros = remaining_units_micros - NEW.reserved_units_micros'),'Exact balance decrement must occur inside the atomic reservation trigger.');
must(exactMigration.includes("'reserve:' || NEW.charging_session_id || ':' || NEW.bucket_id"),'Atomic reservation must write an idempotent reserve-ledger record.');
must(exactMigration.includes('atomic_micros_reservation_trigger'),'Reserve ledger must identify the exact atomic reservation source.');
must(exactMigration.includes('NEW.reserved_units_micros'),'Exact reservation trigger must use integer micros as accounting authority.');

must(runtime.includes('reserveBucket(env,tenant,bucketId,sessionId,wantedMicros)'),'Charging runtime must reserve against a charging-session-aware exact atomic helper.');
must(runtime.includes('INSERT INTO telecom_balance_reservations'),'Runtime must create reservations through the trigger-backed insert.');
must(runtime.includes('reserved_units_micros,committed_units_micros'),'Runtime reservation insert must carry exact micro-unit values.');
must(!runtime.includes('remaining_units=remaining_units-?'),'Runtime must not pre-decrement decimal bucket balances outside the atomic reservation statement.');
must(!runtime.includes('remaining_units_micros=remaining_units_micros-?'),'Runtime must not pre-decrement exact bucket balances outside the atomic reservation statement.');
must(!runtime.includes("`reserve:${sessionId}:${bucket.id}`"),'Runtime must not duplicate the trigger-owned reserve-ledger write.');
must(runtime.includes("telecom_insufficient_balance|UNIQUE constraint failed"),'Atomic reservation contention must be retryable without corrupting balances.');

console.log('Magnanimous Telecom exact atomic reservation source contract verified.');

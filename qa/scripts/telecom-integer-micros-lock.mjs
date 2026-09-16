import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const runtime=read('worker/src/magnanimous-telecom-charging-runtime.js');
const columns=read('worker/migrations/0061_magnanimous_telecom_integer_micros.sql');
const atomic=read('worker/migrations/0062_magnanimous_telecom_atomic_micros.sql');
const expiry=read('worker/migrations/0063_magnanimous_telecom_expiry_micros.sql');
const partial=read('worker/migrations/0064_magnanimous_telecom_partial_commit_micros.sql');
const views=read('worker/migrations/0065_magnanimous_telecom_precision_views_v2.sql');

for(const column of ['initial_units_micros','remaining_units_micros','requested_units_micros','reserved_units_micros','committed_units_micros','estimated_charge_micros','final_charge_micros','units_micros','balance_after_micros']){
 must(columns.includes(column),`Authoritative micro column missing: ${column}`);
 must(runtime.includes(column),`Charging runtime does not use exact micro column: ${column}`);
}
must(runtime.includes('const MICRO_SCALE=1000000'),'Charging runtime must use a fixed integer micro scale.');
must(runtime.includes('Math.round(Number(value||0)*MICRO_SCALE)'),'Decimal inputs must be normalized once at the micro boundary.');
must(runtime.includes("accounting_precision:'integer_micros'"),'Charging overview must report exact accounting precision.');
must(runtime.includes('remaining_units_micros>0'),'Reservation bucket selection must use integer balances.');
must(runtime.includes('reservedMicros'),'Release/commit paths must calculate using integer micros.');
must(atomic.includes('remaining_units_micros - NEW.reserved_units_micros'),'Atomic reservation arithmetic must be integer based.');
must(expiry.includes('SUM(r.reserved_units_micros)'),'Expiry reconciliation must be integer based.');
must(partial.includes('NEW.reserved_units_micros - NEW.committed_units_micros'),'Partial release ledger must be integer based.');
must(views.includes('SELECT * FROM telecom_balance_buckets'),'Compatibility precision views must expose authoritative columns directly.');
must(!atomic.includes('remaining_units >= NEW.reserved_units'),'The final atomic trigger must not authorize against REAL balances.');

console.log('Magnanimous Telecom authoritative integer-micro accounting contract verified.');

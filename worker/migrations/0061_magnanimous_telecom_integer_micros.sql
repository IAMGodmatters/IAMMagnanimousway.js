-- Magnanimous Telecom integer-micro accounting storage.
-- Additive compatibility migration: existing REAL fields remain API/display mirrors while these
-- INTEGER micro-unit columns become the exact accounting representation for charging balances.
-- Existing rows are backfilled without deleting or renaming any working column.
-- This migration performs no carrier/PSTN purchase, SIM/eSIM activation or regulated network action.

ALTER TABLE telecom_balance_buckets ADD COLUMN initial_units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_balance_buckets ADD COLUMN remaining_units_micros INTEGER NOT NULL DEFAULT 0;

ALTER TABLE telecom_charging_sessions ADD COLUMN requested_units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_charging_sessions ADD COLUMN reserved_units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_charging_sessions ADD COLUMN committed_units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_charging_sessions ADD COLUMN estimated_charge_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_charging_sessions ADD COLUMN final_charge_micros INTEGER NOT NULL DEFAULT 0;

ALTER TABLE telecom_balance_reservations ADD COLUMN reserved_units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_balance_reservations ADD COLUMN committed_units_micros INTEGER NOT NULL DEFAULT 0;

ALTER TABLE telecom_balance_transactions ADD COLUMN units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_balance_transactions ADD COLUMN balance_after_micros INTEGER;

UPDATE telecom_balance_buckets
SET initial_units_micros = CAST(ROUND(initial_units * 1000000.0) AS INTEGER),
    remaining_units_micros = CAST(ROUND(remaining_units * 1000000.0) AS INTEGER);

UPDATE telecom_charging_sessions
SET requested_units_micros = CAST(ROUND(requested_units * 1000000.0) AS INTEGER),
    reserved_units_micros = CAST(ROUND(reserved_units * 1000000.0) AS INTEGER),
    committed_units_micros = CAST(ROUND(committed_units * 1000000.0) AS INTEGER),
    estimated_charge_micros = CAST(ROUND(estimated_charge * 1000000.0) AS INTEGER),
    final_charge_micros = CAST(ROUND(final_charge * 1000000.0) AS INTEGER);

UPDATE telecom_balance_reservations
SET reserved_units_micros = CAST(ROUND(reserved_units * 1000000.0) AS INTEGER),
    committed_units_micros = CAST(ROUND(committed_units * 1000000.0) AS INTEGER);

UPDATE telecom_balance_transactions
SET units_micros = CAST(ROUND(units * 1000000.0) AS INTEGER),
    balance_after_micros = CASE
      WHEN balance_after IS NULL THEN NULL
      ELSE CAST(ROUND(balance_after * 1000000.0) AS INTEGER)
    END;

CREATE INDEX IF NOT EXISTS idx_telecom_balance_buckets_micros
  ON telecom_balance_buckets(tenant_id,balance_account_id,status,remaining_units_micros,expires_at);

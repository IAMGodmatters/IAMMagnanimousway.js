-- Refresh precision views after authoritative integer-micro columns are added.
-- Existing view names remain stable for compatibility; duplicate computed aliases are removed.

DROP VIEW IF EXISTS telecom_balance_precision_v;
CREATE VIEW telecom_balance_precision_v AS
SELECT * FROM telecom_balance_buckets;

DROP VIEW IF EXISTS telecom_reservation_precision_v;
CREATE VIEW telecom_reservation_precision_v AS
SELECT * FROM telecom_balance_reservations;

DROP VIEW IF EXISTS telecom_charging_precision_v;
CREATE VIEW telecom_charging_precision_v AS
SELECT * FROM telecom_charging_sessions;

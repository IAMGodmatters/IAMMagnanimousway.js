from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / 'worker' / 'migrations' / '0112_stripe_webhook_event_claims.sql'
db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE billing_webhook_events(event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,processed_at INTEGER NOT NULL);
CREATE TABLE business_plan_subscription_events(event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,processed_at INTEGER NOT NULL);
CREATE TABLE stripe_events(id TEXT PRIMARY KEY,event_type TEXT NOT NULL,processed_at INTEGER NOT NULL);
INSERT INTO billing_webhook_events VALUES('evt_old_billing','invoice.paid',10);
INSERT INTO business_plan_subscription_events VALUES('evt_old_plan','checkout.session.completed',11);
INSERT INTO stripe_events VALUES('evt_old_music','customer.subscription.updated',12);
''')
db.executescript(MIGRATION.read_text(encoding='utf-8'))
for event_id, processor in [('evt_old_billing','billing'),('evt_old_plan','business-plan'),('evt_old_music','music')]:
    row = db.execute('SELECT status,processor FROM stripe_webhook_event_claims WHERE event_id=?', (event_id,)).fetchone()
    assert row == ('processed', processor), (event_id, row)

CLAIM = '''
INSERT INTO stripe_webhook_event_claims(event_id,event_type,processor,status,claimed_at,claim_token,attempt_count,processed_at,last_error,created_at,updated_at)
VALUES(?,?,?,'processing',?,?,1,NULL,'',?,?)
ON CONFLICT(event_id) DO UPDATE SET
event_type=excluded.event_type,status='processing',claimed_at=excluded.claimed_at,claim_token=excluded.claim_token,
attempt_count=stripe_webhook_event_claims.attempt_count+1,processed_at=NULL,last_error='',updated_at=excluded.updated_at
WHERE stripe_webhook_event_claims.processor=excluded.processor
AND stripe_webhook_event_claims.status!='processed'
AND (stripe_webhook_event_claims.status!='processing' OR stripe_webhook_event_claims.claimed_at<=?)
RETURNING event_id
'''
def claim(event_id, processor, timestamp, token, lease=300):
    return db.execute(CLAIM, (event_id, 'checkout.session.completed', processor, timestamp, token, timestamp, timestamp, timestamp-lease)).fetchone()
assert claim('evt_new', 'billing', 1000, 'token-1') == ('evt_new',)
assert claim('evt_new', 'billing', 1001, 'token-2') is None, 'active concurrent claim must not be stolen'
db.execute("UPDATE stripe_webhook_event_claims SET status='processed',processed_at=1002,claimed_at=0,claim_token='' WHERE event_id='evt_new' AND claim_token='token-1'")
assert claim('evt_new', 'billing', 2000, 'token-3') is None, 'processed event must remain a duplicate'
assert claim('evt_failed', 'music', 2100, 'token-f1') == ('evt_failed',)
db.execute("UPDATE stripe_webhook_event_claims SET status='failed',claimed_at=0,claim_token='',last_error='NetworkError' WHERE event_id='evt_failed'")
assert claim('evt_failed', 'music', 2101, 'token-f2') == ('evt_failed',), 'failed event must be retryable'
assert claim('evt_stale', 'business-plan', 3000, 'token-s1') == ('evt_stale',)
assert claim('evt_stale', 'business-plan', 3301, 'token-s2') == ('evt_stale',), 'expired processing lease must be reclaimable'
assert claim('evt_stale', 'billing', 3302, 'token-other') is None, 'a different processor must not take over the claim'
print('Stripe webhook claim migration and SQLite concurrency/retry invariants passed.')

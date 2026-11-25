import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DurableLiveEventJournal } from './durable-live-event-journal.mjs';

function fixture(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'magnanimous-event-journal-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let now = 1_800_000_000_000;
  const filePath = path.join(dir, 'events.jsonl');
  const create = () => new DurableLiveEventJournal({ filePath, now: () => now, ...options });
  return { create, filePath, advance: ms => { now += ms; }, now: () => now };
}
const makeEvent = (eventId, provider = 'manual') => ({
  protocolVersion: 1, eventId, provider, type: 'chat.message',
  occurredAt: new Date(1_800_000_000_000).toISOString(),
  actorName: 'QA viewer', text: 'Hello Magnanimous'
});

test('persists accepted events and deduplication across process restart', t => {
  const f = fixture(t);
  let journal = f.create();
  assert.equal(journal.ingest(makeEvent('persist-1')).status, 'accepted');
  assert.equal(journal.ingest(makeEvent('persist-1')).status, 'duplicate');
  journal = f.create();
  assert.equal(journal.status().queued, 1);
  const delivery = journal.claim(10);
  assert.equal(delivery.events.length, 1);
  assert.equal(delivery.events[0].eventId, 'persist-1');
  assert.equal(journal.acknowledge(delivery.deliveryId, delivery.eventKeys).status, 'acknowledged');
  assert.equal(journal.acknowledge(delivery.deliveryId, delivery.eventKeys).status, 'duplicate');
  journal = f.create();
  assert.equal(journal.status().queued, 0);
  assert.equal(journal.acknowledge(delivery.deliveryId, delivery.eventKeys).status, 'duplicate');
  assert.equal(journal.ingest(makeEvent('persist-1')).status, 'duplicate');
});

test('uses expiring delivery leases and safely redelivers unacknowledged events', t => {
  const f = fixture(t, { leaseMs: 5_000 });
  let journal = f.create();
  journal.ingest(makeEvent('lease-1'));
  const first = journal.claim(1);
  assert.equal(journal.claim(1).events.length, 0);
  f.advance(5_001);
  const second = journal.claim(1);
  assert.notEqual(second.deliveryId, first.deliveryId);
  assert.equal(journal.acknowledge(first.deliveryId, first.eventKeys).status, 'not_leased');
  assert.equal(journal.acknowledge(second.deliveryId, second.eventKeys).status, 'acknowledged');
  assert.equal(journal.status().queued, 0);
});

test('provider-scoped keys prevent cross-provider event ID collisions', t => {
  const f = fixture(t);
  const journal = f.create();
  assert.equal(journal.ingest(makeEvent('same-id', 'manual')).status, 'accepted');
  assert.equal(journal.ingest(makeEvent('same-id', 'youtube')).status, 'accepted');
  const delivery = journal.claim(2);
  assert.equal(delivery.events.length, 2);
  assert.equal(new Set(delivery.eventKeys).size, 2);
  assert.equal(journal.acknowledge(delivery.deliveryId, delivery.eventKeys).acknowledged, 2);
});

test('recovers complete records after a truncated trailing write', t => {
  const f = fixture(t);
  let journal = f.create();
  journal.ingest(makeEvent('recover-1'));
  fs.appendFileSync(f.filePath, '{"version":1,"op":"put","broken":');
  journal = f.create();
  assert.equal(journal.status().queued, 1);
  assert.equal(journal.status().recovery.truncatedTail, true);
  assert.equal(journal.claim(1).events[0].eventId, 'recover-1');
});

test('applies durable queue backpressure instead of dropping pending events', t => {
  const f = fixture(t, { maxPending: 1 });
  const journal = f.create();
  assert.equal(journal.ingest(makeEvent('capacity-1')).status, 'accepted');
  assert.equal(journal.ingest(makeEvent('capacity-2')).status, 'queue_full');
  assert.equal(journal.status().queued, 1);
});

test('rejects partial acknowledgements without removing any event', t => {
  const f = fixture(t);
  const journal = f.create();
  journal.ingest(makeEvent('partial-1'));
  journal.ingest(makeEvent('partial-2'));
  const delivery = journal.claim(2);
  const partial = journal.acknowledge(delivery.deliveryId, [delivery.eventKeys[0], 'youtube:not-in-this-delivery']);
  assert.equal(partial.status, 'not_leased');
  assert.equal(journal.status().queued, 2);
  assert.equal(journal.acknowledge(delivery.deliveryId, delivery.eventKeys).acknowledged, 2);
});

test('compaction preserves active in-process delivery leases', t => {
  const f = fixture(t);
  const journal = f.create();
  journal.ingest(makeEvent('compact-1'));
  journal.ingest(makeEvent('compact-2'));
  const delivery = journal.claim(2);
  assert.equal(delivery.events.length, 2);
  fs.appendFileSync(f.filePath, 'x'.repeat(8 * 1024 * 1024 + 1));
  assert.equal(journal.ingest(makeEvent('compact-3')).status, 'accepted');
  const next = journal.claim(2);
  assert.deepEqual(next.events.map(event => event.eventId), ['compact-3']);
});

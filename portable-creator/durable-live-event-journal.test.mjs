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
  const key = Buffer.alloc(32, 0x4d);
  t.after(() => key.fill(0));
  const create = () => {
    const journal = new DurableLiveEventJournal({ filePath, now: () => now, ...options });
    assert.equal(journal.unlock(key).status, 'unlocked');
    return journal;
  };
  return { create, filePath, key, advance: ms => { now += ms; }, now: () => now };
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
  journal.lock();
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

test('redelivers an unacknowledged claimed event after a host restart', t => {
  const f = fixture(t);
  let journal = f.create();
  journal.ingest(makeEvent('restart-lease-1'));
  const first = journal.claim(1);
  assert.ok(first.deliveryId);
  journal.lock();
  journal = f.create();
  assert.equal(journal.status().queued, 1);
  assert.equal(journal.status().storageReady, true);
  const retry = journal.claim(1);
  assert.notEqual(retry.deliveryId, first.deliveryId);
  assert.equal(retry.events[0].eventId, 'restart-lease-1');
  assert.equal(journal.acknowledge(retry.deliveryId, retry.eventKeys).status, 'acknowledged');
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
  journal.lock();
  fs.appendFileSync(f.filePath, '{"version":1,"cipher":"aes-256-gcm","iv":"broken');
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

test('encrypts event content at rest and reopens only with the workspace-derived key', t => {
  const f = fixture(t);
  let journal = f.create();
  assert.equal(journal.ingest(makeEvent('private-1')).status, 'accepted');
  const raw = fs.readFileSync(f.filePath, 'utf8');
  assert.equal(raw.includes('Hello Magnanimous'), false);
  assert.equal(raw.includes('QA viewer'), false);
  journal.lock();
  assert.equal(journal.status().locked, true);
  journal = f.create();
  assert.equal(journal.status().queued, 1);
  const wrong = new DurableLiveEventJournal({ filePath: f.filePath });
  const opened = wrong.unlock(Buffer.alloc(32, 0x21));
  assert.equal(opened.status, 'storage_error');
  assert.equal(wrong.status().storageReady, false);
  assert.equal(wrong.status().recovery.authenticationError, true);
  assert.equal(fs.readFileSync(f.filePath, 'utf8'), raw, 'Wrong-key recovery must not rewrite or destroy the journal.');
});

test('does not report a duplicate after an event write fails', t => {
  const f = fixture(t);
  const journal = f.create();
  const originalOpen = fs.openSync;
  fs.openSync = function(file, ...args) {
    if (String(file) === f.filePath) throw new Error('simulated USB write failure');
    return originalOpen.call(this, file, ...args);
  };
  try {
    assert.equal(journal.ingest(makeEvent('disk-failure-1')).status, 'storage_error');
  } finally {
    fs.openSync = originalOpen;
  }
  assert.equal(journal.ingest(makeEvent('disk-failure-1')).status, 'storage_error');
});

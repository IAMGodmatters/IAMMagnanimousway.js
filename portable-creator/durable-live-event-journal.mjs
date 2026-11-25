import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { LiveEventRuntime } from './live-event-runtime.mjs';

const MAX_SEEN = 20_000;
const MAX_PENDING = 2_000;
const MAX_JOURNAL_BYTES = 8 * 1024 * 1024;

function eventKey(event) {
  return event.provider + ':' + event.eventId;
}

export class DurableLiveEventJournal {
  constructor({ filePath, now = Date.now, leaseMs = 30_000, maxPending = 1_000 } = {}) {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('A journal file path is required.');
    this.filePath = path.resolve(filePath);
    this.now = now;
    this.leaseMs = Math.max(5_000, Math.min(5 * 60_000, leaseMs));
    this.maxPending = Math.max(1, Math.min(MAX_PENDING, maxPending));
    this.validator = new LiveEventRuntime({ maxQueue: this.maxPending, maxSeen: MAX_SEEN, now });
    this.pending = new Map();
    this.seen = new Map();
    this.acked = new Set();
    this.leases = new Map();
    this.storageFailed = false;
    this.recovery = { malformedLines: 0, truncatedTail: false };
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this._recover();
  }

  _remember(key, at = this.now()) {
    this.seen.delete(key);
    this.seen.set(key, at);
    while (this.seen.size > MAX_SEEN) this.seen.delete(this.seen.keys().next().value);
  }

  _append(record) {
    if (this.storageFailed) throw new Error('The durable event journal is unavailable; new events are paused to prevent loss.');
    const line = JSON.stringify({ version: 1, ...record }) + '\n';
    let fd;
    try {
      fd = fs.openSync(this.filePath, 'a', 0o600);
      fs.writeSync(fd, line, null, 'utf8');
      fs.fsyncSync(fd);
    } catch (error) {
      this.storageFailed = true;
      throw new Error('Could not safely persist the live event. Check USB drive space and write access.');
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
    try {
      if (fs.statSync(this.filePath).size > MAX_JOURNAL_BYTES) this._compact();
    } catch {
      this.storageFailed = true;
      throw new Error('The event journal could not be verified after writing.');
    }
  }

  _recover() {
    if (!fs.existsSync(this.filePath)) return;
    const raw = fs.readFileSync(this.filePath);
    const text = raw.toString('utf8');
    const completeEnd = text.lastIndexOf('\n');
    if (completeEnd !== text.length - 1) this.recovery.truncatedTail = true;
    const lines = text.slice(0, completeEnd + 1).split('\n');
    for (const line of lines) {
      if (!line) continue;
      let record;
      try { record = JSON.parse(line); } catch { this.recovery.malformedLines++; continue; }
      if (record?.version !== 1) { this.recovery.malformedLines++; continue; }
      if (record.op === 'seen' && typeof record.key === 'string') {
        this._remember(record.key, Number(record.at) || this.now());
      } else if (record.op === 'put' && record.event && typeof record.event.eventId === 'string') {
        const key = eventKey(record.event);
        this._remember(key, Number(record.at) || this.now());
        this.pending.set(key, record.event);
      } else if (record.op === 'ack' && typeof record.key === 'string') {
        this.pending.delete(record.key);
        this.acked.add(record.key);
      }
    }
    if (this.pending.size > this.maxPending) {
      const keep = [...this.pending.entries()].slice(-this.maxPending);
      this.pending = new Map(keep);
    }
    if (this.recovery.truncatedTail || this.recovery.malformedLines) this._compact();
  }

  _compact() {
    const temp = this.filePath + '.tmp';
    const records = [];
    for (const [key, at] of this.seen) records.push({ version: 1, op: 'seen', key, at });
    for (const [key, event] of this.pending) records.push({ version: 1, op: 'put', key, event, at: this.now() });
    const body = records.map(record => JSON.stringify(record)).join('\n') + (records.length ? '\n' : '');
    let fd;
    try {
      fd = fs.openSync(temp, 'w', 0o600);
      fs.writeSync(fd, body, null, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(temp, this.filePath);
      this.leases.clear();
    } catch {
      if (fd !== undefined) fs.closeSync(fd);
      try { fs.rmSync(temp, { force: true }); } catch {}
      this.storageFailed = true;
      throw new Error('Could not compact the durable event journal safely.');
    }
  }

  ingest(input) {
    if (this.storageFailed) return { status: 'storage_error', detail: 'Event storage is unavailable; no event was accepted.' };
    const candidate = input && typeof input === 'object' && typeof input.eventId === 'string' && typeof input.provider === 'string'
      ? input.provider + ':' + input.eventId : '';
    if (candidate && this.seen.has(candidate)) return { status: 'duplicate', eventId: input.eventId };
    if (this.pending.size >= this.maxPending) return { status: 'queue_full', detail: 'The durable event queue is full; acknowledge or export pending events before adding more.' };
    const result = this.validator.ingest(input);
    if (result.status !== 'accepted') return result;
    const event = this.validator.consume(1)[0];
    const key = eventKey(event);
    try {
      this._append({ op: 'put', key, event, at: this.now() });
      this._remember(key);
      this.pending.set(key, event);
      return { status: 'accepted', eventId: event.eventId, queued: this.pending.size, durable: true };
    } catch (error) {
      return { status: 'storage_error', detail: error.message };
    }
  }

  claim(limit = 10) {
    const count = Math.max(1, Math.min(50, Number.isInteger(limit) ? limit : 10));
    const now = this.now();
    const available = [];
    for (const [key, event] of this.pending) {
      const lease = this.leases.get(key);
      if (lease && lease.expiresAt > now) continue;
      available.push([key, event]);
      if (available.length >= count) break;
    }
    if (!available.length) return { deliveryId: null, events: [], queued: this.pending.size, capacity: this.maxPending };
    const deliveryId = crypto.randomUUID();
    const expiresAt = now + this.leaseMs;
    const keys = available.map(([key]) => key);
    this._append({ op: 'claim', deliveryId, keys, expiresAt });
    for (const key of keys) this.leases.set(key, { deliveryId, expiresAt });
    return { deliveryId, events: available.map(([, event]) => event), eventKeys: keys, leaseExpiresAt: new Date(expiresAt).toISOString(), queued: this.pending.size, capacity: this.maxPending };
  }

  acknowledge(deliveryId, eventKeys) {
    if (typeof deliveryId !== 'string' || deliveryId.length > 80 || !Array.isArray(eventKeys) || eventKeys.length < 1 || eventKeys.length > 50) {
      return { status: 'invalid', detail: 'A delivery ID and 1–50 event keys are required.' };
    }
    const requested = new Set(eventKeys.filter(key => typeof key === 'string' && key.length <= 300 && key.includes(':')));
    if (!requested.size || requested.size !== eventKeys.length) return { status: 'invalid', detail: 'Event keys must be valid provider:eventId values.' };
    const now = this.now();
    const keys = [];
    for (const key of requested) {
      const lease = this.leases.get(key);
      if (this.pending.has(key) && lease?.deliveryId === deliveryId && lease.expiresAt > now) keys.push(key);
    }
    if (!keys.length) {
      const alreadyAcked = [...requested].every(key => this.seen.has(key) && !this.pending.has(key));
      return alreadyAcked ? { status: 'duplicate', acknowledged: 0 } : { status: 'not_leased', acknowledged: 0, detail: 'The delivery is unknown or its acknowledgement lease expired. Pull the events again.' };
    }
    for (const key of keys) {
      this._append({ op: 'ack', key, deliveryId, at: now });
      this.pending.delete(key);
      this.leases.delete(key);
      this.acked.add(key);
    }
    return { status: 'acknowledged', acknowledged: keys.length, queued: this.pending.size };
  }

  status() {
    const oldest = this.pending.values().next().value;
    return {
      queued: this.pending.size,
      capacity: this.maxPending,
      deduplicationEntries: this.seen.size,
      durable: true,
      storageReady: !this.storageFailed,
      oldestPendingAt: oldest?.receivedAt || oldest?.occurredAt || null,
      recovery: { ...this.recovery }
    };
  }
}

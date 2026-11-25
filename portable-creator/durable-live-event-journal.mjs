import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { LiveEventRuntime } from './live-event-runtime.mjs';

const MAX_SEEN = 20_000;
const MAX_PENDING = 2_000;
const MAX_JOURNAL_BYTES = 8 * 1024 * 1024;
const JOURNAL_SALT = Buffer.from('I AM Magnanimous Way portable event journal v1');
const JOURNAL_INFO = Buffer.from('magnanimous-live-event-journal-aes-256-gcm');

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
    this.leases = new Map();
    this.key = null;
    this.storageFailed = false;
    this.recovery = { malformedLines: 0, truncatedTail: false, authenticationError: false, storageError: false };
    try { fs.mkdirSync(path.dirname(this.filePath), { recursive: true }); }
    catch { this.storageFailed = true; this.recovery.storageError = true; }
  }

  unlock(masterKey) {
    if (!Buffer.isBuffer(masterKey) || masterKey.length !== 32) {
      return { status: 'invalid_key', detail: 'The encrypted workspace must be unlocked before LIVE event storage can open.' };
    }
    this.lock();
    this.key = Buffer.from(crypto.hkdfSync('sha256', masterKey, JOURNAL_SALT, JOURNAL_INFO, 32));
    this.storageFailed = false;
    this.recovery = { malformedLines: 0, truncatedTail: false, authenticationError: false, storageError: false };
    this._recover();
    if (this.storageFailed) {
      this.key.fill(0);
      this.key = null;
      this.pending.clear();
      this.seen.clear();
      this.leases.clear();
      this.validator.clear();
      return { status: 'storage_error', detail: 'The encrypted LIVE event journal could not be safely opened. Existing data was preserved.' };
    }
    return { status: 'unlocked', storageReady: true };
  }

  lock() {
    if (this.key) this.key.fill(0);
    this.key = null;
    this.pending.clear();
    this.seen.clear();
    this.leases.clear();
    this.validator.clear();
  }

  _remember(key, at = this.now()) {
    this.seen.delete(key);
    this.seen.set(key, at);
    while (this.seen.size > MAX_SEEN) this.seen.delete(this.seen.keys().next().value);
  }

  _encode(record) {
    if (!this.key) throw new Error('Unlock the encrypted workspace before using LIVE event storage.');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(record), 'utf8'), cipher.final()]);
    return JSON.stringify({
      version: 1,
      cipher: 'aes-256-gcm',
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      data: ciphertext.toString('base64')
    });
  }

  _decode(line) {
    const envelope = JSON.parse(line);
    if (envelope?.version !== 1 || envelope?.cipher !== 'aes-256-gcm' ||
        typeof envelope.iv !== 'string' || typeof envelope.tag !== 'string' || typeof envelope.data !== 'string') {
      throw new Error('The encrypted event record has an unsupported format.');
    }
    const iv = Buffer.from(envelope.iv, 'hex');
    const tag = Buffer.from(envelope.tag, 'hex');
    const ciphertext = Buffer.from(envelope.data, 'base64');
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length > MAX_JOURNAL_BYTES) {
      throw new Error('The encrypted event record is damaged.');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'));
  }

  _append(record) {
    if (this.storageFailed) throw new Error('The durable event journal is unavailable; new events are paused to prevent loss.');
    if (!this.key) throw new Error('Unlock the encrypted workspace before using LIVE event storage.');
    const line = this._encode({ version: 1, ...record }) + '\n';
    let fd;
    try {
      if (fs.existsSync(this.filePath) && fs.statSync(this.filePath).size > MAX_JOURNAL_BYTES) this._compact();
      fd = fs.openSync(this.filePath, 'a', 0o600);
      const bytes = Buffer.from(line, 'utf8');
      let offset = 0;
      while (offset < bytes.length) {
        const written = fs.writeSync(fd, bytes, offset, bytes.length - offset);
        if (written <= 0) throw new Error('The event journal write did not make progress.');
        offset += written;
      }
      fs.fsyncSync(fd);
    } catch {
      this.storageFailed = true;
      throw new Error('Could not safely persist the encrypted LIVE event. Check USB drive space and write access.');
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }

  _recover() {
    if (!this.key || !fs.existsSync(this.filePath)) return;
    let raw;
    try {
      const size = fs.statSync(this.filePath).size;
      if (size > MAX_JOURNAL_BYTES * 2) throw new Error('Journal exceeds its safe recovery size.');
      raw = fs.readFileSync(this.filePath);
    } catch {
      this.storageFailed = true;
      this.recovery.storageError = true;
      return;
    }
    const text = raw.toString('utf8');
    const completeEnd = text.lastIndexOf('\n');
    if (completeEnd !== text.length - 1) this.recovery.truncatedTail = true;
    const lines = text.slice(0, completeEnd + 1).split('\n');
    for (const line of lines) {
      if (!line) continue;
      let record;
      try { record = this._decode(line); }
      catch {
        this.recovery.malformedLines++;
        this.recovery.authenticationError = true;
        this.storageFailed = true;
        break;
      }
      if (record?.version !== 1) {
        this.recovery.malformedLines++;
        this.storageFailed = true;
        break;
      }
      if (record.op === 'seen' && typeof record.key === 'string') {
        this._remember(record.key, Number(record.at) || this.now());
      } else if (record.op === 'put' && record.event && typeof record.event.eventId === 'string' && typeof record.event.provider === 'string') {
        const key = eventKey(record.event);
        this._remember(key, Number(record.at) || this.now());
        this.pending.set(key, record.event);
      } else if (record.op === 'ack' && typeof record.key === 'string') {
        this.pending.delete(record.key);
      } else if (record.op === 'claim' && typeof record.deliveryId === 'string' && Array.isArray(record.keys) && Number.isFinite(record.expiresAt)) {
        // Delivery leases are intentionally not restored after a host restart; pending events are redelivered.
      } else {
        this.recovery.malformedLines++;
        this.storageFailed = true;
        break;
      }
    }
    if (this.storageFailed) {
      this.pending.clear();
      this.seen.clear();
      this.validator.clear();
      return;
    }
    let trimmed = false;
    if (this.pending.size > this.maxPending) {
      const keep = [...this.pending.entries()].slice(-this.maxPending);
      this.pending = new Map(keep);
      trimmed = true;
    }
    if (trimmed || this.recovery.truncatedTail) this._compact();
  }

  _compact() {
    if (!this.key) throw new Error('Unlock the encrypted workspace before compacting LIVE event storage.');
    const temp = this.filePath + '.tmp';
    const records = [];
    for (const [key, at] of this.seen) records.push({ version: 1, op: 'seen', key, at });
    for (const [key, event] of this.pending) records.push({ version: 1, op: 'put', key, event, at: this.now() });
    const body = records.map(record => this._encode(record)).join('\n') + (records.length ? '\n' : '');
    let fd;
    try {
      fd = fs.openSync(temp, 'w', 0o600);
      const bytes = Buffer.from(body, 'utf8');
      let offset = 0;
      while (offset < bytes.length) {
        const written = fs.writeSync(fd, bytes, offset, bytes.length - offset);
        if (written <= 0) throw new Error('The compacted journal write did not make progress.');
        offset += written;
      }
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(temp, this.filePath);
      try {
        const directoryFd = fs.openSync(path.dirname(this.filePath), 'r');
        try { fs.fsyncSync(directoryFd); } finally { fs.closeSync(directoryFd); }
      } catch { /* Some filesystems, including Windows, do not expose directory fsync. */ }
    } catch {
      if (fd !== undefined) fs.closeSync(fd);
      try { fs.rmSync(temp, { force: true }); } catch {}
      this.storageFailed = true;
      throw new Error('Could not compact the encrypted LIVE event journal safely.');
    }
  }

  ingest(input) {
    if (!this.key) return { status: 'locked', detail: 'Unlock the encrypted workspace before accepting LIVE events.' };
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
      return { status: 'accepted', eventId: event.eventId, queued: this.pending.size, durable: true, encrypted: true };
    } catch (error) {
      this.validator.clear();
      return { status: 'storage_error', detail: error.message };
    }
  }

  claim(limit = 10) {
    if (!this.key) return { status: 'locked', detail: 'Unlock the encrypted workspace before reading LIVE events.' };
    if (this.storageFailed) return { status: 'storage_error', detail: 'The encrypted LIVE event journal is unavailable.' };
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
    try { this._append({ op: 'claim', deliveryId, keys, expiresAt }); }
    catch (error) { return { status: 'storage_error', detail: error.message }; }
    for (const key of keys) this.leases.set(key, { deliveryId, expiresAt });
    return { deliveryId, events: available.map(([, event]) => event), eventKeys: keys, leaseExpiresAt: new Date(expiresAt).toISOString(), queued: this.pending.size, capacity: this.maxPending };
  }

  acknowledge(deliveryId, eventKeys) {
    if (!this.key) return { status: 'locked', detail: 'Unlock the encrypted workspace before acknowledging LIVE events.' };
    if (this.storageFailed) return { status: 'storage_error', detail: 'The encrypted LIVE event journal is unavailable.' };
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
    if (keys.length !== requested.size) {
      const alreadyAcked = keys.length === 0 && [...requested].every(key => this.seen.has(key) && !this.pending.has(key));
      return alreadyAcked ? { status: 'duplicate', acknowledged: 0 } : { status: 'not_leased', acknowledged: 0, detail: 'Every event must belong to the active delivery lease. Pull the events again if the lease expired.' };
    }
    let acknowledged = 0;
    try {
      for (const key of keys) {
        this._append({ op: 'ack', key, deliveryId, at: now });
        this.pending.delete(key);
        this.leases.delete(key);
        acknowledged++;
      }
    } catch (error) {
      return { status: 'storage_error', acknowledged, detail: error.message };
    }
    return { status: 'acknowledged', acknowledged, queued: this.pending.size };
  }

  status() {
    const oldest = this.pending.values().next().value;
    return {
      queued: this.pending.size,
      capacity: this.maxPending,
      deduplicationEntries: this.seen.size,
      durable: true,
      encrypted: true,
      locked: !this.key,
      storageReady: Boolean(this.key) && !this.storageFailed,
      oldestPendingAt: oldest?.receivedAt || oldest?.occurredAt || null,
      recovery: { ...this.recovery }
    };
  }
}

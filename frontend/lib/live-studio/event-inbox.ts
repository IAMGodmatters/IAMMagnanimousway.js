import type { LiveEvent } from './event-contract';

const DB_NAME = 'magnanimous-live-event-inbox-v1';
const STORE_NAME = 'events';
const MAX_EVENTS = 100;
const RETENTION_MS = 24 * 60 * 60 * 1000;

type StoredEvent = {
  key: string;
  event: LiveEvent;
  storedAt: number;
  deliveredAt: number;
};

let database: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('This browser does not support the local event inbox.'));
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('storedAt', 'storedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('The local event inbox could not be opened.'));
    request.onblocked = () => reject(new Error('The local event inbox is blocked by another browser tab.'));
  });
  return database;
}

function eventKey(event: Pick<LiveEvent, 'provider' | 'eventId'>): string {
  return event.provider + ':' + event.eventId;
}

/** Persist a normalized event before it is exposed to the AI Host tab or acknowledged to the relay.
 * Never evict an event the Host has not accepted. At capacity, reclaim only delivered
 * records; if every slot is pending, abort the transaction so the relay can retry.
 */
export async function persistLiveEvent(event: LiveEvent): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = eventKey(event);
    let failure: Error | null = null;
    const lookup = store.get(key);
    lookup.onsuccess = () => {
      // A duplicate delivery is safe: keep the original receipt state and avoid a new slot.
      if (lookup.result) return;
      const all = store.getAll();
      all.onsuccess = () => {
        const records = all.result as StoredEvent[];
        const cutoff = Date.now() - RETENTION_MS;
        const expired = records.filter(item => !item || !Number.isFinite(item.storedAt) || item.storedAt < cutoff);
        for (const item of expired) {
          if (item && typeof item.key === 'string') store.delete(item.key);
        }
        const expiredKeys = new Set(expired.map(item => item?.key).filter((value): value is string => typeof value === 'string'));
        const remaining = records.filter(item => item && typeof item.key === 'string' && !expiredKeys.has(item.key))
          .sort((a, b) => a.storedAt - b.storedAt);
        const slotsToReclaim = Math.max(0, remaining.length - MAX_EVENTS + 1);
        if (slotsToReclaim > 0) {
          const delivered = remaining.filter(item => Number.isFinite(item.deliveredAt) && item.deliveredAt > 0);
          if (delivered.length < slotsToReclaim) {
            failure = new Error('The local event inbox is full of events not yet accepted by the AI Host. Existing events were preserved; free or acknowledge delivered items before new events can be saved.');
            tx.abort();
            return;
          }
          for (const item of delivered.slice(0, slotsToReclaim)) store.delete(item.key);
        }
        store.put({ key, event, storedAt: Date.now(), deliveredAt: 0 } satisfies StoredEvent);
      };
      all.onerror = () => {
        failure = all.error || new Error('The event inbox could not be read for safe compaction.');
        tx.abort();
      };
    };
    lookup.onerror = () => {
      failure = lookup.error || new Error('The event record could not be read.');
      tx.abort();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(failure || tx.error || new Error('The event inbox write failed.'));
    tx.onabort = () => reject(failure || tx.error || new Error('The event inbox write was cancelled.'));
  });
}

/** Return recent events, optionally limiting the result to events not yet accepted by the AI Host tab. */
export async function listLiveEventInbox(pendingOnly = false): Promise<LiveEvent[]> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const records = await new Promise<StoredEvent[]>((resolve, reject) => {
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StoredEvent[]);
    request.onerror = () => reject(request.error || new Error('The event inbox could not be read.'));
  });
  const cutoff = Date.now() - RETENTION_MS;
  return records.filter(item => item && item.event && Number.isFinite(item.storedAt) && item.storedAt >= cutoff && (!pendingOnly || !item.deliveredAt))
    .sort((a, b) => b.storedAt - a.storedAt)
    .slice(0, MAX_EVENTS)
    .map(item => item.event);
}

/** Check the durable Host-completion receipt so reconnects do not enqueue an event twice. */
export async function isLiveEventDelivered(provider: LiveEvent['provider'], eventId: string): Promise<boolean> {
  const db = await openDatabase();
  return await new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(provider + ':' + eventId);
    let delivered = false;
    request.onsuccess = () => {
      const record = request.result as StoredEvent | undefined;
      delivered = Boolean(record && Number.isFinite(record.deliveredAt) && record.deliveredAt > 0);
    };
    request.onerror = () => reject(request.error || new Error('The event completion receipt could not be read.'));
    tx.oncomplete = () => resolve(delivered);
    tx.onerror = () => reject(tx.error || new Error('The event completion receipt lookup failed.'));
    tx.onabort = () => reject(tx.error || new Error('The event completion receipt lookup was cancelled.'));
  });
}

/** Mark an event only after Magnanimous has completed its Host response; the bridge then acknowledges the relay. */
export async function markLiveEventDelivered(provider: LiveEvent['provider'], eventId: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = provider + ':' + eventId;
    const lookup = store.get(key);
    lookup.onsuccess = () => {
      const record = lookup.result as StoredEvent | undefined;
      if (record) store.put({ ...record, deliveredAt: Date.now() });
    };
    lookup.onerror = () => reject(lookup.error || new Error('The event record could not be updated.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('The event delivery receipt could not be saved.'));
    tx.onabort = () => reject(tx.error || new Error('The event delivery receipt was cancelled.'));
  });
}

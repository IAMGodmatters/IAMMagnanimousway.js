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

/** Persist a normalized event before it is exposed to the AI Host tab or acknowledged to the relay. */
export async function persistLiveEvent(event: LiveEvent): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = eventKey(event);
    const lookup = store.get(key);
    lookup.onsuccess = () => {
      if (!lookup.result) store.put({ key, event, storedAt: Date.now(), deliveredAt: 0 } satisfies StoredEvent);
      const all = store.getAll();
      all.onsuccess = () => {
        const records = all.result as StoredEvent[];
        const cutoff = Date.now() - RETENTION_MS;
        const expired = records.filter(item => !Number.isFinite(item.storedAt) || item.storedAt < cutoff);
        for (const item of expired) store.delete(item.key);
        const remaining = records.filter(item => !expired.some(expiredItem => expiredItem.key === item.key))
          .sort((a, b) => a.storedAt - b.storedAt);
        for (const item of remaining.slice(0, Math.max(0, remaining.length - MAX_EVENTS))) store.delete(item.key);
      };
      all.onerror = () => reject(all.error || new Error('The event inbox could not be compacted.'));
    };
    lookup.onerror = () => reject(lookup.error || new Error('The event record could not be read.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('The event inbox write failed.'));
    tx.onabort = () => reject(tx.error || new Error('The event inbox write was cancelled.'));
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

/** Mark an event as accepted into the Host interface; the bridge then acknowledges it to the relay. */
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

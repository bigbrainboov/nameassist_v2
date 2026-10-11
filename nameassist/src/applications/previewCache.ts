/* SIRI.DEV */
/** Disposable browser copies only; document lists and permissions still come from the API. */
type Version = { id: string; updated_at: string };
type Entry = { key: string; owner: string; id: string; version: string; blob: Blob; touched: number };
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_AGE = 24 * 60 * 60 * 1000;
const memory = new Map<string, Entry>();
const pending = new Map<string, Promise<Blob>>();
const invalidations = new Map<string, number>();
let owner: string | null = null;
let epoch = 0;
let database: Promise<IDBDatabase | null> | undefined;
let writes: Promise<unknown> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase | null> {
  if (!database) database = new Promise(resolve => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    try {
      const request = indexedDB.open('nameassist-document-previews', 1);
      const timeout = setTimeout(() => resolve(null), 1500);
      request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'key' });
      request.onsuccess = () => { clearTimeout(timeout); resolve(request.result); };
      request.onerror = request.onblocked = () => { clearTimeout(timeout); resolve(null); };
    } catch { resolve(null); }
  });
  return database;
}

async function diskEntries(): Promise<Entry[]> {
  const db = await openDatabase();
  if (!db) return [];
  return new Promise(resolve => {
    try {
      const request = db.transaction('files', 'readonly').objectStore('files').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

async function diskEntry(key: string): Promise<Entry | undefined> {
  // Logout/invalidation may already be queued. Never read ahead of its deletion transaction.
  await writes;
  const db = await openDatabase();
  if (!db) return;
  return new Promise(resolve => {
    try {
      const request = db.transaction('files', 'readonly').objectStore('files').get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}

function changeDisk(change: (store: IDBObjectStore) => void) {
  writes = writes.catch(() => {}).then(async () => {
    const db = await openDatabase();
    if (!db) return;
    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction('files', 'readwrite');
        tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
        change(tx.objectStore('files'));
      } catch { resolve(); }
    });
  });
  return writes;
}

function trim(entries: Entry[]) {
  let bytes = 0;
  return entries.sort((a, b) => b.touched - a.touched).filter(entry => {
    bytes += entry.blob.size;
    return bytes > MAX_BYTES || Date.now() - entry.touched > MAX_AGE;
  });
}

function keyFor(document: Version) { return JSON.stringify([owner, document.id, document.updated_at]); }
function sessionError() { return new Error('Your session changed. Please reopen the document.'); }

export function setPreviewAccount(next: string | null) {
  if (owner === next && next !== null) return;
  owner = next; epoch++; memory.clear(); pending.clear(); invalidations.clear();
  const current = epoch;
  // Retain this account's cache across a reload, discard other accounts on this browser.
  void changeDisk(store => {
    if (current !== epoch && next !== null) return;
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      if (!next || row.value.owner !== next) row.delete();
      row.continue();
    };
  });
}

export function capturePreviewSession() {
  const current = epoch;
  return () => current === epoch && owner !== null;
}

export async function seedPreview(document: Version, blob: Blob) {
  if (!owner || blob.size > MAX_BYTES) return;
  const current = epoch;
  const entry: Entry = { key: keyFor(document), owner, id: document.id, version: document.updated_at, blob, touched: Date.now() };
  memory.set(entry.key, entry);
  for (const old of trim([...memory.values()])) memory.delete(old.key);
  await changeDisk(store => { if (current === epoch) store.put(entry); });
  const expired = trim(await diskEntries());
  if (current === epoch && expired.length) await changeDisk(store => {
    if (current === epoch) expired.forEach(old => store.delete(old.key));
  });
}

export async function readPreview(document: Version, loader: () => Promise<Blob>): Promise<Blob> {
  if (!owner) return loader();
  const key = keyFor(document);
  const current = epoch;
  const revision = invalidations.get(document.id) || 0;
  const valid = () => current === epoch && revision === (invalidations.get(document.id) || 0);
  if (pending.has(key)) return pending.get(key)!;
  const work = (async () => {
    const entry = memory.get(key) || await diskEntry(key);
    if (!valid()) throw sessionError();
    if (entry && Date.now() - entry.touched < MAX_AGE) {
      memory.set(key, entry);
      for (const old of trim([...memory.values()])) memory.delete(old.key);
      return entry.blob;
    }
    const blob = await loader();
    if (!valid()) throw sessionError();
    await seedPreview(document, blob);
    if (!valid()) throw sessionError();
    return blob;
  })();
  pending.set(key, work);
  try { return await work; }
  finally { if (pending.get(key) === work) pending.delete(key); }
}

export async function invalidatePreview(id: string) {
  invalidations.set(id, (invalidations.get(id) || 0) + 1);
  const account = owner;
  for (const [key, entry] of memory) if (entry.id === id) memory.delete(key);
  for (const key of pending.keys()) if (JSON.parse(key)[1] === id) pending.delete(key);
  await changeDisk(store => {
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      if (row.value.owner === account && row.value.id === id) row.delete();
      row.continue();
    };
  });
}

/** Only call with the complete, successfully fetched customer document list. */
export async function reconcilePreviews(documents: Version[]) {
  const account = owner;
  const current = epoch;
  const versions = new Map(documents.map(doc => [doc.id, doc.updated_at]));
  const stale = (entry: Entry) => entry.owner === account && versions.get(entry.id) !== entry.version;
  for (const key of pending.keys()) {
    const [entryOwner, id, version] = JSON.parse(key);
    if (entryOwner === account && versions.get(id) !== version) {
      invalidations.set(id, (invalidations.get(id) || 0) + 1);
      pending.delete(key);
    }
  }
  for (const [key, entry] of memory) if (stale(entry)) memory.delete(key);
  await changeDisk(store => {
    if (current !== epoch) return;
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      if (stale(row.value)) row.delete();
      row.continue();
    };
  });
}

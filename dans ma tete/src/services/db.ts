/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'kaina_media_store_v1';
const STORE_NAME = 'media_assets';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function setMediaItem(key: string, value: string | null): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = value === null ? store.delete(key) : store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB set error for key ${key}:`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error(`Could not save media item ${key} to IndexedDB:`, err);
  }
}

export async function getMediaItem(key: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error(`IndexedDB get error for key ${key}:`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error(`Could not retrieve media item ${key} from IndexedDB:`, err);
    return null;
  }
}

export async function getAllMediaItems(keys: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = await getMediaItem(key);
  }
  return result;
}

export async function deleteMediaItem(key: string): Promise<void> {
  await setMediaItem(key, null);
}

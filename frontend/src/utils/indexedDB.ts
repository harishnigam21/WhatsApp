// utils/db.ts

const DB_NAME: string = `${process.env.NEXT_PUBLIC_PROJECT_NAME}`;
const STORE_NAME: string = "attachments";

interface MediaItem {
  blob: Blob;
  createdAt: number;
}

interface CursorItem {
  key: IDBValidKey;
  createdAt: number;
}

// Helper to safely check if we are executing on the client side (browser)
const isClient = typeof window !== "undefined";

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Fail gracefully if called on the server during Next.js SSR
    if (!isClient) {
      return reject(new Error("IndexedDB cannot be opened on the server."));
    }

    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db: IDBDatabase = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveToDB = async (key: string, blob: Blob): Promise<void> => {
  if (!isClient) return;

  const db: IDBDatabase = await openDB();
  const tx: IDBTransaction = db.transaction(STORE_NAME, "readwrite");
  const store: IDBObjectStore = tx.objectStore(STORE_NAME);

  const data: MediaItem = {
    blob,
    createdAt: Date.now(),
  };

  store.put(data, key);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getFromDB = async (
  key: string,
): Promise<MediaItem | undefined> => {
  if (!isClient) return undefined;

  const db: IDBDatabase = await openDB();
  const tx: IDBTransaction = db.transaction(STORE_NAME, "readonly");
  const store: IDBObjectStore = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request: IDBRequest<MediaItem | undefined> = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFromDB = async (keys: string[]): Promise<string> => {
  if (!isClient) return "Skipped server execution";

  const db: IDBDatabase = await openDB();
  const tx: IDBTransaction = db.transaction(STORE_NAME, "readwrite");
  const store: IDBObjectStore = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    keys.forEach((key) => {
      store.delete(key);
    });
    tx.oncomplete = () => resolve("Deleted");
    tx.onerror = () => reject("Error deleting");
  });
};

// On logout
export const clearMediaCache = async (
  st: string = STORE_NAME,
): Promise<void> => {
  if (!isClient) return;

  const db: IDBDatabase = await openDB();
  const tx: IDBTransaction = db.transaction(st, "readwrite");
  const store: IDBObjectStore = tx.objectStore(st);
  store.clear();
};

// After every download
export const cleanupOldMedia = async (
  st: string = STORE_NAME,
  limit: number = 50,
): Promise<void> => {
  if (!isClient) return;

  const db: IDBDatabase = await openDB();
  const tx: IDBTransaction = db.transaction(st, "readwrite");
  const store: IDBObjectStore = tx.objectStore(st);
  const items: CursorItem[] = [];

  const request: IDBRequest<IDBCursorWithValue | null> = store.openCursor();

  request.onsuccess = (event: Event) => {
    const target = event.target as IDBRequest<IDBCursorWithValue | null>;
    const cursor = target.result;

    if (cursor) {
      const value = cursor.value as MediaItem;
      items.push({
        key: cursor.key,
        createdAt: value.createdAt,
      });
      cursor.continue();
    } else {
      if (items.length <= limit) return;

      items.sort((a, b) => a.createdAt - b.createdAt);
      const toDelete = items.slice(0, items.length - limit);

      toDelete.forEach((item) => {
        store.delete(item.key);
      });
    }
  };
};

// On app start
export const cleanupExpiredMedia = async (
  st: string = STORE_NAME,
): Promise<void> => {
  if (!isClient) return;

  const MAX_AGE: number = 7 * 24 * 60 * 60 * 1000; // 7 days
  const db: IDBDatabase = await openDB();
  const tx: IDBTransaction = db.transaction(st, "readwrite");
  const store: IDBObjectStore = tx.objectStore(st);

  const request: IDBRequest<IDBCursorWithValue | null> = store.openCursor();

  request.onsuccess = (event: Event) => {
    const target = event.target as IDBRequest<IDBCursorWithValue | null>;
    const cursor = target.result;

    if (cursor) {
      const item = cursor.value as MediaItem;
      const now = Date.now();

      if (now - item.createdAt > MAX_AGE) {
        cursor.delete();
      }
      cursor.continue();
    }
  };
};

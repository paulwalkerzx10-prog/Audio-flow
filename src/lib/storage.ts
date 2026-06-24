import { Recording } from '../types';

// Fallback in-memory storage for restricted environments (e.g. iframe sandbox blockages)
const memoryStore: Record<string, Recording> = {};
let useMemoryFallback = false;

// Prepopulate some default mock recordings in memory if we fall back, so user experiences fully functioning UI
const initialMocks: Recording[] = [
  {
    id: 'mock-1',
    title: 'Vocal Masterclass 03',
    date: new Date('2026-06-20T10:34:00').getTime(),
    durationMs: 145000, 
    tags: ['Recordings'],
    isBookmarked: true,
    blob: new Blob()
  },
  {
    id: 'mock-2',
    title: 'Field Acoustics Demo',
    date: new Date('2026-06-19T14:15:00').getTime(),
    durationMs: 222000, 
    tags: ['Recordings'],
    isBookmarked: false,
    blob: new Blob()
  },
  {
    id: 'mock-3',
    title: 'Raw Acoustic Melody',
    date: new Date('2026-06-18T09:41:00').getTime(),
    durationMs: 87000, 
    tags: ['Favorites'],
    isBookmarked: true,
    blob: new Blob()
  },
  {
    id: 'mock-4',
    title: 'Ambient Vocal Synthesis',
    date: new Date('2026-06-17T11:20:00').getTime(),
    durationMs: 72800, 
    tags: ['Recordings'],
    isBookmarked: false,
    blob: new Blob()
  }
];

initialMocks.forEach(m => {
  memoryStore[m.id] = m;
});

// Native IndexedDB provider with strict exception intercepts
let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function checkIndexedDBEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // In strict sandboxed iframes, window.origin is "null".
    // Also, if document.domain is empty/null, or access is denied, we shouldn't attempt IndexedDB.
    const origin = window.origin;
    const protocol = window.location ? window.location.protocol : '';
    if (origin === 'null' || protocol === 'data:') {
      return false;
    }
    
    // Use 'in' operator to avoid accessing properties directly if blocked
    if (!('indexedDB' in window)) return false;
    
    // Test access by reading the property value inside try-catch
    const idb = window.indexedDB;
    if (!idb) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

// Detect immediately on load if IndexedDB is disabled/blocked to avoid any calls to it
if (!checkIndexedDBEnabled()) {
  useMemoryFallback = true;
}

function getNativeDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!checkIndexedDBEnabled()) {
      reject(new Error('IndexedDB not supported or blocked'));
      return;
    }

    try {
      const request = window.indexedDB.open('vocala-db', 1);

      request.onerror = (event) => {
        try {
          // CRITICAL: Call preventDefault to prevent sandbox/security error events
          // from bubbling up to window.onerror as "Script error."
          event.preventDefault();
          event.stopPropagation();
        } catch (e) {}
        reject(request.error || new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('recordings')) {
          const store = db.createObjectStore('recordings', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
      };
    } catch (err) {
      reject(err);
    }
  });

  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

export async function saveRecording(recording: Recording): Promise<void> {
  if (useMemoryFallback) {
    memoryStore[recording.id] = recording;
    return;
  }

  try {
    const db = await getNativeDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction('recordings', 'readwrite');
        const store = tx.objectStore('recordings');
        const request = store.put(recording);

        request.onerror = (event) => {
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch (e) {}
          reject(request.error || new Error('Failed to save recording'));
        };

        request.onsuccess = () => {
          resolve();
        };
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (err) {
    console.warn("Falling back to memory storage for saveRecording:", err);
    useMemoryFallback = true;
    memoryStore[recording.id] = recording;
  }
}

export async function getRecordings(): Promise<Recording[]> {
  if (useMemoryFallback) {
    return Object.values(memoryStore).sort((a, b) => b.date - a.date);
  }

  try {
    const db = await getNativeDB();
    return await new Promise<Recording[]>((resolve, reject) => {
      try {
        const tx = db.transaction('recordings', 'readonly');
        const store = tx.objectStore('recordings');
        const index = store.index('by-date');
        const request = index.getAll();

        request.onerror = (event) => {
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch (e) {}
          reject(request.error || new Error('Failed to get recordings'));
        };

        request.onsuccess = () => {
          resolve(request.result || []);
        };
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (err) {
    console.warn("Falling back to memory storage for getRecordings:", err);
    useMemoryFallback = true;
    return Object.values(memoryStore).sort((a, b) => b.date - a.date);
  }
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  if (useMemoryFallback) {
    return memoryStore[id];
  }

  try {
    const db = await getNativeDB();
    return await new Promise<Recording | undefined>((resolve, reject) => {
      try {
        const tx = db.transaction('recordings', 'readonly');
        const store = tx.objectStore('recordings');
        const request = store.get(id);

        request.onerror = (event) => {
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch (e) {}
          reject(request.error || new Error('Failed to get recording'));
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (err) {
    console.warn("Falling back to memory storage for getRecording:", err);
    useMemoryFallback = true;
    return memoryStore[id];
  }
}

export async function deleteRecording(id: string): Promise<void> {
  if (useMemoryFallback) {
    delete memoryStore[id];
    return;
  }

  try {
    const db = await getNativeDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction('recordings', 'readwrite');
        const store = tx.objectStore('recordings');
        const request = store.delete(id);

        request.onerror = (event) => {
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch (e) {}
          reject(request.error || new Error('Failed to delete recording'));
        };

        request.onsuccess = () => {
          resolve();
        };
      } catch (txErr) {
        reject(txErr);
      }
    });
  } catch (err) {
    console.warn("Falling back to memory storage for deleteRecording:", err);
    useMemoryFallback = true;
    delete memoryStore[id];
  }
}

export async function updateRecording(recording: Recording): Promise<void> {
  await saveRecording(recording);
}

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Recording } from '../types';

interface VocalaDB extends DBSchema {
  recordings: {
    key: string;
    value: Recording;
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<VocalaDB>> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VocalaDB>('vocala-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('recordings', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
}

export async function saveRecording(recording: Recording): Promise<void> {
  const db = await getDB();
  await db.put('recordings', recording);
}

export async function getRecordings(): Promise<Recording[]> {
  const db = await getDB();
  return await db.getAllFromIndex('recordings', 'by-date');
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  const db = await getDB();
  return await db.get('recordings', id);
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recordings', id);
}

export async function updateRecording(recording: Recording): Promise<void> {
  const db = await getDB();
  await db.put('recordings', recording);
}

import { SavedComic, User } from "../types";

const DB_NAME = "HeroGenDB";
const DB_VERSION = 1;
const STORE_USERS = "users";
const STORE_COMICS = "comics";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_COMICS)) {
        const comicStore = db.createObjectStore(STORE_COMICS, { keyPath: "id" });
        comicStore.createIndex("userId", "userId", { unique: false });
      }
    };
  });
};

export const dbService = {
  async saveUser(user: User): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, "readwrite");
      const store = tx.objectStore(STORE_USERS);
      store.put(user);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getUser(id: string): Promise<User | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, "readonly");
      const store = tx.objectStore(STORE_USERS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async saveComic(comic: SavedComic): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMICS, "readwrite");
      const store = tx.objectStore(STORE_COMICS);
      store.put(comic);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getComicsByUser(userId: string): Promise<SavedComic[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMICS, "readonly");
      const store = tx.objectStore(STORE_COMICS);
      const index = store.index("userId");
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async getComic(id: string): Promise<SavedComic | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMICS, "readonly");
      const store = tx.objectStore(STORE_COMICS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteComic(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMICS, "readwrite");
      const store = tx.objectStore(STORE_COMICS);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
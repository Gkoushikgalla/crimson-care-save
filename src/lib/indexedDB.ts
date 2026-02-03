/**
 * IndexedDB utility for better local data management
 * Provides larger storage capacity, better performance, and structured data handling
 */

const DB_NAME = "crimsoncare_db";
const DB_VERSION = 1;

interface StoreConfig {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique: boolean }[];
}

const STORES: StoreConfig[] = [
  {
    name: "users",
    keyPath: "id",
    indexes: [
      { name: "email", keyPath: "email", unique: true },
      { name: "role", keyPath: "role", unique: false },
      { name: "bloodType", keyPath: "bloodType", unique: false },
    ],
  },
  {
    name: "sosRequests",
    keyPath: "id",
    indexes: [
      { name: "status", keyPath: "status", unique: false },
      { name: "hospitalName", keyPath: "hospitalName", unique: false },
      { name: "createdAt", keyPath: "createdAt", unique: false },
      { name: "bloodType", keyPath: "bloodType", unique: false },
    ],
  },
  {
    name: "donations",
    keyPath: "id",
    indexes: [
      { name: "donorId", keyPath: "donorId", unique: false },
      { name: "hospitalName", keyPath: "hospitalName", unique: false },
      { name: "sosRequestId", keyPath: "sosRequestId", unique: false },
      { name: "status", keyPath: "status", unique: false },
      { name: "donatedAt", keyPath: "donatedAt", unique: false },
    ],
  },
  {
    name: "notifications",
    keyPath: "id",
    indexes: [
      { name: "userId", keyPath: "userId", unique: false },
      { name: "read", keyPath: "read", unique: false },
      { name: "createdAt", keyPath: "createdAt", unique: false },
    ],
  },
];

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens and initializes the IndexedDB database
 */
export const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      STORES.forEach((storeConfig) => {
        if (!db.objectStoreNames.contains(storeConfig.name)) {
          const store = db.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
          });

          storeConfig.indexes?.forEach((index) => {
            store.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }
      });
    };
  });

  return dbPromise;
};

/**
 * Generic get all records from a store
 */
export const getAll = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB getAll error for ${storeName}:`, error);
    return [];
  }
};

/**
 * Get a single record by key
 */
export const getById = async <T>(storeName: string, id: string): Promise<T | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB getById error for ${storeName}:`, error);
    return undefined;
  }
};

/**
 * Get records by index
 */
export const getByIndex = async <T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB getByIndex error for ${storeName}:`, error);
    return [];
  }
};

/**
 * Add or update a record
 */
export const put = async <T>(storeName: string, data: T): Promise<T> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB put error for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Add multiple records in a batch
 */
export const putMany = async <T>(storeName: string, items: T[]): Promise<void> => {
  if (items.length === 0) return;
  
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`IndexedDB putMany error for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Delete a record by key
 */
export const remove = async (storeName: string, id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB remove error for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Clear all records from a store
 */
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB clearStore error for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Migrate data from localStorage to IndexedDB
 */
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    // Migrate users
    const usersData = localStorage.getItem("crimsoncare_users");
    if (usersData) {
      const users = JSON.parse(usersData);
      if (Array.isArray(users) && users.length > 0) {
        await putMany("users", users);
        console.log(`Migrated ${users.length} users to IndexedDB`);
      }
    }

    // Migrate SOS requests
    const sosData = localStorage.getItem("crimsoncare_sos_requests");
    if (sosData) {
      const sosRequests = JSON.parse(sosData);
      if (Array.isArray(sosRequests) && sosRequests.length > 0) {
        await putMany("sosRequests", sosRequests);
        console.log(`Migrated ${sosRequests.length} SOS requests to IndexedDB`);
      }
    }

    // Migrate donations
    const donationsData = localStorage.getItem("crimsoncare_donations");
    if (donationsData) {
      const donations = JSON.parse(donationsData);
      if (Array.isArray(donations) && donations.length > 0) {
        await putMany("donations", donations);
        console.log(`Migrated ${donations.length} donations to IndexedDB`);
      }
    }

    // Mark migration as complete
    localStorage.setItem("crimsoncare_idb_migrated", "true");
  } catch (error) {
    console.error("Migration from localStorage failed:", error);
  }
};

/**
 * Check if migration is needed and perform it
 */
export const initializeDB = async (): Promise<void> => {
  await openDB();
  
  const migrated = localStorage.getItem("crimsoncare_idb_migrated");
  if (!migrated) {
    await migrateFromLocalStorage();
  }
};

/**
 * Check if IndexedDB is available
 */
export const isIndexedDBAvailable = (): boolean => {
  return typeof indexedDB !== "undefined";
};

// Store names as constants for type safety
export const STORE_NAMES = {
  USERS: "users",
  SOS_REQUESTS: "sosRequests",
  DONATIONS: "donations",
  NOTIFICATIONS: "notifications",
} as const;

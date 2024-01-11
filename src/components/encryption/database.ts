/**
 * @file Establishes a persistent key storage via IndexedDB
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

const DATABASE_NAME = 'cryptotools';
const KEY_STORE_NAME = 'keys';
const CURRENT_VERSION = 1;

let db: IDBDatabase;

/**
 * Open the database
 */
const openDatabase = () => new Promise<boolean>((resolve, reject) => {
  const request = window.indexedDB.open(DATABASE_NAME, CURRENT_VERSION);

  request.onerror = () => {
    reject(new Error('Cannot open database.'));
  };

  request.onupgradeneeded = () => {
    db = request.result;

    // Create an objectStore for this database
    db.createObjectStore(KEY_STORE_NAME, { keyPath: 'name' });
  };

  request.onsuccess = () => {
    db = request.result;
    db.onerror = (event) => console.error(new Error(`A database error ocurred: ${JSON.stringify(event.target)}`));
    resolve(true);
  };
});

/**
 * Store a cryptographic key to the database
 */
const storeKey = (
  keyName: string,
  key: CryptoKey | CryptoKeyPair,
) => new Promise<boolean>((resolve, reject) => {
  const transaction = db.transaction([KEY_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(KEY_STORE_NAME);
  const request = store.add({
    name: keyName,
    key,
  });

  request.onerror = (event) => reject(new Error(JSON.stringify(event)));
  request.onsuccess = () => resolve(true);
});

/**
 * Delete a cryptographic key from the database
 */
const deleteKey = (keyName: string) => new Promise<boolean>((resolve, reject) => {
  const transaction = db.transaction([KEY_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(KEY_STORE_NAME);
  const request = store.delete(keyName);

  request.onerror = (event) => reject(new Error(JSON.stringify(event)));
  request.onsuccess = () => resolve(true);
});

type KeyStoreObject = { name: string, key: CryptoKey | CryptoKeyPair };

/**
 * Retrieve all keys from the database
 */
const getKeys = () => new Promise<KeyStoreObject[]>((resolve, reject) => {
  const transaction = db.transaction([KEY_STORE_NAME], 'readonly');
  const store = transaction.objectStore(KEY_STORE_NAME);
  const request = store.getAll();

  request.onerror = (event) => reject(new Error(JSON.stringify(event)));
  request.onsuccess = (event) => resolve((event.target as any).result); // TODO: proper typing
});

export {
  openDatabase, getKeys, storeKey, deleteKey,
};

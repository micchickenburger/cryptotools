/**
 * @file Key Management
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import { handleError } from '../../lib/error';
import load from '../../lib/loader';
import showModal from '../../lib/modal';
import { hideResults } from '../../lib/result';
import {
  DISK_SVG, KEYS_SVG, KEY_SVG, TRASH_SVG,
} from '../../lib/svg';
import {
  deleteKey, getKeys, openDatabase, storeKey,
} from './database';
// eslint-disable-next-line import/no-cycle
import updateOpArea from './operationArea';

type Key = {
  saved: boolean,
  key: CryptoKey | CryptoKeyPair,
};

/**
 * Dictionary of keys in ephemeral state
 */
const keys: { [keyName: string]: Key } = {};

/**
 * Update Key List
 */
const updateKeyList = () => {
  // Hide Operation Area
  const opArea = document.querySelector<HTMLElement>('#encryption .operation-area');
  opArea?.classList.remove('active');
  hideResults();

  const list = document.querySelector<HTMLElement>('#encryption .list-keys ul')!;
  list.textContent = ''; // reset list

  const array = Object.entries(keys);
  if (!array.length) {
    const li = document.createElement('li');
    li.textContent = 'No Keys.  Generate a key to get started.';
    list.appendChild(li);
  }

  array.forEach(([k, v]) => {
    const { key } = v;

    const li = document.createElement('li');
    li.addEventListener('click', updateOpArea(k, key));

    const container = document.createElement('div');
    container.classList.add('container');
    li.appendChild(container);

    const icon = document.createElement('span');
    container.appendChild(icon);

    const meta = document.createElement('div');
    meta.classList.add('meta');
    container.appendChild(meta);

    const name = document.createElement('span');
    name.textContent = k;
    meta.appendChild(name);

    if (v.saved) {
      const disk = document.createElement('span');
      disk.classList.add('saved');
      disk.dataset.tooltip = 'Persists after page refresh';
      disk.innerHTML = DISK_SVG;
      name.appendChild(disk);
    }

    const isSymmetric = key instanceof CryptoKey;

    const attributes = document.createElement('span');
    let type: string;
    let alg: string;
    let usages: KeyUsage[];

    if (isSymmetric) {
      icon.innerHTML = KEY_SVG;
      type = 'Symmetric Key';
      alg = key.algorithm.name;
      usages = key.usages;
    } else {
      icon.innerHTML = KEYS_SVG;
      type = 'Asymmetric Key Pair';
      alg = key.privateKey.algorithm.name;
      usages = key.privateKey.usages.concat(key.publicKey.usages);
    }

    attributes.textContent = `${type} • ${alg} • ${usages.join(', ')}`;
    meta.appendChild(attributes);

    const actions = document.createElement('div');
    actions.classList.add('actions');
    li.appendChild(actions);

    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = TRASH_SVG;
    a.dataset.tooltip = 'Delete key';
    a.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation(); // prevent li click from registering

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      showModal(TRASH_SVG, 'Are you sure?', 'This is an unrecoverable operation.', 'Delete', removeKey(k));
    });
    actions.appendChild(a);

    list.appendChild(li);
  });
};

/**
 * Show key list
 */
const showKeys = () => document.querySelector<HTMLElement>('#encryption li[data-target="list-keys"]')?.click();

/**
 * Add keys to dictionary
 */
const addKey = (name: string, key: CryptoKey | CryptoKeyPair, save: boolean = false) => {
  if (keys[name]) throw new Error(`A key by the name of "${name}" already exists.`);
  keys[name] = { saved: save, key };

  if (save) storeKey(name, key);

  updateKeyList();
  showKeys();
  load(100);
};

/**
 * Retrieve keys from dictionary
 */
const getKey = (name: string) => {
  if (!keys[name]) throw new Error(`A key by the name of "${name}" does not exist.`);
  return keys[name];
};

/**
 * Delete key from dictionary and database
 */
const removeKey = (name: string) => async () => {
  try {
    await deleteKey(name);
    delete keys[name];
    updateKeyList();
  } catch (e) { handleError(e); }
};

// Start by opening the Keys database
(async () => {
  try {
    await openDatabase();

    // Populate the keys dictionary
    const k = await getKeys();
    k.forEach(({ name, key }) => { keys[name] = { saved: true, key }; });
    updateKeyList();
  } catch (e) { handleError(e); }
})();

export { addKey, getKey, updateKeyList };

/**
 * @file Key Management
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { handleError } from '../../lib/error';
import load from '../../lib/loader';
import { KEYS_SVG, KEY_SVG } from '../../lib/svg';
import { getKeys, openDatabase, storeKey } from './database';
// eslint-disable-next-line import/no-cycle
import updateOpArea from './operationArea';

/**
 * Dictionary of keys in ephemeral state
 */
const keys: { [key: string]: CryptoKey | CryptoKeyPair } = {};

/**
 * Update Key List
 */
const updateKeyList = () => {
  const list = document.querySelector<HTMLElement>('#encryption .list-keys ul')!;
  list.textContent = ''; // reset list

  Object.entries(keys).forEach(([k, v]) => {
    const li = document.createElement('li');
    li.addEventListener('click', updateOpArea(k, v));

    const container = document.createElement('div');
    const icon = document.createElement('span');
    const meta = document.createElement('div');
    container.classList.add('container');
    meta.classList.add('meta');

    const name = document.createElement('span');
    name.textContent = k;
    meta.appendChild(name);

    const isSymmetric = v instanceof CryptoKey;

    const attributes = document.createElement('span');
    let type: string;
    let alg: string;
    let usages: KeyUsage[];

    if (isSymmetric) {
      icon.innerHTML = KEY_SVG;
      type = 'Symmetric Key';
      alg = v.algorithm.name;
      usages = v.usages;
    } else {
      icon.innerHTML = KEYS_SVG;
      type = 'Asymmetric Key Pair';
      alg = v.privateKey.algorithm.name;
      usages = v.privateKey.usages.concat(v.publicKey.usages);
    }

    attributes.textContent = `${type} • ${alg} • ${usages.join(', ')}`;
    meta.appendChild(attributes);

    container.appendChild(icon);
    container.appendChild(meta);
    li.appendChild(container);

    const actions = document.createElement('div');
    actions.classList.add('actions');
    li.appendChild(actions);

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
  keys[name] = key;

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

// Start by opening the Keys database
(async () => {
  try {
    await openDatabase();

    // Populate the keys dictionary
    const k = await getKeys();
    k.forEach(({ name, key }) => { keys[name] = key; });
    updateKeyList();
  } catch (e) { handleError(e); }
})();

export { addKey, getKey, updateKeyList };

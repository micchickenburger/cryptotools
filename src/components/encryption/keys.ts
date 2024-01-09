/**
 * @file Key Management
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import load from '../../lib/loader';
import { KEYS_SVG, KEY_SVG } from '../../lib/svg';
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
    usages.forEach((usage) => {
      const button = document.createElement('button');
      button.textContent = `${usage.charAt(0).toUpperCase()}${usage.slice(1)}`;
      button.addEventListener('click', updateOpArea(usage, k, v));
      actions.appendChild(button);
    });
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
const addKey = (name: string, key: CryptoKey | CryptoKeyPair) => {
  if (keys[name]) throw new Error(`A key by the name of "${name}" already exists.`);
  keys[name] = key;

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

export { addKey, getKey, updateKeyList };

/**
 * @file Key Management
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { KEYS_SVG, KEY_SVG } from '../../lib/svg';
import { showResults } from '../../lib/result';
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
    const div = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = k;
    div.appendChild(name);

    const isSymmetric = v instanceof CryptoKey;

    const meta = document.createElement('span');
    let type: string;
    let alg: string;
    let usages: KeyUsage[];

    if (isSymmetric) {
      li.innerHTML = KEY_SVG;
      type = 'Symmetric Key';
      alg = v.algorithm.name;
      usages = v.usages;
    } else {
      li.innerHTML = KEYS_SVG;
      type = 'Asymmetric Key Pair';
      alg = v.privateKey.algorithm.name;
      usages = v.privateKey.usages.concat(v.publicKey.usages);
    }

    meta.textContent = `${type} • ${alg} • ${usages.join(', ')}`;
    div.appendChild(meta);
    li.appendChild(div);

    usages.forEach((usage) => {
      const button = document.createElement('button');
      button.textContent = `${usage.charAt(0).toUpperCase()}${usage.slice(1)}`;
      button.addEventListener('click', updateOpArea(usage, k, v));
      li.appendChild(button);
    });

    list.appendChild(li);
  });
};

/**
 * Stringify results for prettier display
 */
const stringify = (key: CryptoKey) => JSON.stringify({
  type: key.type,
  extractable: key.extractable,
  algorithm: key.algorithm,
  usages: key.usages,
}, null, 2);

/**
 * Add keys to dictionary
 */
const addKey = (name: string, key: CryptoKey | CryptoKeyPair) => {
  if (keys[name]) throw new Error(`A key by the name of "${name}" already exists.`);
  keys[name] = key;

  const results = [];
  if (key instanceof CryptoKey) {
    results.push({
      label: name,
      value: stringify(key),
    });
  } else {
    Object.entries(key).forEach(([k, v]) => results.push({
      label: `${name} ${k}`,
      value: stringify(v),
    }));
  }

  updateKeyList();
  showResults(results);
};

/**
 * Retrieve keys from dictionary
 */
const getKey = (name: string) => {
  if (!keys[name]) throw new Error(`A key by the name of "${name}" does not exist.`);
  return keys[name];
};

export { addKey, getKey, updateKeyList };

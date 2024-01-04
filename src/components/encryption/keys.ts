/**
 * @file Key Management
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { KEYS_SVG, KEY_SVG } from '../../lib/svg';
import { showResults } from '../../lib/result';

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

    const meta = document.createElement('span');
    let type: string;
    let alg: string;
    let usages: string;
    if (v instanceof CryptoKey) {
      li.innerHTML = KEY_SVG;
      type = 'Symmetric Key';
      alg = v.algorithm.name;
      usages = v.usages.join(', ');
    } else {
      li.innerHTML = KEYS_SVG;
      type = 'Asymmetric Key Pair';
      alg = v.privateKey.algorithm.name;
      usages = v.privateKey.usages.concat(v.publicKey.usages).join(', ');
    }
    meta.textContent = `${type} • ${alg} • ${usages}`;

    div.appendChild(meta);
    li.appendChild(div);
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

export { addKey, updateKeyList };

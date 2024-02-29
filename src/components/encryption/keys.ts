/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * @file Key Management
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import { ENCODING, encode } from '../../lib/encode';
import { handleError } from '../../lib/error';
import load from '../../lib/loader';
import showModal from '../../lib/modal';
import { Result, hideResults, showResults } from '../../lib/result';
import {
  DISK_SVG, KEYS_SVG, KEY_SVG, PRIVATE_EXPORT_SVG, PUBLIC_EXPORT_SVG, TRASH_SVG,
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
 * Ephemeral dictionary of keys
 */
const keys: { [keyName: string]: Key } = {};

/**
 * Handle key export clicks
 */
const exportKeyHandler = (key: CryptoKey, name: string) => async (event: Event) => {
  event.preventDefault();
  event.stopPropagation(); // prevent li click from registering

  const type = `${key.type.charAt(0).toUpperCase()}${key.type.slice(1)}`;
  const filename = `${name.replace(/\s/g, '-')}.${key.type}`;
  const results: Result[] = [];

  try {
    switch (key.algorithm.name) {
      // Symmetric algorithms
      case 'AES-CTR': case 'AES-CBC': case 'AES-GCM': case 'HMAC':
        results.push({
          label: `${type} Key "${name}" in Raw Format`,
          value: await exportKey(key, 'raw')() as ArrayBuffer,
          filename,
          extension: 'key',
        });
        break;
      // Asymmetric algorithms
      case 'RSASSA-PKCS1-v1_5': case 'RSA-PSS': case 'RSA-OAEP': case 'ECDSA': {
        const isPrivate = key.type === 'private';
        const value = await exportKey(key, isPrivate ? 'pkcs8' : 'spki')() as ArrayBuffer;
        results.push({
          label: `${type} Key "${name}" in ${isPrivate ? 'PKCS#8' : 'Subject Public Key Info (SPKI)'} Format, DER-Encoded`,
          value,
          defaultEncoding: ENCODING.BASE64,
          filename,
          extension: 'der',
        }, {
          label: `${type} Key "${name}" in PKCS#8 Format, PEM-Encoded`,
          value: `-----BEGIN ${type.toUpperCase()} KEY-----\n${encode(value, ENCODING.BASE64)}\n-----END ${type.toUpperCase()} KEY-----\n`,
          filename,
          extension: isPrivate ? 'key' : 'pem',
        });
        break;
      }
      default:
        throw new Error(`Unsupported key algorithm ${key.algorithm.name}`);
    }

    // For some reason, Elliptic Curve public keys (not private) can also be exported in raw format
    if (key.algorithm.name === 'ECDSA' && key.type === 'public') {
      results.push({
        label: `${type} Key "${name}" in Raw Format`,
        value: await exportKey(key, 'raw')() as ArrayBuffer,
        defaultEncoding: ENCODING.BASE64,
        filename,
      });
    }

    // All algorithms have a JWK export format
    results.push({
      label: `${type} Key "${name}" in JSON Web Key (JWK) Format`,
      value: JSON.stringify(await exportKey(key, 'jwk')() as JsonWebKey, null, 2),
      filename,
    });

    showResults(results);
  } catch (e) { handleError(e); }
};

/**
 * Update Key List
 */
const updateKeyList = () => {
  // Hide Operation Area
  const opArea = document.querySelector<HTMLElement>('#encryption .operation-area');
  opArea?.classList.remove('active');
  hideResults();

  const list = document.querySelector<HTMLElement>('#encryption [data-tab="list-keys"] ul')!;
  list.textContent = ''; // reset list

  const array = Object.entries(keys);
  if (!array.length) {
    const li = document.createElement('li');
    li.textContent = 'No Keys.  Generate or import a key to get started.';
    list.appendChild(li);
  }

  array.forEach(([k, v]) => {
    const { key: keyStructure } = v;

    const li = document.createElement('li');
    li.addEventListener('click', updateOpArea(k, keyStructure));

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

    const isSingleKey = keyStructure instanceof CryptoKey;
    const isSymmetric = isSingleKey && keyStructure.type === 'secret';

    const attributes = document.createElement('span');
    let description: string;
    let alg: string;
    let usages: KeyUsage[];

    if (isSingleKey) {
      icon.innerHTML = KEY_SVG;
      description = isSymmetric ? 'Symmetric Key' : `Asymmetric ${keyStructure.type.charAt(0).toUpperCase()}${keyStructure.type.slice(1)} Key`;
      alg = keyStructure.algorithm.name;
      usages = keyStructure.usages;
    } else {
      icon.innerHTML = KEYS_SVG;
      description = 'Asymmetric Key Pair';
      alg = keyStructure.privateKey.algorithm.name;
      usages = keyStructure.privateKey.usages.concat(keyStructure.publicKey.usages);
    }

    attributes.textContent = `${description} • ${alg} • ${usages.join(', ')}`;
    meta.appendChild(attributes);

    const actions = document.createElement('div');
    actions.classList.add('actions');
    li.appendChild(actions);

    // At minimum, public keys are always exportable
    if (!isSingleKey) {
      const exportPublic = document.createElement('a');
      exportPublic.href = '#';
      exportPublic.innerHTML = PUBLIC_EXPORT_SVG;
      exportPublic.dataset.tooltip = 'Export Public Key';
      exportPublic.addEventListener('click', exportKeyHandler(keyStructure.publicKey, k));
      actions.appendChild(exportPublic);
    }

    // Symmetric keys or asymmetric private keys marked as extractable
    if (
      (!isSingleKey && keyStructure.privateKey.extractable)
      || (isSingleKey && keyStructure.extractable)
    ) {
      const key = isSingleKey ? keyStructure : keyStructure.privateKey;
      const exportPrivate = document.createElement('a');
      exportPrivate.href = '#';
      exportPrivate.innerHTML = key.type === 'public' ? PUBLIC_EXPORT_SVG : PRIVATE_EXPORT_SVG;
      exportPrivate.dataset.tooltip = `Export ${key.type.charAt(0).toUpperCase()}${key.type.slice(1)} Key`;
      exportPrivate.addEventListener('click', exportKeyHandler(key, k));
      actions.appendChild(exportPrivate);
    }

    const trash = document.createElement('a');
    trash.href = '#';
    trash.innerHTML = TRASH_SVG;
    trash.dataset.tooltip = 'Delete key';
    trash.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation(); // prevent li click from registering
      showModal(TRASH_SVG, 'Are you sure?', 'This is an unrecoverable operation.', 'Delete', removeKey(k));
    });
    actions.appendChild(trash);

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

/**
 * Export key
 * @param name The key to export
 * @param format Export format
 */
const exportKey = (key: CryptoKey, format: KeyFormat) => async () => window
  .crypto.subtle.exportKey(format, key);

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

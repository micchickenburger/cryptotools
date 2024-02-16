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

    const isSymmetric = keyStructure instanceof CryptoKey;

    const attributes = document.createElement('span');
    let type: string;
    let alg: string;
    let usages: KeyUsage[];

    if (isSymmetric) {
      icon.innerHTML = KEY_SVG;
      type = 'Symmetric Key';
      alg = keyStructure.algorithm.name;
      usages = keyStructure.usages;
    } else {
      icon.innerHTML = KEYS_SVG;
      type = 'Asymmetric Key Pair';
      alg = keyStructure.privateKey.algorithm.name;
      usages = keyStructure.privateKey.usages.concat(keyStructure.publicKey.usages);
    }

    attributes.textContent = `${type} • ${alg} • ${usages.join(', ')}`;
    meta.appendChild(attributes);

    const actions = document.createElement('div');
    actions.classList.add('actions');
    li.appendChild(actions);

    // At minimum, public keys are always exportable
    if (!isSymmetric) {
      const exportPublic = document.createElement('a');
      exportPublic.href = '#';
      exportPublic.innerHTML = PUBLIC_EXPORT_SVG;
      exportPublic.dataset.tooltip = 'Export Public Key';
      exportPublic.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation(); // prevent li click from registering

        const key = keyStructure.publicKey;
        const filename = `${k.replace(/\s/g, '-')}.public`;
        const results: Result[] = [];

        try {
          switch (key.algorithm.name) {
            case 'RSASSA-PKCS1-v1_5': case 'RSA-PSS': case 'RSA-OAEP': case 'ECDSA': {
              const spki = await exportKey(key, 'spki')() as ArrayBuffer;
              results.push({
                label: `Public Key "${k}" in Subject Public Key Info (SPKI) Format, DER-Encoded`,
                value: spki,
                defaultEncoding: ENCODING.BASE64,
                filename,
                extension: 'der',
              }, {
                label: `Public Key "${k}" in Subject Public Key Info (SPKI) Format, PEM-Encoded`,
                value: `-----BEGIN PUBLIC KEY-----\n${encode(spki, ENCODING.BASE64)}\n-----END PUBLIC KEY-----\n`,
                filename,
                extension: 'pem',
              });
              break;
            }
            default:
              throw new Error(`Unsupported key algorithm ${key.algorithm.name}`);
          }

          // For some reason, Elliptic Curve public keys can also be exported in raw format
          if (key.algorithm.name === 'ECDSA') {
            results.push({
              label: `Public Key "${k}" in Raw Format`,
              value: await exportKey(key, 'raw')() as ArrayBuffer,
              defaultEncoding: ENCODING.BASE64,
              filename,
            });
          }

          // All algorithms have a JWK export format
          results.push({
            label: `Public Key "${k}" in JSON Web Key (JWK) Format`,
            value: JSON.stringify(await exportKey(key, 'jwk')() as JsonWebKey, null, 2),
            filename,
          });

          showResults(results);
        } catch (e) { handleError(e); }
      });
      actions.appendChild(exportPublic);
    }

    // Symmetric keys or asymmetric private keys marked as extractable
    if (
      (!isSymmetric && keyStructure.privateKey.extractable)
      || (isSymmetric && keyStructure.extractable)
    ) {
      const exportPrivate = document.createElement('a');
      exportPrivate.href = '#';
      exportPrivate.innerHTML = PRIVATE_EXPORT_SVG;
      exportPrivate.dataset.tooltip = isSymmetric ? 'Export Secret Key' : 'Export Private Key';
      exportPrivate.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation(); // prevent li click from registering

        const key = isSymmetric ? keyStructure : keyStructure.privateKey;
        const filename = `${k.replace(/\s/g, '-')}.${isSymmetric ? 'secret' : 'private'}`;
        const results: Result[] = [];

        try {
          switch (key.algorithm.name) {
            case 'AES-CTR': case 'AES-CBC': case 'AES-GCM': case 'HMAC':
              results.push({
                label: `Secret Key "${k}" in Raw Format`,
                value: await exportKey(key, 'raw')() as ArrayBuffer,
                filename,
                extension: 'key',
              });
              break;
            case 'RSASSA-PKCS1-v1_5': case 'RSA-PSS': case 'RSA-OAEP': case 'ECDSA': {
              const pkcs8 = await exportKey(key, 'pkcs8')() as ArrayBuffer;
              results.push({
                label: `Private Key "${k}" in PKCS#8 Format, DER-Encoded`,
                value: pkcs8,
                defaultEncoding: ENCODING.BASE64,
                filename,
                extension: 'der',
              }, {
                label: `Private Key "${k}" in PKCS#8 Format, PEM-Encoded`,
                value: `-----BEGIN PRIVATE KEY-----\n${encode(pkcs8, ENCODING.BASE64)}\n-----END PRIVATE KEY-----\n`,
                filename,
                extension: 'key',
              });
              break;
            }
            default:
              throw new Error(`Unsupported key algorithm ${key.algorithm.name}`);
          }

          // All algorithms have a JWK export format
          results.push({
            label: `${isSymmetric ? 'Secret' : 'Private'} Key "${k}" in JSON Web Key (JWK) Format`,
            value: JSON.stringify(await exportKey(key, 'jwk')() as JsonWebKey, null, 2),
            filename,
          });

          showResults(results);
        } catch (e) { handleError(e); }
      });
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

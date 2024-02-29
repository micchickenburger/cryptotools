/**
 * @file Handles UI changes to Encryption Operation Area
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import { hideResults } from '../../lib/result';
import { KEY_SVG } from '../../lib/svg';
// eslint-disable-next-line import/no-cycle
import { getKey } from './keys';

const encryptionSection = document.querySelector<HTMLElement>('#encryption')!;
const opArea = encryptionSection.querySelector<HTMLElement>('.crypto-operations');
const tabs = opArea?.querySelectorAll<HTMLLIElement>('menu li');

// Hide operation area when switching main tabs
encryptionSection.querySelectorAll<HTMLLIElement>('.keys menu li')
  .forEach((li) => li.addEventListener('click', () => opArea?.classList.remove('active')));

/**
 * Update operation area textarea placeholder and button text
 * @param op Requested key usage
 * @param alg Algorithm for displaying algorithm-specific settings
 */
const updateLowerArea = (op: KeyUsage, alg: string) => {
  const textarea = opArea?.querySelector<HTMLTextAreaElement>('textarea');
  const signature = opArea?.querySelector<HTMLElement>('.signature');
  const button = opArea?.querySelector<HTMLButtonElement>('button');

  let placeholder: string = '';
  switch (op) {
    // TODO: Support multiple files
    case 'encrypt': placeholder = 'Paste plain text or drop a file...'; break;
    case 'decrypt': placeholder = 'Paste ciphertext or drop a file...'; break;
    case 'sign': placeholder = 'Paste plain text or drop a file...'; break;
    case 'verify': placeholder = 'Paste plain text or drop a file...'; break;
    default:
  }
  if (textarea) textarea.placeholder = placeholder;

  // Display appropriate encryption/signature settings
  opArea?.querySelectorAll<HTMLElement>('.input > .settings').forEach((elem) => elem.classList.remove('active'));
  opArea?.querySelector<HTMLElement>(`.settings.${alg}.${op}`)?.classList.add('active');
  if (op === 'verify') signature?.classList.add('active');
  else signature?.classList.remove('active');

  // Capitalize operation for button text
  if (button) button.textContent = `${op.charAt(0).toUpperCase()}${op.slice(1)}`;
};

/**
 * Handle Key List item button clicks and update operation area
 * @param keyName Key Dictionary key
 * @param key The Crypto Key
 * @returns function Event Handler
 */
const updateOpArea = (
  keyName: string,
  cryptoKey: CryptoKey | CryptoKeyPair,
  operation?: KeyUsage,
) => () => {
  hideResults();
  opArea?.classList.add('active');
  opArea?.scrollIntoView({
    block: 'center',
    behavior: 'smooth',
  });

  const isSymmetric = cryptoKey instanceof CryptoKey;
  let op = operation;

  let friendlyName = keyName;
  let key: CryptoKey;
  let usages: KeyUsage[];

  if (isSymmetric) {
    key = cryptoKey;
    usages = key.usages;

    // Prefer "Encrypt" and "Sign" tabs
    if (!op) {
      if (usages.includes('encrypt')) op = 'encrypt';
      else if (usages.includes('sign')) op = 'sign';
      else [op] = usages;
    }
  } else {
    usages = cryptoKey.privateKey.usages.concat(cryptoKey.publicKey.usages);

    // Prefer "Encrypt" and "Sign" tabs
    if (!op) {
      if (usages.includes('encrypt')) op = 'encrypt';
      else if (usages.includes('sign')) op = 'sign';
      else [op] = usages;
    }

    let whichKey: string = '';
    switch (op) {
      case 'verify':
      case 'encrypt':
        whichKey = 'Public Key';
        key = cryptoKey.publicKey;
        break;
      case 'sign':
      case 'decrypt':
        whichKey = 'Private Key';
        key = cryptoKey.privateKey;
        break;
      default:
        throw new Error(`Operation ${op} is not implemented for key "${keyName}".`);
    }
    friendlyName = `${keyName} (${whichKey})`;
  }

  const alg = key.algorithm.name.toLowerCase();
  if (opArea) {
    opArea.dataset.key = keyName;
    opArea.dataset.alg = alg;
  }

  tabs?.forEach((tab) => tab.classList.remove('active', 'show'));
  opArea?.querySelector<HTMLElement>(`menu li[data-op="${op}"]`)?.classList.add('active');
  usages.forEach((usage) => opArea?.querySelector<HTMLElement>(`menu li[data-op="${usage}"]`)?.classList.add('show'));

  // Display key name in footer
  const keyNameElement = opArea?.querySelector<HTMLLIElement>('.footer .key');
  if (keyNameElement) {
    keyNameElement.innerHTML = KEY_SVG;
    const span = document.createElement('span');
    span.textContent = friendlyName;
    keyNameElement.appendChild(span);
  }

  updateLowerArea(op, alg);
};

// Also update operation area on tab change
tabs?.forEach((tab) => {
  const op = tab.dataset.op as KeyUsage;
  tab.addEventListener('click', () => {
    const keyName = opArea!.dataset.key || '';
    const { key } = getKey(keyName);
    updateOpArea(keyName, key, op)();
  });
});

export default updateOpArea;

/**
 * @file Contains functionality for PBKDF2 hashing and verification
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * Web Crypto API includes native support for the Password-Based Key
 * Derivation Function 2 (PBKDF2).
 */

import { showResult } from '../../lib/result';
import { decode, encode } from '../../lib/encode';
import load from '../../lib/loader';

const hashSettings = document.querySelector<HTMLElement>('#hash-PBKDF2');
if (!hashSettings) throw new Error('The Hash settings element does not exist.');

const digestSelect = hashSettings.querySelector<HTMLSelectElement>('.digest-select');
const lengthInput = hashSettings.querySelector<HTMLInputElement>('input.derivation-length');
const iterationsInput = hashSettings.querySelector<HTMLInputElement>('input.iterations');
const outputEncoding = hashSettings.querySelector<HTMLSelectElement>('select.output-encoding');
const saltEncoding = hashSettings.querySelector<HTMLSelectElement>('select.input-encoding');
const saltInput = hashSettings.querySelector<HTMLInputElement>('input.salt');
const passwordInput = hashSettings.querySelector<HTMLInputElement>('.password input');
const button = hashSettings.querySelector<HTMLButtonElement>('button');

// Update Output Length
lengthInput?.addEventListener('change', () => {
  const ol = document.querySelector('#passwords menu .output-length span');
  if (ol) ol.textContent = `${parseInt(lengthInput.value, 10) * 8} bits`;
});

// Update Block Size
digestSelect?.addEventListener('change', () => {
  const bs = document.querySelector('#passwords menu .block-size span');
  if (bs) bs.textContent = String(digestSelect.selectedOptions[0].dataset.bs);
});

// Hash password
button?.addEventListener('click', async () => {
  load(0);
  button.disabled = true;

  const password = (new TextEncoder()).encode(passwordInput?.value);
  const key = await crypto.subtle.importKey('raw', password, { name: 'PBKDF2' }, false, ['deriveBits']);

  let salt: ArrayBuffer;
  if (saltInput?.value) {
    const radix = Number(saltEncoding?.selectedOptions[0].value);
    salt = decode(saltInput.value, radix);
  } else salt = crypto.getRandomValues(new Uint8Array(16)); // 128 bits recommended by NIST

  const hash = digestSelect?.value;
  const iterations = Number(iterationsInput?.value) || 100000;
  const algorithm = {
    name: 'PBKDF2',
    salt,
    hash,
    iterations,
  };

  const length = Number(lengthInput?.value) || 32 * 8;
  const derivation = await crypto.subtle.deriveBits(algorithm, key, length);

  const outputRadix = Number(outputEncoding?.selectedOptions[0].value);
  showResult(encode(derivation, outputRadix));
  button.disabled = false;
});

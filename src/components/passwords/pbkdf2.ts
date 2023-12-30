/**
 * @file Contains functionality for PBKDF2 hashing and verification
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * Web Crypto API includes native support for the Password-Based Key
 * Derivation Function 2 (PBKDF2).
 */

import { showResults } from '../../lib/result';
import { ENCODING, decode, encode } from '../../lib/encode';
import load from '../../lib/loader';
import { handleError } from '../../lib/error';

const hashSettings = document.querySelector<HTMLElement>('#hash-PBKDF2')!;
const prfSelect = hashSettings.querySelector<HTMLSelectElement>('.prf-select');
const lengthInput = hashSettings.querySelector<HTMLInputElement>('input.derivation-length');
const iterationsInput = hashSettings.querySelector<HTMLInputElement>('input.iterations');
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
prfSelect?.addEventListener('change', () => {
  const bs = document.querySelector('#passwords menu .block-size span');
  if (bs) bs.textContent = String(prfSelect.selectedOptions[0].dataset.bs);
});

// Hash password
button?.addEventListener('click', async () => {
  load(0);
  button.disabled = true;

  try {
    const password = (new TextEncoder()).encode(passwordInput?.value);
    const key = await crypto.subtle.importKey('raw', password, { name: 'PBKDF2' }, false, ['deriveBits']);
  
    let salt: ArrayBuffer;
    if (saltInput?.value) {
      const radix = Number(saltEncoding?.selectedOptions[0].value);
      salt = decode(saltInput.value, radix);
    } else salt = crypto.getRandomValues(new Uint8Array(16)).buffer; // 128 bits recommended by NIST
  
    const hash = prfSelect?.selectedOptions[0].dataset.alg;
    const iterations = Number(iterationsInput?.value) || 100000;
    const algorithm = {
      name: 'PBKDF2',
      salt,
      hash,
      iterations,
    };
  
    const length = (Number(lengthInput?.value) || 32) * 8;
    const derivation = await crypto.subtle.deriveBits(algorithm, key, length);
  
    // PHC String Format requires that the = symbol only be used in the parameter map.  The hash
    // MUST be in B64 format, which is Base64 without the padding.  Here we choose to represent
    // the salt in the same format, as well.
    const toB64 = (base64: string) => base64.replace(/=/g, '');
    const b64Salt = toB64(encode(salt, ENCODING.BASE64));
    const b64Hash = toB64(encode(derivation, ENCODING.BASE64));
    const hashString = `$pbkdf2$prf=hmac-${hash!.toLowerCase()},c=${iterations},dklen=${length}$${b64Salt}$${b64Hash}`;
  
    showResults([
      { label: 'PBKDF2 String in PHC String Format (recommended by author)', value: hashString },
      { label: 'Hash', value: derivation, defaultEncoding: ENCODING.BASE64 },
      { label: 'Salt', value: salt, defaultEncoding: ENCODING.BASE64 },
    ]);
  } catch (e) { handleError(e); }

  button.disabled = false;
});

/**
 * @file Contains functionality for cryptographic digests
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * Input data of aribtrary length can be passed through a one-way
 * cryptographic function to produce a digest, or hash of the data.
 * Such digest can be used to verify the integrity of the data when
 * the expected hash is previously known.
 * 
 * We use the Web Crypto API to perform all hashing functions in the
 * browser with native code.
 */

import load from '../lib/loader';
import { hideResult, showResult } from '../lib/result';

/**
 * Character count
 */
const input = document.querySelector('textarea');
input?.addEventListener('input', () => {
  const characterCount = document.querySelector('#digest .character-count');
  if (characterCount) {
    const count = input.value.length;
    if (count === 1) characterCount.textContent = '1 character';
    else characterCount.textContent = `${count} characters`;
  }
});

/**
 * Digest Generation
 */
async function digestMessage(message: string, algorithm: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string
  return hashHex;
}

const button = document.querySelector('button');
button?.addEventListener('click', () => {
  load(0);
  const text = input?.value;
  if (text && selected.alg) {
    digestMessage(text, selected.alg).then((digestHex) => {
      showResult(digestHex);
    });
  }
});

let selected: DOMStringMap;

const digestSelect = document.querySelector('#digest-select') as HTMLSelectElement;
digestSelect?.addEventListener('change', (event) => {
  const menu = document.querySelector('#digest menu');
  const outputLength = menu?.querySelector('#digest-output-length span');
  const blockSize = menu?.querySelector('#digest-block-size span');
  const method = menu?.querySelector('#digest-method span');
  const specification = menu?.querySelector('#digest-specification span');
  
  selected = digestSelect.selectedOptions[0].dataset;
  if (outputLength) outputLength.textContent = selected.ol || '';
  if (blockSize) blockSize.textContent = selected.bs || '';
  if (method) method.textContent = selected.method || '';
  if (specification) specification.textContent = selected.spec || '';

  hideResult();
});

document.addEventListener('DOMContentLoaded', () => {
  digestSelect.dispatchEvent(new Event('change'));
});

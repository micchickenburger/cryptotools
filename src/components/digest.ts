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

import { handleError } from '../lib/error';
import { ENCODING } from '../lib/encode';
import load from '../lib/loader';
import { hideResults, showResults } from '../lib/result';

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
  const data = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const digest = await crypto.subtle.digest(algorithm, data); // hash the message
  return digest;
}

let selected: DOMStringMap;

const button = document.querySelector('button');
button?.addEventListener('click', async () => {
  load(0);
  const text = input!.value;
  const algorithm = selected!.alg!;
  try {
    const digest = await digestMessage(text, algorithm);
    showResults([{ label: `${algorithm} Digest`, value: digest, defaultEncoding: ENCODING.HEXADECIMAL }]);
  } catch (e) { handleError(e); }
});

const digestSelect = document.querySelector<HTMLSelectElement>('#digest-select')!;
digestSelect.addEventListener('change', () => {
  const menu = document.querySelector('#digest menu')!;
  const blockSize = menu.querySelector('#digest-block-size span')!;
  const method = menu.querySelector('#digest-method span')!;
  const specification = menu.querySelector('#digest-specification span')!;

  selected = digestSelect.selectedOptions[0].dataset;
  blockSize.textContent = selected.bs || '';
  method.textContent = selected.method || '';
  specification.textContent = selected.spec || '';

  hideResults();
});

document.addEventListener('DOMContentLoaded', () => {
  digestSelect.dispatchEvent(new Event('change'));
});

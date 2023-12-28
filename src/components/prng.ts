/**
 * @file Contains functionality for secure generation of random data
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * The Web Crypto API lets us generate random data suitable for cryptographic
 * operations using a native Pseudo Random Number Generator.  We enable
 * generation of artibtrary length random data for display or download.  For
 * display, we support binary, octal, and hexadecimal encodings.  We also
 * enable production of random UUIDv4 values.
 */

import { encode } from '../lib/encode';
import load from '../lib/loader';
import { showResult } from '../lib/result';

const prngOperation = document.querySelector('#random .operation') as HTMLSelectElement;
const prngOptions = document.querySelector('#random .prng-options') as HTMLElement;
const prngByteLength = document.querySelector('#random .byte-length') as HTMLInputElement;
const prngOutput = document.querySelector('#random .output') as HTMLSelectElement;
const prngOutputEncodingControl = document.querySelector('#random .output-encoding-control') as HTMLElement;
const prngOutputEncoding = document.querySelector('#random .output-encoding') as HTMLSelectElement;
const prngGenerateButton = document.querySelector('#random button') as HTMLButtonElement;

prngOperation?.addEventListener('change', () => {
  const op = prngOperation.selectedOptions[0].value;
  if (op === 'uuid') prngOptions.classList.remove('active');
  else prngOptions.classList.add('active'); // op === 'random'
});

prngOutput?.addEventListener('change', () => {
  const out = prngOutput.selectedOptions[0].value;
  if (out === 'display') prngOutputEncodingControl.classList.add('active');
  else prngOutputEncodingControl.classList.remove('active'); // out === 'download'
});

prngGenerateButton.addEventListener('click', () => {
  load(0);

  const op = prngOperation.selectedOptions[0].value;
  if (op === 'uuid') return showResult(self.crypto.randomUUID());

  // If not 'uuid', then 'random'
  const bytes = parseInt(prngByteLength.value, 10) || 64;
  const array = new Uint8Array(bytes);
  self.crypto.getRandomValues(array);

  const out = prngOutput.selectedOptions[0].value;

  if (out === 'display') {
    const enc = prngOutputEncoding.selectedOptions[0].value;
    const radix = parseInt(enc, 10);
    return showResult(encode(array, radix));
  }

  // If not 'display', then 'download'
  const blob = new Blob([array], { type: 'application/octet-stream' });
  const uri = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = uri;
  a.download = `prng-${bytes}-bytes.bin`;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(uri);
  load(100);
});

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

import { handleError } from '../lib/error';
import load from '../lib/loader';
import { hideResults, showResults } from '../lib/result';


const menuItems = document.querySelectorAll<HTMLLIElement>('#random .section-menu li');
const sections = document.querySelectorAll<HTMLDivElement>('#random .subsection > div.settings');

menuItems.forEach((item) => item.addEventListener('click', () => {
  menuItems.forEach(i => i.classList.remove('active'));
  sections.forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  if (item.dataset.target) document.querySelector(`.${item.dataset.target}`)?.classList.add('active');
  hideResults();
}));

const prngGenerateButton = document.querySelector<HTMLButtonElement>('#random button')!;
prngGenerateButton.addEventListener('click', () => {
  load(0);
  
  try {
    const prngByteLength = document.querySelector<HTMLInputElement>('#random .byte-length')!;
    const prngOutput = document.querySelector<HTMLSelectElement>('#random .output')!;
    const op = document.querySelector<HTMLElement>('#random .section-menu li.active')!.dataset.target;
    if (op === 'uuid') return showResults([{ label: 'UUID', value: self.crypto.randomUUID() }]);
  
    // If not 'uuid', then 'random-values'
    const bytes = parseInt(prngByteLength.value, 10) || 64;
    const array = new Uint8Array(bytes);
    self.crypto.getRandomValues(array);
  
    const out = prngOutput.selectedOptions[0].value;
  
    if (out === 'display') {
      return showResults([{ label: 'Random Values', value: array.buffer }]);
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
  } catch (e) { handleError(e); }

  load(100);
});

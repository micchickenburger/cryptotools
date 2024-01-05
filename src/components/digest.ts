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

const digestSection = document.querySelector('#digest')!;
const digestSelect = digestSection.querySelector<HTMLSelectElement>('.digest-select')!;
const textarea = digestSection.querySelector('textarea')!;

/**
 * Digest Generation
 */
async function digestMessage(message: string, algorithm: string) {
  const data = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const digest = await crypto.subtle.digest(algorithm, data); // hash the message
  return digest;
}

const button = digestSection.querySelector('button');
button?.addEventListener('click', async () => {
  load(0);
  const algorithm = digestSelect.selectedOptions[0].dataset.alg!;
  const text = textarea.value;
  try {
    const digest = await digestMessage(text, algorithm);
    showResults([{ label: `${algorithm} Digest`, value: digest, defaultEncoding: ENCODING.HEXADECIMAL }]);
  } catch (e) { handleError(e); }
});

digestSelect.addEventListener('change', () => {
  const menu = digestSection.querySelector('menu')!;
  const blockSize = menu.querySelector('.block-size span')!;
  const method = menu.querySelector('.method span')!;
  const specification = menu.querySelector('.specification span')!;

  const selected = digestSelect.selectedOptions[0].dataset;
  blockSize.textContent = selected.bs || '';
  method.textContent = selected.method || '';
  specification.textContent = selected.spec || '';

  hideResults();
});

/**
 * File Uploads
 */

const digestFiles = (files?: FileList | null) => {
  if (!files || !files.length) return;
  load(0);

  const list = Array.from(files);
  const algorithm = digestSelect.selectedOptions[0].dataset.alg!;
  const totalSize = list.reduce((size, file) => size + file.size, 0);
  const currentSizes: number[] = [];
  const digests: { label: string, value: ArrayBuffer }[] = [];

  list.forEach((file, i) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      currentSizes[i] = event.loaded;
      load((currentSizes.reduce((p, c) => p + c, 0) / totalSize) * 100);
    };

    reader.onload = async (event) => {
      if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
        handleError(new Error(`File [${file.name}] of type [${file.type}] failed to load.`));
        return;
      }

      const label = `${algorithm} Digest of ${file.name} • ${file.size.toLocaleString()} bytes • ${file.type || 'Unknown type'}`;
      digests.push({ label, value: await crypto.subtle.digest(algorithm, event.target.result) });

      if (digests.length === files.length) showResults(digests);
    };

    reader.readAsArrayBuffer(file);
  });
};

const upload = digestSection.querySelector<HTMLInputElement>('.upload input');
upload?.addEventListener('change', () => digestFiles(upload.files));

/**
 * Drag-and-Drop File Uploads
 */

textarea.addEventListener('drop', (event) => {
  digestFiles(event.dataTransfer?.files);
});

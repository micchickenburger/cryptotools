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

/**
 * Character count
 */
const textarea = digestSection.querySelector('textarea')!;
textarea.addEventListener('input', () => {
  const characterCount = digestSection.querySelector('.character-count')!;
  const count = textarea.value.length;
  if (count === 1) characterCount.textContent = '1 character';
  else characterCount.textContent = `${count} characters`;
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

const button = digestSection.querySelector('button');
button?.addEventListener('click', async () => {
  load(0);
  const text = textarea.value;
  const algorithm = selected!.alg!;
  try {
    const digest = await digestMessage(text, algorithm);
    showResults([{ label: `${algorithm} Digest`, value: digest, defaultEncoding: ENCODING.HEXADECIMAL }]);
  } catch (e) { handleError(e); }
});

const digestSelect = digestSection.querySelector<HTMLSelectElement>('#digest-select')!;
digestSelect.addEventListener('change', () => {
  const menu = digestSection.querySelector('menu')!;
  const blockSize = menu.querySelector('#digest-block-size span')!;
  const method = menu.querySelector('#digest-method span')!;
  const specification = menu.querySelector('#digest-specification span')!;

  selected = digestSelect.selectedOptions[0].dataset;
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

      const label = `${algorithm} Digest of ${file.name} (${file.size.toLocaleString()} bytes; ${file.type || 'uknown type'})`;
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

const preventDefault = (event: Event) => {
  event.stopPropagation();
  event.preventDefault();
};

const classState = (add: boolean) => () => {
  if (add) textarea.classList.add('dragover');
  else textarea.classList.remove('dragover');
};

textarea.addEventListener('dragenter', preventDefault);
textarea.addEventListener('dragenter', classState(true));
textarea.addEventListener('dragover', preventDefault);
textarea.addEventListener('dragover', classState(true));
textarea.addEventListener('dragleave', classState(false));
textarea.addEventListener('dragend', classState(false));
textarea.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();
  classState(false)();
  digestFiles(event.dataTransfer?.files);
});

/**
 * Prevent drops outside of the textarea
 */

const disallowDrop = (event: DragEvent) => {
  const e = event;
  if (e.target !== textarea && e.dataTransfer) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'none';
    e.dataTransfer.dropEffect = 'none';
  }
};

window.addEventListener('dragover', disallowDrop);
window.addEventListener('dragenter', disallowDrop);
window.addEventListener('drop', disallowDrop);

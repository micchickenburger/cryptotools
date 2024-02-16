/**
 * @file Key Generation
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import load from '../../lib/loader';
import { handleError } from '../../lib/error';
import { addKey } from './keys';

const generateElement = document.querySelector('#encryption [data-tab="generate-key"]')!;
const purposeElement = generateElement.querySelector<HTMLSelectElement>('.control.purpose select')!;

/**
 * Update footer stats
 */
const updateStats = () => {
  const algorithmSelect = generateElement.querySelector<HTMLSelectElement>('.settings.algorithm.active select')!;
  const currentAglorithm = algorithmSelect.selectedOptions[0];
  const type = generateElement.querySelector<HTMLSpanElement>('.stats .type span')!;
  const method = generateElement.querySelector<HTMLSpanElement>('.stats .method span')!;
  const spec = generateElement.querySelector<HTMLSpanElement>('.stats .specification span')!;
  const confidentiality = generateElement.querySelector<HTMLSpanElement>('.stats .confidentiality')!;
  const integrity = generateElement.querySelector<HTMLSpanElement>('.stats .integrity')!;

  // Show appropriate settings for current algorithm
  const sections = generateElement.querySelectorAll<HTMLElement>('div.settings');
  sections.forEach((section) => {
    if (!section.classList.contains('algorithm')) {
      section.classList.remove('active');
    }
  });
  generateElement.querySelector(`.settings.${currentAglorithm.dataset.target}`)?.classList.add('active');

  // Update statistics
  algorithmSelect.parentElement!.querySelector('.label')!.textContent = `Algorithm • ${currentAglorithm.dataset.mode}`;
  type.textContent = currentAglorithm.dataset.type || '';
  method.textContent = currentAglorithm.dataset.method || '';
  spec.textContent = currentAglorithm.dataset.spec || '';

  if (currentAglorithm.dataset.confidentiality === 'true') {
    confidentiality.classList.remove('no');
    confidentiality.dataset.tooltip = 'Provides Confidentiality';
  } else {
    confidentiality.classList.add('no');
    confidentiality.dataset.tooltip = 'Provides NO Confidentiality';
  }

  if (currentAglorithm.dataset.integrity === 'true') {
    integrity.classList.remove('no');
    integrity.dataset.tooltip = 'Provides Integrity Protection';
  } else {
    integrity.classList.add('no');
    integrity.dataset.tooltip = 'Provides NO Integrity Protection';
  }
};

/**
 * Update controls based on selected key generation purpose
 */
purposeElement.addEventListener('change', () => {
  const target = purposeElement.selectedOptions[0].value;
  const sections = generateElement.querySelectorAll('.settings.algorithm');

  sections.forEach((section) => section.classList.remove('active'));
  generateElement.querySelector(`.settings.${target}`)?.classList.add('active');

  updateStats();
});
generateElement.querySelectorAll('.settings.algorithm').forEach((alg) => alg.addEventListener('change', () => updateStats()));

/**
 * Convert a decimal integer to Uint8Array
 */
const intToArray = (num: number): Uint8Array => {
  let n = num;
  const bytes = [];

  while (n > 0) {
    // eslint-disable-next-line no-bitwise
    bytes.unshift(n & 0xFF); // Get the lowest 8 bits
    // eslint-disable-next-line no-bitwise
    n >>= 8; // Shift right by 8 bits
  }
  return new Uint8Array(bytes);
};

/**
 * Handle key generation trigger
 */
const button = generateElement.querySelector('button');
button?.addEventListener('click', async () => {
  button.disabled = true;
  load(0);

  const nameElement = generateElement.querySelector<HTMLInputElement>('.name input')!;
  const name = nameElement.value;
  const algorithmSelect = generateElement.querySelector<HTMLSelectElement>('.settings.algorithm.active select')!;
  const currentAglorithm = algorithmSelect.selectedOptions[0];

  try {
    if (!name) throw new Error('A key name is required.');

    let params: RsaHashedKeyGenParams | EcKeyGenParams | HmacKeyGenParams | AesKeyGenParams;
    const keyUsage: KeyUsage[] = purposeElement.value === 'encryption'
      ? ['encrypt', 'decrypt']
      : ['sign', 'verify'];

    switch (currentAglorithm.dataset.target) {
      case 'rsa': {
        const modulusLength = Number(generateElement.querySelector<HTMLOptionElement>('.settings.rsa input.modulus-length')?.value) || 2048;
        const exponent = Number(generateElement.querySelector<HTMLOptionElement>('.settings.rsa input.public-exponent')?.value) || 65537;
        const hash = generateElement.querySelector<HTMLSelectElement>('.settings.rsa select.hash')?.value || 'SHA-256';

        params = {
          name: currentAglorithm.dataset.alg || '',
          modulusLength,
          publicExponent: intToArray(exponent),
          hash,
        };
        break;
      }

      case 'ec': {
        const curve = generateElement.querySelector<HTMLSelectElement>('.settings.ec select.curve')?.value || 'P-256';
        params = {
          name: currentAglorithm.dataset.alg || '',
          namedCurve: curve,
        };
        break;
      }

      case 'hmac': {
        const hash = generateElement.querySelector<HTMLSelectElement>('.settings.hmac select.hash')?.value || 'SHA-256';
        params = {
          name: currentAglorithm.dataset.alg || '',
          hash,
        };
        break;
      }

      case 'aes': {
        const length = Number(generateElement.querySelector<HTMLSelectElement>('.settings.aes select.key-length')?.value) || 256;
        params = {
          name: currentAglorithm.dataset.alg || '',
          length,
        };
        break;
      }

      default:
        throw new Error('No algorithm selected.');
    }

    const extractable = generateElement.querySelector<HTMLInputElement>('.extractable input')?.checked || false;
    const key = await window.crypto.subtle.generateKey(params, extractable, keyUsage);
    const persist = generateElement.querySelector<HTMLInputElement>('.save input')?.checked;
    addKey(name, key, persist);
  } catch (e) {
    handleError(e);
    button.disabled = false;
    return;
  }

  // Reset form
  generateElement.querySelector<HTMLFormElement>('form')?.reset();
  const event = new Event('change');
  purposeElement.dispatchEvent(event);
  button.disabled = false;
});

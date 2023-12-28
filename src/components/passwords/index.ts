/**
 * @file Contains functionality for hashing and verification of passwords
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * Due to their pervasive and high-value nature, passwords require special
 * application of digest functions to reduce abuse.  In particular, they
 * benefit from salting to mitigate rainbow attacks, and key stretching to
 * drastically increase the energy required to brute force them.
 */

import { hideResult } from '../../lib/result';
import './bcrypt';

let selectedHashAlgorithm: DOMStringMap;

const hashSelect = document.querySelector('#hash-select') as HTMLSelectElement;
hashSelect?.addEventListener('change', (event) => {
  const menu = document.querySelector('#passwords menu');
  const outputLength = menu?.querySelector('#hash-output-length span');
  const blockSize = menu?.querySelector('#hash-block-size span');
  const method = menu?.querySelector('#hash-method span');
  const specification = menu?.querySelector('#hash-specification span');
  
  selectedHashAlgorithm = hashSelect.selectedOptions[0].dataset;
  if (outputLength) outputLength.textContent = selectedHashAlgorithm.ol || '';
  if (blockSize) blockSize.textContent = selectedHashAlgorithm.bs || '';
  if (method) method.textContent = selectedHashAlgorithm.method || '';
  if (specification) specification.textContent = selectedHashAlgorithm.spec || '';

  hideResult();
});

document.addEventListener('DOMContentLoaded', () => {
  hashSelect.dispatchEvent(new Event('change'));
});

const hashOperation = document.querySelector('#passwords #hash-operation') as HTMLSelectElement;
const updateHashView = () => {
  const operation = hashOperation.selectedOptions[0].value;
  const hash = hashSelect.selectedOptions[0].dataset.alg;
  const target = document.querySelector(`#passwords #${operation}-${hash}`);

  const settings = document.querySelectorAll('#passwords .settings');
  settings.forEach((setting) => setting.classList.remove('active'));
  target?.classList.add('active');
};
hashOperation?.addEventListener('change', updateHashView);
hashSelect?.addEventListener('change', updateHashView);

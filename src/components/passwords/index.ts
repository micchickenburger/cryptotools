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
import './pbkdf2';

const hashSelect = document.querySelector('#passwords menu .algorithm select') as HTMLSelectElement;
const hashOperation = document.querySelector('#passwords .operation') as HTMLSelectElement;

hashSelect?.addEventListener('change', (event) => {
  const menu = document.querySelector('#passwords menu');
  const outputLength = menu?.querySelector('.output-length span');
  const blockSize = menu?.querySelector('.block-size span');
  const method = menu?.querySelector('.method span');
  const specification = menu?.querySelector('.specification span');
  
  const selected = hashSelect.selectedOptions[0].dataset;
  if (outputLength) outputLength.textContent = selected.ol || '';
  if (blockSize) blockSize.textContent = selected.bs || '';
  if (method) method.textContent = selected.method || '';
  if (specification) specification.textContent = selected.spec || '';

  hideResult();
});

const updateHashView = () => {
  const operation = hashOperation.selectedOptions[0].value;
  const hash = hashSelect.selectedOptions[0].dataset.alg;
  const target = document.querySelector(`#passwords #${operation}-${hash}`);
  
  const settings = document.querySelectorAll('#passwords .settings');
  settings.forEach((setting) => setting.classList.remove('active'));
  target?.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
  hashSelect.dispatchEvent(new Event('change'));
});

hashOperation?.addEventListener('change', updateHashView);
hashSelect?.addEventListener('change', updateHashView);

/**
 * @file Contains functionality for hashing and verification of passwords
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 *
 * Due to their pervasive and high-value nature, passwords require special
 * application of digest functions to reduce abuse.  In particular, they
 * benefit from salting to mitigate rainbow attacks, and key stretching to
 * drastically increase the energy required to brute force them.
 */

import { hideResults } from '../../lib/result';
import './bcrypt';
import './pbkdf2';
import './srp';

const algorithm = document.querySelector<HTMLSelectElement>('#passwords menu .algorithm select')!;
const operation = document.querySelector<HTMLSelectElement>('#passwords .operation')!;

const updateView = () => {
  const op = operation.selectedOptions[0].value;
  const hash = algorithm.selectedOptions[0].dataset.alg;
  const target = document.querySelector(`#passwords #${op}-${hash}`);

  const settings = document.querySelectorAll('#passwords .subsection > .settings');
  settings.forEach((setting) => setting.classList.remove('active'));
  target?.classList.add('active');
};

const updateStats = () => {
  const menu = document.querySelector('#passwords menu')!;
  const blockSize = menu.querySelector('.block-size span')!;
  const method = menu.querySelector('.method span')!;
  const specification = menu.querySelector('.specification span')!;

  // Update statistics
  const selected = algorithm.selectedOptions[0].dataset;
  blockSize.textContent = selected.bs || '';
  method.textContent = selected.method || '';
  specification.textContent = selected.spec || '';

  // Update operation list
  operation.textContent = '';
  selected.operations?.split(' ').forEach((op, i) => {
    const option = document.createElement('option');
    if (i === 0) option.selected = true;
    option.value = op;
    option.textContent = `${op[0].toUpperCase()}${op.substring(1)}`;
    operation.appendChild(option);
  });

  hideResults();
  updateView();
};

algorithm.addEventListener('change', updateStats);
operation.addEventListener('change', updateView);

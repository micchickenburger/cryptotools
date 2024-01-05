/**
 * @file Contains functionality for bcrypt hashing and verification
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * Web Crypto API does not include bcrypt support; however, the bcrypt.js
 * library runs in the browser and uses Web Crypto API's PRNG for secure
 * random data to use in its salt generation function.  The JS implementation
 * of bcrypt is around 30% slower than native implementations, so the progress
 * bar really comes in handy here.
 */

import * as bcrypt from 'bcryptjs';
import { showResults } from '../../lib/result';
import load from '../../lib/loader';
import { handleError } from '../../lib/error';

// Update bcrypt cost iterations count
const bcryptControl = document.querySelector<HTMLDivElement>('#hash-bcrypt .control.cost span:first-child')!;
const bcryptCost = document.querySelector<HTMLInputElement>('#hash-bcrypt input.cost')!;

bcryptCost.addEventListener('change', () => {
  const value = parseInt(bcryptCost.value, 10);
  bcryptControl.textContent = `Cost • ${(2 ** value).toLocaleString()} iterations`;
});

// Bcrypt finish and progress functions
const bcryptComplete = (
  button: HTMLButtonElement,
  text: string | null,
) => (error: Error | null, result: string | boolean) => {
  // TODO: Determine whether we should return or throw here; execution continues
  if (error) handleError(error);

  if (typeof result === 'boolean') {
    showResults([{ label: 'Bcrypt Verification Result', value: String(result) }]);
  } else {
    const sansHash = bcrypt.getSalt(result); // Like $2a$10$uTzw7mkyaPz.6Kb.H0d/sO
    const salt = sansHash.replace(/^.+\$/, '');
    const hash = result.substring(sansHash.length);

    showResults([
      { label: 'Bcrypt String', value: result },
      { label: 'Salt', value: salt },
      { label: 'Hash', value: hash },
    ]);
  }

  const btn = button;
  btn.textContent = text;
  btn.disabled = false;
};

const bcryptProgress = (button: HTMLButtonElement) => (num: number) => {
  load(num * 100);
  const btn = button;
  btn.textContent = `${String(num * 100).substring(0, 4)}%`;
};

// Generate bcrypt
const bcryptHashButton = document.querySelector<HTMLButtonElement>('#hash-bcrypt button');
bcryptHashButton?.addEventListener('click', () => {
  load(0);
  bcryptHashButton.disabled = true;

  try {
    const cost = parseInt(bcryptCost.value, 10) || 10;
    const password = document.querySelector<HTMLInputElement>('#hash-bcrypt .password input')!;

    bcrypt.hash(
      password.value,
      cost,
      bcryptComplete(bcryptHashButton, bcryptHashButton.textContent),
      bcryptProgress(bcryptHashButton),
    );
  } catch (e) { handleError(e); }
});

// Verify bcrypt
const bcryptVerifyButton = document.querySelector<HTMLButtonElement>('#verify-bcrypt button');
bcryptVerifyButton?.addEventListener('click', async () => {
  load(0);
  bcryptVerifyButton.disabled = true;

  const password = document.querySelector<HTMLInputElement>('#verify-bcrypt .password input')!;
  const hash = document.querySelector<HTMLInputElement>('#verify-bcrypt .hash input')!;

  try {
    bcrypt.compare(
      password.value,
      hash.value,
      bcryptComplete(bcryptVerifyButton, bcryptVerifyButton.textContent),
      bcryptProgress(bcryptVerifyButton),
    );
  } catch (e) { handleError(e); }
});

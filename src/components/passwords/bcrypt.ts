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
import { showResult } from '../../lib/result';
import load from '../../lib/loader';

// Update bcrypt cost iterations count
const bcryptControl = document.querySelector('#hash-bcrypt .control.cost') as HTMLDivElement;
const bcryptCost = document.querySelector('#hash-bcrypt input.cost') as HTMLInputElement;

bcryptCost?.addEventListener('change', () => {
  const value = parseInt(bcryptCost.value, 10);
  bcryptControl.dataset.title = `Cost: 2^${value} = ${Math.pow(2, value).toLocaleString()} iterations`;
});

// Bcrypt finish and progress functions
const bcryptComplete = (button: HTMLButtonElement, text: string | null) => (error: Error | null, result: string | boolean) => {
  if (error) console.error(error);
  showResult(String(result));
  button.textContent = text;
  button.disabled = false;
};

const bcryptProgress = (button: HTMLButtonElement) => (num: number) => {
  load(num * 100);
  button.textContent = `${String(num * 100).substring(0, 4)}%`;
};

// Generate bcrypt
const bcryptHashButton = document.querySelector('#hash-bcrypt button') as HTMLButtonElement;
bcryptHashButton?.addEventListener('click', () => {
  load(0);
  bcryptHashButton.disabled = true;

  const cost = parseInt(bcryptCost.value, 10) || 10;
  const password = document.querySelector('#hash-bcrypt .password input') as HTMLInputElement;

  bcrypt.hash(
    password.value,
    cost,
    bcryptComplete(bcryptHashButton, bcryptHashButton.textContent),
    bcryptProgress(bcryptHashButton),
  );
});

// Verify bcrypt
const bcryptVerifyButton = document.querySelector('#verify-bcrypt button') as HTMLButtonElement;
bcryptVerifyButton?.addEventListener('click', async () => {
  load(0);
  bcryptVerifyButton.disabled = true;

  const password = document.querySelector('#verify-bcrypt .password input') as HTMLInputElement;
  const hash = document.querySelector('#verify-bcrypt .hash input') as HTMLInputElement;

  bcrypt.compare(
    password.value,
    hash.value,
    bcryptComplete(bcryptVerifyButton, bcryptVerifyButton.textContent),
    bcryptProgress(bcryptVerifyButton),
  );
});
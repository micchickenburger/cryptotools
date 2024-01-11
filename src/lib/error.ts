/**
 * @file Contains functionality for handling and conveying errors to user
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import load from './loader';

const errorElement = document.querySelector('#error')!;
const content = errorElement.querySelector('.content')!;

const handleError = (error: unknown) => {
  let err;
  if (!(error instanceof Error)) err = new Error(String(error));
  else err = error;
  errorElement.classList.add('active');
  content.textContent = err.message;
  load(100);
};

const clearError = () => {
  content.textContent = '';
  errorElement.classList.remove('active');
};

export { handleError, clearError };

/**
 * @file Contains functionality for handling and conveying errors to user
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

const errorElement = document.querySelector('#error')!;
const content = errorElement.querySelector('.content')!;

const handleError = (error: unknown) => {
  let err;
  if (!(error instanceof Error)) err = new Error(String(error));
  else err = error;
  errorElement.classList.add('active');
  content.textContent = err.message;
};

const clearError = () => {
  content.textContent = '';
  errorElement.classList.remove('active');
}

export { handleError, clearError };

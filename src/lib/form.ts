/**
 * @file Disables form submissions
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

const submit = (event: Event) => {
  event.preventDefault();
  if (!(event.target as HTMLFormElement).checkValidity()) event.stopImmediatePropagation();
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form')?.forEach((form) => form.addEventListener('submit', submit));
});

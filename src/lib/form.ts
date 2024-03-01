/**
 * @file Disables form submissions and handles other common form functionality
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import { guessEncoding } from './encode';

const submit = (event: Event) => {
  event.preventDefault();
  if (!(event.target as HTMLFormElement).checkValidity()) event.stopImmediatePropagation();
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form')?.forEach((form) => form.addEventListener('submit', submit));
});

/**
 * Guess encoding of input-encoding fields, used by any control that should
 * accept an input of arbitrary encoding, such as digest verification,
 * encryption IVs and counters, or salt values.
 */
const checkInputEncoding = (encodingSelect: HTMLSelectElement, input: HTMLInputElement) => () => {
  const encoding = guessEncoding(input.value);

  if (encoding) { // UNKNOWN is radix 0, a falsey value
    encodingSelect.childNodes.forEach((op) => {
      const option = op as HTMLOptionElement;
      if (Number(option.value) === encoding) option.selected = true;
    });
  }
};

// Check input encoding of multi select fields
const multiElements = document.querySelectorAll<HTMLSelectElement>('label.multi');
multiElements.forEach((element) => {
  const input = element.querySelector('input')!;
  const select = element.querySelector('select')!;
  input.addEventListener('paste', () => setTimeout(checkInputEncoding(select, input), 0));
});

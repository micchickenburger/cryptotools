/**
 * @file Handles functionality for "Operation Areas"
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 *
 * Operation Areas are used in sections like Digest and Encryption,
 * and consume content and produce statistics to aid the user in
 * cryptographic operations.
 */

import { ENCODING, guessEncoding } from './encode';

const opAreas = document.querySelectorAll<HTMLElement>('.operation-area');

/**
 * Guess encoding of textarea content
 */
const checkTextareaEncoding = (textarea: HTMLTextAreaElement) => () => {
  const encodingSelect = textarea.parentElement!.querySelector('.encoding select') || textarea.parentElement!.parentElement!.querySelector('.encoding select');
  const encoding = guessEncoding(textarea.value);

  if (encoding) { // UNKNOWN is radix 0, a falsey value
    encodingSelect?.childNodes.forEach((op) => {
      const option = op as HTMLOptionElement;
      if (Number(option.value) === encoding) option.selected = true;
    });
  }
};

opAreas.forEach((opArea) => {
  const textareas = opArea.querySelectorAll<HTMLTextAreaElement>('textarea');

  // If user is typing, it's probably plain text, so let's just check onpaste
  // We use setTimeout to allow the paste to complete before evaluating the whole textarea contents
  textareas.forEach((textarea) => {
    textarea.addEventListener('paste', () => setTimeout(checkTextareaEncoding(textarea), 0));

    // Character Count
    const countCharacters = () => {
      const characterCount = textarea.parentElement!.querySelector('.character-count') || textarea.parentElement!.parentElement!.querySelector('.character-count');

      if (characterCount) {
        const count = textarea.value.length;
        if (count === 1) characterCount.textContent = '1 character';
        else characterCount.textContent = `${count.toLocaleString()} characters`;
      }
    };
    textarea.addEventListener('input', countCharacters);

    // Change encoding to UTF-8 if user is typing (because who manually types Binary, Hex, etc)
    textarea.addEventListener('keypress', () => {
      const encodingSelect = textarea.parentElement!.querySelector<HTMLSelectElement>('.encoding select')
        || textarea.parentElement!.parentElement!.querySelector<HTMLSelectElement>('.encoding select');
      encodingSelect!.value = String(ENCODING['UTF-8']);
    });

    // Allow manually triggering updates.  This helps get around dispatch event restrictions
    textarea.addEventListener('update', () => {
      checkTextareaEncoding(textarea)();
      countCharacters();
    });
  });
});

/**
 * Drag and Drop operations for textareas
 */

const preventDefault = (event: Event) => {
  event.stopPropagation();
  event.preventDefault();
};

const classState = (element: HTMLElement, add: boolean) => () => {
  if (add) element.classList.add('dragover');
  else element.classList.remove('dragover');
};

opAreas.forEach((opArea) => {
  const textareas = opArea.querySelectorAll<HTMLTextAreaElement>('.input > textarea');

  textareas.forEach((textarea) => {
    // Drag-and-drop
    textarea?.addEventListener('dragenter', preventDefault);
    textarea?.addEventListener('dragenter', classState(textarea, true));
    textarea?.addEventListener('dragover', preventDefault);
    textarea?.addEventListener('dragover', classState(textarea, true));
    textarea?.addEventListener('dragleave', classState(textarea, false));
    textarea?.addEventListener('dragend', classState(textarea, false));
    textarea?.addEventListener('drop', preventDefault);
    textarea?.addEventListener('drop', classState(textarea, false));
  });
});

/**
 * Prevent drops outside of textareas
 */

const disallowDrop = (event: DragEvent) => {
  const e = event;
  const target = e.target as HTMLElement;
  if (target?.nodeName !== 'TEXTAREA' && e.dataTransfer) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'none';
    e.dataTransfer.dropEffect = 'none';
  }
};

window.addEventListener('dragover', disallowDrop);
window.addEventListener('dragenter', disallowDrop);
window.addEventListener('drop', disallowDrop);

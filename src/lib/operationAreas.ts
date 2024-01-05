/**
 * @file Handles functionality for "Operation Areas"
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * Operation Areas are used in sections like Digest and Encryption,
 * and consume content and produce statistics to aid the user in
 * cryptographic operations.
 */

const opAreas = document.querySelectorAll<HTMLElement>('.operation-area');

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
  const textarea = opArea.querySelector<HTMLTextAreaElement>('textarea');

  // Drag-and-drop
  textarea?.addEventListener('dragenter', preventDefault);
  textarea?.addEventListener('dragenter', classState(textarea, true));
  textarea?.addEventListener('dragover', preventDefault);
  textarea?.addEventListener('dragover', classState(textarea, true));
  textarea?.addEventListener('dragleave', classState(textarea, false));
  textarea?.addEventListener('dragend', classState(textarea, false));
  textarea?.addEventListener('drop', preventDefault);
  textarea?.addEventListener('drop', classState(textarea, false));

  // Character Count
  textarea?.addEventListener('input', () => {
    const characterCount = opArea.querySelector('.character-count')!;
    const count = textarea.value.length;
    if (count === 1) characterCount.textContent = '1 character';
    else characterCount.textContent = `${count} characters`;
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

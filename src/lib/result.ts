/**
 * @file Contains functionality for showing operation results
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * The result element is separate from functionality-specific sections
 * and intends to display the output of some operation in a fixed-width
 * font face, while providing common UX elements, like copy.
 */

import load from './loader';

const result = document.querySelector<HTMLElement>('#result');
if (!result) throw new Error('No results element exists.');

const copyAnchor = result.querySelector<HTMLElement>('a.copy');
const content = result.querySelector<HTMLElement>('.content');

const setCopyText = (value: string = 'Copy') => {
  const copyText = result.querySelector('.copy span');
  if (copyText) copyText.textContent = value;
};

copyAnchor?.addEventListener('click', async (event) => {
  event.preventDefault();

  if (content && content.textContent) {
    try {
      await navigator.clipboard.writeText(content.textContent);
      setCopyText('Copied!');
    } catch (e) {
      console.error(e);
      setCopyText('Error: You will have to copy manually :(');
    }
  }
});

const showResult = (value: string) => {
  load(100);
  if (content) content.textContent = value;
  setCopyText();
  result.style.opacity = '100%';
};

const hideResult = () => result.style.opacity = '0';

export { showResult, hideResult };

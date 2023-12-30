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

import { ENCODING, decode, encode, guessEncoding } from './encode';
import load from './loader';
import {
  COPIED_SVG, COPY_SVG, TEXT_SVG, RULER_SVG, CODE_SVG, DOUBLE_CHEVRON_SVG,
} from './svg';

const copyEvent = (content: HTMLElement, copy: HTMLElement) => async (event: Event) => {
  event.preventDefault();

  try {
    await navigator.clipboard.writeText(content.textContent!);
    copy.innerHTML = COPIED_SVG;
    copy.dataset.tooltip = 'Copied!';
    setTimeout(() => {
      copy.innerHTML = COPY_SVG;
      copy.dataset.tooltip = 'Copy';
    }, 5000); // revert icon after five seconds
  } catch (e) {
    console.error(e);
  }
};

const buildResultElement = (
  label: string, value: string, encoding: ENCODING, bitLength: number,
): HTMLElement => {
  const container = document.createElement('div');
  container.classList.add('result');

  const h2 = document.createElement('h2');
  h2.textContent = label;
  container.appendChild(h2);

  const content = document.createElement('div');
  content.classList.add('content');
  content.textContent = value;
  container.appendChild(content);

  const stats = document.createElement('div');
  stats.classList.add('stats');
  [{
    icon: TEXT_SVG,
    tooltip: 'Character length',
    content: `${value.length} characters`,
  }, {
    icon: RULER_SVG,
    tooltip: 'Output length',
    content: `${bitLength} bits`,
  }, {
    icon: CODE_SVG,
    tooltip: 'Encoding',
    content: ENCODING[encoding].toLowerCase(),
  }].forEach(({ icon, tooltip, content }) => {
    const stat = document.createElement('div');
    if (tooltip) stat.dataset.tooltip = tooltip;
    stat.innerHTML = icon;

    const span = document.createElement('span');
    span.textContent = content;

    stat.appendChild(span);
    stats.appendChild(stat);
  });
  container.appendChild(stats);

  const copy = document.createElement('a');
  copy.dataset.tooltip = 'Copy';
  copy.href = '#';
  copy.addEventListener('click', copyEvent(content, copy));
  copy.innerHTML = COPY_SVG;
  stats.appendChild(copy);

  return container;
};

interface Result {
  label: string;
  defaultEncoding?: ENCODING;
  value: ArrayBuffer | string;
}

const resultElement = document.querySelector<HTMLElement>('#results')!;

const showResults = (results: Result[]) => {
  resultElement.innerHTML = DOUBLE_CHEVRON_SVG; // remove any previous results

  results.forEach(({ label, value, defaultEncoding }) => {
    let encoding: ENCODING;
    let content: string;
    let byteLength: number;

    if (value instanceof ArrayBuffer) {
      encoding = defaultEncoding || ENCODING.HEXADECIMAL;
      content = encode(value, encoding);
      byteLength = value.byteLength;
    } else {
      content = value;

      // Try determining byte length
      encoding = defaultEncoding || guessEncoding(value);
      try {
        byteLength = decode(value, encoding).byteLength;
      } catch (e) {
        byteLength = (new TextEncoder()).encode(value).byteLength; // assume utf-8 encoded text
      }
    }

    const result = buildResultElement(label, content, encoding, byteLength * 8);
    resultElement.appendChild(result);
  });
  
  resultElement.style.opacity = '100%';
  load(100);
};

const hideResults = () => {
  resultElement.style.opacity = '0';
  resultElement.textContent = '';
}

export { showResults, hideResults };

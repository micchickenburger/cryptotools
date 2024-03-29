/**
 * @file Contains functionality for showing operation results
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 *
 * The result element is separate from functionality-specific sections
 * and intends to display the output of some operation in a fixed-width
 * font face, while providing common UX elements, like copy.
 */

import { clearError, handleError } from './error';
import load from './loader';
import {
  ENCODING, decode, encode, guessEncoding,
} from './encode';
import {
  DONE_SVG, COPY_SVG, TEXT_SVG, RULER_SVG, CODE_SVG, DOUBLE_CHEVRON_SVG,
  DOWNLOAD_SVG, DOWNLOAD_BINARY_SVG, CHEVRON_SVG,
} from './svg';

const resultElement = document.querySelector<HTMLElement>('#results')!;

/**
 * Trigger a file download
 * @param data Data to download
 * @param filename Suggested filename
 * @param extension Suggested file extension
 */
const downloadEvent = (
  data: string | ArrayBuffer,
  filename?: string,
  extension?: string | null,
) => async () => {
  let array: ArrayBuffer;
  let ext = extension === null ? '' : (extension || 'bin');

  if (typeof data === 'string') {
    array = (new TextEncoder()).encode(data);

    if (!extension) {
      const encoding = guessEncoding(data);
      switch (encoding) {
        case ENCODING.JSON: ext = 'json'; break;
        case ENCODING.PEM: ext = 'pem'; break;
        default: ext = 'txt';
      }
    }
  } else array = data;

  const blob = new Blob([array], { type: 'application/octet-stream' });
  const uri = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = uri;
  const suffix = ext ? `.${ext}` : '';
  a.download = filename ? `${filename}${suffix}` : `cryptotools-result${suffix}`;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(uri);
};

type BuildResultData = {
  label: string,
  value: string,
  encoding: ENCODING,
  bitLength: number,
  rawData: string | ArrayBuffer,
  filename?: string,
  extension?: string | null,
};

/**
 * Build result element
 * @param label Title of result
 * @param value The encoded result
 * @param encoding The encoding used
 * @param bitLength The length of the raw data
 * @param rawData The unencoded, raw data
 * @param filename The suggested download filename
 * @param extension The suggested download file extension
 */
const buildResultElement = ({
  label, value, encoding, bitLength, rawData, filename, extension,
}: BuildResultData) => {
  const container = document.createElement('div');
  container.classList.add('result');

  const h2 = document.createElement('h2');
  h2.textContent = label;
  container.appendChild(h2);

  const content = document.createElement('div');
  content.classList.add('content');
  content.textContent = `${value.substring(0, 1000)}${value.length > 1000 ? '…' : ''}`;
  container.appendChild(content);

  const stats = document.createElement('div');
  stats.classList.add('stats');

  const statsItems = [{
    icon: TEXT_SVG,
    tooltip: 'Character length',
    statValue: `${value.length.toLocaleString()} characters`,
  }, {
    icon: RULER_SVG,
    tooltip: 'Output length',
    statValue: `${bitLength.toLocaleString()} bits`,
  }];

  const canChangeEncoding = encoding > 0 && typeof rawData === 'object';

  const actionItems = [{
    tooltip: 'Download Text',
    tooltipAfter: 'Downloaded!',
    icon: DOWNLOAD_SVG,
    callback: downloadEvent(value, filename, canChangeEncoding ? `${ENCODING[encoding].toLocaleLowerCase()}.txt` : extension),
  }, {
    tooltip: 'Copy',
    tooltipAfter: 'Copied!',
    icon: COPY_SVG,
    callback: () => navigator.clipboard.writeText(value),
  }];

  // Positive radixes are safe to encode and decode
  if (canChangeEncoding) {
    // First, add the Download Raw Data action button
    actionItems.unshift({
      tooltip: 'Download Raw Data',
      tooltipAfter: 'Downloaded!',
      icon: DOWNLOAD_BINARY_SVG,
      callback: downloadEvent(rawData, filename, extension),
    });

    // Then add encoding transformation control
    const formLabel = document.createElement('label');
    const fieldLabel = document.createElement('span');
    formLabel.classList.add('control');
    fieldLabel.classList.add('label');
    fieldLabel.textContent = 'Encoding';
    formLabel.innerHTML = CODE_SVG;
    formLabel.insertBefore(fieldLabel, formLabel.firstChild);

    const select = document.createElement('select');

    // Changing the encoding requires a rerender of the section to ensure
    // stats and event handlers are referencing the correct data
    select.addEventListener('change', () => {
      const radix = Number(select.selectedOptions[0].value);

      try {
        const newValue = encode(rawData, radix);
        const result = buildResultElement({
          label, value: newValue, encoding: radix, bitLength, rawData, filename, extension,
        });
        container.replaceWith(result);
      } catch (e) { handleError(e); }
    });

    Object.entries(ENCODING).forEach(([labelContent, radix]) => {
      if (typeof radix === 'number' && radix > 0) {
        const option = document.createElement('option');
        option.textContent = labelContent.toLowerCase();
        option.value = String(radix);
        if (radix === encoding) option.selected = true;
        select.appendChild(option);
      }
    });

    formLabel.appendChild(select);

    // Chevron dropdown
    const chevron = document.createElement('span');
    chevron.innerHTML = CHEVRON_SVG;
    formLabel.appendChild(chevron.firstChild!);

    stats.appendChild(formLabel);
  } else {
    statsItems.unshift({
      icon: CODE_SVG,
      tooltip: 'Encoding',
      statValue: ENCODING[encoding].toLowerCase(),
    });
  }

  statsItems.forEach(({ icon, tooltip, statValue }) => {
    const stat = document.createElement('div');
    stat.classList.add('datum');
    if (tooltip) stat.dataset.tooltip = tooltip;
    stat.innerHTML = icon;

    const span = document.createElement('span');
    span.textContent = statValue;

    stat.appendChild(span);
    stats.appendChild(stat);
  });
  container.appendChild(stats);

  const actions = document.createElement('div');
  actions.classList.add('links');
  stats.appendChild(actions);

  actionItems.forEach(({
    tooltip, tooltipAfter, icon, callback,
  }) => {
    const a = document.createElement('a');
    a.dataset.tooltip = tooltip;
    a.href = '#';
    a.addEventListener('click', async (event) => {
      event.preventDefault();

      try {
        await callback();

        a.innerHTML = DONE_SVG;
        a.dataset.tooltip = tooltipAfter;
        setTimeout(() => {
          a.innerHTML = icon;
          a.dataset.tooltip = tooltip;
        }, 5000); // revert icon after five seconds
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    });

    a.innerHTML = icon;
    actions.appendChild(a);
  });

  return container;
};

interface Result {
  label: string;
  defaultEncoding?: ENCODING;
  value: ArrayBuffer | string;
  filename?: string;
  extension?: string | null;
}

const showResults = (results: Result[]) => {
  resultElement.innerHTML = DOUBLE_CHEVRON_SVG; // remove any previous results
  clearError(); // as well as any previous error
  window.scrollTo({
    top: resultElement.offsetTop,
    behavior: 'smooth',
  });

  results.forEach(({
    label, value, defaultEncoding, filename, extension,
  }) => {
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
        // eslint-disable-next-line no-console
        console.warn(`Cannot calculate raw data byte length for "${label}" because no decoder has been implemented for \`${ENCODING[encoding].toLowerCase()}\`. Assuming utf-8 encoded text instead.`);
        byteLength = (new TextEncoder()).encode(value).byteLength; // assume utf-8 encoded text
      }
    }

    try {
      const result = buildResultElement({
        label,
        value: content,
        encoding,
        bitLength: byteLength * 8,
        rawData: value,
        filename,
        extension,
      });
      resultElement.appendChild(result);
    } catch (e) { handleError(e); }
  });

  resultElement.style.opacity = '100%';
  load(100);
};

const hideResults = () => {
  resultElement.style.opacity = '0';
  resultElement.textContent = '';
  clearError();
};

export { showResults, hideResults, Result };

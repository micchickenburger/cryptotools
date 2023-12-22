const loader = document.querySelector<HTMLElement>('#loader');
const load = (pct: number) => {
  if (loader) loader.style.width = `${pct}%`;
};

const showResult = (value: string) => {
  load(100);
  const result = document.querySelector<HTMLElement>('#result');
  if (result) {
    const content = result.querySelector('.content');
    if (content) content.textContent = value;
    setCopyText();
    result.style.opacity = '100%';
  }
};

const hideResult = () => {
  const result = document.querySelector<HTMLElement>('#result');
  if (result) result.style.opacity = '0';
};

const setCopyText = (value: string = 'Copy') => {
  const copyText = document.querySelector('#result .copy span');
  if (copyText) copyText.textContent = value;
};

const copyAnchor = document.querySelector('#result > a.copy');
copyAnchor?.addEventListener('click', async (event) => {
  event.preventDefault();
  const parent = (event.currentTarget as HTMLElement).parentElement;
  const content = parent?.querySelector('.content')?.textContent;
  if (content) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyText('Copied!');
    } catch (e) {
      setCopyText('Error: You will have to copy manually :(');
    }
  }
});

/**
 * Digest Generation
 */
async function digestMessage(message: string, algorithm: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string
  return hashHex;
}

const button = document.querySelector('button');
button?.addEventListener('click', () => {
  load(0);
  const text = document.querySelector('textarea')?.value;
  if (text && selected.alg) {
    digestMessage(text, selected.alg).then((digestHex) => {
      showResult(digestHex);
    });
  }
});

let selected: DOMStringMap;

const digestSelect = document.querySelector('#digest-select') as HTMLSelectElement;
digestSelect?.addEventListener('change', (event) => {
  const menu = document.querySelector('#digest-menu');
  const outputLength = menu?.querySelector('#digest-output-length span');
  const blockSize = menu?.querySelector('#digest-block-size span');
  const method = menu?.querySelector('#digest-method span');
  const specification = menu?.querySelector('#digest-specification span');
  
  selected = digestSelect.selectedOptions[0].dataset;
  if (outputLength) outputLength.textContent = selected.ol || '';
  if (blockSize) blockSize.textContent = selected.bs || '';
  if (method) method.textContent = selected.method || '';
  if (specification) specification.textContent = selected.spec || '';

  hideResult();
});

document.addEventListener('DOMContentLoaded', () => {
  digestSelect.dispatchEvent(new Event('change'));
});

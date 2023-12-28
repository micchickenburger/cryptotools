import * as bcrypt from 'bcryptjs';

/**
 * Loader logic
 */
const loader = document.querySelector<HTMLElement>('#loader');
const load = (pct: number) => {
  if (loader) loader.style.width = `${pct}%`;
};

/**
 * Main Menu
 */
const menuItems = document.querySelectorAll('#main-menu li') as unknown as HTMLElement[];
const sections = document.querySelectorAll('main section') as unknown as HTMLElement[];
menuItems.forEach((item) => item.addEventListener('click', (event) => {
  menuItems.forEach(i => i.classList.remove('active'));
  sections.forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  if (item.dataset.target) document.querySelector(item.dataset.target)?.classList.add('active');
  hideResult();
}));

/**
 * Result Logic
 */

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
 * Character count
 */
const input = document.querySelector('textarea');
input?.addEventListener('input', () => {
  const characterCount = document.querySelector('#digest .character-count');
  if (characterCount) {
    const count = input.value.length;
    if (count === 1) characterCount.textContent = '1 character';
    else characterCount.textContent = `${count} characters`;
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
  const text = input?.value;
  if (text && selected.alg) {
    digestMessage(text, selected.alg).then((digestHex) => {
      showResult(digestHex);
    });
  }
});

let selected: DOMStringMap;

const digestSelect = document.querySelector('#digest-select') as HTMLSelectElement;
digestSelect?.addEventListener('change', (event) => {
  const menu = document.querySelector('#digest menu');
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

/**
 * Pseudo Random Number Generator Logic
 */

const prngOperation = document.querySelector('#random .operation') as HTMLSelectElement;
const prngOptions = document.querySelector('#random .prng-options') as HTMLElement;
const prngByteLength = document.querySelector('#random .byte-length') as HTMLInputElement;
const prngOutput = document.querySelector('#random .output') as HTMLSelectElement;
const prngOutputEncodingControl = document.querySelector('#random .output-encoding-control') as HTMLElement;
const prngOutputEncoding = document.querySelector('#random .output-encoding') as HTMLSelectElement;
const prngGenerateButton = document.querySelector('#random button') as HTMLButtonElement;

prngOperation?.addEventListener('change', () => {
  switch (prngOperation.selectedOptions[0].value) {
    case 'random':
      prngOptions.classList.add('active');
      break;
    case 'uuid':
      prngOptions.classList.remove('active');
      break;
    default:
  }
});

prngOutput?.addEventListener('change', () => {
  switch (prngOutput.selectedOptions[0].value) {
    case 'display':
      prngOutputEncodingControl.classList.add('active');
      break;
    case 'download':
      prngOutputEncodingControl.classList.remove('active');
      break;
    default:
  }
});

const encode = (array: Uint8Array, radix: number): string => {
  let padding: number = 0;
  if (radix === 2) padding = 8;
  if (radix === 8) padding = 3;
  if (radix === 16) padding = 2;
  if (!padding) throw new Error(`Radix ${radix} is not supported`);

  return array.reduce<string>((str, byte) => str + byte.toString(radix).padStart(padding, '0'), '');
};

prngGenerateButton.addEventListener('click', () => {
  load(0);
  switch (prngOperation.selectedOptions[0].value) {
    case 'random':
      const bytes = parseInt(prngByteLength.value, 10) || 64;
      const array = new Uint8Array(bytes);
      self.crypto.getRandomValues(array);

      switch (prngOutput.selectedOptions[0].value) {
        case 'download':
          const blob = new Blob([array], { type: 'application/octet-stream' });
          const uri = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = uri;
          a.download = `prng-${bytes}-bytes.bin`;
          document.body.appendChild(a);
          a.click();

          // Cleanup
          document.body.removeChild(a);
          window.URL.revokeObjectURL(uri);
          load(100);
          break;
        case 'display':
          const radix = parseInt(prngOutputEncoding.selectedOptions[0].value, 10);
          showResult(encode(array, radix));
          break;
        default:
      }
      break;
    case 'uuid':
      showResult(self.crypto.randomUUID());
      break;
    default:
  }
});

/**
 * Password Hashing Logic
 */

let selectedHashAlgorithm: DOMStringMap;

const hashSelect = document.querySelector('#hash-select') as HTMLSelectElement;
hashSelect?.addEventListener('change', (event) => {
  const menu = document.querySelector('#passwords menu');
  const outputLength = menu?.querySelector('#hash-output-length span');
  const blockSize = menu?.querySelector('#hash-block-size span');
  const method = menu?.querySelector('#hash-method span');
  const specification = menu?.querySelector('#hash-specification span');
  
  selectedHashAlgorithm = hashSelect.selectedOptions[0].dataset;
  if (outputLength) outputLength.textContent = selectedHashAlgorithm.ol || '';
  if (blockSize) blockSize.textContent = selectedHashAlgorithm.bs || '';
  if (method) method.textContent = selectedHashAlgorithm.method || '';
  if (specification) specification.textContent = selectedHashAlgorithm.spec || '';

  hideResult();
});

document.addEventListener('DOMContentLoaded', () => {
  hashSelect.dispatchEvent(new Event('change'));
});

const hashOperation = document.querySelector('#passwords #hash-operation') as HTMLSelectElement;
const updateHashView = () => {
  const operation = hashOperation.selectedOptions[0].value;
  const hash = hashSelect.selectedOptions[0].dataset.alg;
  const target = document.querySelector(`#passwords #${operation}-${hash}`);

  const settings = document.querySelectorAll('#passwords .settings');
  settings.forEach((setting) => setting.classList.remove('active'));
  target?.classList.add('active');
};
hashOperation?.addEventListener('change', updateHashView);
hashSelect?.addEventListener('change', updateHashView);

// Update bcrypt cost iterations count
const bcryptControl = document.querySelector('#hash-bcrypt .control.cost') as HTMLDivElement;
const bcryptCost = document.querySelector('#hash-bcrypt input.cost') as HTMLInputElement;

bcryptCost?.addEventListener('change', () => {
  const value = parseInt(bcryptCost.value, 10);
  bcryptControl.dataset.title = `Cost: 2^${value} = ${Math.pow(2, value).toLocaleString()} iterations`;
});

// Bcrypt finish and progress functions
const bcryptComplete = (button: HTMLButtonElement, text: string | null) => (error: Error | null, result: string | boolean) => {
  if (error) console.error(error);
  showResult(String(result));
  button.textContent = text;
  button.disabled = false;
};

const bcryptProgress = (button: HTMLButtonElement) => (num: number) => {
  load(num * 100);
  button.textContent = `${String(num * 100).substring(0, 4)}%`;
};

// Generate bcrypt
const bcryptHashButton = document.querySelector('#hash-bcrypt button') as HTMLButtonElement;
bcryptHashButton?.addEventListener('click', () => {
  load(0);
  bcryptHashButton.disabled = true;

  const cost = parseInt(bcryptCost.value, 10) || 10;
  const password = document.querySelector('#hash-bcrypt .password input') as HTMLInputElement;

  bcrypt.hash(
    password.value,
    cost,
    bcryptComplete(bcryptHashButton, bcryptHashButton.textContent),
    bcryptProgress(bcryptHashButton),
  );
});

// Verify bcrypt
const bcryptVerifyButton = document.querySelector('#verify-bcrypt button') as HTMLButtonElement;
bcryptVerifyButton?.addEventListener('click', async () => {
  load(0);
  bcryptVerifyButton.disabled = true;

  const password = document.querySelector('#verify-bcrypt .password input') as HTMLInputElement;
  const hash = document.querySelector('#verify-bcrypt .hash input') as HTMLInputElement;

  bcrypt.compare(
    password.value,
    hash.value,
    bcryptComplete(bcryptVerifyButton, bcryptVerifyButton.textContent),
    bcryptProgress(bcryptVerifyButton),
  );
});

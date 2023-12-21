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

const menuLabel = document.querySelector<HTMLElement>('footer .menu-label');
menuLabel?.addEventListener('click', (event) => {
  event.preventDefault();
  const menu = document.querySelector<HTMLElement>('#menu');
  if (menu) menu.classList.add('open');
});

const menuCloseLabel = document.querySelector<HTMLElement>('footer #menu .close');
menuCloseLabel?.addEventListener('click', (event) => {
  event.preventDefault();
  const menu = document.querySelector<HTMLElement>('#menu');
  if (menu) menu.classList.remove('open');
});

async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
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
  if (text) digestMessage(text).then((digestHex) => {
    showResult(digestHex);
  });
});

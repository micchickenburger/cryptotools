/**
 * @file Checks browser for essential features
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

const warning = document.querySelector('#warning')!;

const supportWarnings: string[] = [];

// BigInt support
const BIGINT_SUPPORTED = (() => {
  try {
    if (window.BigInt instanceof Function && 1n) return true;
  } catch (e) { /* do nothing */ }
  return false;
})();
if (!BIGINT_SUPPORTED) supportWarnings.push('BigInt is not supported in this browser. Many operations, including SRP, will fail.');

// IndexedDB support
const IDB_SUPPORTED = (() => {
  try {
    if (window.indexedDB instanceof IDBFactory) return true;
  } catch (e) { /* do nothing */ }
  return false;
})();
if (!IDB_SUPPORTED) supportWarnings.push('IndexedDB is not supported in this browser. Cryptographic keys cannot be stored.');

// Secure Random support via WebCrypto API
const SECURE_RANDOM_SUPPORTED = (() => {
  try {
    if (window.crypto.getRandomValues instanceof Function) return true;
  } catch (e) { /* do nothing */ }
  return false;
})();
if (!SECURE_RANDOM_SUPPORTED) supportWarnings.push('This browser cannot securely source random data. Many operations will fail. The outputs of any operations that do not fail should not be trusted.');

// Subtle crypto support via WebCrypto API
const SUBTLE_CRYPTO_SUPPORTED = (() => {
  try {
    if (window.crypto.subtle.constructor instanceof Function) return true;
  } catch (e) { /* do nothing */ }
  return false;
})();
if (!SUBTLE_CRYPTO_SUPPORTED) supportWarnings.push('The WebCrypto API subtle crypto interface is not available. Is this page being delivered over HTTPS? Many operations will fail. The outputs of any operations that do not fail should not be trusted.');

if (supportWarnings.length) {
  warning.classList.add('active');

  const content = warning.querySelector('.content')!;
  supportWarnings.forEach((item) => {
    const p = document.createElement('p');
    p.textContent = item;
    content.appendChild(p);
  });
}

export {
  BIGINT_SUPPORTED,
  IDB_SUPPORTED,
  SECURE_RANDOM_SUPPORTED,
  SUBTLE_CRYPTO_SUPPORTED,
};

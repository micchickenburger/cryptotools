import SupportedFeatureChecks from './SupportedFeatureChecks';

const warning = document.querySelector('#warning')!;
const supportWarnings: string[] = [];

const BIGINT_SUPPORTED = SupportedFeatureChecks.BigInt(window);
const IDB_SUPPORTED = SupportedFeatureChecks.IndexedDB(window);
const SECURE_RANDOM_SUPPORTED = SupportedFeatureChecks.SecureRandom(window);
const SUBTLE_CRYPTO_SUPPORTED = SupportedFeatureChecks.SubtleCrypto(window);

if (!BIGINT_SUPPORTED) supportWarnings.push('BigInt is not supported in this browser. Many operations, including SRP, will fail.');
if (!IDB_SUPPORTED) supportWarnings.push('IndexedDB is not supported in this browser. Cryptographic keys cannot be stored.');
if (!SECURE_RANDOM_SUPPORTED) supportWarnings.push('This browser cannot securely source random data. Many operations will fail. The outputs of any operations that do not fail should not be trusted.');
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

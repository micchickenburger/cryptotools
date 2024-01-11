/**
 * @file Handles encryption, decryption, signing, and verifying
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import { getKey } from './keys';
import { handleError } from '../../lib/error';
import { ENCODING, decode } from '../../lib/encode';
import { Result, showResults } from '../../lib/result';

const encryptionSection = document.querySelector<HTMLElement>('#encryption')!;
const opArea = encryptionSection.querySelector<HTMLElement>('.encrypt.operation-area')!;
const button = opArea.querySelector<HTMLButtonElement>('button');

button?.addEventListener('click', async () => {
  const operation = opArea.querySelector<HTMLLIElement>('menu li.active')?.dataset.op;
  const textarea = opArea.querySelector<HTMLTextAreaElement>('.input textarea')!;
  const encoding = Number(opArea.querySelector<HTMLSelectElement>('.input .encoding select')?.selectedOptions[0].value);

  const results: Result[] = [];

  try {
    const cryptoKey = getKey(opArea.dataset.key || '').key;
    const isSymmetric = cryptoKey instanceof CryptoKey;

    switch (operation) {
      case 'verify': {
        const key = isSymmetric ? cryptoKey : cryptoKey.publicKey;
        const data = decode(textarea.value, encoding);

        const signatureTextarea = opArea.querySelector<HTMLTextAreaElement>('.signature textarea')!;
        const signatureEncoding = Number(opArea.querySelector<HTMLSelectElement>('.signature .encoding select')?.selectedOptions[0].value);
        const signature = decode(signatureTextarea.value, signatureEncoding);

        const algorithm: any = { // TODO: typing this properly throw errors when adding params
          name: key.algorithm.name,
        };

        if (key.algorithm.name === 'RSA-PSS') {
          const saltLength = opArea.querySelector<HTMLInputElement>('.rsa-pss.verify input.salt-length')?.value;
          algorithm.saltLength = saltLength ? Number(saltLength) : 32;
        }

        if (key.algorithm.name === 'ECDSA') {
          const hashAlgorithm = opArea.querySelector<HTMLSelectElement>('.ecdsa.verify select')?.selectedOptions[0].value;
          algorithm.hash = hashAlgorithm;
        }

        const verification = await window.crypto.subtle.verify(algorithm, key, signature, data);
        results.unshift({
          label: 'Signature verifies data?',
          value: String(verification),
        });
        break;
      }
      case 'encrypt': {
        const key = isSymmetric ? cryptoKey : cryptoKey.publicKey;
        const data = decode(textarea.value, encoding);

        const algorithm: any = { // TODO: typing this properly throw errors when adding params
          name: key.algorithm.name,
        };

        if (key.algorithm.name === 'AES-CTR') {
          const counterValue = opArea.querySelector<HTMLInputElement>('.aes-ctr.encrypt input.counter')?.value;
          const counterRadix = opArea.querySelector<HTMLSelectElement>('.aes-ctr.encrypt select')?.selectedOptions[0].value;

          // Counter must be exactly 16 bytes long, the AES block size.  Here we let the
          // implementation handle throwing the error for a counter of wrong size.
          //
          // The length is the number of bits in the counter block used for the counter
          // (as opposed to the nonce).  The total number of blocks in the message must be
          // less than or equal to 2^n, where n is this counter length in bits.

          let counter: ArrayBuffer;
          if (counterValue) {
            const radix = Number(counterRadix);
            counter = decode(counterValue, radix);
            if (counter.byteLength !== 16) throw new Error('Counter length must be exactly 16 bytes.');
          } else counter = crypto.getRandomValues(new Uint8Array(16)).buffer; // per SP800-38A

          algorithm.counter = counter;
          algorithm.length = 64; // NIST recommends length half of the counter block size (bits)

          results.push({
            label: 'Counter • Needed to decrypt',
            value: counter,
            defaultEncoding: ENCODING.BASE64,
          }, {
            label: 'Counter Length • Needed to decrypt',
            value: algorithm.length,
            defaultEncoding: ENCODING.INTEGER,
          });
        }

        if (key.algorithm.name === 'AES-CBC') {
          const cbcIv = opArea.querySelector<HTMLInputElement>('.aes-cbc.encrypt .iv input')?.value;
          const cbcIvRadix = opArea.querySelector<HTMLSelectElement>('.aes-cbc.encrypt .iv select')?.selectedOptions[0].value;

          // Initialization Vector must be random and unique for every encryption operation
          let iv: ArrayBuffer;
          if (cbcIv) {
            const radix = Number(cbcIvRadix);
            iv = decode(cbcIv, radix);
            if (iv.byteLength !== 16) throw new Error('IV length must be exactly 16 bytes.');
          } else iv = crypto.getRandomValues(new Uint8Array(16)).buffer; // MUST be 16 bytes

          algorithm.iv = iv;

          results.push({
            label: 'Initialization Vector (IV) • Needed to decrypt • Not Secret',
            value: iv,
            defaultEncoding: ENCODING.BASE64,
          });
        }

        if (key.algorithm.name === 'AES-GCM') {
          const gcmIv = opArea.querySelector<HTMLInputElement>('.aes-gcm.encrypt .iv input')?.value;
          const gcmIvRadix = opArea.querySelector<HTMLSelectElement>('.aes-gcm.encrypt .iv select')?.selectedOptions[0].value;
          const authenticatedDataTextArea = opArea.querySelector<HTMLTextAreaElement>('.aes-gcm.encrypt textarea');
          const tagLength = opArea.querySelector<HTMLSelectElement>('.aes-gcm.encrypt .tag-length select')?.selectedOptions[0].value;

          algorithm.tagLength = Number(tagLength) || 128; // 128 bits is implementation default

          // Initialization Vector must be random and unique for every encryption operation
          let iv: ArrayBuffer;
          if (gcmIv) {
            const radix = Number(gcmIvRadix);
            iv = decode(gcmIv, radix);
          } else iv = crypto.getRandomValues(new Uint8Array(12)).buffer; // NIST recommends 96 bits

          algorithm.iv = iv;

          results.unshift({
            label: 'Initialization Vector (IV) • Needed to decrypt • Not Secret',
            value: iv,
            defaultEncoding: ENCODING.BASE64,
          });

          // Additional data can be authenticated and not encrypted
          if (authenticatedDataTextArea?.value.length) {
            const additionalData = (new TextEncoder()).encode(authenticatedDataTextArea?.value);
            algorithm.additionalData = additionalData;
            results.push({
              label: 'Authenticated but Unencrypted Data • Needed to decrypt',
              value: authenticatedDataTextArea.value,
              defaultEncoding: ENCODING['UTF-8'],
            });
          }
        }

        const ciphertext = await window.crypto.subtle.encrypt(algorithm, key, data);
        results.unshift({
          label: 'Ciphertext',
          value: ciphertext,
          defaultEncoding: ENCODING.BASE64,
        });
        break;
      }
      case 'sign': {
        const key = isSymmetric ? cryptoKey : cryptoKey.privateKey;
        const data = decode(textarea.value, encoding);

        const algorithm: any = { // TODO: typing this properly throw errors when adding params
          name: key.algorithm.name,
        };

        if (key.algorithm.name === 'RSA-PSS') {
          const saltLength = opArea.querySelector<HTMLInputElement>('.rsa-pss.sign input.salt-length')?.value;

          let byteLength: number;
          switch ((key.algorithm as any).hash.name) { // TODO: hash doesn't exist in type
            case 'SHA-1': byteLength = 160 / 8; break;
            case 'SHA-256': byteLength = 256 / 8; break;
            case 'SHA-384': byteLength = 384 / 8; break;
            case 'SHA-512': byteLength = 512 / 8; break;
            default: byteLength = 0;
          }
          algorithm.saltLength = saltLength === '' ? byteLength : Number(saltLength);

          results.push({
            label: 'RSA-PSS Salt Length • Needed for signature verification',
            value: String(algorithm.saltLength),
            defaultEncoding: ENCODING.INTEGER,
          });

          // TODO: MDN reports the following as the ceiling for salt length.  However,
          // the ceiling seems to actually be the SHA output size in bytes, at least in Safari.
          // @link https://developer.mozilla.org/en-US/docs/Web/API/RsaPssParams#saltlength
          const keySizeInBits = (key.algorithm as any).modulusLength;
          console.debug('Limit', Math.ceil((keySizeInBits - 1) / 8) - byteLength - 2);
        }

        if (key.algorithm.name === 'ECDSA') {
          const hashAlgorithm = opArea.querySelector<HTMLSelectElement>('.ecdsa.sign select')?.selectedOptions[0].value;
          algorithm.hash = hashAlgorithm;

          results.push({
            label: 'Hash Function • Needed for signature verification',
            value: String(hashAlgorithm),
            defaultEncoding: ENCODING['UTF-8'],
          });
        }

        const signature = await window.crypto.subtle.sign(algorithm, key, data);
        results.unshift({
          label: 'Signature',
          value: signature,
          defaultEncoding: ENCODING.BASE64,
        });
        break;
      }
      case 'decrypt': {
        const key = isSymmetric ? cryptoKey : cryptoKey.privateKey;
        const data = decode(textarea.value, encoding);

        const algorithm: any = { // TODO: typing this properly throw errors when adding params
          name: key.algorithm.name,
        };

        if (key.algorithm.name === 'AES-CTR') {
          const counterValue = opArea.querySelector<HTMLInputElement>('.aes-ctr.decrypt input.counter')?.value;
          const counterRadix = opArea.querySelector<HTMLSelectElement>('.aes-ctr.decrypt select')?.selectedOptions[0].value;

          // Counter must be exactly 16 bytes long, the AES block size.  Here we let the
          // implementation handle throwing the error for a counter of wrong size.
          //
          // The length is the number of bits in the counter block used for the counter
          // (as opposed to the nonce).  The total number of blocks in the message must be
          // less than or equal to 2^n, where n is this counter length in bits.

          let counter: ArrayBuffer;
          if (counterValue) {
            const radix = Number(counterRadix);
            counter = decode(counterValue, radix);
            if (counter.byteLength !== 16) throw new Error('Counter length must be exactly 16 bytes.');
          } else throw new Error('AES-CTR requires the initial counter value in order to decrypt the ciphertext.');

          algorithm.counter = counter;
          algorithm.length = 64; // NIST recommends length half of the counter block size (bits)
        }

        if (key.algorithm.name === 'AES-CBC') {
          const cbcIv = opArea.querySelector<HTMLInputElement>('.aes-cbc.decrypt .iv input')?.value;
          const cbcIvRadix = opArea.querySelector<HTMLSelectElement>('.aes-cbc.decrypt .iv select')?.selectedOptions[0].value;

          // Initialization Vector must be the same used for encryption
          let iv: ArrayBuffer;
          if (cbcIv) {
            const radix = Number(cbcIvRadix);
            iv = decode(cbcIv, radix);
            if (iv.byteLength !== 16) throw new Error('IV length must be exactly 16 bytes.');
          } else throw new Error('AES-CBC requires the Initialization Vector (IV) in order to decrypt the ciphertext.');

          algorithm.iv = iv;
        }

        if (key.algorithm.name === 'AES-GCM') {
          const gcmIv = opArea.querySelector<HTMLInputElement>('.aes-gcm.decrypt .iv input')?.value;
          const gcmIvRadix = opArea.querySelector<HTMLSelectElement>('.aes-gcm.decrypt .iv select')?.selectedOptions[0].value;
          const authenticatedDataTextArea = opArea.querySelector<HTMLTextAreaElement>('.aes-gcm.decrypt textarea');
          const tagLength = opArea.querySelector<HTMLSelectElement>('.aes-gcm.decrypt .tag-length select')?.selectedOptions[0].value;

          algorithm.tagLength = Number(tagLength) || 128; // 128 bits is implementation default

          // Initialization Vector must be random and unique for every encryption operation
          let iv: ArrayBuffer;
          if (gcmIv) {
            const radix = Number(gcmIvRadix);
            iv = decode(gcmIv, radix);
          } else throw new Error('AES-GCM requires the Initialization Vector (IV) in order to decrypt the ciphertext.');

          algorithm.iv = iv;

          // Additional data can be authenticated and not encrypted
          if (authenticatedDataTextArea?.value.length) {
            const additionalData = (new TextEncoder()).encode(authenticatedDataTextArea?.value);
            algorithm.additionalData = additionalData;
          }
        }

        const plaintext = await window.crypto.subtle.decrypt(algorithm, key, data);
        results.unshift({
          label: 'Plaintext',
          value: plaintext,
          defaultEncoding: ENCODING['UTF-8'],
        });

        break;
      }
      default:
        throw new Error(`Operation ${operation} is not implemented.`);
    }

    showResults(results);
  } catch (error) { handleError(error); }
});

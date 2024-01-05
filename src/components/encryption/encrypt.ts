/**
 * @file Handles encryption, decryption, signing, and verifying
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

import { getKey } from './keys';
import { handleError } from '../../lib/error';
import { ENCODING } from '../../lib/encode';
import { Result, showResults } from '../../lib/result';

const encryptionSection = document.querySelector<HTMLElement>('#encryption')!;
const opArea = encryptionSection.querySelector<HTMLElement>('.encrypt.operation-area')!;
const button = opArea.querySelector<HTMLButtonElement>('button');

button?.addEventListener('click', async () => {
  const operation = opArea.querySelector<HTMLLIElement>('menu li.active')?.dataset.op;
  const cryptoKey = getKey(opArea.dataset.key || '');
  const isSymmetric = cryptoKey instanceof CryptoKey;

  const textarea = opArea.querySelector<HTMLTextAreaElement>('textarea')!;
  const data = (new TextEncoder()).encode(textarea.value);

  // RSA-PSS
  const saltLength = opArea.querySelector<HTMLInputElement>('.rsa-pss input.salt-length')?.value;

  // ECDSA
  const hashAlgorithm = opArea.querySelector<HTMLSelectElement>('.ecdsa select')?.selectedOptions[0].value;

  // AES-CTR
  let counter = opArea.querySelector<HTMLInputElement>('.aes-ctr input.counter')?.value;
  const counterRadix = opArea.querySelector<HTMLSelectElement>('.aes-ctr select')?.selectedOptions[0].value;

  // AES-CBC, AES-GCM
  let iv = opArea.querySelector<HTMLInputElement>('.aes-gcm input.counter')?.value;
  const ivRadix = opArea.querySelector<HTMLSelectElement>('.aes-gcm select')?.selectedOptions[0].value;

  const results: Result[] = [];

  try {
    switch (operation) {
      // case 'verify': {
      //   const key = isSymmetric ? cryptoKey : cryptoKey.publicKey;
      //   break;
      // }
      case 'encrypt': {
        const key = isSymmetric ? cryptoKey : cryptoKey.publicKey;

        const algorithm: any = { // TODO: typing this properly throw errors when adding params
          name: key.algorithm.name,
        };

        if (key.algorithm.name === 'AES-CTR') {
          // TODO
        }

        if (key.algorithm.name === 'AES-CBC' || key.algorithm.name === 'AES-GCM') {
          // TODO
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
        const algorithm: any = { // TODO: typing this properly throw errors when adding params
          name: key.algorithm.name,
        };

        if (key.algorithm.name === 'RSA-PSS') {
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
            label: 'RSA-PSS Salt Length (required for signature verification)',
            value: String(algorithm.saltLength),
            defaultEncoding: ENCODING.INTEGER,
          });

          // TODO: MDN reports the following as the ceiling for salt length.  However,
          // the ceiling seems to actually be the SHA output size in bytes, at least in Safari.
          // @link https://developer.mozilla.org/en-US/docs/Web/API/RsaPssParams#saltlength
          const keySizeInBits = (key.algorithm as any).modulusLength;
          console.debug('Limit:', Math.ceil((keySizeInBits - 1) / 8) - byteLength - 2);
        }

        if (key.algorithm.name === 'ECDSA') {
          algorithm.hash = hashAlgorithm;
        }

        const signature = await window.crypto.subtle.sign(algorithm, key, data);
        results.unshift({
          label: 'Signature',
          value: signature,
          defaultEncoding: ENCODING.BASE64,
        });
        break;
      }
      // case 'decrypt': {
      //   const key = isSymmetric ? cryptoKey : cryptoKey.privateKey;
      //   break;
      // }
      default:
        throw new Error(`Operation ${operation} is not implemented.`);
    }

    showResults(results);
  } catch (error) { handleError(error); }
});

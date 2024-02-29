/**
 * @file Key Import
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import * as asn1js from 'asn1js';
import { handleError } from '../../lib/error';
import { ENCODING, decode, guessEncoding } from '../../lib/encode';
import { addKey } from './keys';

/**
 * ASN.1 Schema for Public Keys
 * @link https://github.com/PeculiarVentures/PKI.js/blob/ace03e1c1f141d0c52da26360012e58ebe77932a/src/PublicKeyInfo.ts#L137
 */
const PUBLIC_KEY_SCHEMA = new asn1js.Sequence({
  value: [
    new asn1js.Sequence({
      name: 'encryptionAlgorithm',
      value: [
        new asn1js.ObjectIdentifier({ name: 'algorithm' }),
        new asn1js.Any({ name: 'parameters', optional: true }),
      ],
    }),
    new asn1js.BitString({ name: 'key' }),
  ],
});

/**
 * ASN.1 Schema for Private Keys
 * @link https://github.com/PeculiarVentures/PKI.js/blob/ace03e1c1f141d0c52da26360012e58ebe77932a/src/PrivateKeyInfo.ts#L102
 */
const PRIVATE_KEY_SCHEMA = new asn1js.Sequence({
  value: [
    new asn1js.Integer({ name: 'version' }),
    new asn1js.Sequence({
      name: 'encryptionAlgorithm',
      value: [
        new asn1js.ObjectIdentifier({ name: 'algorithm' }),
        new asn1js.Any({ name: 'parameters', optional: true }),
      ],
    }),
    new asn1js.OctetString({ name: 'key' }),
    new asn1js.Constructed({
      optional: true,
      idBlock: {
        tagClass: 3, // CONTEXT-SPECIFIC
        tagNumber: 0, // [0]
      },
      value: [
        new asn1js.Repeated({
          name: 'attributes',
          value: new asn1js.Sequence({
            value: [
              new asn1js.ObjectIdentifier({}),
              new asn1js.Set({ value: [new asn1js.Repeated({ value: new asn1js.Any() })] }),
            ],
          }),
        }),
      ],
    }),
  ],
});

const section = document.querySelector<HTMLElement>('#encryption [data-tab="import-keys"]')!;
const importButton = section.querySelector<HTMLButtonElement>('button');
const textarea = section.querySelector<HTMLTextAreaElement>('textarea')!;
const algorithmSelect = section.querySelector<HTMLSelectElement>('.algorithm select')!;
const keyTypeSelect = section.querySelector<HTMLSelectElement>('.key-type select')!;

// Update settings based on textarea detection
// setTimeout is needed to await the browser paste to complete
textarea.addEventListener('paste', () => setTimeout(() => {
  const { value } = textarea;
  const encoding = guessEncoding(value);
  let isSymmetric = false;
  let isPrivate = false;
  let format: string;
  let keyData: ArrayBuffer | object | undefined;
  let algorithm: string = 'AES-GCM';
  const keyUsages: KeyUsage[] = [];

  // Detect key type
  try {
    switch (encoding) {
      // JSON Web Keys
      case ENCODING.JSON: {
        const jwk = JSON.parse(value);

        // kty parameter is required in a JWK
        if (jwk && jwk.kty) {
          format = 'jwk';
          keyData = jwk;
          keyUsages.push(...jwk.key_ops);
          if (jwk.d) isPrivate = true;

          if (jwk.kty === 'oct') isSymmetric = true;
          switch (true) {
            case /^A\d+CBC$/.test(jwk.alg): algorithm = 'AES-CBC'; break;
            case /^A\d+CTR$/.test(jwk.alg): algorithm = 'AES-CTR'; break;
            case /^A\d+GCM$/.test(jwk.alg): algorithm = 'AES-GCM'; break;
            case /^HS\d+$/.test(jwk.alg): algorithm = 'HMAC'; break;
            case /^RSA-OAEP-\d+$/.test(jwk.alg): algorithm = 'RSA-OAEP'; break;
            case /^PS\d+$/.test(jwk.alg): algorithm = 'RSA-PSS'; break;
            case /^RS\d+$/.test(jwk.alg): algorithm = 'RSASSA-PKCS1-v1_5'; break;
            default:
              // No alg for ECDSA
              if (jwk.kty === 'EC') algorithm = 'ECDSA';
          }
        } else throw new Error('JSON object is not a valid JSON Web Key');
        break;
      }

      // PKCS#8 and SPKI are DER-encoded ASN.1 structures. When Base64 encoded and
      // a header -----BEGIN {something}----- and footer -----END {something}-----
      // are added, the DER-encoded structure is PEM-encoded.
      case ENCODING.PEM:
      default: {
        if (encoding === ENCODING.PEM) {
          // Decode PEM to DER
          const der = value.match(/^-{5}BEGIN (.+)-{5}(?:\r\n?|\n)((?:[0-9a-zA-Z+/]{4})*[0-9a-zA-Z+/]{2}[0-9a-zA-Z+/=]{2})(\r\n?|\n)-{5}END .+-{5}(\r\n?|\n)?$/);
          if (der && der.length > 2) keyData = decode(der[2], ENCODING.BASE64);
        } else keyData = decode(value, encoding);

        // Decode DER to ASN.1
        const asn = asn1js.fromBER(keyData as ArrayBuffer);
        const root = asn.result;
        let schema: asn1js.CompareSchemaResult | undefined;

        // Is this a public key?
        schema = asn1js.compareSchema(
          root,
          root,
          PUBLIC_KEY_SCHEMA,
        );
        format = 'spki';

        // Or a private key?
        if (!schema || !schema.verified) {
          schema = asn1js.compareSchema(
            root,
            root,
            PRIVATE_KEY_SCHEMA,
          );
          isPrivate = true;
          format = 'pkcs8';
        }

        if (!schema || !schema.verified) {
          console.log('Input does not look like a PEM-encoded, ASN.1 DER-encoded, or JSON-encoded cryptokey. Assuming raw.');
          format = 'raw';
          isSymmetric = true;
          algorithm = 'AES-GCM'; // Could also be CBC or CTR modes, or HMAC
          break;
        }

        console.debug('schema', schema);

        const algorithmId = schema.result.algorithm.valueBlock.toString();
        switch (algorithmId) {
          case '1.2.840.10045.2.1': // ECDSA
            console.debug('algorithm', 'ecdsa', 'isPrivate?', isPrivate);
            algorithm = 'ECDSA';
            break;
          case '1.2.840.113549.1.1.1': // RSA
            console.debug('algorithm', 'rsa', 'isPrivate?', isPrivate);
            algorithm = 'RSASSA-PKCS1-v1_5'; // Could also be PSS or OAEP mode
            break;
          default:
            throw new Error(`Unknown algorithm ID ${algorithmId}`);
        }

        if (isPrivate) keyUsages.push('decrypt', 'sign');
        else keyUsages.push('encrypt', 'verify');
      }
    }
  } catch (e) { handleError(e); }
  console.debug(format!, keyData, algorithm, keyUsages, isSymmetric);

  // Set fields for user
  algorithmSelect.value = algorithm;
  if (isSymmetric) {
    keyTypeSelect.parentElement!.style.display = 'none';
  } else {
    keyTypeSelect.parentElement!.style.display = 'flex';
    keyTypeSelect.value = isPrivate ? 'private' : 'public';
  }
}, 0));

// Import key
importButton?.addEventListener('click', async () => {
  const { value } = textarea;
  const encoding = guessEncoding(value);
  let isPrivate = false;

  let format: KeyFormat;
  let keyData: ArrayBuffer | JsonWebKey;
  let algorithm: RsaHashedImportParams | EcKeyImportParams
  | HmacImportParams | AlgorithmIdentifier | AesKeyAlgorithm;
  const extractable = !!section.querySelector<HTMLInputElement>('.extractable input')?.checked;
  const keyUsages: KeyUsage[] = [];

  const keyName = section.querySelector<HTMLInputElement>('.name input')?.value;
  const saveKey = !!section.querySelector<HTMLInputElement>('.save input')?.checked;

  // Detect key type
  try {
    if (!keyName) throw new Error('A key name is required.');

    switch (encoding) {
      // JSON Web Keys
      case ENCODING.JSON: {
        const jwk = JSON.parse(value);

        // kty parameter is required in a JWK
        if (jwk && jwk.kty) {
          format = 'jwk';
          keyData = jwk as JsonWebKey;
          keyUsages.push(...jwk.key_ops);

          switch (true) {
            case /^A\d+CBC$/.test(jwk.alg): algorithm = 'AES-CBC' as AlgorithmIdentifier; break;
            case /^A\d+CTR$/.test(jwk.alg): algorithm = 'AES-CTR' as AlgorithmIdentifier; break;
            case /^A\d+GCM$/.test(jwk.alg): algorithm = 'AES-GCM' as AlgorithmIdentifier; break;
            case /^HS\d+$/.test(jwk.alg):
              algorithm = {
                name: 'HMAC',
                hash: `SHA-${jwk.alg.match(/^HS(\d{1,3})$/)[1]}`, // alg options: HS1, HS256, HS384, HS512
              } as HmacImportParams;
              break;
            case jwk.kty === 'RSA': {
              const [, algId, hashBits] = jwk.alg.match(/^(.+?)-?(\d{1,3})?$/);

              let name: string;
              switch (algId) {
                case 'RSA-OAEP': name = 'RSA-OAEP'; break;
                case 'RS': name = 'RSASSA-PKCS1-v1_5'; break;
                case 'PS': name = 'RSA-PSS'; break;
                default: throw new Error(`RSA Algorithm "${jwk.alg}" is not supported.`);
              }

              let hash: string;
              switch (hashBits) {
                case undefined: case '1': hash = 'SHA-1'; break;
                case '256': case '384': case '512': hash = `SHA-${hashBits}`; break;
                default: throw new Error(`RSA Algorithm "${jwk.alg}" is not supported.`);
              }

              algorithm = { name, hash } as RsaHashedImportParams;
              break;
            }
            // TODO: ECDH
            case jwk.kty === 'EC': algorithm = { name: 'ECDSA', namedCurve: jwk.crv } as EcKeyImportParams; break;
            default: throw new Error(`Unsupported key type "${jwk.kty}"${jwk.alg ? ` with algorithm "${jwk.alg}"` : ''}.`);
          }
        } else throw new Error('JSON object is not a valid JSON Web Key');
        break;
      }

      // PKCS#8 and SPKI are DER-encoded ASN.1 structures. When Base64 encoded and
      // a header -----BEGIN {something}----- and footer -----END {something}-----
      // are added, the DER-encoded structure is PEM-encoded.
      case ENCODING.PEM:
      default: {
        if (encoding === ENCODING.PEM) {
          // Decode PEM to DER
          const der = value.match(/^-{5}BEGIN (.+)-{5}(?:\r\n?|\n)((?:[0-9a-zA-Z+/]{4})*[0-9a-zA-Z+/]{2}[0-9a-zA-Z+/=]{2})(\r\n?|\n)-{5}END .+-{5}(\r\n?|\n)?$/);
          if (der && der.length > 2) keyData = decode(der[2], ENCODING.BASE64);
          else throw new Error('Invalid PEM encoding.');
        } else keyData = decode(value, encoding);

        // Decode DER to ASN.1
        const asn = asn1js.fromBER(keyData);
        const root = asn.result;
        let schema: asn1js.CompareSchemaResult | undefined;

        // Is this a public key?
        schema = asn1js.compareSchema(
          root,
          root,
          PUBLIC_KEY_SCHEMA,
        );
        format = 'spki';

        // Or a private key?
        if (!schema || !schema.verified) {
          schema = asn1js.compareSchema(
            root,
            root,
            PRIVATE_KEY_SCHEMA,
          );
          isPrivate = true;
          format = 'pkcs8';
        }

        if (!schema || !schema.verified) {
          console.log('Input does not look like a PEM-encoded, ASN.1 DER-encoded, or JSON-encoded cryptokey. Assuming raw.');
          format = 'raw';
          algorithm = algorithmSelect.value as AlgorithmIdentifier;
          keyUsages.push('encrypt', 'decrypt'); // TODO: differentiate for HMAC; exclude options that don't make sense
          break;
        }

        const algorithmId = schema.result.algorithm.valueBlock.toString();
        switch (algorithmId) {
          // TODO: Extract curve and hash settings from DER data
          case '1.2.840.10045.2.1': algorithm = 'ECDSA'; break;
          case '1.2.840.113549.1.1.1': algorithm = 'RSASSA-PKCS1-v1_5'; break; // Could also be PSS or OAEP mode
          // TODO: ECDH
          default:
            throw new Error(`Unknown algorithm ID "${algorithmId}"`);
        }

        if (isPrivate) keyUsages.push('decrypt', 'sign');
        else keyUsages.push('encrypt', 'verify');
      }
    }

    // importKey overloads do not overlap
    let key: CryptoKey;
    if (format === 'jwk') {
      key = await crypto.subtle
        .importKey(format, keyData as JsonWebKey, algorithm, extractable, keyUsages);
    } else {
      key = await crypto.subtle
        .importKey(format, keyData as ArrayBuffer, algorithm, extractable, keyUsages);
    }

    addKey(keyName, key, saveKey);
  } catch (e) { handleError(e); }
});

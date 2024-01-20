/**
 * @file Contains functionality for encoding and decoding raw data
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

import * as bcrypt from 'bcryptjs';

enum ENCODING {
  // Non-transformable encodings
  BOOLEAN = -1,
  BIGINT = -2,
  INTEGER = -3,
  UUID = -4,
  JSON = -5,
  UNKNOWN = 0,

  // Transformable encodings
  BINARY = 2,
  OCTAL = 8,
  'UTF-8' = 100,
  HEXADECIMAL = 16,
  BASE64 = 64, // RFC 4648
  BASE64_CRYPT = 640, // Nonstandard OpenBSD alphabet used by crypt, bcrypt

  // Password Hashing Formats
  PHC_STRING = -100,
  MODULAR_CRYPT_FORMAT = -200,
}

/**
 * Encode raw binary data into a string
 *
 * @param rawData Source data to encode
 * @param radix The base representation of the encoding
 * @returns string
 */
const encode = (rawData: ArrayBuffer, radix: ENCODING): string => {
  const array = new Uint8Array(rawData);

  if (radix === ENCODING.BASE64) {
    return btoa(array.reduce((str, byte) => str + String.fromCharCode(byte), ''));
  }

  if (radix === ENCODING.BASE64_CRYPT) {
    return bcrypt.encodeBase64(array, array.length);
  }

  if (radix === ENCODING['UTF-8']) return (new TextDecoder()).decode(rawData);

  let padding: number = 0;
  if (radix === ENCODING.BINARY) padding = 8;
  if (radix === ENCODING.OCTAL) padding = 3;
  if (radix === ENCODING.HEXADECIMAL) padding = 2;
  if (!padding) throw new Error(`Radix ${radix} is not supported`);

  return array.reduce<string>((str, byte) => str + byte.toString(radix).padStart(padding, '0'), '');
};

/**
 * Decode a string into raw binary data
 *
 * @param encodedData Source data to decode
 * @param radix The base representation of the encoding
 * @returns ArrayBuffer
 */
const decode = (encodedData: string, radix: ENCODING): ArrayBuffer => {
  let array: Uint8Array;

  if (radix === ENCODING.BOOLEAN) {
    // This operation will always return a length of 1 byte, which is the
    // minimum length of a boolean value since 1 byte is the standard
    // minimum addressable memory size in modern CPU architectures
    array = new Uint8Array(1);

    // we want an exception if the encoded data is not stringified boolean
    array[0] = Number(JSON.parse(encodedData)); // 1 or 0
    return array.buffer;
  }

  if (radix === ENCODING.BASE64) {
    const str = atob(encodedData);
    array = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i += 1) {
      array[i] = str.charCodeAt(i);
    }
    return array.buffer;
  }

  if (radix === ENCODING.BASE64_CRYPT) {
    const arr = bcrypt.decodeBase64(encodedData, Infinity);
    return Uint8Array.from(arr).buffer;
  }

  if (radix === ENCODING.BIGINT) {
    // Assumes big endian byte order
    let int = BigInt(encodedData);
    const bytes = [];
    while (int > 0) {
      // eslint-disable-next-line no-bitwise
      bytes.push(Number(int & 0xffn));
      // eslint-disable-next-line no-bitwise
      int >>= 8n;
    }
    return Uint8Array.from(bytes.reverse()).buffer;
  }

  if (radix === ENCODING.UUID) {
    const data = encodedData.replace(/-/g, '');
    array = new Uint8Array(data.length / 2);
    data.match(/.{1,2}/g)?.forEach((byte, i) => { array[i] = parseInt(byte, 16); });
    return array.buffer;
  }

  if (radix === ENCODING['UTF-8']) return (new TextEncoder()).encode(encodedData);

  let separator: number = 0;
  if (radix === ENCODING.BINARY) separator = 8;
  if (radix === ENCODING.OCTAL) separator = 3;
  if (radix === ENCODING.HEXADECIMAL) separator = 2;
  if (!separator) throw new Error(`Radix ${radix} is not supported`);

  const length = encodedData.length / separator;
  array = new Uint8Array(length);

  encodedData.match(new RegExp(`.{1,${separator}}`, 'g'))
    ?.forEach((byte, i) => { array[i] = parseInt(byte, radix); });

  return array.buffer;
};

/**
 * Guess the encoding of a string based on character groupings
 *
 * @param encodedData Source data
 * @returns encoding radix
 */
const guessEncoding = (encodedData: string): ENCODING => {
  // Start with more restrictive/confident character sets and work our way down
  if (encodedData.toLowerCase() === 'true' || encodedData.toLowerCase() === 'false') return ENCODING.BOOLEAN;

  if (/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(encodedData)) return ENCODING.UUID;
  if (/^([01]{8})+$/.test(encodedData)) return ENCODING.BINARY;
  if (/^([0-7]{3})+$/.test(encodedData)) return ENCODING.OCTAL;
  if (/^([0-9a-f]{2})+$|^([0-9A-F]{2})+$/.test(encodedData)) return ENCODING.HEXADECIMAL;
  if (/^([0-9a-zA-Z+/]{4})*[0-9a-zA-Z+/]{2}[0-9a-zA-Z+/=]{2}$/.test(encodedData)) return ENCODING.BASE64;

  // Base64 crypt uses a dot instead of a plus, and has no padding or groupings
  if (/^[0-9a-zA-Z./]+$/.test(encodedData)) return ENCODING.BASE64_CRYPT;

  // Since any javascript primitive in a string is valid JSON, let's be more restrictive
  if (/{/.test(encodedData)) {
    try {
      JSON.parse(encodedData);
      return ENCODING.JSON;
    } catch (e) { /* do nothing */ }
  }

  //
  // Password Hashing Formats
  //

  // PHC String Format
  // @link https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md
  // Note: I made the regexp look for identifiers more than three characters in
  //   length to reduce occasional PHC String matches from clearly Modular Crypt
  //   format strings.
  if (/^\$[a-z0-9-]{4,32}(\$v=[0-9]+)?(\$[a-z0-9-]{1,32}=[a-zA-Z0-9/+.-]+(,[a-z0-9-]{1,32}=[a-zA-Z0-9/+.-]+)*)?(\$[a-zA-Z0-9/+.-]+(\$[a-zA-Z0-9/+]{2,})?)?$/.test(encodedData)) {
    return ENCODING.PHC_STRING;
  }

  // Modular Crypt Format (deprecated in 2016 in favor of PHC)
  // @link https://passlib.readthedocs.io/en/stable/modular_crypt_format.html
  if (/^\$[a-zA-Z0-9]+(\$[a-zA-Z0-9./]+)+$/.test(encodedData)) return ENCODING.MODULAR_CRYPT_FORMAT;

  return ENCODING.UNKNOWN;
};

export {
  ENCODING, decode, encode, guessEncoding,
};

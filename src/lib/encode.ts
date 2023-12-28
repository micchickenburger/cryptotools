/**
 * @file Contains functionality for encoding and decoding raw data
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 */

/**
 * Encode raw binary data into a string of binary, octal, hexadecimal, or
 * Base 64 text.
 * 
 * @param rawData Source data to encode
 * @param radix The base representation of the encoding
 * @returns string
 */
const encode = (rawData: ArrayBuffer, radix: number): string => {
  const array = new Uint8Array(rawData);

  // Base 64
  if (radix === 64) {
    return btoa(array.reduce((str, byte) => str + String.fromCharCode(byte), ''));
  }

  let padding: number = 0;
  if (radix === 2) padding = 8; // Binary
  if (radix === 8) padding = 3; // Octal
  if (radix === 16) padding = 2; // Hexadecimal
  if (!padding) throw new Error(`Radix ${radix} is not supported`);

  return array.reduce<string>((str, byte) => str + byte.toString(radix).padStart(padding, '0'), '');
};

/**
 * Decode a string of binary, octal, hexadecimal, or Base 64 text into raw
 * binary data.
 * 
 * @param encodedData Source data to decode
 * @param radix The base representation of the encoding
 * @returns ArrayBuffer
 */
const decode = (encodedData: string, radix: number): ArrayBuffer => {
  let array: Uint8Array;

  // Base 64
  if (radix === 64) {
    const str = atob(encodedData);
    array = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i += 1) {
      array[i] = str.charCodeAt(i);
    }
    return array.buffer;
  }

  let separator: number = 0;
  if (radix === 2) separator = 8; // Binary
  if (radix === 8) separator = 3; // Octal
  if (radix === 16) separator = 2; // Hexadecimal
  if (!separator) throw new Error(`Radix ${radix} is not supported`);

  const length = encodedData.length / separator;
  array = new Uint8Array(length);

  encodedData.match(new RegExp(`.{1,${separator}}`, 'g'))
    ?.forEach((byte, i) => array[i] = parseInt(byte, radix));

  return array.buffer;
};

export { decode, encode };

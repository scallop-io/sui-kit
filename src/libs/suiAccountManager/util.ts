import { fromBase64, fromHex } from '@mysten/bcs';

// TODO: remove this file after all usages are migrated to @mysten/bcs and update is functions

/**
 * @description This regular expression matches any string that contains only hexadecimal digits (0-9, A-F, a-f).
 * @param str
 */
export const isHex = (str: string) =>
  /^0x[0-9a-fA-F]+$|^[0-9a-fA-F]+$/.test(str);

/**
 * @description This regular expression matches any string that contains only base64 digits (0-9, A-Z, a-z, +, /, =).
 * Note that the "=" signs at the end are optional padding characters that may be present in some base64 encoded strings.
 * @param str
 */
export const isBase64 = (str: string) => /^[a-zA-Z0-9+/]+={0,2}$/g.test(str);

/**
 * @deprecated Use fromHex or fromBase64 from @mysten/bcs directly instead.
 * @description Convert a hex or base64 string to Uint8Array
 */
export const hexOrBase64ToUint8Array = (str: string): Uint8Array => {
  if (isHex(str)) {
    return fromHex(str);
  }
  if (isBase64(str)) {
    return fromBase64(str);
  }
  throw new Error('The string is not a valid hex or base64 string.');
};

const PRIVATE_KEY_SIZE = 32;
const LEGACY_PRIVATE_KEY_SIZE = 64;
/**
 * normalize a private key
 * A private key is a 32-byte array.
 * But there are two different formats for private keys:
 * 1. A 32-byte array
 * 2. A 64-byte array with the first 32 bytes being the private key and the last 32 bytes being the public key
 * 3. A 33-byte array with the first byte being 0x00 (sui.keystore key is a Base64 string with scheme flag 0x00 at the beginning)
 */
export const normalizePrivateKey = (key: Uint8Array): Uint8Array => {
  if (key.length === LEGACY_PRIVATE_KEY_SIZE) {
    return key.slice(0, PRIVATE_KEY_SIZE);
  }
  if (key.length === PRIVATE_KEY_SIZE + 1 && key[0] === 0) {
    return key.slice(1);
  }
  if (key.length === PRIVATE_KEY_SIZE) {
    return key;
  }
  throw new Error('invalid secret key');
};

/**
 * @deprecated Please use fromHex and fromBase64 from '@mysten/bcs' directly.
 */
export { fromHex, fromBase64 } from '@mysten/bcs';

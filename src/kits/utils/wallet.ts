import { fromHex, fromBase64 } from '@mysten/sui/utils';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { DerivePathScheme, DerivePathParams } from '../types';

/**
 * @description This regular expression matches any hexadecimal value.
 * @param str
 */
export const isHex = (value: string) =>
  /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;

/**
 * @description This regular expression matches any base64 value.
 * @param value
 */
export const isBase64 = (value: string) =>
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/g.test(
    value
  );

/**
 * @description Convert a hex or base64 string to Uint8Array
 */
export const hexOrBase64ToUint8Array = (str: string): Uint8Array => {
  if (isHex(str)) {
    return fromHex(str);
  } else if (isBase64(str)) {
    return fromBase64(str);
  } else {
    throw new Error('The string is not a valid hex or base64 string.');
  }
};

/**
 * @description Get ed25519, secp256k1, or secp256r1 derive path.
 */
export const getDerivePath = (
  derivePathScheme: DerivePathScheme,
  derivePathParams: DerivePathParams = {}
) => {
  const {
    accountIndex = 0,
    isExternal = false,
    addressIndex = 0,
  } = derivePathParams;

  const formats: { [key in DerivePathScheme]: string } = {
    ED25519: `m/44'/784'`,
    Secp256k1: `m/54'/784'`,
    Secp256r1: `m/74'/784'`,
  };

  // compliant to SLIP-0010
  const hardenedPath = `${accountIndex}'/${isExternal ? 1 : 0}'/${addressIndex}'`;
  // compliant to BIP-32
  const bip32Path = `${accountIndex}'/${isExternal ? 1 : 0}/${addressIndex}`;

  return `${formats[derivePathScheme]}/${derivePathScheme === 'ED25519' ? hardenedPath : bip32Path}`;
};

/**
 * @description Generate a mnemonic phrase.
 */
export const generateMnemonics = (numberOfWords: 12 | 24 = 24) => {
  const strength = numberOfWords === 12 ? 128 : 256;
  return generateMnemonic(wordlist, strength);
};

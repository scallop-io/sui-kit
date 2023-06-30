import { generateMnemonic as genMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export const generateMnemonic = (numberOfWords: 12 | 24 = 24) => {
  const strength = numberOfWords === 12 ? 128 : 256;
  return genMnemonic(wordlist, strength);
};

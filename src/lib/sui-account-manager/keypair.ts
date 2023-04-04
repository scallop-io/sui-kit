import { Ed25519Keypair } from '@mysten/sui.js'

export type DerivePathParams = {
  accountIndex?: number;
  isExternal?: boolean;
  addressIndex?: number;
}
/**
 * @description Get ed25519 derive path for SUI
 * @param derivePathParams
 */
export const getDerivePathForSUI = (derivePathParams: DerivePathParams = {}) => {
  const { accountIndex = 0, isExternal = false, addressIndex = 0 } = derivePathParams;
  return `m/44'/784'/${accountIndex}'/${isExternal ? 1 : 0}'/${addressIndex}'`;
}

/**
 * the format is m/44'/784'/accountIndex'/${isExternal ? 1 : 0}'/addressIndex'
 *
 * accountIndex is the index of the account, default is 0.
 *
 * isExternal is the type of the address, default is false. Usually, the external address is used to receive coins. The internal address is used to change coins.
 *
 * addressIndex is the index of the address, default is 0. It's used to generate multiple addresses for one account.
 *
 * @description Get keypair from mnemonics and derive path
 * @param mnemonics
 * @param derivePathParams
 */
export const getKeyPair = (mnemonics: string, derivePathParams: DerivePathParams = {}) => {
  const derivePath = getDerivePathForSUI(derivePathParams);
  return Ed25519Keypair.deriveKeypair(mnemonics, derivePath);
}

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import {
  decodeSuiPrivateKey,
  PRIVATE_KEY_SIZE,
  SIGNATURE_FLAG_TO_SCHEME,
  LEGACY_PRIVATE_KEY_SIZE,
  SignatureScheme,
} from '@mysten/sui/cryptography';
import {
  getDerivePath,
  isHex,
  isBase64,
  hexOrBase64ToUint8Array,
} from '../utils/wallet';
import type {
  WalletKitParams,
  DerivePathScheme,
  DerivePathParams,
} from '../types';

export class WalletKit {
  private mnemonics: string;
  private secretKey: string;
  private scheme: DerivePathScheme;
  public keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;
  public address: string;

  /**
   * Support the following ways to init the WalletKit:
   * 1. mnemonics
   * 2. secretKey (base64 or hex private key)
   * It'd throw error, If none of them is provided.
   *
   * @param mnemonics, 12 or 24 mnemonics words, separated by space
   * @param secretKey, base64 or hex string or Bech32 string, when mnemonics is provided, secretKey will be ignored
   */
  constructor({ mnemonics, secretKey, scheme }: WalletKitParams = {}) {
    this.mnemonics = mnemonics || '';
    this.secretKey = secretKey || '';
    this.scheme = scheme || 'ED25519';

    if (!this.mnemonics && !this.secretKey) {
      throw new Error('Mnemonics or secretKey is required.');
    }

    this.keypair = this.secretKey
      ? this.getKeypairFromSecretKey(this.secretKey)
      : this.getKeypairFromMnemonics({
          mnemonics: this.mnemonics,
          derivePathScheme: this.scheme,
        });
    this.address = this.keypair.getPublicKey().toSuiAddress();
  }

  /**
   * It will generate Keypair from the secretKey.
   *
   * There are several formats for secretKey:
   * - 32-byte Hex encoding of the private key.
   * - 64-byte Hex encoding (Legacy), where the first 32 bytes represent the private key and the last 32 bytes represent the public key.
   * - 33-byte Base64 encoding, which includes a scheme flag and the private key.
   * - 33-byte Bech32 encoding, starting with the prefix suiprivkey.
   * @param secretKey, base64 or hex string or Bech32 string
   * @param scheme, signature scheme, default is ED25519
   */
  getKeypairFromSecretKey(
    secretKey: string = this.secretKey,
    scheme: SignatureScheme = this.scheme
  ) {
    if (!secretKey) throw new Error('Secretkey is not provided.');
    let secretKeyUint8Array = new Uint8Array(PRIVATE_KEY_SIZE + 1);

    if (isHex(secretKey) || isBase64(secretKey)) {
      secretKeyUint8Array = hexOrBase64ToUint8Array(secretKey);
      if (secretKeyUint8Array.length == LEGACY_PRIVATE_KEY_SIZE) {
        // only valiable when the scheme of secretKey is ed25519
        scheme = 'ED25519';
        secretKeyUint8Array = secretKeyUint8Array.slice(0, PRIVATE_KEY_SIZE);
      } else if (secretKeyUint8Array.length == PRIVATE_KEY_SIZE + 1) {
        scheme =
          SIGNATURE_FLAG_TO_SCHEME[
            secretKeyUint8Array[0] as keyof typeof SIGNATURE_FLAG_TO_SCHEME
          ];
        secretKeyUint8Array = secretKeyUint8Array.slice(1);
      }
    } else {
      const decoded = decodeSuiPrivateKey(secretKey);
      scheme = decoded.schema;
      secretKeyUint8Array = decoded.secretKey;
    }

    switch (scheme) {
      case 'ED25519': {
        return Ed25519Keypair.fromSecretKey(secretKeyUint8Array);
      }
      case 'Secp256k1': {
        return Secp256k1Keypair.fromSecretKey(secretKeyUint8Array);
      }
      case 'Secp256r1': {
        return Secp256r1Keypair.fromSecretKey(secretKeyUint8Array);
      }
      default: {
        throw new Error(`Invalid keypair scheme ${scheme}`);
      }
    }
  }

  /**
   * It will generate Keypair from the mnemonic with the given derivePathParams.
   */
  getKeypairFromMnemonics({
    mnemonics = this.mnemonics,
    derivePathScheme = this.scheme,
    derivePathParams,
  }: {
    mnemonics?: string;
    derivePathScheme?: DerivePathScheme;
    derivePathParams?: DerivePathParams;
  }) {
    if (!mnemonics) throw new Error('Mnemonics is not provided.');

    const derivePath = getDerivePath(derivePathScheme, derivePathParams);

    switch (derivePathScheme) {
      case 'ED25519': {
        return Ed25519Keypair.deriveKeypair(mnemonics, derivePath);
      }
      case 'Secp256k1': {
        return Secp256k1Keypair.deriveKeypair(mnemonics, derivePath);
      }
      case 'Secp256r1': {
        return Secp256r1Keypair.deriveKeypair(mnemonics, derivePath);
      }
    }
  }

  /**
   * Switch the current keypair with the given derivePathParams.
   * This is only useful when the mnemonics is provided.
   */
  switchKeypairForMnemonics(derivePathParams: DerivePathParams) {
    if (!this.mnemonics) throw new Error('Mnemonics is not provided.');
    this.keypair = this.getKeypairFromMnemonics({
      mnemonics: this.mnemonics,
      derivePathScheme: this.scheme,
      derivePathParams,
    });
    this.address = this.keypair.getPublicKey().toSuiAddress();
  }
}

import { MultiSigPublicKey } from '@mysten/sui/multisig';
import type { PublicKey } from '@mysten/sui/cryptography';
import { ed25519PublicKeyFromBase64 } from './publickey';

export type PublicKeyWeightPair = {
  publicKey: PublicKey;
  weight: number;
};

export class MultiSigClient {
  public readonly pksWeightPairs: PublicKeyWeightPair[];
  public readonly threshold: number;
  public readonly multiSigPublicKey: MultiSigPublicKey;
  constructor(pks: PublicKeyWeightPair[], threshold: number) {
    this.pksWeightPairs = pks;
    this.threshold = threshold;
    this.multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
      threshold: this.threshold,
      publicKeys: this.pksWeightPairs,
    });
  }

  static fromRawEd25519PublicKeys(
    rawPublicKeys: string[],
    weights: number[],
    threshold: number
  ): MultiSigClient {
    const pks = rawPublicKeys.map((rawPublicKey, i) => {
      return {
        publicKey: ed25519PublicKeyFromBase64(rawPublicKey),
        weight: weights[i],
      };
    });
    return new MultiSigClient(pks, threshold);
  }

  multiSigAddress(): string {
    return this.multiSigPublicKey.toSuiAddress();
  }

  combinePartialSigs(sigs: string[]): string {
    return this.multiSigPublicKey.combinePartialSignatures(sigs);
  }
}

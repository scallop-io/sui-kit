import {
  PubkeyWeightPair,
  combinePartialSigs,
  toMultiSigAddress,
} from './multiSig';
import { ed25519PublicKeyFromBase64 } from './publickey';
export class MultiSigClient {
  public readonly pksWeightPairs: PubkeyWeightPair[];
  public readonly threshold: number;
  constructor(pks: PubkeyWeightPair[], threshold: number) {
    this.pksWeightPairs = pks;
    this.threshold = threshold;
  }

  static fromRawPubkeys(
    rawPubkeys: string[],
    weights: number[],
    threshold: number
  ): MultiSigClient {
    const pks = rawPubkeys.map((rawPubkey, i) => {
      return {
        pubKey: ed25519PublicKeyFromBase64(rawPubkey),
        weight: weights[i],
      };
    });
    return new MultiSigClient(pks, threshold);
  }

  multiSigAddress(): string {
    return toMultiSigAddress(this.pksWeightPairs, this.threshold);
  }

  combinePartialSigs(sigs: string[]): string {
    return combinePartialSigs(sigs, this.pksWeightPairs, this.threshold);
  }
}

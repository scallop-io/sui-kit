// TODO: I think we can remove this file or update to NormalizedCallArg
import type { SuiClientTypes } from '@mysten/sui/client';
import type { CallArg } from '@mysten/sui/transactions';

// Transaction result type with effects
type TransactionResultWithEffects = SuiClientTypes.TransactionResult<{
  effects: true;
}>;

export class SuiOwnedObject {
  public readonly objectId: string;
  public version?: string;
  public digest?: string;

  constructor(param: { objectId: string; version?: string; digest?: string }) {
    this.objectId = param.objectId;
    this.version = param.version;
    this.digest = param.digest;
  }

  /**
   * Check if the object is fully initialized.
   * So that when it's used as an input, it won't be necessary to fetch from fullnode again.
   * Which can save time when sending transactions.
   */
  isFullObject(): boolean {
    return !!this.version && !!this.digest;
  }

  asCallArg(): CallArg | string {
    if (!this.version || !this.digest) {
      return this.objectId;
    }
    return {
      $kind: 'Object',
      Object: {
        $kind: 'ImmOrOwnedObject',
        ImmOrOwnedObject: {
          objectId: this.objectId,
          version: this.version,
          digest: this.digest,
        },
      },
    };
  }

  /**
   * Update object version & digest based on the transaction response.
   * @param txResponse
   */
  updateFromTxResponse(txResponse: TransactionResultWithEffects) {
    const tx = txResponse.Transaction ?? txResponse.FailedTransaction;
    if (!tx) {
      throw new Error('Bad transaction response!');
    }
    const effects = tx.effects;
    if (!effects) {
      throw new Error('Transaction response has no effects!');
    }
    for (const change of effects.changedObjects) {
      if (change.objectId === this.objectId && change.outputDigest) {
        this.digest = change.outputDigest;
        this.version = change.outputVersion ?? undefined;
        return;
      }
    }
    throw new Error('Could not find object in transaction response!');
  }
}

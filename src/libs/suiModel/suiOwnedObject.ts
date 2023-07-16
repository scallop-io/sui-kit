import { Infer } from 'superstruct';
import {
  getObjectChanges,
  SuiTransactionBlockResponse,
  ObjectCallArg,
  ObjectId,
  Inputs
} from '@mysten/sui.js';

export class SuiOwnedObject {
  public readonly objectId: string;
  public version?: number | string;
  public digest?: string;

  constructor(param: {objectId: string, version?: string, digest?: string}) {
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

8  asCallArg(): Infer<typeof ObjectCallArg> | Infer<typeof ObjectId>  {
    if (!this.version || !this.digest) {
      return this.objectId;
    }
    return {
      Object: {
        ImmOrOwned: {
          objectId: this.objectId,
          version: this.version,
          digest: this.digest,
        }
      }
    }
  }

  /**
   * Update object version & digest based on the transaction response.
   * @param txResponse
   */
  updateFromTxResponse(txResponse: SuiTransactionBlockResponse) {
    const changes = getObjectChanges(txResponse);
    if (!changes) {
      throw new Error('Bad transaction response!');
    }
    for (const change of changes) {
      if (change.type === 'mutated' && change.objectId === this.objectId) {
        this.digest = change.digest;
        this.version = change.version;
        return;
      }
    }
    throw new Error('Could not find object in transaction response!');
  }
}

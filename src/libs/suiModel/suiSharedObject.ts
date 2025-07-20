// TODO: I think we can remove this file or update to NormalizedCallArg
import type { CallArg } from '@mysten/sui/transactions';

export class SuiSharedObject {
  public readonly objectId: string;
  public initialSharedVersion?: string;

  constructor(param: {
    objectId: string;
    initialSharedVersion?: string;
    mutable?: boolean;
  }) {
    this.objectId = param.objectId;
    this.initialSharedVersion = param.initialSharedVersion;
  }

  asCallArg(mutable: boolean = false): CallArg | string {
    if (!this.initialSharedVersion) {
      return this.objectId;
    }
    return {
      $kind: 'Object',
      Object: {
        $kind: 'SharedObject',
        SharedObject: {
          objectId: this.objectId,
          initialSharedVersion: this.initialSharedVersion,
          mutable,
        },
      },
    };
  }
}

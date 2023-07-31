import { Infer } from 'superstruct';
import { ObjectCallArg, ObjectId } from '@mysten/sui.js';

export class SuiSharedObject {
  public readonly objectId: string;
  public initialSharedVersion?: number | string;

  constructor(param: {
    objectId: string;
    initialSharedVersion?: number;
    mutable?: boolean;
  }) {
    this.objectId = param.objectId;
    this.initialSharedVersion = param.initialSharedVersion;
  }

  asCallArg(
    mutable: boolean = false
  ): Infer<typeof ObjectCallArg> | Infer<typeof ObjectId> {
    if (!this.initialSharedVersion) {
      return this.objectId;
    }
    return {
      Object: {
        Shared: {
          objectId: this.objectId,
          initialSharedVersion: this.initialSharedVersion,
          mutable,
        },
      },
    };
  }
}

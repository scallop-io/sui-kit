import type {
  Transaction,
  TransactionObjectArgument,
  Argument,
  Inputs,
  TransactionArgument,
} from '@mysten/sui/transactions';
import type { SerializedBcs } from '@mysten/bcs';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { SuiTxBlock } from 'src/libs/suiTxBuilder';

export type SuiKitParams = AccountMangerParams & {
  fullnodeUrls?: string[];
  faucetUrl?: string;
  networkType?: NetworkType;
};

export type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export type AccountMangerParams = {
  mnemonics?: string;
  secretKey?: string;
};

export type DerivePathParams = {
  accountIndex?: number;
  isExternal?: boolean;
  addressIndex?: number;
};

type TransactionBlockType = InstanceType<typeof Transaction>;

export type PureCallArg = {
  Pure: number[];
};

type SharedObjectRef = {
  /** Hex code as string representing the object id */
  objectId: string;

  /** The version the object was shared at */
  initialSharedVersion: number | string;

  /** Whether reference is mutable */
  mutable: boolean;
};

type SuiObjectRef = {
  /** Base64 string representing the object digest */
  objectId: string;
  /** Object version */
  version: number | string;
  /** Hex code as string representing the object id */
  digest: string;
};

/**
 * An object argument.
 */
type ObjectArg =
  | { ImmOrOwnedObject: SuiObjectRef }
  | { SharedObject: SharedObjectRef }
  | { Receiving: SuiObjectRef };

export type ObjectCallArg = {
  Object: ObjectArg;
};
export type TransactionType = Parameters<TransactionBlockType['add']>;

export type TransactionPureArgument = Extract<
  Argument,
  {
    $kind: 'Input';
    type?: 'pure';
  }
>;

export type SuiTxArg = TransactionArgument | SerializedBcs<unknown>;
export type SuiAddressArg = Argument | SerializedBcs<unknown> | string;
export type SuiAmountsArg = SuiTxArg | number | bigint;

export type SuiObjectArg =
  | TransactionObjectArgument
  | string
  | Parameters<typeof Inputs.ObjectRef>[0]
  | Parameters<typeof Inputs.SharedObjectRef>[0]
  | ObjectCallArg;

export type SuiVecTxArg =
  | { value: SuiTxArg[]; vecType: SuiInputTypes }
  | SuiTxArg[];

/**
 * These are the basics types that can be used in the SUI
 */
export type SuiBasicTypes =
  | 'address'
  | 'bool'
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128'
  | 'u256';

export type SuiInputTypes = 'object' | SuiBasicTypes;

export type SuiKitReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : SuiTxBlock;

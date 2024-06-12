import type {
  Transaction,
  TransactionObjectArgument,
  TransactionArgument,
  Inputs,
} from '@mysten/sui/transactions';
import type { SerializedBcs } from '@mysten/bcs';
import type { bcs } from '@mysten/sui/bcs';

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

type ObjectArg = typeof bcs.ObjectArg.$inferInput;

export type PureCallArg = {
  Pure: number[];
};
export type ObjectCallArg = {
  Object: ObjectArg;
};
export type TransactionType = Parameters<TransactionBlockType['add']>;

export type TransactionPureArgument = Extract<
  TransactionArgument,
  {
    kind: 'Input';
    type: 'pure';
  }
>;

export type SuiTxArg = SuiAddressArg | number | bigint | boolean;

export type SuiAddressArg =
  | TransactionArgument
  | SerializedBcs<any>
  | string
  | PureCallArg;

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

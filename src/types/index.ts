import { union, object, string, number, boolean, integer } from 'superstruct';
import { TransactionBlock, Transactions } from '@mysten/sui.js/transactions';
import type { Infer } from 'superstruct';
import type { TransactionArgument } from '@mysten/sui.js/transactions';
import type { SharedObjectRef } from '@mysten/sui.js/bcs';

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

const SuiObjectRef = object({
  digest: string(),
  objectId: string(),
  version: union([number(), string()]),
});

const ObjectArg = union([
  object({ ImmOrOwned: SuiObjectRef }),
  object({
    Shared: object({
      objectId: string(),
      initialSharedVersion: union([integer(), string()]),
      mutable: boolean(),
    }),
  }),
]);

const ObjectCallArg = object({ Object: ObjectArg });

type TransactionBlockType = InstanceType<typeof TransactionBlock>;
export type ObjectCallArg = Infer<typeof ObjectCallArg>;
export type TransactionType = Parameters<TransactionBlockType['add']>;
export type PublishTransactionArgs = Parameters<
  (typeof Transactions)['Publish']
>;
export type UpgradeTransactionArgs = Parameters<
  (typeof Transactions)['Upgrade']
>;
export type MakeMoveVecTransactionArgs = Parameters<
  (typeof Transactions)['MakeMoveVec']
>;

export type SuiTxArg =
  | Infer<typeof TransactionArgument>
  | Infer<typeof ObjectCallArg>
  | string
  | number
  | bigint
  | boolean;

export type SuiObjectArg =
  | SharedObjectRef
  | Infer<typeof SuiObjectRef>
  | string
  | Infer<typeof ObjectCallArg>
  | Infer<typeof TransactionArgument>;

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

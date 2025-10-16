import type {
  Transaction,
  TransactionObjectArgument,
  Argument,
  Inputs,
  TransactionArgument,
  Command,
} from '@mysten/sui/transactions';
import type { SerializedBcs } from '@mysten/bcs';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { ClientWithCoreApi } from '@mysten/sui/experimental';
import { SuiTxBlock } from 'src/libs/suiTxBuilder';

export type SuiKitParams = (AccountManagerParams & {
  faucetUrl?: string;
}) &
  Partial<SuiInteractorParams>;

export type SuiKitClient = ClientWithCoreApi;

export type SuiInteractorParams =
  | {
      networkType: NetworkType;
      fullnodeUrls: string[];
      suiClients: never;
    }
  | {
      networkType: NetworkType;
      suiClients: SuiKitClient[];
      fullnodeUrls: never;
    };

export type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export type AccountManagerParams = {
  mnemonics?: string;
  secretKey?: string;
};

export type DerivePathParams = {
  accountIndex?: number;
  isExternal?: boolean;
  addressIndex?: number;
};

type SharedObjectRef = Parameters<typeof Inputs.SharedObjectRef>[0];

type SuiObjectRef = Parameters<typeof Inputs.ObjectRef>[0];

/**
 * An object argument.
 */
type ObjectArg =
  | { ImmOrOwnedObject: SuiObjectRef }
  | { SharedObject: SharedObjectRef }
  | { Receiving: SuiObjectRef };

type ObjectCallArg = {
  Object: ObjectArg;
};

type PureArg = {
  bytes: string;
};

type PureCallArg = {
  Pure: PureArg;
};

type UnresolvedPureArg = {
  value: unknown;
};

type UnresolvedPureCallArg = {
  Unresolved: UnresolvedPureArg;
};

type UnresolvedObjectArg = {
  objectId: string;
  version?: string | number | null;
  diest?: string | null;
  initialSharedVersion?: string | number | null;
  mutable?: boolean | null;
};

type UnresolvedObjectCallArg = {
  UnresolvedObject: UnresolvedObjectArg;
};

type CallArg = ObjectCallArg &
  PureCallArg &
  UnresolvedObjectCallArg &
  UnresolvedPureCallArg;

export type TransactionType = Command;

export type SuiTxArg =
  | string
  | CallArg
  | TransactionObjectArgument
  | SuiAddressArg;

export type SuiAddressArg = string | Argument | SerializedBcs<any>;
export type SuiAmountsArg = SuiTxArg | number | bigint;

export type SuiObjectArg =
  | Exclude<SuiTxArg, CallArg>
  | ObjectCallArg
  | SuiObjectRef
  | SharedObjectRef
  | ((tx: Transaction) => Promise<TransactionArgument | void>);

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

export type SuiVecTxArg =
  | { value: SuiTxArg[]; vecType: SuiInputTypes }
  | SuiTxArg[];

export type SuiKitReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : SuiTxBlock;

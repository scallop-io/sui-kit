import {
  DisplayFieldsResponse,
  ObjectContentFields,
  SharedObjectRef,
  SuiObjectRef,
  TransactionArgument
} from "@mysten/sui.js/src";

export type AccountMangerParams = {
  mnemonics?: string;
  secretKey?: string;
};

export type DerivePathParams = {
  accountIndex?: number;
  isExternal?: boolean;
  addressIndex?: number;
};

export type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export type SuiKitParams = {
  mnemonics?: string;
  secretKey?: string;
  fullnodeUrls?: string[];
  faucetUrl?: string;
  networkType?: NetworkType;
};

export type ObjectData = {
  objectId: string;
  objectType: string;
  objectVersion: number;
  objectDigest: string;
  initialSharedVersion?: number;
  objectDisplay: DisplayFieldsResponse;
  objectFields: ObjectContentFields;
};

export type SuiTxArg = TransactionArgument | string | number | bigint | boolean;

export type SuiObjectArg =
  | SharedObjectRef
  | SuiObjectRef
  | string
  | TransactionArgument;

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

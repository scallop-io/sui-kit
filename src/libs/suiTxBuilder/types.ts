import {
  SharedObjectRef,
  SuiObjectRef,
  TransactionArgument,
} from '@mysten/sui.js';

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

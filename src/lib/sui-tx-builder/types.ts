import {
  SharedObjectRef,
  SuiObjectRef,
  TransactionArgument,
} from '@mysten/sui.js';
import { SuiInputTypes } from './util';

export type SuiTxArg = TransactionArgument | string | number | bigint | boolean;
export type SuiObjectArg =
  | SharedObjectRef
  | SuiObjectRef
  | string
  | TransactionArgument;
export type SuiVecTxArg =
  | { value: SuiTxArg[]; vecType: SuiInputTypes }
  | SuiTxArg[];

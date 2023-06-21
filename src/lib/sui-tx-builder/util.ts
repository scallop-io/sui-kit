import {
  normalizeSuiObjectId,
  TransactionArgument,
  TransactionBlock,
} from '@mysten/sui.js';
import { SuiTxArg } from './types';

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

export const getDefaultSuiInputType = (value: any): SuiInputTypes => {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return 'object';
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    return 'u64';
  } else if (typeof value === 'boolean') {
    return 'bool';
  } else {
    return 'object';
  }
};

/**
 * Since we know the elements in the array are the same type
 * If type is not provided, we will try to infer the type from the first element
 * By default,
 *
 * string starting with `0x` =====> object id
 * number, bigint ====> u64
 * boolean =====> bool
 *
 *
 * If type is provided, we will use the type to convert the array
 * @param args
 * @param type 'address' | 'bool' | 'u8' | 'u16' | 'u32' | 'u64' | 'u128' | 'u256' | 'object'
 */
export function makeVecParam(
  txBlock: TransactionBlock,
  args: SuiTxArg[],
  type?: SuiInputTypes
) {
  if (args.length === 0)
    throw new Error('Transaction builder error: Empty array is not allowed');
  const defaultSuiType = getDefaultSuiInputType(args[0]);
  if (type === 'object' || (!type && defaultSuiType === 'object')) {
    const objects = args.map((arg) =>
      typeof arg === 'string'
        ? txBlock.object(normalizeSuiObjectId(arg))
        : (arg as any)
    );
    return txBlock.makeMoveVec({ objects });
  } else {
    const vecType = type || defaultSuiType;
    return txBlock.pure(args, `vector<${vecType}>`);
  }
}

export function isMoveVecArg(arg: any) {
  const isFullMoveVecArg =
    arg && arg.value && Array.isArray(arg.value) && arg.vecType;
  const isSimpleMoveVecArg = Array.isArray(arg);
  return isFullMoveVecArg || isSimpleMoveVecArg;
}

export function convertArgs(
  txBlock: TransactionBlock,
  args: any[]
): TransactionArgument[] {
  return args.map((arg) => {
    if (typeof arg === 'string' && arg.startsWith('0x')) {
      // We always treat string starting with `0x` as object id
      return txBlock.object(normalizeSuiObjectId(arg));
    } else if (isMoveVecArg(arg)) {
      // if it's an array arg, we will convert it to move vec
      const vecType = arg.vecType || undefined;
      return vecType
        ? makeVecParam(txBlock, arg.value, vecType)
        : makeVecParam(txBlock, arg);
    } else if (typeof arg !== 'object') {
      // Other basic types such as string, number, boolean are converted to pure value
      return txBlock.pure(arg);
    } else {
      // We do nothing, because it's most likely already a move value
      return arg;
    }
  });
}

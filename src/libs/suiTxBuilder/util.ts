import {
  normalizeSuiObjectId,
  normalizeSuiAddress,
  isValidSuiObjectId,
  isValidSuiAddress,
} from '@mysten/sui.js/utils';
import { Inputs } from '@mysten/sui.js/transactions';
import { isPureArg } from '@mysten/sui.js/bcs';
import { isSerializedBcs } from '@mysten/bcs';
import type {
  TransactionArgument,
  TransactionBlock,
  TransactionObjectArgument,
} from '@mysten/sui.js/transactions';
import type {
  SuiInputTypes,
  SuiObjectArg,
  SuiAddressArg,
  SuiTxArg,
  SuiVecTxArg,
} from 'src/types';

export const getDefaultSuiInputType = (
  value: SuiTxArg
): SuiInputTypes | undefined => {
  if (typeof value === 'string' && isValidSuiObjectId(value)) {
    return 'object';
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    return 'u64';
  } else if (typeof value === 'boolean') {
    return 'bool';
  } else {
    return undefined;
  }
};

/**
 * Since we know the elements in the array are the same type
 * If type is not provided, we will try to infer the type from the first element
 * By default,
 *
 * string is hex and its length equal to 32 =====> object id
 * number, bigint ====> u64
 * boolean =====> bool
 *
 * If type is provided, we will use the type to convert the array
 * @param args
 * @param type 'address' | 'bool' | 'u8' | 'u16' | 'u32' | 'u64' | 'u128' | 'u256' | 'signer' | 'object' | string
 */
export function makeVecParam(
  txBlock: TransactionBlock,
  args: SuiTxArg[],
  type?: SuiInputTypes
): TransactionArgument {
  if (args.length === 0)
    throw new Error('Transaction builder error: Empty array is not allowed');
  // Using first element value as default type
  const defaultSuiType = getDefaultSuiInputType(args[0]);
  const VECTOR_REGEX = /^vector<(.+)>$/;
  const STRUCT_REGEX = /^([^:]+)::([^:]+)::([^<]+)(<(.+)>)?/;

  type = type || defaultSuiType;

  if (type === 'object') {
    const objects = args.map((arg) =>
      typeof arg === 'string' && isValidSuiObjectId(arg)
        ? txBlock.object(normalizeSuiObjectId(arg))
        : convertObjArg(txBlock, arg as SuiObjectArg)
    );
    return txBlock.makeMoveVec({ objects });
  } else if (
    typeof type === 'string' &&
    !VECTOR_REGEX.test(type) &&
    !STRUCT_REGEX.test(type)
  ) {
    return txBlock.pure(args, `vector<${type}>`);
  } else {
    const objects = args.map((arg) =>
      convertObjArg(txBlock, arg as SuiObjectArg)
    );
    return txBlock.makeMoveVec({ objects, type });
  }
}

/**
 * Check whether it is an valid move vec input.
 *
 * @param arg The argument to check.
 * @returns boolean.
 */
export function isMoveVecArg(arg: SuiTxArg | SuiVecTxArg): arg is SuiVecTxArg {
  if (typeof arg === 'object' && 'vecType' in arg && 'value' in arg) {
    return true;
  } else if (Array.isArray(arg)) {
    return true;
  }
  return false;
}

/**
 * Convert any valid input into array of TransactionArgument.
 *
 * @param txb The Transaction Block
 * @param args The array of argument to convert.
 * @returns The converted array of TransactionArgument.
 */
export function convertArgs(
  txBlock: TransactionBlock,
  args: (SuiTxArg | SuiVecTxArg)[]
) {
  return args.map((arg) => {
    if (typeof arg === 'string' && isValidSuiObjectId(arg)) {
      return txBlock.object(normalizeSuiObjectId(arg));
    } else if (
      typeof arg == 'object' &&
      !isSerializedBcs(arg) &&
      !isPureArg(arg)
    ) {
      return convertObjArg(txBlock, arg as SuiObjectArg);
    } else if (isMoveVecArg(arg)) {
      const vecType = 'vecType' in arg;
      return vecType
        ? makeVecParam(txBlock, arg.value, arg.vecType)
        : makeVecParam(txBlock, arg);
    } else if (isSerializedBcs(arg)) {
      return arg;
    } else {
      return txBlock.pure(arg);
    }
  });
}

/**
 * Convert any valid address input into a TransactionArgument.
 *
 * @param txb The Transaction Block
 * @param arg The address argument to convert.
 * @returns The converted TransactionArgument.
 */
export function convertAddressArg(
  txBlock: TransactionBlock,
  arg: SuiAddressArg
) {
  if (typeof arg === 'string' && isValidSuiAddress(arg)) {
    return txBlock.pure.address(normalizeSuiAddress(arg));
  } else if (
    typeof arg == 'object' &&
    !isSerializedBcs(arg) &&
    !isPureArg(arg)
  ) {
    return convertObjArg(txBlock, arg as SuiObjectArg);
  } else if (isPureArg(arg)) {
    return txBlock.pure(arg);
  } else {
    return arg;
  }
}

/**
 * Convert any valid object input into a TransactionArgument.
 *
 * @param txb The Transaction Block
 * @param arg The object argument to convert.
 * @returns The converted TransactionArgument.
 */
export function convertObjArg(
  txb: TransactionBlock,
  arg: SuiObjectArg
): TransactionObjectArgument {
  if (typeof arg === 'string') {
    return txb.object(arg);
  }

  if ('digest' in arg && 'version' in arg && 'objectId' in arg) {
    return txb.objectRef(arg);
  }

  if ('objectId' in arg && 'initialSharedVersion' in arg && 'mutable' in arg) {
    return txb.sharedObjectRef(arg);
  }

  if ('Object' in arg) {
    if ('ImmOrOwned' in arg.Object) {
      return txb.object(Inputs.ObjectRef(arg.Object.ImmOrOwned));
    } else if ('Shared' in arg.Object) {
      return txb.object(Inputs.SharedObjectRef(arg.Object.Shared));
    } else {
      throw new Error('Invalid argument type');
    }
  }

  if ('kind' in arg) {
    return arg;
  }

  throw new Error('Invalid argument type');
}

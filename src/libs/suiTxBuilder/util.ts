import {
  normalizeSuiObjectId,
  normalizeSuiAddress,
  isValidSuiObjectId,
  isValidSuiAddress,
} from '@mysten/sui/utils';
import { Inputs, getPureBcsSchema } from '@mysten/sui/transactions';
import { SerializedBcs, bcs, isSerializedBcs } from '@mysten/bcs';
import type {
  TransactionArgument,
  Transaction,
  TransactionObjectArgument,
} from '@mysten/sui/transactions';
import type {
  SuiObjectArg,
  SuiAddressArg,
  SuiTxArg,
  SuiVecTxArg,
  SuiInputTypes,
  SuiAmountsArg,
} from 'src/types';

export const getDefaultSuiInputType = (
  value: SuiTxArg
): 'u64' | 'bool' | 'object' | undefined => {
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
  txBlock: Transaction,
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
    const elements = args.map((arg) =>
      typeof arg === 'string' && isValidSuiObjectId(arg)
        ? txBlock.object(normalizeSuiObjectId(arg))
        : convertObjArg(txBlock, arg as SuiObjectArg)
    );
    return txBlock.makeMoveVec({ elements });
  } else if (
    typeof type === 'string' &&
    !VECTOR_REGEX.test(type) &&
    !STRUCT_REGEX.test(type)
  ) {
    const bcsSchema = getPureBcsSchema(type)!;
    return txBlock.pure(bcs.vector(bcsSchema).serialize(args));
  } else {
    const elements = args.map((arg) =>
      convertObjArg(txBlock, arg as SuiObjectArg)
    );
    return txBlock.makeMoveVec({ elements, type });
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
  txBlock: Transaction,
  args: (SuiTxArg | SuiVecTxArg)[]
): TransactionArgument[] {
  return args.map((arg) => {
    if (arg instanceof SerializedBcs || isSerializedBcs(arg)) {
      return txBlock.pure(arg);
    }

    if (isMoveVecArg(arg)) {
      const vecType = 'vecType' in arg;
      return vecType
        ? makeVecParam(txBlock, arg.value, arg.vecType)
        : makeVecParam(txBlock, arg);
    }

    return arg;
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
  txBlock: Transaction,
  arg: SuiAddressArg
): TransactionArgument {
  if (typeof arg === 'string' && isValidSuiAddress(arg)) {
    return txBlock.pure.address(normalizeSuiAddress(arg));
  } else {
    return convertArgs(txBlock, [arg])[0];
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
  txb: Transaction,
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
    if ('ImmOrOwnedObject' in arg.Object) {
      return txb.object(Inputs.ObjectRef(arg.Object.ImmOrOwnedObject));
    } else if ('SharedObject' in arg.Object) {
      return txb.object(Inputs.SharedObjectRef(arg.Object.SharedObject));
    } else {
      throw new Error('Invalid argument type');
    }
  }

  if (typeof arg === 'function') {
    return arg;
  }

  if (
    'GasCoin' in arg ||
    'Input' in arg ||
    'Result' in arg ||
    'NestedResult' in arg
  ) {
    return arg;
  }

  throw new Error('Invalid argument type');
}

export function convertAmounts(txBlock: Transaction, amounts: SuiAmountsArg[]) {
  return amounts.map((amount) => {
    if (typeof amount === 'number' || typeof amount === 'bigint') {
      return amount;
    } else {
      return convertArgs(txBlock, [amount])[0];
    }
  });
}

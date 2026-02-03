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
import type { SuiClientTypes } from '@mysten/sui/client';
import type {
  SuiObjectArg,
  SuiAddressArg,
  SuiTxArg,
  SuiVecTxArg,
  SuiInputTypes,
  SuiAmountsArg,
} from '../../types/index.js';

// Object reference type
interface SuiObjectRef {
  objectId: string;
  version: number | string;
  digest: string;
}

// Simple types that can be converted to OpenSignatureBody
type SimpleBcsType =
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128'
  | 'u256'
  | 'bool'
  | 'address';

// Convert simple type string to OpenSignatureBody
function toOpenSignatureBody(
  type: SimpleBcsType
): SuiClientTypes.OpenSignatureBody {
  return { $kind: type } as SuiClientTypes.OpenSignatureBody;
}

// TODO: unclear why we need this function and types
export const getDefaultSuiInputType = (
  value: SuiTxArg
): 'u64' | 'bool' | 'object' | undefined => {
  if (typeof value === 'string' && isValidSuiObjectId(value)) {
    return 'object';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return 'u64';
  }
  if (typeof value === 'boolean') {
    return 'bool';
  }
  return undefined;
};

// =========== TYPE GUARD ============
/**
 * Check whether it is an valid input amount;
 *
 * @param arg
 * @returns boolean.
 */
function isAmountArg(arg: any): arg is bigint | number | string {
  return (
    typeof arg === 'number' ||
    typeof arg === 'bigint' ||
    (typeof arg === 'string' && !isValidSuiAddress(arg) && !isNaN(Number(arg)))
  );
}

/**
 * Check whether it is an valid move vec input.
 *
 * @param arg The argument to check.
 * @returns boolean.
 */
function isMoveVecArg(arg: SuiTxArg | SuiVecTxArg): arg is SuiVecTxArg {
  if (typeof arg === 'object' && 'vecType' in arg && 'value' in arg) {
    return true;
  } else if (Array.isArray(arg)) {
    return true;
  }
  return false;
}

/**
 * Check whether it is an valid object reference.
 * @param arg The argument to check
 * @returns boolean
 */
function isObjectRef(arg: SuiObjectArg): arg is SuiObjectRef {
  return (
    typeof arg === 'object' &&
    'digest' in arg &&
    'version' in arg &&
    'objectId' in arg
  );
}

/**
 * Check whether it is an valid shared object reference.
 * @param arg The argument to check
 * @returns
 */
function isSharedObjectRef(
  arg: SuiObjectArg
): arg is Parameters<typeof Inputs.SharedObjectRef>[0] {
  return (
    typeof arg === 'object' &&
    'objectId' in arg &&
    'initialSharedVersion' in arg &&
    'mutable' in arg
  );
}
// ===================================

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
  // TODO: unclear why we need this function and types
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
    // Convert simple type to OpenSignatureBody for BCS schema
    const signatureBody = toOpenSignatureBody(type as SimpleBcsType);
    const bcsSchema = getPureBcsSchema(signatureBody);
    if (!bcsSchema) {
      throw new Error(`Unknown type: ${type}`);
    }
    return txBlock.pure(bcs.vector(bcsSchema).serialize(args));
  } else {
    const elements = args.map((arg) =>
      convertObjArg(txBlock, arg as SuiObjectArg)
    );
    return txBlock.makeMoveVec({ elements, type: type as string });
  }
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

    if (isAmountArg(arg)) {
      return convertAmounts(txBlock, [arg])[0];
    }

    // Cast to SuiObjectArg - at this point it should be an object type
    return convertObjArg(txBlock, arg as unknown as SuiObjectArg);
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
): SuiTxArg {
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

  if (isObjectRef(arg)) {
    return txb.objectRef(arg);
  }

  if (isSharedObjectRef(arg)) {
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

export function convertAmounts(
  txBlock: Transaction,
  amounts: SuiAmountsArg[]
): TransactionArgument[] {
  return amounts.map((amount) => {
    if (isAmountArg(amount)) {
      return txBlock.pure.u64(amount);
    } else {
      return convertArgs(txBlock, [amount])[0];
    }
  });
}

export const partitionArray = <T>(array: T[], chunkSize: number) => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

import {
  TransactionBlock,
  SUI_SYSTEM_STATE_OBJECT_ID,
  normalizeSuiObjectId,
  TransactionArgument,
} from '@mysten/sui.js'
import { SuiInputTypes, getDefaultSuiInputType } from './util'

export type SuiTxArg = TransactionArgument | string | number | bigint | boolean;
export type SuiVecTxArg = { value: SuiTxArg[], vecType: SuiInputTypes } | SuiTxArg[];

export class SuiTxBlock {
  public txBlock: TransactionBlock;
  constructor() {
    this.txBlock = new TransactionBlock();
  }

  transferSuiToMany(recipients: string[], amounts: number[]) {
    // require recipients.length === amounts.length
    if (recipients.length !== amounts.length) {
      throw new Error('transferSuiToMany: recipients.length !== amounts.length');
    }
    const tx = this.txBlock;
    const coins = tx.splitCoins(tx.gas, amounts.map(amount => tx.pure(amount)));
    recipients.forEach((recipient, index) => {
      tx.transferObjects([coins[index]], tx.pure(recipient));
    });
    return this;
  }
  transferSui(recipient: string, amount: number) {
    return this.transferSuiToMany([recipient], [amount]);
  }

  transferObjects(objects: SuiTxArg[], recipient: string) {
    const tx = this.txBlock;
    tx.transferObjects(this.#convertArgs(objects), tx.pure(recipient));
    return this;
  }

  // TODO: refactor this to take a list of coins
  takeAmountFromCoins(coins: SuiTxArg[], amount: number) {
    const tx = this.txBlock;
    const coinObjects = this.#convertArgs(coins);
    const mergedCoin = coins.length > 1
      ? tx.mergeCoins(coinObjects[0],  coinObjects.slice(1))
      : coinObjects[0]
    const [sendCoin] = tx.splitCoins(mergedCoin, [tx.pure(amount)]);
    return [sendCoin, mergedCoin]
  }

  splitSUIFromGas(amounts: number[]) {
    const tx = this.txBlock;
    return tx.splitCoins(tx.gas, amounts.map(m => tx.pure(m)));
  }
  
  splitCoins(coin: SuiTxArg, amounts: number[]) {
    const tx = this.txBlock;
    const coinObject = this.#convertArgs([coin])[0];
    return tx.splitCoins(coinObject, amounts.map(m => tx.pure(m)));
  }
  
  splitMultiCoins(coins: SuiTxArg[], amounts: number[]) {
    const tx = this.txBlock;
    const coinObjects = this.#convertArgs(coins);
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      tx.mergeCoins(mergedCoin,  coinObjects.slice(1));
    }
    const splitedCoins = tx.splitCoins(mergedCoin, amounts.map(m => tx.pure(m)));
    return { splitedCoins, mergedCoin }
  }
  
  transferCoinToMany(inputCoins: SuiTxArg[], sender: string, recipients: string[], amounts: number[]) {
    // require recipients.length === amounts.length
    if (recipients.length !== amounts.length) {
      throw new Error('transferSuiToMany: recipients.length !== amounts.length');
    }
    const tx = this.txBlock;
    const { splitedCoins, mergedCoin } = this.splitMultiCoins(inputCoins, amounts);
    recipients.forEach((recipient, index) => {
      tx.transferObjects([splitedCoins[index]], tx.pure(recipient));
    });
    tx.transferObjects([mergedCoin], tx.pure(sender))
    return this;
  }
  
  transferCoin(inputCoins: SuiTxArg[], sender: string, recipient: string, amount: number) {
    return this.transferCoinToMany(inputCoins, sender, [recipient], [amount]);
  }
  
  /**
   * @description Move call
   * @param target `${string}::${string}::${string}`, e.g. `0x3::sui_system::request_add_stake`
   * @param args the arguments of the move call, such as `['0x1', '0x2']`
   * @param typeArgs the type arguments of the move call, such as `['0x2::sui::SUI']`
   */
  moveCall(target: string, args: (SuiTxArg | SuiVecTxArg)[] = [], typeArgs: string[] = []) {
    // a regex for pattern `${string}::${string}::${string}`
    const regex = /(?<package>[a-zA-Z0-9]+)::(?<module>[a-zA-Z0-9_]+)::(?<function>[a-zA-Z0-9_]+)/;
    const match = target.match(regex);
    if (match === null) throw new Error('Invalid target format. Expected `${string}::${string}::${string}`');
    const convertedArgs = this.#convertArgs(args);
    const tx = this.txBlock;
    return tx.moveCall({
      target: target as `${string}::${string}::${string}`,
      arguments: convertedArgs,
      typeArguments: typeArgs,
    });
  }

  stakeSui(amount: number, validatorAddr: string) {
    const tx = this.txBlock;
    const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    tx.moveCall({
      target: '0x3::sui_system::request_add_stake',
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), stakeCoin, tx.pure(validatorAddr)],
    });
    return tx;
  }

  address(value: string) {
    return this.txBlock.pure(value)
  }

  pure(value: any) {
    return this.txBlock.pure(value)
  }

  object(value: string) {
    return this.txBlock.object(value)
  }

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
  makeMoveVec(args: SuiTxArg[], type?: SuiInputTypes) {
    if (args.length === 0) throw new Error('Transaction builder error: Empty array is not allowed');
    const defaultSuiType = getDefaultSuiInputType(args[0])
    if (type === 'object' || (!type && defaultSuiType === 'object')) {
      const objects = args.map(arg =>
        typeof arg === 'string' ? this.txBlock.object(normalizeSuiObjectId(arg)) : (arg as any)
      );
      return this.txBlock.makeMoveVec({ objects })
    } else {
      const vecType = type || defaultSuiType;
      return this.txBlock.pure(args, `vector<${vecType}>`)
    }
  }

  #isMoveVecArg(arg: any) {
    const isFullMoveVecArg = arg && arg.value && Array.isArray(arg.value) && arg.vecType;
    const isSimpleMoveVecArg = Array.isArray(arg);
    return isFullMoveVecArg || isSimpleMoveVecArg;
  }

  #convertArgs(args: any[]): TransactionArgument[] {
    return args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('0x')) {
        // We always treat string starting with `0x` as object id
        return this.txBlock.object(normalizeSuiObjectId(arg))
      } else if (this.#isMoveVecArg(arg)) {
        // if it's an array arg, we will convert it to move vec
        const vecType = arg.vecType || undefined;
        return vecType
          ? this.makeMoveVec(arg.value, vecType)
          : this.makeMoveVec(arg)
      } else if (typeof arg !== 'object') {
        // Other basic types such as string, number, boolean are converted to pure value
        return this.txBlock.pure(arg)
      } else {
        // We do nothing, because it's most likely already a move value
        return arg
      }
    })
  }
}

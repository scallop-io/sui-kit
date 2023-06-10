import {
  TransactionBlock,
  SUI_SYSTEM_STATE_OBJECT_ID,
  normalizeSuiObjectId,
  TransactionArgument,
  TransactionExpiration,
  SuiObjectRef,
  SharedObjectRef,
  JsonRpcProvider,
  TransactionType,
  Transactions,
  ObjectCallArg,
} from '@mysten/sui.js'
import { SuiInputTypes, getDefaultSuiInputType } from './util'

export type SuiTxArg = TransactionArgument | string | number | bigint | boolean;
export type SuiObjectArg = SharedObjectRef | SuiObjectRef | string | TransactionArgument;
export type SuiVecTxArg = { value: SuiTxArg[], vecType: SuiInputTypes } | SuiTxArg[];
interface BuildOptions {
  provider?: JsonRpcProvider;
  onlyTransactionKind?: boolean;
}

export class SuiTxBlock {
  public txBlock: TransactionBlock;
  constructor(transaction?: TransactionBlock) {
    this.txBlock = new TransactionBlock(transaction);
  }

  //======== override methods of TransactionBlock ============

  address(value: string) {
    return this.txBlock.pure(value, 'address')
  }
  pure(value: unknown, type?: string) {
    return this.txBlock.pure(value)
  }
  object(value: string | ObjectCallArg) {
    return this.txBlock.object(value)
  }
  objectRef(ref: SuiObjectRef) {
    return this.txBlock.objectRef(ref)
  }
  sharedObjectRef(ref: SharedObjectRef) {
    return this.txBlock.sharedObjectRef(ref)
  }
  setSender(sender: string) {
    return this.txBlock.setSender(sender)
  }
  setSenderIfNotSet(sender: string) {
    return this.txBlock.setSenderIfNotSet(sender)
  }
  setExpiration(expiration?: TransactionExpiration) {
    return this.txBlock.setExpiration(expiration)
  }
  setGasPrice(price: number | bigint) {
    return this.txBlock.setGasPrice(price)
  }
  setGasBudget(budget: number | bigint) {
    return this.txBlock.setGasBudget(budget)
  }
  setGasOwner(owner: string) {
    return this.txBlock.setGasOwner(owner);
  }
  setGasPayment(payments: SuiObjectRef[]) {
    return this.txBlock.setGasPayment(payments);
  }

  add(transaction: TransactionType) {
    return this.txBlock.add(transaction);
  }
  serialize() {
    return this.txBlock.serialize();
  }
  build(params: BuildOptions = {}) {
    return this.txBlock.build(params)
  }
  getDigest({ provider }: { provider?: JsonRpcProvider } = {}) {
    return this.txBlock.getDigest({ provider });
  }

  get gas() {
    return this.txBlock.gas;
  }
  get blockData() {
    return this.txBlock.blockData;
  }

  transferObjects(objects: SuiObjectArg[], recipient: string) {
    const tx = this.txBlock;
    tx.transferObjects(this.#convertArgs(objects), tx.pure(recipient));
    return this;
  }
  splitCoins(coin: SuiObjectArg, amounts: number[]) {
    const tx = this.txBlock;
    const coinObject = this.#convertArgs([coin])[0];
    const res = tx.splitCoins(coinObject, amounts.map(m => tx.pure(m)));
    return amounts.map((_, i) => res[i]);
  }
  mergeCoins(destination: SuiObjectArg, sources: SuiObjectArg[]) {
    const destionationObject = this.#convertArgs([destination])[0];
    const sourceObjects = this.#convertArgs(sources);
    return this.txBlock.mergeCoins(destionationObject, sourceObjects);
  }
  publish(...args: Parameters<(typeof Transactions)['Publish']>) {
    return this.txBlock.publish(...args);
  }
  upgrade(...args: Parameters<(typeof Transactions)['Upgrade']>) {
    return this.txBlock.upgrade(...args);
  }
  makeMoveVec(...args: Parameters<(typeof Transactions)['MakeMoveVec']>) {
    return this.txBlock.makeMoveVec(...args);
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


  //======== enhance methods ============
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

  takeAmountFromCoins(coins: SuiObjectArg[], amount: number) {
    const tx = this.txBlock;
    const coinObjects = this.#convertArgs(coins);
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      tx.mergeCoins(mergedCoin, coinObjects.slice(1));
    }
    const [sendCoin] = tx.splitCoins(mergedCoin, [tx.pure(amount)]);
    return [sendCoin, mergedCoin];
  }


  splitSUIFromGas(amounts: number[]) {
    const tx = this.txBlock;
    return tx.splitCoins(tx.gas, amounts.map(m => tx.pure(m)));
  }
  
  splitMultiCoins(coins: SuiObjectArg[], amounts: number[]) {
    const tx = this.txBlock;
    const coinObjects = this.#convertArgs(coins);
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      tx.mergeCoins(mergedCoin,  coinObjects.slice(1));
    }
    const splitedCoins = tx.splitCoins(mergedCoin, amounts.map(m => tx.pure(m)));
    return { splitedCoins, mergedCoin }
  }
  
  transferCoinToMany(inputCoins: SuiObjectArg[], sender: string, recipients: string[], amounts: number[]) {
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
  
  transferCoin(inputCoins: SuiObjectArg[], sender: string, recipient: string, amount: number) {
    return this.transferCoinToMany(inputCoins, sender, [recipient], [amount]);
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
  #makeVecParam(args: SuiTxArg[], type?: SuiInputTypes) {
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
          ? this.#makeVecParam(arg.value, vecType)
          : this.#makeVecParam(arg)
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

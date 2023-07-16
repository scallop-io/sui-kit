import {
  TransactionBlock,
  SUI_SYSTEM_STATE_OBJECT_ID,
  TransactionExpiration,
  SuiObjectRef,
  SharedObjectRef,
  JsonRpcProvider,
  TransactionType,
  Transactions,
  ObjectCallArg,
} from '@mysten/sui.js';
import { convertArgs } from './util';
import type { SuiTxArg, SuiObjectArg, SuiVecTxArg } from 'src/types';

export class SuiTxBlock {
  public txBlock: TransactionBlock;
  constructor(transaction?: TransactionBlock) {
    this.txBlock = new TransactionBlock(transaction);
  }

  //======== override methods of TransactionBlock ============

  address(value: string) {
    return this.txBlock.pure(value, 'address');
  }
  pure(value: unknown, type?: string) {
    return this.txBlock.pure(value, type);
  }
  object(value: string | ObjectCallArg) {
    return this.txBlock.object(value);
  }
  objectRef(ref: SuiObjectRef) {
    return this.txBlock.objectRef(ref);
  }
  sharedObjectRef(ref: SharedObjectRef) {
    return this.txBlock.sharedObjectRef(ref);
  }
  setSender(sender: string) {
    return this.txBlock.setSender(sender);
  }
  setSenderIfNotSet(sender: string) {
    return this.txBlock.setSenderIfNotSet(sender);
  }
  setExpiration(expiration?: TransactionExpiration) {
    return this.txBlock.setExpiration(expiration);
  }
  setGasPrice(price: number | bigint) {
    return this.txBlock.setGasPrice(price);
  }
  setGasBudget(budget: number | bigint) {
    return this.txBlock.setGasBudget(budget);
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
  build(
    params: {
      provider?: JsonRpcProvider;
      onlyTransactionKind?: boolean;
    } = {}
  ) {
    return this.txBlock.build(params);
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
    tx.transferObjects(convertArgs(this.txBlock, objects), tx.pure(recipient));
    return this;
  }
  splitCoins(coin: SuiObjectArg, amounts: number[]) {
    const tx = this.txBlock;
    const coinObject = convertArgs(this.txBlock, [coin])[0];
    const res = tx.splitCoins(
      coinObject,
      amounts.map((m) => tx.pure(m))
    );
    return amounts.map((_, i) => res[i]);
  }
  mergeCoins(destination: SuiObjectArg, sources: SuiObjectArg[]) {
    const destinationObject = convertArgs(this.txBlock, [destination])[0];
    const sourceObjects = convertArgs(this.txBlock, sources);
    return this.txBlock.mergeCoins(destinationObject, sourceObjects);
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
  moveCall(
    target: string,
    args: (SuiTxArg | SuiVecTxArg)[] = [],
    typeArgs: string[] = []
  ) {
    // a regex for pattern `${string}::${string}::${string}`
    const regex =
      /(?<package>[a-zA-Z0-9]+)::(?<module>[a-zA-Z0-9_]+)::(?<function>[a-zA-Z0-9_]+)/;
    const match = target.match(regex);
    if (match === null)
      throw new Error(
        'Invalid target format. Expected `${string}::${string}::${string}`'
      );
    const convertedArgs = convertArgs(this.txBlock, args);
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
      throw new Error(
        'transferSuiToMany: recipients.length !== amounts.length'
      );
    }

    const tx = this.txBlock;
    const coins = tx.splitCoins(
      tx.gas,
      amounts.map((amount) => tx.pure(amount))
    );
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
    const coinObjects = convertArgs(this.txBlock, coins);
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      tx.mergeCoins(mergedCoin, coinObjects.slice(1));
    }
    const [sendCoin] = tx.splitCoins(mergedCoin, [tx.pure(amount)]);
    return [sendCoin, mergedCoin];
  }

  splitSUIFromGas(amounts: number[]) {
    const tx = this.txBlock;
    return tx.splitCoins(
      tx.gas,
      amounts.map((m) => tx.pure(m))
    );
  }

  splitMultiCoins(coins: SuiObjectArg[], amounts: number[]) {
    const tx = this.txBlock;
    const coinObjects = convertArgs(this.txBlock, coins);
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      tx.mergeCoins(mergedCoin, coinObjects.slice(1));
    }
    const splitedCoins = tx.splitCoins(
      mergedCoin,
      amounts.map((m) => tx.pure(m))
    );
    return { splitedCoins, mergedCoin };
  }

  transferCoinToMany(
    inputCoins: SuiObjectArg[],
    sender: string,
    recipients: string[],
    amounts: number[]
  ) {
    // require recipients.length === amounts.length
    if (recipients.length !== amounts.length) {
      throw new Error(
        'transferSuiToMany: recipients.length !== amounts.length'
      );
    }
    const tx = this.txBlock;
    const { splitedCoins, mergedCoin } = this.splitMultiCoins(
      inputCoins,
      amounts
    );
    recipients.forEach((recipient, index) => {
      tx.transferObjects([splitedCoins[index]], tx.pure(recipient));
    });
    tx.transferObjects([mergedCoin], tx.pure(sender));
    return this;
  }

  transferCoin(
    inputCoins: SuiObjectArg[],
    sender: string,
    recipient: string,
    amount: number
  ) {
    return this.transferCoinToMany(inputCoins, sender, [recipient], [amount]);
  }

  stakeSui(amount: number, validatorAddr: string) {
    const tx = this.txBlock;
    const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    tx.moveCall({
      target: '0x3::sui_system::request_add_stake',
      arguments: [
        tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
        stakeCoin,
        tx.pure(validatorAddr),
      ],
    });
    return tx;
  }
}

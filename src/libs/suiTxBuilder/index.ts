import { Transaction, TransactionObjectInput } from '@mysten/sui/transactions';
import { SUI_SYSTEM_STATE_OBJECT_ID } from '@mysten/sui/utils';
import {
  convertArgs,
  convertAddressArg,
  convertObjArg,
  convertAmounts,
  partitionArray,
} from './util';
import type { SuiClient, SuiObjectRef } from '@mysten/sui/client';
import type { Keypair } from '@mysten/sui/cryptography';
import type {
  SuiTxArg,
  SuiAddressArg,
  SuiObjectArg,
  SuiVecTxArg,
  SuiAmountsArg,
} from 'src/types';
import type { bcs } from '@mysten/sui/bcs';

export class SuiTxBlock {
  public txBlock: Transaction;

  constructor(transaction?: Transaction) {
    this.txBlock = transaction
      ? Transaction.from(transaction)
      : new Transaction();
  }

  /* Directly wrap methods and properties of TransactionBlock */
  get gas() {
    return this.txBlock.gas;
  }
  /** @deprecated Use `getData()` instead. */
  get blockData() {
    // TODO: need to update this method to use the new blockData method
    return this.txBlock.blockData;
  }

  get getData() {
    return this.txBlock.getData();
  }

  address(value: string) {
    return this.txBlock.pure.address(value);
  }

  get pure(): typeof this.txBlock.pure {
    return this.txBlock.pure;
  }

  object(value: string | TransactionObjectInput) {
    return this.txBlock.object(value);
  }

  objectRef(ref: SuiObjectRef) {
    return this.txBlock.objectRef(ref);
  }
  sharedObjectRef(ref: typeof bcs.SharedObjectRef.$inferType) {
    return this.txBlock.sharedObjectRef(ref);
  }
  setSender(sender: string) {
    return this.txBlock.setSender(sender);
  }
  setSenderIfNotSet(sender: string) {
    return this.txBlock.setSenderIfNotSet(sender);
  }
  setExpiration(expiration?: Parameters<typeof this.txBlock.setExpiration>[0]) {
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
  /**
   * @deprecated Use toJSON instead.
   * For synchronous serialization, you can use `getData()`
   * */
  serialize() {
    // TODO: need to update this method to use the new serialize method
    return this.txBlock.serialize();
  }

  toJSON() {
    return this.txBlock.toJSON();
  }

  sign(params: {
    signer: Keypair;
    client?: SuiClient;
    onlyTransactionKind?: boolean;
  }) {
    return this.txBlock.sign(params);
  }
  build(
    params: {
      client?: SuiClient;
      onlyTransactionKind?: boolean;
    } = {}
  ) {
    return this.txBlock.build(params);
  }
  getDigest(params: { client?: SuiClient } = {}) {
    return this.txBlock.getDigest(params);
  }
  add(...args: Parameters<typeof this.txBlock.add>) {
    return this.txBlock.add(...args);
  }
  publish({
    modules,
    dependencies,
  }: {
    modules: number[][] | string[];
    dependencies: string[];
  }) {
    return this.txBlock.publish({ modules, dependencies });
  }
  upgrade(...args: Parameters<typeof this.txBlock.upgrade>) {
    return this.txBlock.upgrade(...args);
  }

  makeMoveVec(...args: Parameters<typeof this.txBlock.makeMoveVec>) {
    return this.txBlock.makeMoveVec(...args);
  }

  /* Override methods of TransactionBlock */

  transferObjects(objects: SuiObjectArg[], address: SuiAddressArg) {
    return this.txBlock.transferObjects(
      objects.map((object) => convertObjArg(this.txBlock, object)),
      convertAddressArg(this.txBlock, address) as any
    );
  }

  splitCoins(coin: SuiObjectArg, amounts: SuiAmountsArg[]) {
    const res = this.txBlock.splitCoins(
      convertObjArg(this.txBlock, coin),
      convertAmounts(this.txBlock, amounts)
    );
    return amounts.map((_, i) => res[i]);
  }

  mergeCoins(destination: SuiObjectArg, sources: SuiObjectArg[]) {
    const destinationObject = convertObjArg(this.txBlock, destination);
    const sourceObjects = sources.map((source) =>
      convertObjArg(this.txBlock, source)
    );
    return this.txBlock.mergeCoins(destinationObject, sourceObjects);
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
    return this.txBlock.moveCall({
      target: target as `${string}::${string}::${string}`,
      arguments: convertedArgs,
      typeArguments: typeArgs,
    });
  }

  /* Enhance methods of TransactionBlock */
  transferSuiToMany(recipients: SuiAddressArg[], amounts: SuiAmountsArg[]) {
    // require recipients.length === amounts.length
    if (recipients.length !== amounts.length) {
      throw new Error(
        'transferSuiToMany: recipients.length !== amounts.length'
      );
    }
    const coins = this.txBlock.splitCoins(
      this.txBlock.gas,
      convertAmounts(this.txBlock, amounts)
    );
    const recipientObjects = recipients.map((recipient) =>
      convertAddressArg(this.txBlock, recipient)
    );
    recipientObjects.forEach((address, index) => {
      this.txBlock.transferObjects([coins[index]], address as any);
    });
    return this;
  }

  transferSui(address: SuiAddressArg, amount: SuiAmountsArg) {
    return this.transferSuiToMany([address], [amount]);
  }

  takeAmountFromCoins(coins: SuiObjectArg[], amount: SuiAmountsArg) {
    const { splitedCoins, mergedCoin } = this.splitMultiCoins(
      coins,
      convertAmounts(this.txBlock, [amount])
    );

    return [splitedCoins, mergedCoin];
  }

  splitSUIFromGas(amounts: SuiAmountsArg[]) {
    return this.txBlock.splitCoins(
      this.txBlock.gas,
      convertAmounts(this.txBlock, amounts)
    );
  }

  splitMultiCoins(coins: SuiObjectArg[], amounts: SuiAmountsArg[]) {
    if (coins.length === 0) {
      throw new Error('takeAmountFromCoins: coins array is empty');
    }

    const partitions = partitionArray(coins.slice(1), 511);
    const mergedCoin = convertObjArg(this.txBlock, coins[0]);
    for (const partition of partitions) {
      const coinObjects = partition.map((coin) =>
        convertObjArg(this.txBlock, coin)
      );
      this.txBlock.mergeCoins(mergedCoin, coinObjects);
    }
    const splitedCoins = this.txBlock.splitCoins(
      mergedCoin,
      convertAmounts(this.txBlock, amounts)
    );
    return { splitedCoins, mergedCoin };
  }

  transferCoinToMany(
    coins: SuiObjectArg[],
    sender: SuiAddressArg,
    recipients: SuiAddressArg[],
    amounts: SuiAmountsArg[]
  ) {
    // require recipients.length === amounts.length
    if (recipients.length !== amounts.length) {
      throw new Error(
        'transferSuiToMany: recipients.length !== amounts.length'
      );
    }
    const coinObjects = coins.map((coin) => convertObjArg(this.txBlock, coin));
    const { splitedCoins, mergedCoin } = this.splitMultiCoins(
      coinObjects,
      convertAmounts(this.txBlock, amounts)
    );
    const recipientObjects = recipients.map((recipient) =>
      convertAddressArg(this.txBlock, recipient)
    );
    recipientObjects.forEach((address, index) => {
      this.txBlock.transferObjects([splitedCoins[index]], address as any);
    });
    this.txBlock.transferObjects(
      [mergedCoin],
      convertAddressArg(this.txBlock, sender) as any
    );
    return this;
  }

  transferCoin(
    coins: SuiObjectArg[],
    sender: SuiAddressArg,
    recipient: SuiAddressArg,
    amount: SuiAmountsArg
  ) {
    return this.transferCoinToMany(coins, sender, [recipient], [amount]);
  }

  stakeSui(amount: SuiAmountsArg, validatorAddr: SuiAddressArg) {
    const [stakeCoin] = this.txBlock.splitCoins(
      this.txBlock.gas,
      convertAmounts(this.txBlock, [amount])
    );
    return this.txBlock.moveCall({
      target: '0x3::sui_system::request_add_stake',
      arguments: convertArgs(this.txBlock, [
        this.txBlock.object(SUI_SYSTEM_STATE_OBJECT_ID),
        stakeCoin,
        convertAddressArg(this.txBlock, validatorAddr),
      ]),
    });
  }
}

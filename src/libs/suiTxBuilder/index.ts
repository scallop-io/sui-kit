import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_SYSTEM_STATE_OBJECT_ID } from '@mysten/sui.js/utils';
import { convertArgs, convertAddressArg, convertObjArg } from './util';
import type { SuiClient, SuiObjectRef } from '@mysten/sui.js/client';
import type { TransactionObjectArgument } from '@mysten/sui.js/transactions';
import type {
  TransactionExpiration,
  SharedObjectRef,
} from '@mysten/sui.js/bcs';
import type { Keypair } from '@mysten/sui.js/cryptography';
import type {
  ObjectCallArg,
  TransactionType,
  SuiTxArg,
  SuiAddressArg,
  SuiObjectArg,
  SuiVecTxArg,
} from 'src/types';

export class SuiTxBlock {
  public txBlock: TransactionBlock;

  constructor(transaction?: TransactionBlock) {
    this.txBlock = new TransactionBlock(transaction);
  }

  /* Directly wrap methods and properties of TransactionBlock */
  get gas() {
    return this.txBlock.gas;
  }
  get blockData() {
    return this.txBlock.blockData;
  }

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
  serialize() {
    return this.txBlock.serialize();
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
  add(...args: TransactionType) {
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
  upgrade({
    modules,
    dependencies,
    packageId,
    ticket,
  }: {
    modules: number[][] | string[];
    dependencies: string[];
    packageId: string;
    ticket: TransactionObjectArgument | string;
  }) {
    return this.txBlock.upgrade({ modules, dependencies, packageId, ticket });
  }
  makeMoveVec({
    objects,
    type,
  }: {
    objects: (TransactionObjectArgument | string)[];
    type?: string;
  }) {
    return this.txBlock.makeMoveVec({ objects, type });
  }

  /* Override methods of TransactionBlock */

  transferObjects(objects: SuiObjectArg[], address: SuiAddressArg) {
    return this.txBlock.transferObjects(
      objects.map((object) => convertObjArg(this.txBlock, object)),
      convertAddressArg(this.txBlock, address)
    );
  }

  splitCoins(coin: SuiObjectArg, amounts: SuiTxArg[]) {
    const res = this.txBlock.splitCoins(
      convertObjArg(this.txBlock, coin),
      convertArgs(this.txBlock, amounts)
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

  transferSuiToMany(recipients: SuiAddressArg[], amounts: SuiTxArg[]) {
    // require recipients.length === amounts.length
    if (recipients.length !== amounts.length) {
      throw new Error(
        'transferSuiToMany: recipients.length !== amounts.length'
      );
    }
    const coins = this.txBlock.splitCoins(
      this.txBlock.gas,
      convertArgs(this.txBlock, amounts)
    );
    const recipientObjects = recipients.map((recipient) =>
      convertAddressArg(this.txBlock, recipient)
    );
    recipientObjects.forEach((address, index) => {
      this.txBlock.transferObjects([coins[index]], address);
    });
    return this;
  }

  transferSui(address: SuiAddressArg, amount: SuiTxArg) {
    return this.transferSuiToMany([address], [amount]);
  }

  takeAmountFromCoins(coins: SuiObjectArg[], amount: SuiTxArg) {
    const coinObjects = coins.map((coin) => convertObjArg(this.txBlock, coin));
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      this.txBlock.mergeCoins(mergedCoin, coinObjects.slice(1));
    }
    const [sendCoin] = this.txBlock.splitCoins(
      mergedCoin,
      convertArgs(this.txBlock, [amount])
    );
    return [sendCoin, mergedCoin];
  }

  splitSUIFromGas(amounts: SuiTxArg[]) {
    return this.txBlock.splitCoins(
      this.txBlock.gas,
      convertArgs(this.txBlock, amounts)
    );
  }

  splitMultiCoins(coins: SuiObjectArg[], amounts: SuiTxArg[]) {
    const coinObjects = coins.map((coin) => convertObjArg(this.txBlock, coin));
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      this.txBlock.mergeCoins(mergedCoin, coinObjects.slice(1));
    }
    const splitedCoins = this.txBlock.splitCoins(
      mergedCoin,
      convertArgs(this.txBlock, amounts)
    );
    return { splitedCoins, mergedCoin };
  }

  transferCoinToMany(
    coins: SuiObjectArg[],
    sender: SuiAddressArg,
    recipients: SuiAddressArg[],
    amounts: SuiTxArg[]
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
      amounts
    );
    const recipientObjects = recipients.map((recipient) =>
      convertAddressArg(this.txBlock, recipient)
    );
    recipientObjects.forEach((address, index) => {
      this.txBlock.transferObjects([splitedCoins[index]], address);
    });
    this.txBlock.transferObjects(
      [mergedCoin],
      convertAddressArg(this.txBlock, sender)
    );
    return this;
  }

  transferCoin(
    coins: SuiObjectArg[],
    sender: SuiAddressArg,
    recipient: SuiAddressArg,
    amount: SuiTxArg
  ) {
    return this.transferCoinToMany(coins, sender, [recipient], [amount]);
  }

  stakeSui(amount: SuiTxArg, validatorAddr: SuiAddressArg) {
    const [stakeCoin] = this.txBlock.splitCoins(
      this.txBlock.gas,
      convertArgs(this.txBlock, [amount])
    );
    return this.txBlock.moveCall({
      target: '0x3::sui_system::request_add_stake',
      arguments: convertArgs(this.txBlock, [
        SUI_SYSTEM_STATE_OBJECT_ID,
        stakeCoin,
        validatorAddr,
      ]),
    });
  }
}

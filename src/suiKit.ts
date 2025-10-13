/**
 * @description This file is used to aggregate the tools that used to interact with SUI network.
 */
import { Transaction } from '@mysten/sui/transactions';
import { SuiAccountManager } from './libs/suiAccountManager';
import { SuiTxBlock } from './libs/suiTxBuilder';
import { SuiInteractor } from './libs/suiInteractor';
import type {
  SuiTransactionBlockResponse,
  DevInspectResults,
  SuiObjectDataOptions,
  DryRunTransactionBlockResponse,
} from '@mysten/sui/client';
import type { SuiSharedObject, SuiOwnedObject } from './libs/suiModel';
import type {
  SuiKitParams,
  DerivePathParams,
  SuiTxArg,
  SuiVecTxArg,
  SuiKitReturnType,
  SuiObjectArg,
} from './types';

/**
 * @class SuiKit
 * @description This class is used to aggregate the tools that used to interact with SUI network.
 */
export class SuiKit {
  public accountManager: SuiAccountManager;
  public suiInteractor: SuiInteractor;

  /**
   * Support the following ways to init the SuiToolkit:
   * 1. mnemonics
   * 2. secretKey (base64 or hex)
   * If none of them is provided, will generate a random mnemonics with 24 words.
   *
   * @param mnemonics, 12 or 24 mnemonics words, separated by space
   * @param secretKey, base64 or hex string or bech32, when mnemonics is provided, secretKey will be ignored
   * @param networkType, 'testnet' | 'mainnet' | 'devnet' | 'localnet', default is 'mainnet'
   * @param fullnodeUrls, the fullnode url, default is the preconfig fullnode url for the given network type
   */
  constructor(params: SuiKitParams) {
    const { mnemonics, secretKey } = params;
    // Init the account manager
    this.accountManager = new SuiAccountManager({ mnemonics, secretKey });
    // Init the SuiInteractor
    this.suiInteractor = new SuiInteractor(params);
  }

  /**
   * Create SuiTxBlock with sender set to the current signer
   * @returns SuiTxBlock with sender set to the current signer
   */
  createTxBlock(): SuiTxBlock {
    const txb = new SuiTxBlock();
    txb.setSender(this.accountManager.currentAddress);
    return txb;
  }

  /**
   * if derivePathParams is not provided or mnemonics is empty, it will return the keypair.
   * else:
   * it will generate signer from the mnemonic with the given derivePathParams.
   * @param derivePathParams, such as { accountIndex: 2, isExternal: false, addressIndex: 10 }, comply with the BIP44 standard
   */
  getKeypair(derivePathParams?: DerivePathParams) {
    return this.accountManager.getKeyPair(derivePathParams);
  }

  /**
   * @description Switch the current account with the given derivePathParams
   * @param derivePathParams, such as { accountIndex: 2, isExternal: false, addressIndex: 10 }, comply with the BIP44 standard
   */
  switchAccount(derivePathParams: DerivePathParams) {
    this.accountManager.switchAccount(derivePathParams);
  }

  /**
   * @description Get the address of the account for the given derivePathParams
   * @param derivePathParams, such as { accountIndex: 2, isExternal: false, addressIndex: 10 }, comply with the BIP44 standard
   */
  getAddress(derivePathParams?: DerivePathParams) {
    return this.accountManager.getAddress(derivePathParams);
  }

  get currentAddress() {
    return this.accountManager.currentAddress;
  }

  async getBalance(coinType?: string, derivePathParams?: DerivePathParams) {
    const owner = this.accountManager.getAddress(derivePathParams);
    return this.suiInteractor.currentClient.getBalance({ owner, coinType });
  }

  get client() {
    return this.suiInteractor.currentClient;
  }

  async getObjects(
    objectIds: string[],
    options?: SuiObjectDataOptions & {
      batchSize?: number;
      switchClientDelay?: number;
    }
  ) {
    return this.suiInteractor.getObjects(objectIds, options);
  }

  /**
   * @description Update objects in a batch
   * @param suiObjects
   */
  async updateObjects(suiObjects: (SuiSharedObject | SuiOwnedObject)[]) {
    return this.suiInteractor.updateObjects(suiObjects);
  }

  async signTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ) {
    if (tx instanceof SuiTxBlock) {
      tx.setSender(this.getAddress(derivePathParams));
    }
    const txBlock = tx instanceof SuiTxBlock ? tx.txBlock : tx;
    const txBytes =
      txBlock instanceof Transaction
        ? await txBlock.build({ client: this.client })
        : txBlock;
    const keyPair = this.getKeypair(derivePathParams);
    return await keyPair.signTransaction(txBytes);
  }

  async signAndSendTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse> {
    const { bytes, signature } = await this.signTxn(tx, derivePathParams);
    return this.suiInteractor.sendTx(bytes, signature);
  }

  async dryRunTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ): Promise<DryRunTransactionBlockResponse> {
    if (tx instanceof SuiTxBlock) {
      tx.setSender(this.getAddress(derivePathParams));
    }
    const txBlock = tx instanceof SuiTxBlock ? tx.txBlock : tx;
    const txBytes =
      txBlock instanceof Transaction
        ? await txBlock.build({ client: this.client })
        : txBlock;
    return this.suiInteractor.dryRunTx(txBytes);
  }

  /**
   * Transfer the given amount of SUI to the recipient
   * @param recipient
   * @param amount
   * @param derivePathParams
   */
  async transferSui(
    recipient: string,
    amount: number,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
  async transferSui<S extends boolean>(
    recipient: string,
    amount: number,
    sign?: S,
    derivePathParams?: DerivePathParams
  ): Promise<SuiKitReturnType<S>>;
  async transferSui<S extends boolean>(
    recipient: string,
    amount: number,
    sign: S = true as S,
    derivePathParams?: DerivePathParams
  ) {
    const tx = new SuiTxBlock();
    tx.transferSui(recipient, amount);
    return sign
      ? ((await this.signAndSendTxn(
          tx,
          derivePathParams
        )) as SuiKitReturnType<S>)
      : (tx as SuiKitReturnType<S>);
  }

  /**
   * Transfer to mutliple recipients
   * @param recipients the recipients addresses
   * @param amounts the amounts of SUI to transfer to each recipient, the length of amounts should be the same as the length of recipients
   * @param derivePathParams
   */
  async transferSuiToMany(
    recipients: string[],
    amounts: number[],
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
  async transferSuiToMany<S extends boolean>(
    recipients: string[],
    amounts: number[],
    sign?: S,
    derivePathParams?: DerivePathParams
  ): Promise<SuiKitReturnType<S>>;
  async transferSuiToMany<S extends boolean>(
    recipients: string[],
    amounts: number[],
    sign: S = true as S,
    derivePathParams?: DerivePathParams
  ) {
    const tx = new SuiTxBlock();
    tx.transferSuiToMany(recipients, amounts);
    return sign
      ? ((await this.signAndSendTxn(
          tx,
          derivePathParams
        )) as SuiKitReturnType<S>)
      : (tx as SuiKitReturnType<S>);
  }

  /**
   * Transfer the given amounts of coin to multiple recipients
   * @param recipients the list of recipient address
   * @param amounts the amounts to transfer for each recipient
   * @param coinType any custom coin type but not SUI
   * @param derivePathParams the derive path params for the current signer
   */
  async transferCoinToMany(
    recipients: string[],
    amounts: number[],
    coinType: string,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
  async transferCoinToMany<S extends boolean>(
    recipients: string[],
    amounts: number[],
    coinType: string,
    sign?: S,
    derivePathParams?: DerivePathParams
  ): Promise<SuiKitReturnType<S>>;
  async transferCoinToMany<S extends boolean>(
    recipients: string[],
    amounts: number[],
    coinType: string,
    sign: S = true as S,
    derivePathParams?: DerivePathParams
  ) {
    const tx = new SuiTxBlock();
    const owner = this.accountManager.getAddress(derivePathParams);
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    const coins = await this.suiInteractor.selectCoins(
      owner,
      totalAmount,
      coinType
    );
    tx.transferCoinToMany(
      coins.map((c) => c.objectId),
      owner,
      recipients,
      amounts
    );
    return sign
      ? ((await this.signAndSendTxn(
          tx,
          derivePathParams
        )) as SuiKitReturnType<S>)
      : (tx as SuiKitReturnType<S>);
  }

  async transferCoin(
    recipient: string,
    amount: number,
    coinType: string,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
  async transferCoin<S extends boolean>(
    recipient: string,
    amount: number,
    coinType: string,
    sign?: S,
    derivePathParams?: DerivePathParams
  ): Promise<SuiKitReturnType<S>>;
  async transferCoin<S extends boolean>(
    recipient: string,
    amount: number,
    coinType: string,
    sign: S = true as S,
    derivePathParams?: DerivePathParams
  ) {
    return this.transferCoinToMany(
      [recipient],
      [amount],
      coinType,
      sign,
      derivePathParams
    );
  }

  async transferObjects(
    objects: SuiObjectArg[],
    recipient: string,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
  async transferObjects<S extends boolean>(
    objects: SuiObjectArg[],
    recipient: string,
    sign?: S,
    derivePathParams?: DerivePathParams
  ): Promise<SuiKitReturnType<S>>;
  async transferObjects<S extends boolean>(
    objects: SuiObjectArg[],
    recipient: string,
    sign: S = true as S,
    derivePathParams?: DerivePathParams
  ) {
    const tx = new SuiTxBlock();
    tx.transferObjects(objects, recipient);
    return sign ? await this.signAndSendTxn(tx, derivePathParams) : tx;
  }

  async moveCall(callParams: {
    target: string;
    arguments?: (SuiTxArg | SuiVecTxArg)[];
    typeArguments?: string[];
    derivePathParams?: DerivePathParams;
  }) {
    const {
      target,
      arguments: args = [],
      typeArguments = [],
      derivePathParams,
    } = callParams;
    const tx = new SuiTxBlock();
    tx.moveCall(target, args, typeArguments);
    return this.signAndSendTxn(tx, derivePathParams);
  }

  /**
   * Select coins with the given amount and coin type, the total amount is greater than or equal to the given amount
   * @param amount
   * @param coinType
   * @param owner
   */
  async selectCoinsWithAmount(
    amount: number,
    coinType: string,
    owner?: string
  ) {
    owner = owner || this.accountManager.currentAddress;
    const coins = await this.suiInteractor.selectCoins(owner, amount, coinType);
    return coins;
  }

  /**
   * stake the given amount of SUI to the validator
   * @param amount the amount of SUI to stake
   * @param validatorAddr the validator address
   * @param sign whether to sign and send the transaction, default is true
   * @param derivePathParams the derive path params for the current signer
   */
  async stakeSui(
    amount: number,
    validatorAddr: string,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
  async stakeSui<S extends boolean>(
    amount: number,
    validatorAddr: string,
    sign?: S,
    derivePathParams?: DerivePathParams
  ): Promise<SuiKitReturnType<S>>;
  async stakeSui<S extends boolean>(
    amount: number,
    validatorAddr: string,
    sign: S = true as S,
    derivePathParams?: DerivePathParams
  ) {
    const tx = new SuiTxBlock();
    tx.stakeSui(amount, validatorAddr);
    return sign
      ? ((await this.signAndSendTxn(
          tx,
          derivePathParams
        )) as SuiKitReturnType<S>)
      : (tx as SuiKitReturnType<S>);
  }

  /**
   * Execute the transaction with on-chain data but without really submitting. Useful for querying the effects of a transaction.
   * Since the transaction is not submitted, its gas cost is not charged.
   * @param tx the transaction to execute
   * @param derivePathParams the derive path params
   * @returns the effects and events of the transaction, such as object changes, gas cost, event emitted.
   */
  async inspectTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ): Promise<DevInspectResults> {
    const txBlock = tx instanceof SuiTxBlock ? tx.txBlock : tx;
    return this.suiInteractor.currentClient.devInspectTransactionBlock({
      transactionBlock: txBlock,
      sender: this.getAddress(derivePathParams),
    });
  }
}

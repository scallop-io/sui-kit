/**
 * @file src.ts
 * @description This file is used to aggregate the tools that used to interact with SUI network.
 * @author IceFox
 * @version 0.1.0
 */
import { RawSigner, TransactionBlock, DevInspectResults, SuiTransactionBlockResponse } from '@mysten/sui.js';
import { SuiAccountManager, DerivePathParams } from "./sui-account-manager";
import { SuiRpcProvider, NetworkType } from './sui-rpc-provider';
import { SuiTxBlock, SuiTxArg, SuiVecTxArg } from "./sui-tx-builder";

export type SuiKitParams = {
  mnemonics?: string;
  secretKey?: string;
  fullnodeUrl?: string;
  faucetUrl?: string;
  networkType?: NetworkType;
}
/**
 * @class SuiKit
 * @description This class is used to aggregate the tools that used to interact with SUI network.
 */
export class SuiKit {

  public accountManager: SuiAccountManager;
  public rpcProvider: SuiRpcProvider;

  /**
   * Support the following ways to init the SuiToolkit:
   * 1. mnemonics
   * 2. secretKey (base64 or hex)
   * If none of them is provided, will generate a random mnemonics with 24 words.
   *
   * @param mnemonics, 12 or 24 mnemonics words, separated by space
   * @param secretKey, base64 or hex string, when mnemonics is provided, secretKey will be ignored
   * @param networkType, 'testnet' | 'mainnet' | 'devnet' | 'localhost', default is 'devnet'
   * @param fullnodeUrl, the fullnode url, default is the preconfig fullnode url for the given network type
   * @param faucetUrl, the faucet url, default is the preconfig faucet url for the given network type
   */
  constructor({ mnemonics, secretKey, networkType, fullnodeUrl, faucetUrl }: SuiKitParams = {}) {
    // Init the account manager
    this.accountManager = new SuiAccountManager({ mnemonics, secretKey });
    // Init the rpc provider
    this.rpcProvider = new SuiRpcProvider({ fullnodeUrl, faucetUrl, networkType });
  }

  /**
   * if derivePathParams is not provided or mnemonics is empty, it will return the currentSigner.
   * else:
   * it will generate signer from the mnemonic with the given derivePathParams.
   * @param derivePathParams, such as { accountIndex: 2, isExternal: false, addressIndex: 10 }, comply with the BIP44 standard
   */
  getSigner(derivePathParams?: DerivePathParams) {
    const keyPair = this.accountManager.getKeyPair(derivePathParams);
    return new RawSigner(keyPair, this.rpcProvider.provider);
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
  currentAddress() { return this.accountManager.currentAddress }
  
  provider() { return this.rpcProvider.provider }

  /**
   * Request some SUI from faucet
   * @Returns {Promise<boolean>}, true if the request is successful, false otherwise.
   */
  async requestFaucet(derivePathParams?: DerivePathParams) {
    const addr = this.accountManager.getAddress(derivePathParams);
    return this.rpcProvider.requestFaucet(addr);
  }

  async getBalance(coinType?: string, derivePathParams?: DerivePathParams) {
    const owner = this.accountManager.getAddress(derivePathParams);
    return this.rpcProvider.getBalance(owner, coinType);
  }

  async getObjects(objectIds: string[]) {
    return this.rpcProvider.getObjects(objectIds);
  }

  async signTxn(tx: Uint8Array | TransactionBlock | SuiTxBlock, derivePathParams?: DerivePathParams) {
    tx = tx instanceof SuiTxBlock ? tx.txBlock : tx;
    const signer = this.getSigner(derivePathParams);
    return signer.signTransactionBlock({ transactionBlock: tx });
  }

  async signAndSendTxn(tx: Uint8Array | TransactionBlock | SuiTxBlock, derivePathParams?: DerivePathParams): Promise<SuiTransactionBlockResponse> {
    tx = tx instanceof SuiTxBlock ? tx.txBlock : tx;
    const signer = this.getSigner(derivePathParams);
    return signer.signAndExecuteTransactionBlock({ transactionBlock: tx, options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
    }})
  }

  /**
   * Transfer the given amount of SUI to the recipient
   * @param recipient
   * @param amount
   * @param derivePathParams
   */
  async transferSui(recipient: string, amount: number, derivePathParams?: DerivePathParams) {
    const tx = new SuiTxBlock();
    tx.transferSui(recipient, amount);
    return this.signAndSendTxn(tx, derivePathParams);
  }

  /**
   * Transfer to mutliple recipients
   * @param recipients the recipients addresses
   * @param amounts the amounts of SUI to transfer to each recipient, the length of amounts should be the same as the length of recipients
   * @param derivePathParams
   */
  async transferSuiToMany(recipients: string[], amounts: number[], derivePathParams?: DerivePathParams) {
    const tx = new SuiTxBlock();
    tx.transferSuiToMany(recipients, amounts);
    return this.signAndSendTxn(tx, derivePathParams);
  }

  /**
   * Transfer the given amounts of coin to multiple recipients
   * @param recipients the list of recipient address
   * @param amounts the amounts to transfer for each recipient
   * @param coinType any custom coin type but not SUI
   * @param derivePathParams the derive path params for the current signer
   */
  async transferCoinToMany(recipients: string[], amounts: number[], coinType: string, derivePathParams?: DerivePathParams) {
    const tx = new SuiTxBlock();
    const owner = this.accountManager.getAddress(derivePathParams);
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    const coins = await this.rpcProvider.selectCoins(owner, totalAmount, coinType);
    tx.transferCoinToMany(coins.map(c => c.objectId), owner, recipients, amounts);
    return this.signAndSendTxn(tx, derivePathParams);
  }
  
  async transferCoin(recipient: string, amount: number, coinType: string, derivePathParams?: DerivePathParams) {
    return this.transferCoinToMany([recipient], [amount], coinType, derivePathParams)
  }
  
  async transferObjects(objects: string[], recipient: string, derivePathParams?: DerivePathParams) {
    const tx = new SuiTxBlock();
    tx.transferObjects(objects, recipient);
    return this.signAndSendTxn(tx, derivePathParams);
  }
  
  async moveCall(callParams: {target: string, arguments?: (SuiTxArg | SuiVecTxArg)[], typeArguments?: string[], derivePathParams?: DerivePathParams}) {
    const { target, arguments: args = [], typeArguments = [], derivePathParams } = callParams;
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
  async selectCoinsWithAmount(amount: number, coinType: string, owner?: string) {
    owner = owner || this.accountManager.currentAddress;
    const coins = await this.rpcProvider.selectCoins(owner, amount, coinType);
    return coins.map(c => c.objectId)
  }

  /**
   * stake the given amount of SUI to the validator
   * @param amount the amount of SUI to stake
   * @param validatorAddr the validator address
   * @param derivePathParams the derive path params for the current signer
   */
  async stakeSui(amount: number, validatorAddr: string, derivePathParams?: DerivePathParams) {
    const tx = new SuiTxBlock();
    tx.stakeSui(amount, validatorAddr);
    return this.signAndSendTxn(tx, derivePathParams);
  }

  /**
   * Execute the transaction with on-chain data but without really submitting. Useful for querying the effects of a transaction.
   * Since the transaction is not submitted, its gas cost is not charged.
   * @param tx the transaction to execute
   * @param derivePathParams the derive path params
   * @returns the effects and events of the transaction, such as object changes, gas cost, event emitted.
   */
  async inspectTxn(tx: Uint8Array | TransactionBlock | SuiTxBlock, derivePathParams?: DerivePathParams): Promise<DevInspectResults> {
    tx = tx instanceof SuiTxBlock ? tx.txBlock : tx;
    return this.rpcProvider.provider.devInspectTransactionBlock({ transactionBlock: tx, sender: this.getAddress(derivePathParams) })
  }
}

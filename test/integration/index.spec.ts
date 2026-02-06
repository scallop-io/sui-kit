import { config as dotenvConfig } from 'dotenv';
import { describe, it, expect } from 'vitest';
import {
  SUI_TYPE_ARG,
  SuiKit,
  SuiTxBlock,
  getFullnodeUrl,
  normalizeStructTag,
} from 'src/index.js';
import { getDerivePathForSUI } from 'src/libs/suiAccountManager/keypair.js';
import type {
  SuiTransactionBlockResponse,
  SimulateTransactionResponse,
} from 'src/index.js';

const ENABLE_LOG = false;

// Helper to check if transaction was successful in v2 SDK response
function isTransactionSuccess(
  result: SuiTransactionBlockResponse | SimulateTransactionResponse
): boolean {
  const tx = result.Transaction ?? result.FailedTransaction;
  return tx?.status?.success === true;
}

dotenvConfig();

describe('Test Scallop Kit with secret key', () => {
  const suiKit = new SuiKit({
    secretKey: process.env.SECRET_KEY,
  });

  it('Test Manage Account', async () => {
    const coinType = '0x2::sui::SUI';
    const currentAddress = suiKit.currentAddress;
    const derivePathParams = {
      accountIndex: 0,
      isExternal: false,
      addressIndex: 0,
    };
    const deriveAddress = suiKit.getAddress(derivePathParams);
    const currentAddressBalance = (await suiKit.getBalance()).balance;
    const deriveAddressBalance = (
      await suiKit.getBalance(coinType, derivePathParams)
    ).balance;
    const currentPrivateKey = suiKit.getKeypair().getSecretKey();

    if (ENABLE_LOG) {
      console.log(
        `Current Account: ${currentAddress} has ${currentAddressBalance} SUI`
      );
      console.log(
        `Account ${getDerivePathForSUI(
          derivePathParams
        )}: ${deriveAddress} has ${deriveAddressBalance} SUI`
      );
      console.log(`Current Account PrivateKey: ${currentPrivateKey}`);
    }

    expect(!!currentAddress).toBe(true);
    expect(!!deriveAddress).toBe(true);
    expect(!!currentPrivateKey).toBe(true);
  });
  it('Test Interactor with Sui: sign and send txn', async () => {
    const tx = new SuiTxBlock();
    tx.setSender(suiKit.currentAddress);
    const signAndSendTxnRes = await suiKit.signAndSendTxn(tx);

    if (ENABLE_LOG) {
      console.log(signAndSendTxnRes);
    }

    expect(isTransactionSuccess(signAndSendTxnRes)).toBe(true);
  });

  it('Test Interactor with Sui: get objects', async () => {
    const objIds = [
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    ];
    const getObjectsRes = await suiKit.getObjects(objIds, {
      include: { content: false },
    });

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length).toBe(objIds.length);
  });

  it('Test Interactor with Sui: get objects with batching', async () => {
    const objIds = [
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    ];
    const getObjectsRes = await suiKit.getObjects(objIds, {
      include: { content: false },
      batchSize: 2,
    });

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length).toBe(objIds.length);
  });

  it('Test Interactor with Sui: select coins', async () => {
    const coinType = '0x2::sui::SUI';
    const coins = await suiKit.selectCoinsWithAmount(10 ** 8, coinType);

    if (ENABLE_LOG) {
      console.log(`Select coins: ${coins}`);
    }

    expect(coins.length > 0).toBe(true);
  });

  it('Test Interactor with Sui: transfer coin', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = suiKit.currentAddress;
    console.log(`Receiver: ${receiver}`);
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoin(receiver, amount, coinType, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test interactor with sui: transfer coin to many', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoinToMany(
      receiver,
      [amount, amount],
      coinType,
      false
    );

    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with Sui: transfer sui', async () => {
    const receiver = suiKit.currentAddress;
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSui(receiver, amount, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with Sui: transfer sui to many', async () => {
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSuiToMany(
      receiver,
      [amount, amount],
      false
    );
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with sui: stake sui', async () => {
    const validatorAddress =
      '0x8ecaf4b95b3c82c712d3ddb22e7da88d2286c4653f3753a86b6f7a216a3ca518';
    const amount = 10 ** 9;
    const tx = await suiKit.stakeSui(
      amount,
      validatorAddress,
      false,
      undefined
    );
    const stakeSuiRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Stake sui response: ${stakeSuiRes}`);
    }

    expect(isTransactionSuccess(stakeSuiRes)).toBe(true);
  });

  it('Test Interactor with sui: transfer object', async () => {
    const objectsResult = await suiKit.client.core.listOwnedObjects({
      owner: suiKit.currentAddress,
      limit: 2,
    });
    const object = objectsResult.objects.find(
      (t) =>
        t.type !==
        normalizeStructTag(
          `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${SUI_TYPE_ARG}>`
        )
    );

    if (!object)
      throw new Error(
        `No object found for wallet address: ${suiKit.currentAddress}`
      );

    const receiver = suiKit.currentAddress;
    const tx = await suiKit.transferObjects([object.objectId], receiver, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });
});

describe('Test Scallop Kit with mnemonics', () => {
  const suiKit = new SuiKit({
    mnemonics: process.env.MNEMONICS,
  });

  it('Test Manage Account', async () => {
    const coinType = '0x2::sui::SUI';
    const currentAddress = suiKit.currentAddress;
    const derivePathParams = {
      accountIndex: 0,
      isExternal: false,
      addressIndex: 0,
    };
    const deriveAddress = suiKit.getAddress(derivePathParams);
    const currentAddressBalance = (await suiKit.getBalance()).balance;
    const deriveAddressBalance = (
      await suiKit.getBalance(coinType, derivePathParams)
    ).balance;
    const currentPrivateKey = suiKit.getKeypair().getSecretKey();

    if (ENABLE_LOG) {
      console.log(
        `Current Account: ${currentAddress} has ${currentAddressBalance} SUI`
      );
      console.log(
        `Account ${getDerivePathForSUI(
          derivePathParams
        )}: ${deriveAddress} has ${deriveAddressBalance} SUI`
      );
      console.log(`Current Account PrivateKey: ${currentPrivateKey}`);
    }

    expect(!!currentAddress).toBe(true);
    expect(!!deriveAddress).toBe(true);
    expect(!!currentPrivateKey).toBe(true);
  });
  it('Test Interactor with Sui: sign and send txn', async () => {
    const tx = new SuiTxBlock();
    tx.setSender(suiKit.currentAddress);
    const signAndSendTxnRes = await suiKit.signAndSendTxn(tx);

    if (ENABLE_LOG) {
      console.log(signAndSendTxnRes);
    }

    expect(isTransactionSuccess(signAndSendTxnRes)).toBe(true);
  });

  it('Test Interactor with Sui: get objects', async () => {
    const objIds = [
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    ];
    const getObjectsRes = await suiKit.getObjects(objIds, {
      include: { content: false },
    });

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length).toBe(objIds.length);
  });

  it('Test Interactor with Sui: get objects with batching', async () => {
    const objIds = [
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    ];
    const getObjectsRes = await suiKit.getObjects(objIds, {
      include: { content: false },
      batchSize: 2,
    });

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length).toBe(objIds.length);
  });

  it('Test Interactor with Sui: select coins', async () => {
    const coinType = '0x2::sui::SUI';
    const coins = await suiKit.selectCoinsWithAmount(10 ** 8, coinType);

    if (ENABLE_LOG) {
      console.log(`Select coins: ${coins}`);
    }

    expect(coins.length > 0).toBe(true);
  });

  it('Test Interactor with Sui: transfer coin', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = suiKit.currentAddress;
    console.log(`Receiver: ${receiver}`);
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoin(receiver, amount, coinType, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test interactor with sui: transfer coin to many', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoinToMany(
      receiver,
      [amount, amount],
      coinType,
      false
    );

    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with Sui: transfer sui', async () => {
    const receiver = suiKit.currentAddress;
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSui(receiver, amount, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with Sui: transfer sui to many', async () => {
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSuiToMany(
      receiver,
      [amount, amount],
      false
    );
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with sui: stake sui', async () => {
    const validatorAddress =
      '0x8ecaf4b95b3c82c712d3ddb22e7da88d2286c4653f3753a86b6f7a216a3ca518';
    const amount = 10 ** 9;
    const tx = await suiKit.stakeSui(
      amount,
      validatorAddress,
      false,
      undefined
    );
    const stakeSuiRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Stake sui response: ${stakeSuiRes}`);
    }

    expect(isTransactionSuccess(stakeSuiRes)).toBe(true);
  });

  it('Test Interactor with sui: transfer object', async () => {
    const objectsResult = await suiKit.client.core.listOwnedObjects({
      owner: suiKit.currentAddress,
      limit: 2,
    });
    const object = objectsResult.objects.find(
      (t) =>
        t.type !==
        normalizeStructTag(
          `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${SUI_TYPE_ARG}>`
        )
    );

    if (!object)
      throw new Error(
        `No object found for wallet address: ${suiKit.currentAddress}`
      );

    const receiver = suiKit.currentAddress;
    const tx = await suiKit.transferObjects([object.objectId], receiver, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });
});

describe('Test Scallop Kit with sui clients', () => {
  const fullnodeUrls = [getFullnodeUrl('mainnet')];
  const suiKit = new SuiKit({
    secretKey: process.env.SECRET_KEY,
    fullnodeUrls,
  });

  it('Test Manage Account', async () => {
    const coinType = '0x2::sui::SUI';
    const currentAddress = suiKit.currentAddress;
    const derivePathParams = {
      accountIndex: 0,
      isExternal: false,
      addressIndex: 0,
    };
    const deriveAddress = suiKit.getAddress(derivePathParams);
    const currentAddressBalance = (await suiKit.getBalance()).balance;
    const deriveAddressBalance = (
      await suiKit.getBalance(coinType, derivePathParams)
    ).balance;
    const currentPrivateKey = suiKit.getKeypair().getSecretKey();

    if (ENABLE_LOG) {
      console.log(
        `Current Account: ${currentAddress} has ${currentAddressBalance} SUI`
      );
      console.log(
        `Account ${getDerivePathForSUI(
          derivePathParams
        )}: ${deriveAddress} has ${deriveAddressBalance} SUI`
      );
      console.log(`Current Account PrivateKey: ${currentPrivateKey}`);
    }

    expect(!!currentAddress).toBe(true);
    expect(!!deriveAddress).toBe(true);
    expect(!!currentPrivateKey).toBe(true);
  });
  it('Test Interactor with Sui: sign and send txn', async () => {
    const tx = new SuiTxBlock();
    tx.setSender(suiKit.currentAddress);
    const signAndSendTxnRes = await suiKit.signAndSendTxn(tx);

    if (ENABLE_LOG) {
      console.log(signAndSendTxnRes);
    }

    expect(isTransactionSuccess(signAndSendTxnRes)).toBe(true);
  });

  it('Test Interactor with Sui: get objects', async () => {
    const objIds = [
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    ];
    const getObjectsRes = await suiKit.getObjects(objIds, {
      include: { content: false },
    });

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length).toBe(objIds.length);
  });

  it('Test Interactor with Sui: get objects with batching', async () => {
    const objIds = [
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    ];
    const getObjectsRes = await suiKit.getObjects(objIds, {
      include: { content: false },
      batchSize: 2,
    });

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length).toBe(objIds.length);
  });

  it('Test Interactor with Sui: select coins', async () => {
    const coinType = '0x2::sui::SUI';
    const coins = await suiKit.selectCoinsWithAmount(10 ** 8, coinType);

    if (ENABLE_LOG) {
      console.log(`Select coins: ${coins}`);
    }

    expect(coins.length > 0).toBe(true);
  });

  it('Test Interactor with Sui: transfer coin', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = suiKit.currentAddress;
    console.log(`Receiver: ${receiver}`);
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoin(receiver, amount, coinType, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test interactor with sui: transfer coin to many', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoinToMany(
      receiver,
      [amount, amount],
      coinType,
      false
    );

    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with Sui: transfer sui', async () => {
    const receiver = suiKit.currentAddress;
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSui(receiver, amount, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with Sui: transfer sui to many', async () => {
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSuiToMany(
      receiver,
      [amount, amount],
      false
    );
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test Interactor with sui: stake sui', async () => {
    const validatorAddress =
      '0x8ecaf4b95b3c82c712d3ddb22e7da88d2286c4653f3753a86b6f7a216a3ca518';
    const amount = 10 ** 9;
    const tx = await suiKit.stakeSui(
      amount,
      validatorAddress,
      false,
      undefined
    );
    const stakeSuiRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Stake sui response: ${stakeSuiRes}`);
    }

    expect(isTransactionSuccess(stakeSuiRes)).toBe(true);
  });

  it('Test Interactor with sui: transfer object', async () => {
    const objectsResult = await suiKit.client.core.listOwnedObjects({
      owner: suiKit.currentAddress,
      limit: 2,
    });
    const object = objectsResult.objects.find(
      (t) =>
        t.type !==
        normalizeStructTag(
          `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${SUI_TYPE_ARG}>`
        )
    );

    if (!object)
      throw new Error(
        `No object found for wallet address: ${suiKit.currentAddress}`
      );

    const receiver = suiKit.currentAddress;
    const tx = await suiKit.transferObjects([object.objectId], receiver, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(isTransactionSuccess(transferCoinsRes)).toBe(true);
  });

  it('Test switching fullnodes', async () => {
    const fullNode = getFullnodeUrl('mainnet');
    suiKit.suiInteractor.switchFullNodes([fullNode]);

    expect(suiKit.suiInteractor.currentFullNode).toEqual(fullNode);
  });
});

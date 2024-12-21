import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { SuiKit, SuiTxBlock, Transaction } from '../src/index';
import { getDerivePathForSUI } from '../src/libs/suiAccountManager/keypair';
import { convertArgs } from 'src/libs/suiTxBuilder/util';

const ENABLE_LOG = false;

dotenv.config();

describe('Test Scallop Kit', () => {
  const fullnodeUrls = [
    'https://fullnode.mainnet.sui.io:443',
    'https://sui-mainnet.public.blastapi.io',
    'https://sui-mainnet-rpc.allthatnode.com',
  ];
  const suiKit = new SuiKit({
    secretKey: process.env.SECRET_KEY,
    // mnemonics: process.env.MNEMONICS,
    fullnodeUrls,
  });

  it('Test Manage Account', async () => {
    const coinType = '0x2::sui::SUI';
    const currentAddress = suiKit.currentAddress();
    const derivePathParams = {
      accountIndex: 0,
      isExternal: false,
      addressIndex: 0,
    };
    const deriveAddress = suiKit.getAddress(derivePathParams);
    const currentAddressBalance = (await suiKit.getBalance()).totalBalance;
    const deriveAddressBalance = (
      await suiKit.getBalance(coinType, derivePathParams)
    ).totalBalance;
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
    tx.setSender(suiKit.currentAddress());
    const signAndSendTxnRes = await suiKit.signAndSendTxn(tx);

    if (ENABLE_LOG) {
      console.log(signAndSendTxnRes);
    }

    expect(signAndSendTxnRes.effects?.status.status === 'success').toBe(true);
  });

  it('Test Interactor with Sui: get objects', async () => {
    const coinType = `0x2::sui::SUI`;
    const coinObjects = await suiKit.selectCoinsWithAmount(1e8, coinType);
    const getObjectsRes = await suiKit.getObjects(
      coinObjects.map(({ objectId }) => objectId)
    );

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length > 0).toBe(true);
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
    const receiver = suiKit.currentAddress();
    console.log(`Receiver: ${receiver}`);
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferCoin(receiver, amount, coinType, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(transferCoinsRes.effects.status.status === 'success').toBe(true);
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

    expect(transferCoinsRes.effects.status.status === 'success').toBe(true);
  });

  it('Test Interactor with Sui: transfer sui', async () => {
    const receiver = suiKit.currentAddress();
    const amount = 10 ** 7; // 0.01 SUI
    const tx = await suiKit.transferSui(receiver, amount, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(transferCoinsRes.effects.status.status === 'success').toBe(true);
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

    expect(transferCoinsRes.effects.status.status === 'success').toBe(true);
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

    expect(stakeSuiRes.effects.status.status === 'success').toBe(true);
  });

  it('Test Interactor with sui: transfer object', async () => {
    const object = (
      await suiKit.client().getOwnedObjects({
        owner: suiKit.currentAddress(),
        limit: 1,
      })
    ).data[0].data;

    if (!object)
      throw new Error(
        `No object found for wallet address: ${suiKit.currentAddress()}`
      );

    const receiver = suiKit.currentAddress();
    const tx = await suiKit.transferObjects([object], receiver, false);
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(transferCoinsRes.effects.status.status === 'success').toBe(true);
  });
});

describe('Test convert args', () => {
  const fullnodeUrls = [
    'https://fullnode.mainnet.sui.io:443',
    'https://sui-mainnet.public.blastapi.io',
    'https://sui-mainnet-rpc.allthatnode.com',
  ];
  const suiKit = new SuiKit({
    secretKey: process.env.SECRET_KEY,
    // mnemonics: process.env.MNEMONICS,
    fullnodeUrls,
  });

  it('Test convert args for Owned Sui Object Data', async () => {
    const objId =
      '0x33305a2e3d3666e9af9ea5d018788405c8fe5ff30f5fd8ea2295e89cfd619459' as const;
    const objectData = (await suiKit.getObjects([objId]))[0];
    expect(!!objectData).toBe(true);

    // try parse with convert args
    const txb = new Transaction();
    // @ts-ignore
    const inputArg = convertArgs(txb, [objectData]);
    expect('Input' in inputArg[0] && inputArg[0].type === 'object').toBe(true);
    if ('Input' in inputArg[0]) {
      expect(
        !!txb.getData().inputs[inputArg[0].Input].Object?.ImmOrOwnedObject
          ?.version
      ).toBe(true);
    }
  });

  it('Test convert args for amount', async () => {
    const amount = '1000000' as const;
    const txb = new Transaction();
    // @ts-ignore
    const inputArg = convertArgs(txb, [amount]);
    expect('Input' in inputArg[0] && inputArg[0].type === 'pure').toBe(true);
  });
});

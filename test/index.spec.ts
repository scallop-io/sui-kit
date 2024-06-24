import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { SuiKit, SuiTxBlock } from '../src/index';
import { getDerivePathForSUI } from '../src/libs/suiAccountManager/keypair';

const ENABLE_LOG = false;

dotenv.config();

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop Kit', async () => {
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

  it.skip('Test Manage Account', async () => {
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
  it.skip('Test Interactor with Sui: sign and send txn', async () => {
    const tx = new SuiTxBlock();
    tx.setSender(suiKit.currentAddress());
    const signAndSendTxnRes = await suiKit.signAndSendTxn(tx);

    if (ENABLE_LOG) {
      console.log(signAndSendTxnRes);
    }

    expect(signAndSendTxnRes.effects?.status.status === 'success').toBe(true);
  });

  it.skip('Test Interactor with Sui: get objects', async () => {
    const coinType = `0x2::sui::SUI`;
    const objectIds = await suiKit.selectCoinsWithAmount(1e8, coinType);
    const getObjectsRes = await suiKit.getObjects(objectIds);

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(getObjectsRes.length > 0).toBe(true);
  });

  it.skip('Test Interactor with Sui: select coins', async () => {
    const coinType = '0x2::sui::SUI';
    const coins = await suiKit.selectCoinsWithAmount(10 ** 8, coinType);

    if (ENABLE_LOG) {
      console.log(`Select coins: ${coins}`);
    }

    expect(coins.length > 0).toBe(true);
  });

  it.skip('Test Interactor with Sui: transfer coin', async () => {
    const coinType = '0x2::sui::SUI';
    const receiver = suiKit.currentAddress();
    console.log(`Receiver: ${receiver}`);
    const amount = 10 ** 9;
    const transferCoinsRes = await suiKit.transferCoin(
      receiver,
      amount,
      coinType
    );

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(!!transferCoinsRes).toBe(true);
  });
  it.skip('Test interactor with usdc: transfer coin to many', async () => {
    const coinType =
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'; // USDC
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 6;
    const transferCoinsRes = await suiKit.transferCoinToMany(
      receiver,
      [amount, amount],
      coinType
    );

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(!!transferCoinsRes).toBe(true);
  });

  it.skip('Test Interactor with Sui: transfer sui', async () => {
    const receiver = suiKit.currentAddress();
    const amount = 10 ** 9;
    const transferCoinsRes = await suiKit.transferSui(receiver, amount);

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(!!transferCoinsRes).toBe(true);
  });
  it.skip('Test Interactor with Sui: transfer sui to many', async () => {
    const receiver = [
      suiKit.accountManager.getAddress({
        accountIndex: 1,
      }),
      suiKit.accountManager.getAddress({
        accountIndex: 2,
      }),
    ];
    const amount = 10 ** 9;
    const transferCoinsRes = await suiKit.transferSuiToMany(receiver, [
      amount,
      amount,
    ]);

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(!!transferCoinsRes).toBe(true);
  });
  it.skip('Test Interactor with sui: stake sui', async () => {
    const validatorAddress =
      '0x8ecaf4b95b3c82c712d3ddb22e7da88d2286c4653f3753a86b6f7a216a3ca518';
    const amount = 10 ** 9;
    const tx = await suiKit.stakeSui(
      amount,
      validatorAddress,
      false,
      undefined
    );
    const transferCoinsRes = await suiKit.inspectTxn(tx); // inspect txn should be enough to check if the txn is valid

    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(transferCoinsRes.effects.status.status === 'success').toBe(true);
  });
  it.skip('Test Interactor with sui: transfer object', async () => {
    const object =
      '0x2382368d7793a3ea13c5f667c06619c9a36d033bbee9147bd6d7e947731f9874'; // adjust to your owned object
    const receiver = suiKit.currentAddress();
    const transferCoinsRes = await suiKit.transferObjects([object], receiver);
    if (ENABLE_LOG) {
      console.log(`Transfer coins response: ${transferCoinsRes}`);
    }

    expect(!!transferCoinsRes).toBe(true);
  });
});

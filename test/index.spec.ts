import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { SuiKit, SuiTxBlock } from '../src/index';
import { getDerivePathForSUI } from '../src/libs/suiAccountManager/keypair';
import { SuiOwnedObject } from '../src/libs/suiModel';

const ENABLE_LOG = true;

dotenv.config();

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop Kit', async () => {
  const fullnodeUrls = [
    'https://api.shinami.com/node/v1/sui_mainnet_af69715eb5088e2eb2000069999a65d8',
    'https://sui-mainnet.blockvision.org/v1/2Sf0z3YB6WWNOcn8HuUWHjdp4Sb',
    'https://fullnode.mainnet.sui.io:443',
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
    const currentPrivateKey = suiKit.getKeypair().export().privateKey;

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
    const gas = new SuiOwnedObject({
      objectId:
        '0x6d8528380c0e91611f674af8ae12a509cd63288607bc07c981a1f15fb7d3a19b',
    });
    await suiKit.updateObjects([gas]);
    tx.moveCall('0x2::sui::getSUI');
    tx.setSender(suiKit.currentAddress());
    tx.setGasPrice(1000);
    tx.setGasPayment([
      { objectId: gas.objectId, version: gas.version!, digest: gas.digest! },
    ]);
    tx.setGasBudget(10 ** 7);
    const signAndSendTxnRes = await suiKit.signAndSendTxn(tx);

    if (ENABLE_LOG) {
      console.log(signAndSendTxnRes);
    }

    expect(!!signAndSendTxnRes).toBe(true);
  });

  it.skip('Test Interactor with Sui: get objects', async () => {
    const getObjectsRes = await suiKit.getObjects([
      '0x6d8528380c0e91611f674af8ae12a509cd63288607bc07c981a1f15fb7d3a19c',
    ]);

    if (ENABLE_LOG) {
      console.info(`Get Objects Response:`);
      console.dir(getObjectsRes);
    }

    expect(!!getObjectsRes).toBe(true);
  });

  it.skip('Test Interactor with Sui: select coins', async () => {
    const coinType = '0x2::sui::SUI';
    const coins = await suiKit.selectCoinsWithAmount(10 * 8, coinType);

    if (ENABLE_LOG) {
      console.log(`Select coins: ${coins}`);
    }

    expect(!!coins).toBe(true);
  });
});

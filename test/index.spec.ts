import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { SuiKit, SuiTxBlock } from '../src/index';
import {SuiOwnedObject} from "../src/libs/suiModel";

dotenv.config();

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop Kit', async () => {
  const fullnodeUrls = [
    'https://api.shinami.com/node/v1/sui_mainnet_af69715eb5088e2eb2000069999a65d8',
    'http://sui-mainnet-rpc.allthatnode.com',
    'https://sui-mainnet-rpc.nodereal.io',
    'https://fullnode.mainnet.sui.io:443/',
  ]
  const suiKit = new SuiKit({
    // secretKey: process.env.SECRET_KEY,
    mnemonics: process.env.MNEMONICS,
    fullnodeUrls,
  });

  it('Manage account', async () => {
    const coinType = '0x2::sui::SUI';
    const addr = suiKit.getAddress({ accountIndex: 0 });
    const balance = (await suiKit.getBalance(coinType, { accountIndex: 0 }))
      .totalBalance;
    console.log(`Account ${0}: ${addr} has ${balance} SUI`);

    expect(!!addr).toBe(true);
  });

  it('use multiple fullnodeUrls', async () => {
    const tx = new SuiTxBlock();
    const gas = new SuiOwnedObject({ objectId: '0x6d8528380c0e91611f674af8ae12a509cd63288607bc07c981a1f15fb7d3a19b' });
    await suiKit.updateObjects([gas]);
    tx.moveCall(
      '0x2::sui::getSUI',
    );
    tx.setSender(suiKit.currentAddress());
    tx.setGasPrice(1000);
    tx.setGasPayment([{ objectId: gas.objectId, version: gas.version!, digest: gas.digest! }]);
    tx.setGasBudget(10 ** 7);
    const res = await suiKit.signAndSendTxn(tx);
    console.log(res)
  });

  it('getObjects', async () => {
    const res = await suiKit.getObjects(['0x6d8528380c0e91611f674af8ae12a509cd63288607bc07c981a1f15fb7d3a19c']);
    console.log(res)
  });
});

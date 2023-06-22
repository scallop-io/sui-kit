import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { SuiKit } from '../src/index';
import { NetworkType } from '../src/index';

dotenv.config();

const NETWORK: NetworkType = 'testnet';

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop Kit', async () => {
  const suiKit = new SuiKit({
    // secretKey: process.env.SECRET_KEY,
    mnemonics: process.env.MNEMONICS,
    networkType: NETWORK,
  });

  it('Manage account', async () => {
    const coinType = '0x2::sui::SUI';
    const addr = suiKit.getAddress({ accountIndex: 0 });
    const balance = (await suiKit.getBalance(coinType, { accountIndex: 0 }))
      .totalBalance;
    console.log(`Account ${0}: ${addr} has ${balance} SUI`);

    expect(!!addr).toBe(true);
  });
});

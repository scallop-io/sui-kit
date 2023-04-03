import { SuiKit } from "../sui-kit";
import * as process from "process";
import dotenv from "dotenv";
import {getShinamiFullNodeUrl} from "../sui-kit/lib/plugins/shinami";
dotenv.config();

(async() => {
  const displayBalance = async (suiKit: SuiKit) => {
    console.log(`balance for account ${suiKit.getAddress()}: ${(await suiKit.getBalance()).totalBalance}`);
  }

  const mnemonics = process.env.MNEMONICS;
  const SHINAMI_KEY = process.env.SHINAMI_KEY || '';
  const shinamiFullnode = getShinamiFullNodeUrl(SHINAMI_KEY);
  const suiKit = new SuiKit({ mnemonics, fullnodeUrl: shinamiFullnode, networkType: 'testnet' });
  const stakeSui = async (accountIndex: number) => {
    suiKit.switchAccount({ accountIndex })
    await displayBalance(suiKit );
    const amountToStake = 10**9;
    // NodeReal address
    const validatorAddress = '0xc64c306856aa14ad8a281e2b54a9a02b742d4485cd677527c377f48a9d12b332';
    console.log(`Stake ${amountToStake} SUI to ${validatorAddress}...`)
    await suiKit.stakeSui(amountToStake, validatorAddress);
    console.log('Stake transaction sent.')

    console.log('Wait 3 seconds for the transaction to be confirmed...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('After stake:');
    await displayBalance(suiKit);
  }
  for(let i = 6; i < 10; i++) {
    await stakeSui(i);
  }
})();

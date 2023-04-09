import { SuiKit } from "../src";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

(async() => {
  const displayBalance = async (suiKit: SuiKit) => {
    console.log(`balance for account ${suiKit.getAddress()}: ${(await suiKit.getBalance()).totalBalance}`);
  }

  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'testnet' });
  const stakeSui = async (accountIndex: number) => {
    suiKit.switchAccount({ accountIndex })
    await displayBalance(suiKit );
    const amountToStake = 10**9;
    // NodeReal address
    const validatorAddress = '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
    console.log(`Stake ${amountToStake} SUI to ${validatorAddress}...`)
    await suiKit.stakeSui(amountToStake, validatorAddress);
    console.log('Stake transaction sent.')

    console.log('Wait 10 seconds for the transaction to be confirmed...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('After stake:');
    await displayBalance(suiKit);
  }
  // Stake SUI for accounts from 1 to 9
  for(let i = 0; i < 10; i++) {
    console.log(`Stake SUI for account ${i}`);
    await stakeSui(i);
  }
})();

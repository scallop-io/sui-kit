/**
 * This is an example of using SuiKit to transfer custom coin from one account to another.
 */
import { SuiKit } from "../src";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

(async() => {
  const displayBalance = async (suiKit: SuiKit, accountIndex: number, coinType: string) => {
    console.log(`balance for account ${accountIndex}: ${(await suiKit.getBalance(coinType, { accountIndex } )).totalBalance}`);
  }

  const coinType = '0x88a66d984ade7c7f106e0c6a91cffa58b764811233363e6020978da3d358d9c4::custom_coin::CUSTOM_COIN';

  // Account that will receive SUI
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  await displayBalance(suiKit, 0, coinType);
  await displayBalance(suiKit, 1, coinType);

  console.log(`Transfer 100 coin from account0 to account1`);
  const recipient = suiKit.getAddress({ accountIndex: 1 });
  const amount = 100;
  await suiKit.transferCoin(recipient, amount, coinType, { accountIndex: 0 });

  console.log('Wait 3 seconds for the transaction to be confirmed...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('After transfer:');
  await displayBalance(suiKit, 0, coinType);
  await displayBalance(suiKit, 1, coinType);
})();

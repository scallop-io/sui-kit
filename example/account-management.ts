import * as dotenv from 'dotenv';
import { SuiKit } from '../src';
import {getShinamiFullNodeUrl} from "../src/lib/plugins/shinami";
dotenv.config();

async function checkAccounts(suiKit: SuiKit, start: number = 0, end: number = 10) {
  const displayAccounts = async (suiKit: SuiKit, accountIndex: number) => {
    const coinType = '0x2::sui::SUI';
    const addr = suiKit.getAddress({accountIndex});
    console.log(`Account ${accountIndex}: ${addr}`);
    // const balance = (await suiKit.getBalance(coinType, {accountIndex})).totalBalance;
    // console.log(`Account ${accountIndex}: ${addr} has ${balance} SUI`);
  }
  // log the first 10 accounts
  for (let i = start; i <= end; i++) {
    await displayAccounts(suiKit, i);
  }
}

async function internalTransferSui(suiKit: SuiKit, fromAccountIndex: number, toAccountIndex: number, amount: number) {
  const toAddr = suiKit.getAddress({accountIndex: toAccountIndex });
  console.log(`Transfer ${amount} SUI from account ${fromAccountIndex} to account ${toAccountIndex}`);
  return await suiKit.transferSui(toAddr, amount,  {accountIndex: fromAccountIndex});
}

(async () => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'testnet' });
  await checkAccounts(suiKit);
  // // transfer 0.05 SUI to accounts from 1 to 8
  // const range = (start: number, end: number) => Array.from({length: (end - start + 1)}, (v, k) => k + start);
  // const recipients = range(1, 8).map(i => suiKit.getAddress({accountIndex: i}));
  // const amounts = range(1, 8).map(i => 5 * 10**7);
  // console.log('Transfer 0.05 SUI to accounts from 1 to 8');
  // await suiKit.transferSuiToMany(recipients, amounts, {accountIndex: 0});
  // console.log('Transfer done'.green);
  // // wait for the transaction to be confirmed
  // console.log('Wait 3 seconds for the transaction to be confirmed...');
  // await new Promise(resolve => setTimeout(resolve, 3000));
  // await checkAccounts(suiKit);
})();

import * as dotenv from 'dotenv';
import { SuiKit } from '../src';
dotenv.config();

async function checkAccounts(suiKit: SuiKit, start: number = 0, end: number = 10) {
  const displayAccounts = async (suiKit: SuiKit, accountIndex: number) => {
    const coinType = '0x2::sui::SUI';
    const addr = suiKit.getAddress({accountIndex});
    const balance = (await suiKit.getBalance(coinType, {accountIndex})).totalBalance;
    console.log(`Account ${accountIndex}: ${addr} has ${balance} SUI`);
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
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  await checkAccounts(suiKit, 0, 10);
})();

import * as dotenv from 'dotenv';
import { SuiKit } from '@scallop-io/sui-kit';
dotenv.config();

const displayAccounts = async (suiKit: SuiKit, accountIndex: number) => {
  const coinType = '0x2::sui::SUI';
  const addr = suiKit.getAddress({accountIndex});
  const balance = (await suiKit.getBalance(coinType, {accountIndex})).totalBalance;
  console.log(`Account ${accountIndex}: ${addr} has ${balance} SUI`);
}

async function internalTransferSui(suiKit: SuiKit, fromAccountIndex: number, toAccountIndex: number, amount: number) {
  const toAddr = suiKit.getAddress({accountIndex: toAccountIndex });
  console.log(`Transfer ${amount} SUI from account ${fromAccountIndex} to account ${toAccountIndex}`);
  return await suiKit.transferSui(toAddr, amount,  {accountIndex: fromAccountIndex});
}

(async () => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics });
  // log the first 10 accounts
  for (let i = 0; i <= 9; i++) {
    await displayAccounts(suiKit, i);
  }
})();

/**
 * This example shows how to use programmable transaction with SuiKit
 */

import * as dotenv from 'dotenv';
import { SuiKit, TransactionBlock } from '../src';
dotenv.config();

(async () => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  // we use account 0 to send coins to other accounts
  suiKit.switchAccount({ accountIndex: 0 });

  // build a transaction block to send coins to accounts 1-10
  const tx = new TransactionBlock();
  for(let i = 1; i <= 10; i++) {
    const recipient = suiKit.getAddress({ accountIndex: i });
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(1000)]);
    tx.transferObjects([coin], tx.pure(recipient));
  }

  // send the transaction block
  const response = await suiKit.signAndSendTxn(tx)
  console.log('Transaction digest: ' + response.digest);
})();

import dotenv from 'dotenv';
import { SuiKit } from '../sui-kit';
dotenv.config();

(async () => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'testnet' });
  await suiKit.requestFaucet({ accountIndex: 9 });
})()

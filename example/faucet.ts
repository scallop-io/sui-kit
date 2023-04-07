import * as dotenv from 'dotenv';
import { SuiKit } from '../src';
dotenv.config();

(async () => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  await suiKit.requestFaucet({ accountIndex: 9 });
})()

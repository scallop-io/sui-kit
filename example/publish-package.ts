/**
 * This is an example of using SuiKit to publish a move package
 */
import path from "path";
import dotenv from "dotenv";
import { SuiKit } from "../src";
dotenv.config();

(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'testnet' });
  const balance = await suiKit.getBalance();
  if (balance.totalBalance <= 3000) {
    await suiKit.requestFaucet();
  }
  // Wait for 3 seconds before publish package
  await new Promise(resolve => setTimeout(() => resolve(true), 3000));

  const packagePath = path.join(__dirname, './sample_move/custom_coin');
  const result = await suiKit.publishPackage(packagePath);
  console.log('packageId: ' + result.packageId);
})();

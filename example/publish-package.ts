/**
 * This is an example of using SuiKit to publish a move package
 */
import * as path from "path";
import * as dotenv from "dotenv";
import { SuiKit } from "../src";
import { SuiPackagePublisher } from "../src/lib/sui-package-publisher";
dotenv.config();

(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  const balance = await suiKit.getBalance();
  if (balance.totalBalance <= 3000) {
    await suiKit.requestFaucet();
  }
  // Wait for 3 seconds before publish package
  await new Promise(resolve => setTimeout(() => resolve(true), 3000));

  const packagePath = path.join(__dirname, './sample_move/package_a');
  const publisher = new SuiPackagePublisher();
  const result = await publisher.publishPackage(packagePath, suiKit.getSigner());
  console.log('packageId: ' + result.packageId);
})();

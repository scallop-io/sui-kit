/**
 * This is an example of using SuiKit to upgrade a move package
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
  if (parseInt(balance.totalBalance) <= 3000) {
    await suiKit.requestFaucet();
  }
  // Wait for 3 seconds before publish package
  await new Promise(resolve => setTimeout(() => resolve(true), 3000));

  const oldPkgId = '0x733b3e35184e00803e957b98721fabac669306b4eba92a72b2c39bfbe365ff24';
  const upgradeCapId = '0xd09e2415f74a6b090387951a0297fdae72745fb0249e7e7029a9d0eafe2cab23';
  const packagePath = path.join(__dirname, './sample_move/package_a_upgrade');
  const publisher = new SuiPackagePublisher();
  const result = await publisher.upgradePackage(packagePath, upgradeCapId, { skipFetchLatestGitDeps: true });
  console.log(result);
})();

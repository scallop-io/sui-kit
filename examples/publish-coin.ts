/**
 * This is an example of using SuiKit to publish a move package
 */
import * as path from "path";
import * as dotenv from "dotenv";
import { SuiKit } from "@scallop-dao/sui-kit";
import { SuiPackagePublisher } from "@scallop-dao/sui-package-kit";
dotenv.config();

const mnemonics = process.env.MNEMONICS;
const suiKit = new SuiKit({ mnemonics });
const publisher = new SuiPackagePublisher();
const packagePath = path.join(__dirname, './sample_move/custom_coin');
publishPackage(suiKit, publisher, packagePath).then(() => {});

async function publishPackage(suiKit: SuiKit, packagePublisher: SuiPackagePublisher, packagePath: string) {
  const publisher = new SuiPackagePublisher();
  const signer = suiKit.getSigner();
  const result = await publisher.publishPackage(packagePath, signer);
  console.log('packageId: ' + result.packageId);
}

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
const packagePath = path.join(__dirname, './sample_move/package_a');
publishPackage(suiKit, publisher, packagePath).then(() => {});

const upgradeCapId = '0xf74564461b31f58009770c1aa33fba85867f9807f67ecd73bb440d3b4bc29ab6';
const upgradePackagePath = path.join(__dirname, './sample_move/package_a_upgrade');
// upgradePackage(publisher, upgradePackagePath, upgradeCapId).then(() => {});

async function publishPackage(suiKit: SuiKit, packagePublisher: SuiPackagePublisher, packagePath: string) {
  const publisher = new SuiPackagePublisher();
  const signer = suiKit.getSigner();
  const result = await publisher.publishPackage(packagePath, signer);
  console.log('packageId: ' + result.packageId);
}

async function upgradePackage(packagePublisher: SuiPackagePublisher, packagePath: string, upgradeCapId: string) {
  const result = await publisher.upgradePackage(packagePath, upgradeCapId);
  console.log(result);
}

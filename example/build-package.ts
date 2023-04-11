/**
 * This is an example of using SuiKit to build a move package
 */
import * as path from "path";
import * as dotenv from "dotenv";
import { SuiPackagePublisher } from "../src/lib/sui-package-publisher";
dotenv.config();

(async() => {
  const packagePath = path.join(__dirname, './sample_move/package_a');
  const publisher = new SuiPackagePublisher();
  const result = await publisher.buildPackage(packagePath, { skipFetchLatestGitDeps: true });
  console.log(result);
})();

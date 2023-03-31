/**
 * This is an example of using SuiKit to publish a move package
 */
import path from "path";
import { SuiKit } from "../lib/sui-kit";

(async() => {
	const suiKit = new SuiKit()
	const balance = await suiKit.getBalance()
	if (balance.totalBalance <= 3000) {
		await suiKit.requestFaucet()
	}
	// Wait for 3 seconds before publish package
	await new Promise(resolve => setTimeout(() => resolve(true), 3000))

	const packagePath = path.join(__dirname, './sample_move/package_a')
	const result = await suiKit.publishPackage(packagePath)
	console.log('packageId: ' + result.packageId)
})();

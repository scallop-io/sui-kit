/**
 * This is an example of using SuiKit to publish a move package
 */
import dotenv from 'dotenv'
import * as process from "process";
import path from "path";
import { SuiKit } from "../lib/sui-kit";
dotenv.config();

(async() => {
	const mnemonics = process.env.mnemonics;
	const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' })
	const balance = await suiKit.getBalance()
	if (balance.totalBalance <= 3000) {
		await suiKit.requestFaucet()
	}
	const packagePath = path.join(__dirname, './sample_move/package_b')
	const result = await suiKit.publishPackage(packagePath)
	console.log('packageId: ' + result.packageId)
})();

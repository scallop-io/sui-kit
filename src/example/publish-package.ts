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
	// Init a SuiKit instance, it will use testnet by default. Read the doc for more options
	const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' })
	const balance = await suiKit.getBalance()
	if (balance.totalBalance <= 3000) {
		// Request some testnet coins from the faucet
		await suiKit.requestFaucet()
	}
	const packagePath = path.join(__dirname + '/./sample_move')
	// Publish the package (make sure you have the latest version of SUI cli installed)
	const result = await suiKit.publishPackage(packagePath)
	console.log('packageId: ' + result.packageId)
	console.log('publish transaction : ' + result.publishTxn)
})();

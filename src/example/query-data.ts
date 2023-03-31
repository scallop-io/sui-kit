/**
 * This is an example of using SuiKit to publish a move package
 */
import dotenv from 'dotenv'
import * as process from "process";
import { SuiKit } from "../lib/sui-kit";
dotenv.config();

(async() => {
	const mnemonics = process.env.mnemonics;
	// Init a SuiKit instance, it will use testnet by default. Read the doc for more options
	const suiKit = new SuiKit({ mnemonics, networkType: 'testnet' })
	const address = suiKit.getAddress({ accountIndex: 0 })

	console.log('SUI address: ', address);
	const balance = await suiKit.getBalance()
	console.log('SUI balance: ' + balance.totalBalance);
})();

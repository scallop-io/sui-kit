/**
 * This is an example of using SuiKit to publish a move package
 */
import dotenv from 'dotenv'
import * as process from "process";
import { SuiKit } from "../lib/sui-kit";
dotenv.config();

(async() => {
	const mnemonics = process.env.mnemonics;
	const suiKit = new SuiKit({ mnemonics })
	for (let i = 0; i < 10; i++) {
		suiKit.switchAccount({ accountIndex: i });
		const address = suiKit.getAddress();
		console.log(`address for account ${i}: ${address}`)
	}
})();

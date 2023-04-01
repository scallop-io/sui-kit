/**
 * This is an example of using SuiKit to query data from SUI network
 */
import { SuiKit } from "../sui-kit";
import * as process from "process";

(async() => {
	const mnemonics = process.env.MNEMONICS;
	const secretKey = "AONOr9SfnOFFGAjHiBPALiWFh+HrtVOh9S/0OGcZOKre";
	const suiKit = new SuiKit({ secretKey, networkType: 'testnet' });
	const balance = await suiKit.getBalance();
	console.log(`balance for account ${suiKit.currentAddress()}: ${balance.totalBalance}`)
})();

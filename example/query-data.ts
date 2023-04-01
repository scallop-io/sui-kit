/**
 * This is an example of using SuiKit to query data from SUI network
 */
import { SuiKit } from "../sui-kit";

(async() => {
	const suiKit = new SuiKit();
	for (let i = 0; i < 10; i++) {
		suiKit.switchAccount({ accountIndex: i });
		const balance = await suiKit.getBalance();
		console.log(`address for account ${i}: ${suiKit.currentAddress()}`);
		console.log(`balance for account ${i}: ${balance.totalBalance}`);
	}
})();

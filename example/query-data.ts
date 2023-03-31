/**
 * This is an example of using SuiKit to query data from SUI network
 */
import { SuiKit } from "../sui-kit";

(async() => {
	const suiKit = new SuiKit();
	for (let i = 0; i < 10; i++) {
		suiKit.switchAccount({ accountIndex: i });
		console.log(`address for account ${i}: ${suiKit.currentAddress}`);
	}
})();

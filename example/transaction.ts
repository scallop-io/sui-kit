/**
 * This is an example of using SuiKit to publish a move package
 */
import { SuiKit } from "../sui-kit";

(async() => {
	const suiKit = new SuiKit()

	// Request some SUI from faucet for account 0
	await suiKit.requestFaucet({ accountIndex: 0 });
	// Wait 3 seconds for data sync
	await new Promise(resolve => setTimeout(() => resolve(true), 8000));


	// Get the address of account 1
	const addr1 = suiKit.getAddress({ accountIndex: 1 });

	// Send the coin with account 0
	await suiKit.transferSui(addr1, 1000, { accountIndex: 0 });

	// Wait 3 seconds before query
	await new Promise(resolve => setTimeout(() => resolve(true), 3000));

	// Query the balance of account 1
	const balance1 = await suiKit.getBalance('0x2::sui::SUI', { accountIndex: 1 });
	console.log('account1 address: ', addr1)
	console.log('account1 balance: ', balance1)
})();

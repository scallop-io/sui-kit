/**
 * This is an example of using SuiKit to transfer SUI from one account to another.
 */
import { SuiKit } from "../sui-kit";
import * as process from "process";
import dotenv from "dotenv";
dotenv.config();

(async() => {
	const displayBalance = async (suiKit: SuiKit) => {
		console.log(`balance for account ${suiKit.currentAddress()}: ${(await suiKit.getBalance()).totalBalance}`);
	}

	// Account that will receive SUI
	const mnemonics = process.env.MNEMONICS;
	const suiKitM = new SuiKit({ mnemonics, networkType: 'testnet' });
	await displayBalance(suiKitM)

	// Account that will send SUI
	const secretKey = process.env.SECRET_KEY;
	const suiKitS = new SuiKit({ secretKey, networkType: 'testnet' });
	await displayBalance(suiKitS)

	// Transfer all SUI from account S to account M except the gas budget
	const gasPrice = 1000;
	const gasBudget = gasPrice * 1200;
	const balanceS = await suiKitS.getBalance();
	console.log(`Transfer ${balanceS.totalBalance - gasBudget} from ${suiKitS.currentAddress()} to ${suiKitM.currentAddress()}`)
	await suiKitS.transferSui(suiKitM.currentAddress(), balanceS.totalBalance - gasBudget)

	console.log('Wait 3 seconds for the transaction to be confirmed...')
	await new Promise(resolve => setTimeout(resolve, 3000));

	console.log('After transfer:')
	await displayBalance(suiKitM)
	await displayBalance(suiKitS)
})();

import dotenv from 'dotenv'
import { SuiKit } from '../sui-kit'
import {getShinamiFullNodeUrl} from "../sui-kit/lib/plugins/shinami";
dotenv.config()

async function checkAccounts(suiKit: SuiKit) {
	const displayAccounts = async (suiKit: SuiKit, accountIndex: number) => {
		const coinType = '0x2::sui::SUI'
		const addr = suiKit.getAddress({accountIndex})
		const balance = (await suiKit.getBalance(coinType, {accountIndex})).totalBalance
		console.log(`Account ${accountIndex}: ${addr} has ${balance} SUI`)
	}
	// log the first 10 accounts
	const numAccounts = 10
	for (let i = 0; i < numAccounts; i++) {
		await displayAccounts(suiKit, i)
	}
}

async function internalTransferSui(suiKit: SuiKit, fromAccountIndex: number, toAccountIndex: number, amount: number) {
	const toAddr = suiKit.getAddress({accountIndex: toAccountIndex })
	console.log(`Transfer ${amount} SUI from account ${fromAccountIndex} to account ${toAccountIndex}`)
	return await suiKit.transferSui(toAddr, amount,  {accountIndex: fromAccountIndex})
}

const mnemonics = process.env.MNEMONICS;
const shinamiKey = process.env.SHINAMI_KEY || '';
const shinamiFullnode = getShinamiFullNodeUrl(shinamiKey);
const suiKit = new SuiKit({ mnemonics, fullnodeUrl: shinamiFullnode, networkType: 'testnet' })
checkAccounts(suiKit).then(() => {})

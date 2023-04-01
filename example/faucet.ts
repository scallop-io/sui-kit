import { SuiKit } from '../sui-kit'

(async () => {
	const suiKit = new SuiKit({ networkType: 'testnet' })
	const addr = '0xd5743dc7892e91c48fb979188bcebbcf352524e8246fde931827ec50176ffb13'
	const balance = await suiKit.rpcProvider.provider.getBalance({ owner: addr })
	console.log(`balance for account ${addr}: ${balance.totalBalance}`)
})()

import { SuiKit } from '../sui-kit'

(async () => {
	const suiKit = new SuiKit({ networkType: 'devnet' })
	await suiKit.requestFaucet()
})()

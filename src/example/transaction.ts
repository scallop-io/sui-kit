/**
 * This is an example of using SuiKit to publish a move package
 */
import { TransactionBlock, Ed25519Keypair } from '@mysten/sui.js'
import { SuiKit } from "../lib/sui-kit";

(async() => {
	const mnemonics = 'always secret tiny else choose head settle guess just tape tunnel owner perfect tonight avocado bullet include gentle cloud always dentist regular tide guitar';
	const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' })



	const tx = new TransactionBlock();
	tx.moveCall({
    target: '0x2::coin::join',
    arguments: [tx.object('0x3'), tx.object('0x4')],
    typeArguments: [ '0x2::sui::SUI'],
	})
})();

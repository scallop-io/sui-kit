/**
 * This is an example of using SuiKit to publish a move package
 */
import dotenv from 'dotenv'
import * as process from "process";
import { SuiKit } from "../lib/sui-kit";
import { TransactionBlock  } from '@mysten/sui.js'
dotenv.config();

(async() => {
	const mnemonics = process.env.mnemonics;
	const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' })

	const tx = new TransactionBlock();
	tx.moveCall({
    target: '0x2::coin::join',
    arguments: [tx.object('0x3'), tx.object('0x4')],
    typeArguments: [ '0x2::sui::SUI'],
	})
})();

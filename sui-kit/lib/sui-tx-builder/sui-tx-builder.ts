import { TransactionBlock } from '@mysten/sui.js'

export class SuiTxBlock {
	public txBlock: TransactionBlock;
	constructor() {
		this.txBlock = new TransactionBlock();
	}
	transferSuiToMany(recipients: string[], amounts: number[]) {
		const tx = this.txBlock;
		const coins = tx.splitCoins(tx.gas, amounts.map(amount => tx.pure(amount)));
		recipients.forEach((recipient, index) => {
			tx.transferObjects([coins[index]], tx.pure(recipient));
		});
		return this;
	}
	transferSui(to: string, amount: number) {
		return this.transferSuiToMany([to], [amount]);
	}

	moveCall(target: `${string}::${string}::${string}`, args: any[] = [], typeArgs: string[] = []) {
		const tx = this.txBlock;
		tx.moveCall({
			target: target,
			arguments: args.map(arg => tx.pure(arg)),
			typeArguments: typeArgs,
		});
		return this;
	}
}

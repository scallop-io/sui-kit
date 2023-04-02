import { TransactionBlock, JsonRpcProvider } from '@mysten/sui.js'

interface BuildOptions {
	provider?: JsonRpcProvider;
	onlyTransactionKind?: boolean;
}
export class SuiTxBlock {
	public txBlock: TransactionBlock;
	constructor() {
		this.txBlock = new TransactionBlock();
	}

	/**
	 * @description Build the transaction block
	 * @param provider
	 * @param onlyTransactionKind, if false, it will do a dry run to get the gas price.
	 */
	build({ provider, onlyTransactionKind }: BuildOptions = {}) {
		this.txBlock.build({ provider, onlyTransactionKind });
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

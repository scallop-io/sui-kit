import { TransactionBlock, JsonRpcProvider, TransactionArgument } from '@mysten/sui.js'

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
	 * @param onlyTransactionKind, if false, it will do a dry run to get the gas price.
	 */
	build(onlyTransactionKind: boolean = false) {
		this.txBlock.build({ onlyTransactionKind });
	}
	transferSuiToMany(recipients: string[], amounts: number[]) {
		const tx = this.txBlock;
		const coins = tx.splitCoins(tx.gas, amounts.map(amount => tx.pure(amount)));
		recipients.forEach((recipient, index) => {
			tx.transferObjects([coins[index]], tx.pure(recipient));
		});
		return this;
	}
	transferSui(recipient: string, amount: number) {
		return this.transferSuiToMany([recipient], [amount]);
	}

	transferObjects(objects: string[], recipient: string) {
		const tx = this.txBlock;
		tx.transferObjects(objects.map(obj => tx.object(obj)), tx.pure(recipient));
		return this;
	}

	takeAmountFromCoins(coins: string[], amount: number) {
		const tx = this.txBlock;
		const mergedCoin = coins.length > 1
			? tx.mergeCoins(tx.object(coins[0]),  coins.slice(1).map(coin => tx.object(coin)))
			: tx.object(coins[0])
		const [sendCoin] = tx.splitCoins(mergedCoin, [tx.pure(amount)]);
		return [sendCoin, mergedCoin]
	}

	moveCall(target: `${string}::${string}::${string}`, args: any[] = [], typeArgs: string[] = []) {
		const tx = this.txBlock;
		return tx.moveCall({
			target: target,
			arguments: args.map(arg => tx.pure(arg)),
			typeArguments: typeArgs,
		});
	}
}

import { Transaction } from "@mysten/sui/transactions";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import type {
	SuiAddressArg,
	SuiAmountsArg,
	SuiObjectArg,
	SuiTxArg,
	SuiVecTxArg,
} from "../../types/index.js";
import {
	convertAddressArg,
	convertAmounts,
	convertArgs,
	convertObjArg,
	partitionArray,
} from "./util.js";

export class SuiTxBlock extends Transaction {
	constructor(tx?: Transaction) {
		super();
		// `Transaction` keeps its state in private fields, so the only way to copy
		// an existing transaction is to let the base class build the copy and then
		// re-point it at this subclass.
		if (tx) {
			// biome-ignore lint/correctness/noConstructorReturn: returning the adopted base-class copy is the only way to clone a Transaction
			return SuiTxBlock.adopt(Transaction.from(tx));
		}
	}

	private static adopt(tx: Transaction) {
		return Object.setPrototypeOf(tx, SuiTxBlock.prototype) as SuiTxBlock;
	}

	address(value: string) {
		return this.pure.address(value);
	}

	static from(tx: Parameters<typeof Transaction.from>[0]) {
		return SuiTxBlock.adopt(Transaction.from(tx));
	}

	static fromKind(tx: Parameters<typeof Transaction.fromKind>[0]) {
		return SuiTxBlock.adopt(Transaction.fromKind(tx));
	}

	// @ts-expect-error - intentionally narrows the base `Transaction.moveCall`
	splitCoins(coin: SuiObjectArg, amounts: SuiAmountsArg[]) {
		return super.splitCoins(
			convertObjArg(this, coin),
			convertAmounts(this, amounts),
		);
	}

	/* Override methods of TransactionBlock */
	transferObjects(objects: SuiObjectArg[], address: SuiAddressArg) {
		return super.transferObjects(
			objects.map((object) => convertObjArg(this, object)),
			convertAddressArg(this, address),
		);
	}

	mergeCoins(destination: SuiObjectArg, sources: SuiObjectArg[]) {
		const destinationObject = convertObjArg(this, destination);
		const sourceObjects = sources.map((source) => convertObjArg(this, source));
		return super.mergeCoins(destinationObject, sourceObjects);
	}

	/**
	 * @description Move call
	 * @param target `${string}::${string}::${string}`, e.g. `0x3::sui_system::request_add_stake`
	 * @param args the arguments of the move call, such as `['0x1', '0x2']`
	 * @param typeArgs the type arguments of the move call, such as `['0x2::sui::SUI']`
	 */
	// @ts-expect-error - intentionally narrows the base `Transaction.moveCall`
	// signature to this positional form; the object form is not supported here.
	moveCall(
		target: string,
		args: (SuiTxArg | SuiVecTxArg | SuiObjectArg | SuiAmountsArg)[] = [],
		typeArgs: string[] = [],
	) {
		// a regex for pattern `${string}::${string}::${string}`
		const regex =
			/(?<package>[a-zA-Z0-9]+)::(?<module>[a-zA-Z0-9_]+)::(?<function>[a-zA-Z0-9_]+)/;
		const match = target.match(regex);
		if (match === null)
			throw new Error(
				// biome-ignore lint/suspicious/noTemplateCurlyInString: Intended error message format
				"Invalid target format. Expected `${string}::${string}::${string}`",
			);
		const convertedArgs = convertArgs(this, args);
		return super.moveCall({
			target: target as `${string}::${string}::${string}`,
			arguments: convertedArgs,
			typeArguments: typeArgs,
		} as Parameters<Transaction["moveCall"]>[0]);
	}

	/* Enhance methods of TransactionBlock */
	transferSuiToMany(recipients: SuiAddressArg[], amounts: SuiAmountsArg[]) {
		// require recipients.length === amounts.length
		if (recipients.length !== amounts.length) {
			throw new Error(
				"transferSuiToMany: recipients.length !== amounts.length",
			);
		}
		const coins = this.splitCoins(this.gas, convertAmounts(this, amounts));

		const recipientObjects = recipients.map((recipient) =>
			convertAddressArg(this, recipient),
		);

		// Transfer splitted coins to recipients
		recipientObjects.forEach((address, index) => {
			this.transferObjects([coins[index]], address);
		});

		return this;
	}

	transferSui(address: SuiAddressArg, amount: SuiAmountsArg) {
		return this.transferSuiToMany([address], [amount]);
	}

	takeAmountFromCoins(coins: SuiObjectArg[], amount: SuiAmountsArg) {
		const { splitedCoins, mergedCoin } = this.splitMultiCoins(
			coins,
			convertAmounts(this, [amount]),
		);

		return [splitedCoins, mergedCoin];
	}

	splitSUIFromGas(amounts: SuiAmountsArg[]) {
		return this.splitCoins(this.gas, convertAmounts(this, amounts));
	}

	splitMultiCoins(coins: SuiObjectArg[], amounts: SuiAmountsArg[]) {
		if (coins.length === 0) {
			throw new Error("takeAmountFromCoins: coins array is empty");
		}

		const partitions = partitionArray(coins.slice(1), 511);
		const mergedCoin = convertObjArg(this, coins[0]);
		for (const partition of partitions) {
			const coinObjects = partition.map((coin) => convertObjArg(this, coin));
			this.mergeCoins(mergedCoin, coinObjects);
		}
		const splitedCoins = this.splitCoins(
			mergedCoin,
			convertAmounts(this, amounts),
		);
		return { splitedCoins, mergedCoin };
	}

	transferCoinToMany(
		coins: SuiObjectArg[],
		sender: SuiAddressArg,
		recipients: SuiAddressArg[],
		amounts: SuiAmountsArg[],
	) {
		// require recipients.length === amounts.length
		if (recipients.length !== amounts.length) {
			throw new Error(
				"transferCoinToMany: recipients.length !== amounts.length",
			);
		}
		const coinObjects = coins.map((coin) => convertObjArg(this, coin));
		const { splitedCoins, mergedCoin } = this.splitMultiCoins(
			coinObjects,
			convertAmounts(this, amounts),
		);
		const recipientObjects = recipients.map((recipient) =>
			convertAddressArg(this, recipient),
		);

		// Transfer splitted coins to recipients
		recipientObjects.forEach((address, index) => {
			this.transferObjects([splitedCoins[index]], address);
		});

		// Return the remaining coin back to sender
		this.transferObjects([mergedCoin], convertAddressArg(this, sender));

		return this;
	}

	transferCoin(
		coins: SuiObjectArg[],
		sender: SuiAddressArg,
		recipient: SuiAddressArg,
		amount: SuiAmountsArg,
	) {
		return this.transferCoinToMany(coins, sender, [recipient], [amount]);
	}

	stakeSui(amount: SuiAmountsArg, validatorAddr: SuiAddressArg) {
		const [stakeCoin] = this.splitCoins(
			this.gas,
			convertAmounts(this, [amount]),
		);
		return this.moveCall(`0x3::sui_system::request_add_stake`, [
			this.object(SUI_SYSTEM_STATE_OBJECT_ID),
			stakeCoin,
			convertAddressArg(this, validatorAddr),
		]);
	}
}

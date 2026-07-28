import { Transaction } from "@mysten/sui/transactions";
import { SuiTxBlock } from "src/libs/suiTxBuilder/index.js";
import { SuiKit } from "src/suiKit.js";
import { describe, expect, it } from "vitest";

function createTxBlock() {
	return new SuiTxBlock();
}

describe("SuiTxBlock", () => {
	const suiKit = new SuiKit({
		mnemonics: "test test test test test test test test test test test test",
	});

	it("makeMoveVec should call underlying txBlock.makeMoveVec", () => {
		const tx = createTxBlock();
		expect(() => tx.makeMoveVec({ elements: [] })).not.toThrow();
	});

	it("transferObjects should call underlying txBlock.transferObjects", () => {
		const tx = createTxBlock();
		const result = tx.transferObjects(
			["0x1234567890abcdef1234567890abcdef12345678"],
			suiKit.currentAddress,
		);
		expect(result).toBeDefined();
	});

	it("moveCall should call underlying txBlock.moveCall", () => {
		const tx = createTxBlock();
		const result = tx.moveCall("0x1::module::func", []);
		expect(result).toBeDefined();
	});

	it("transferSuiToMany should transfer to multiple recipients", () => {
		const tx = createTxBlock();

		const recipients = [suiKit.currentAddress, suiKit.currentAddress];
		const amounts = [1, 2];
		const result = tx.transferSuiToMany(recipients, amounts);
		expect(result).toBe(tx);
	});

	it("transferSui should transfer to one recipient", () => {
		const tx = createTxBlock();
		const result = tx.transferSui(suiKit.currentAddress, 1);
		expect(result).toBe(tx);
	});

	it("takeAmountFromCoins should return splitedCoins and mergedCoin", () => {
		const tx = createTxBlock();
		const coins = ["0x1234567890abcdef1234567890abcdef12345678"];
		const [splitedCoins, mergedCoin] = tx.takeAmountFromCoins(coins, 1);
		expect(splitedCoins).toBeDefined();
		expect(mergedCoin).toBeDefined();
	});

	it("splitSUIFromGas should split coins from gas", () => {
		const tx = createTxBlock();
		const result = tx.splitSUIFromGas([1, 2]);
		expect(result).toBeDefined();
	});

	it("splitMultiCoins should split and merge coins", () => {
		const tx = createTxBlock();
		const coins = ["0x1234567890abcdef1234567890abcdef12345678"];
		const result = tx.splitMultiCoins(coins, [1]);
		expect(result).toHaveProperty("splitedCoins");
		expect(result).toHaveProperty("mergedCoin");
	});

	it("transferCoinToMany should transfer coins to many", () => {
		const tx = createTxBlock();
		const coins = ["0x1234567890abcdef1234567890abcdef12345678"];
		const sender = suiKit.currentAddress;
		const recipients = [suiKit.currentAddress];
		const amounts = [1];
		const result = tx.transferCoinToMany(coins, sender, recipients, amounts);
		expect(result).toBe(tx);
	});

	it("stakeSui should call moveCall for staking", () => {
		const tx = createTxBlock();
		const result = tx.stakeSui(1, suiKit.currentAddress);
		expect(result).toBeDefined();
	});
});

describe("SuiTxBlock as a Transaction subclass", () => {
	const SENDER = `0x${"1".repeat(64)}`;
	const COIN_ID = `0x${"2".repeat(64)}`;

	function sourceTx() {
		const tx = new Transaction();
		tx.setSender(SENDER);
		tx.splitCoins(tx.gas, [1]);
		return tx;
	}

	// SuiTxBlock is passed directly to @mysten/sui APIs that expect a Transaction,
	// so the prototype chain must hold.
	it("is an instance of Transaction", () => {
		expect(new SuiTxBlock()).toBeInstanceOf(Transaction);
	});

	it("starts empty when constructed without a transaction", () => {
		expect(new SuiTxBlock().getData().commands).toHaveLength(0);
	});

	it("copies commands and sender from an existing transaction", () => {
		const source = sourceTx();
		const tx = new SuiTxBlock(source);

		expect(tx).toBeInstanceOf(SuiTxBlock);
		expect(tx.getData().sender).toBe(SENDER);
		expect(tx.getData().commands).toEqual(source.getData().commands);
	});

	// The copy is produced by re-pointing a base Transaction at SuiTxBlock's
	// prototype, so verify the subclass helpers are actually reachable on it.
	it("exposes SuiTxBlock helpers on a copied transaction", () => {
		const tx = new SuiTxBlock(sourceTx());
		tx.moveCall("0x1::module::func", [COIN_ID]);

		expect(tx.getData().commands).toHaveLength(2);
		expect(tx.getData().commands[1].$kind).toBe("MoveCall");
	});

	it("does not mutate the source transaction when copying", () => {
		const source = sourceTx();
		const tx = new SuiTxBlock(source);
		tx.splitCoins(tx.gas, [2]);

		expect(source.getData().commands).toHaveLength(1);
		expect(tx.getData().commands).toHaveLength(2);
	});

	it("from() restores a serialized transaction as a SuiTxBlock", async () => {
		const source = sourceTx();
		const tx = SuiTxBlock.from(await source.toJSON());

		expect(tx).toBeInstanceOf(SuiTxBlock);
		expect(tx.getData().sender).toBe(SENDER);
		expect(tx.getData().commands).toHaveLength(1);
	});

	it("fromKind() restores transaction kind bytes as a SuiTxBlock", async () => {
		const kind = await sourceTx().build({ onlyTransactionKind: true });
		const tx = SuiTxBlock.fromKind(kind);

		expect(tx).toBeInstanceOf(SuiTxBlock);
		expect(tx.getData().commands).toHaveLength(1);
	});
});

describe("SuiTxBlock.splitCoins", () => {
	const COIN_ID = `0x${"2".repeat(64)}`;

	// The override exists so that every SuiObjectArg shape accepted elsewhere in
	// the class also works here; the base Transaction.splitCoins rejects these.
	it("accepts an object reference as the coin", () => {
		const tx = new SuiTxBlock();
		tx.splitCoins({ objectId: COIN_ID, version: "1", digest: "abc" }, [1]);

		const [command] = tx.getData().commands;
		expect(command.$kind).toBe("SplitCoins");
		expect(tx.getData().inputs[0].$kind).toBe("Object");
	});

	it("accepts an ObjectCallArg as the coin", () => {
		const tx = new SuiTxBlock();
		tx.splitCoins(
			{
				Object: {
					ImmOrOwnedObject: { objectId: COIN_ID, version: "1", digest: "abc" },
				},
			},
			[1],
		);

		expect(tx.getData().commands[0].$kind).toBe("SplitCoins");
		expect(tx.getData().inputs[0].$kind).toBe("Object");
	});

	// SuiAmountsArg allows strings so callers can pass u64 values that overflow
	// `number`; they must be serialized as pure u64, not treated as object ids.
	it("serializes string amounts as pure u64 inputs", () => {
		const tx = new SuiTxBlock();
		tx.splitCoins(tx.gas, ["18446744073709551615"]);

		const input = tx.getData().inputs[0];
		expect(input.$kind).toBe("Pure");
		expect(input.Pure?.bytes).toBe("//////////8=");
	});

	it("returns one result per requested amount", () => {
		const tx = new SuiTxBlock();
		const coins = tx.splitCoins(tx.gas, [1, 2, 3]);

		expect(coins[0]).toBeDefined();
		expect(coins[1]).toBeDefined();
		expect(coins[2]).toBeDefined();
	});
});

describe("SuiTxBlock.moveCall", () => {
	it("rejects a target that is not package::module::function", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.moveCall("not-a-move-target")).toThrow(
			/Invalid target format/,
		);
	});

	it("converts positional args and type args", () => {
		const tx = new SuiTxBlock();
		tx.moveCall(
			"0x2::coin::zero",
			[`0x${"3".repeat(64)}`, 42],
			["0x2::sui::SUI"],
		);

		const [command] = tx.getData().commands;
		expect(command.$kind).toBe("MoveCall");
		expect(command.MoveCall?.typeArguments).toEqual(["0x2::sui::SUI"]);
		expect(command.MoveCall?.arguments).toHaveLength(2);
		// a bare object id stays unresolved until build time; the amount is pure u64
		expect(tx.getData().inputs[0].$kind).toBe("UnresolvedObject");
		expect(tx.getData().inputs[1].$kind).toBe("Pure");
	});
});

describe("SuiTxBlock (simple coverage)", () => {
	const suiKit = new SuiKit({
		mnemonics: "test test test test test test test test test test test test",
	});

	it("should get gas", () => {
		const tx = new SuiTxBlock();
		expect(tx.gas).toBeDefined();
	});

	it("should get getData", () => {
		const tx = new SuiTxBlock();
		expect(tx.getData()).toBeDefined();
	});

	it("should get pure", () => {
		const tx = new SuiTxBlock();
		expect(tx.pure).toBeDefined();
	});

	it("should call object", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.object(`0x${"1".repeat(64)}`)).not.toThrow();
	});

	it("should call objectRef", () => {
		const tx = new SuiTxBlock();
		expect(() =>
			tx.objectRef({
				objectId: `0x${"1".repeat(64)}`,
				version: "1",
				digest: "abc",
			}),
		).not.toThrow();
	});

	it("should call sharedObjectRef", () => {
		const tx = new SuiTxBlock();
		expect(() =>
			tx.sharedObjectRef({
				objectId: `0x${"1".repeat(64)}`,
				initialSharedVersion: "1",
				mutable: true,
			}),
		).not.toThrow();
	});

	it("should call setSender", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.setSender(`0x${"1".repeat(64)}`)).not.toThrow();
	});

	it("should call setSenderIfNotSet", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.setSenderIfNotSet(`0x${"1".repeat(64)}`)).not.toThrow();
	});

	it("should call setExpiration", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.setExpiration()).not.toThrow();
	});

	it("should call setGasPrice", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.setGasPrice(1)).not.toThrow();
	});

	it("should call setGasBudget", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.setGasBudget(1)).not.toThrow();
	});

	it("should call setGasOwner", () => {
		const tx = new SuiTxBlock();
		expect(() => tx.setGasOwner(`0x${"1".repeat(64)}`)).not.toThrow();
	});

	it("should call setGasPayment", () => {
		const tx = new SuiTxBlock();
		expect(() =>
			tx.setGasPayment([
				{ objectId: `0x${"1".repeat(64)}`, version: "1", digest: "abc" },
			]),
		).not.toThrow();
	});

	it("should call serialize", () => {
		const tx = createTxBlock();
		expect(() => tx.serialize()).not.toThrow();
	});

	it("should call toJSON", () => {
		const tx = createTxBlock();
		expect(() => tx.toJSON()).not.toThrow();
	});

	it("should call add with invalid input throws in SDK v2", () => {
		const tx = createTxBlock();
		// SDK v2 validates transaction commands and throws for invalid input
		expect(() => tx.add({} as any)).toThrow();
	});

	it("should call publish", () => {
		const tx = createTxBlock();
		expect(() =>
			tx.publish({
				modules: [[1, 2, 3]],
				dependencies: [`0x${"1".repeat(64)}`],
			}),
		).not.toThrow();
	});

	it("should call upgrade", () => {
		const tx = createTxBlock();
		const args = [
			{
				modules: [
					[1, 2, 3],
					[4, 5, 6],
				],
				dependencies: [`0x${"1".repeat(64)}`],
				package: `0x${"1".repeat(64)}`,
				ticket: `0x${"1".repeat(64)}`,
			},
		];
		expect(() => tx.upgrade(args[0])).not.toThrow();
	});

	it("should call getDigest", () => {
		const tx = new SuiTxBlock();
		tx.setSender(`0x${"1".repeat(64)}`);
		tx.setGasPayment([
			{ objectId: `0x${"4".repeat(64)}`, version: "1", digest: "abc" },
		]);
		tx.transferObjects([`0x${"2".repeat(64)}`], `0x${"3".repeat(64)}`);
		expect(() => tx.getDigest({ client: suiKit.client })).not.toThrow();
	});

	it("should call build", () => {
		const tx = new SuiTxBlock();
		tx.setSender(`0x${"1".repeat(64)}`);
		tx.setGasPayment([
			{ objectId: `0x${"4".repeat(64)}`, version: "1", digest: "abc" },
		]);
		tx.transferObjects([`0x${"2".repeat(64)}`], `0x${"3".repeat(64)}`);
		expect(() => tx.build({ client: suiKit.client })).not.toThrow();
	});
});

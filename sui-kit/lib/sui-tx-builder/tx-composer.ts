import assert from "assert";
import { TransactionBlock } from "@mysten/sui.js";

export const composeTransferSuiTxBlock = (recipients: string[], amounts: number[]) => {
  assert(recipients.length === amounts.length, "recipients and amounts must have the same length");
  const tx = new TransactionBlock();
  const coins = tx.splitCoins(tx.gas, amounts.map(amount => tx.pure(amount)));
  recipients.forEach((recipient, index) => {
    tx.transferObjects([coins[index]], tx.pure(recipient));
  });
  return tx;
}

export const composeTransferObjectsTxn = (to: string, objects: string[]) => {
  const tx = new TransactionBlock();
  tx.transferObjects(objects.map(obj => tx.pure(obj)), tx.pure(to));
  return tx;
}

type Target = `${string}::${string}::${string}`;
export const composeMoveCallTxn = (target: Target, args: any[] = [], typeArgs: string[] = []) => {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: target,
    arguments: args.map(arg => tx.pure(arg)),
    typeArguments: typeArgs,
  });
  return tx;
}

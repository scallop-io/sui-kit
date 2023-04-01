import { TransactionBlock } from "@mysten/sui.js";

export const composeTransferSuiTxn = (to: string, amount: number) => {
  const tx = new TransactionBlock();
  const [coinToSend] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
  tx.transferObjects([coinToSend], tx.pure(to));
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
}

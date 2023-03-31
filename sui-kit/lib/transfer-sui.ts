import { TransactionBlock } from "@mysten/sui.js";

export const composeTransferSuiTxn = (to: string, amount: number) => {
  const tx = new TransactionBlock();
  const [coinToSend] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
  tx.transferObjects([coinToSend], tx.pure(to));
  return tx;
}

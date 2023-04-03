# How to achieve max performance on SUI network?

## 1. Pre-build the transaction
When sending transactions, there's a process to build the transaction which needs to call the nodes to get the latest data, such as object version, gas price, gas budget.
There'll be multiple forth and back calls between the client and the nodes, if you can pre-build the transaction, you can save a lot of time when you send it.
For simple transactions, you can pre-build the whole transaction and send it anytime you want.
For complex transactions, you can pre-build the other parts and leave dynamic part to be built when sending the transaction.

## 2. Choose high quality fullnode
By default, people will use the public fullnode provided by SUI, which is a good choice for most of the cases.
But, it's usually not the best choice for the high performance applications, since the public fullnode is shared by many users, and it's not optimized for the high performance applications.
By choosing a node that is optimized and used less by others, you can build & send your transaction significantly faster.

## 3. Set higher gas price
By default, the gas price will be set to the reference gas price returned by the node.
You should set a higher gas price to make sure your transaction will get executed as soon as possible.

## 4. Use programmable transaction
Programmable transaction is a feature that allows you to include multiple move calls in one transaction.
Instead of sending multiple transactions, you can send one transaction with multiple move calls, which will save a lot of time.
SuiKit supports programmable transaction.

## 5. Batch transactions
Suppose you want to send multiple transactions in a short period of time, let's say 10 transactions in a second.
If you send them in parallel, by default you'll end up with 10 transactions referencing the same gas coins, which will cause the transactions to fail.
How to solve this problem?
1, Manually set different gas coins for each transaction.
2, Use programmable transaction if you can batch the transactions together.
3, Split your assets into multiple accounts, and send the transactions in parallel.
Here I think solution 3 is the best one, with least effort and best compatibility.
You can use SuiKit to create multiple accounts, and send the transactions in parallel.
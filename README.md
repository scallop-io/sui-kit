# Tookit for interacting with SUI network

[中文文档](./README_cn.md)

## Features
- [x] Transfer SUI & Custom Coin
- [x] Request faucet from devnet, testnet
- [x] Stake SUI
- [x] Compatible with programmable transaction
- [x] Publish move packages
- [x] Advanced features: multi-accounts.

## Pre-requisites

1, Install the package

```bash
npm install
```

2, Install SUI cli (optional: only needed for publishing packages)

Please refer to the official documentation: [How to install SUI cli](https://docs.sui.io/devnet/build/install)


## How to use

### Transfer coins
You can use SuiKit to transfer SUI and other coins.

```typescript

/**
 * This is an example of using SuiKit to transfer coins from one account to another.
 */
import { SuiKit } from 'sui-kit';

const secretKey = '<Secret key>';
const suiKit = new SuiKit({ secretKey });
const recipient = '0xCAFE';
suiKit.transferSui(recipient, 1000).then(() => console.log('transfered 1000 SUI'));
suiKit.transferCoin(recipient, 1000, '0xCOFFEE::coin::COIN').then(
  () => console.log('transfered 1000 COIN')
);
```

### Request faucet
You can use SuiKit to request faucet from devnet or testnet.

```typescript
import { SuiKit } from 'sui-kit';

const secretKey = '<Secret key>';
const suiKit = new SuiKit({ secretyKey,  networkType: 'devnet' });
suiKit.requestFaucet().then(() => {
  console.log('Faucet request success');
});
```

### Stake SUI
You can use SuiKit to stake SUI.

```typescript
/**
 * This is an example of using SuiKit to stake SUI
 */
import { SuiKit } from 'sui-kit';

const secretKey = '<Secret key>';
const suiKit = new SuiKit({ secretyKey,  networkType: 'devnet' });
const stakeAmount = 1000;
const validatorAddress = '0x123';
suiKit.stakeSui(stakeAmount, validatorAddress).then(() => {
  console.log('Stake SUI success');
});
```


### Programmable transaction
With programmable transaction, you can send a transaction with multiple actions.
The following example shows how to transfer SUI to multiple accounts in one transaction.

```typescript
/**
 * This example shows how to use programmable transaction with SuiKit
 */

import { SuiKit, TransactionBlock } from 'sui-kit';

const secretKey = '<Secret key>';
const suiKit = new SuiKit({ secretKey });

// build a transaction block to send coins to multiple accounts
const tx = new TransactionBlock();

const recipients = ['0x123', '0x456', '0x789'];
recipients.forEach(recipient => {
  const [coin] = tx.splitCoins(tx.gas, [tx.pure(1000)]);
  tx.transferObjects([coin], tx.pure(recipient));
});

// send the transaction block
suiKit.signAndSendTxn(tx).then(response => {
  console.log('Transaction digest: ' + response.digest);
});

```

### Publish move packages
You can use SuiKit to publish move packages to the SUI network.
**Notice: you need to install SUI cli first.** (see [Pre-requisites](#pre-requisites))

```typescript
/**
 * This is an example of using SuiKit to publish a move package
 */
import { SuiKit } from "sui-kit";

(async() => {
  const secretKey = '<Secret key>';
  const suiKit = new SuiKit({ secretKey, networkType: 'devnet' });
  const balance = await suiKit.getBalance();
  if (balance.totalBalance <= 3000) {
    await suiKit.requestFaucet();
  }
  // Wait for 3 seconds before publish package
  await new Promise(resolve => setTimeout(() => resolve(true), 3000));

  const packagePath = path.join(__dirname, './example/sample_move/custom_coin');
  const result = await suiKit.publishPackage(packagePath);
  console.log('packageId: ' + result.packageId);
})();

```

## Advanced features

### Multi-accounts

SuiKit follows bip32 & bip39 standard, so you can use it to manage multiple accounts.
When init SuiKit, you can pass in your mnemonics to create a wallet with multiple accounts.

```typescript
/**
 * This is an example of using SuiKit to manage multiple accounts.
 */
import { SuiKit } from 'sui-kit'

async function checkAccounts(suiKit: SuiKit) {
  const displayAccounts = async (suiKit: SuiKit, accountIndex: number) => {
    const coinType = '0x2::sui::SUI'
    const addr = suiKit.getAddress({accountIndex})
    const balance = (await suiKit.getBalance(coinType, {accountIndex})).totalBalance
    console.log(`Account ${accountIndex}: ${addr} has ${balance} SUI`)
  }
  // log the first 10 accounts
  const numAccounts = 10
  for (let i = 0; i < numAccounts; i++) {
    await displayAccounts(suiKit, i)
  }
}

async function internalTransferSui(suiKit: SuiKit, fromAccountIndex: number, toAccountIndex: number, amount: number) {
  const toAddr = suiKit.getAddress({accountIndex: toAccountIndex })
  console.log(`Transfer ${amount} SUI from account ${fromAccountIndex} to account ${toAccountIndex}`)
  return await suiKit.transferSui(toAddr, amount,  {accountIndex: fromAccountIndex})
}

const mnemonics = process.env.MNEMONICS;
const suiKit = new SuiKit({ mnemonics })
checkAccounts(suiKit).then(() => {})
// transfer 1000 SUI from account 0 to account 1
internalTransferSui(suiKit, 0, 1, 1000).then(() => {})
```

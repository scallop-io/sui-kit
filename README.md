# Tookit for interacting with SUI network

[中文文档](./README_cn.md)

## Features
- [x] Transfer SUI & Custom Coin
- [x] Stake SUI
- [x] Compatible with programmable transaction
- [x] Inspection of transaction (gasless transaction for inspection)
- [x] Advanced features: multi-accounts

## Pre-requisites

```bash
npm install @scallop-dao/sui-kit
```


## How to use

### Init SuiKit

```typescript
import { SuiKit } from '@scallop-dao/sui-kit';

// The following types of secret key are supported:
// 1. base64 key from SUI cli keystore file
// 2. 32 bytes hex key
// 3. 64 bytes legacy hex key
const secretKey = '<Secret key>';
const suiKit1 = new SuiKit({ secretKey });


// 12 or 24 words mnemonics
const mnemonics = '<Mnemonics>';
const suiKit2 = new SuiKit({ mnemonics });


// It will create a HD wallet with a random mnemonics 
const suiKit3 = new SuiKit();


// Override options
const suiKit = new SuiKit({
  mnemonics: '<Mnemonics>',
  // 'testnet' | 'mainnet' | 'devnet', default is 'devnet'
  networkType: 'testnet',
  // the fullnode url, default is the preconfig fullnode url for the given network type
  fullnodeUrl: '<SUI fullnode>',
  // the faucet url, default is the preconfig faucet url for the given network type
  faucetUrl: '<SUI faucet url>' 
});
```


### Transfer 
You can use SuiKit to transfer SUI, custom coins, and any objects.

```typescript

const recipient1 = '0x123'; // repace with real address
const recipient2 = '0x456'; // repace with real address

// transfer SUI to single recipient
await suiKit.transferSui(recipient1, 1000);
// transfer SUI to multiple recipients
await suiKit.transferSuiToMany([recipient1, recipient2], [1000, 2000]);

const coinType = '0xfb03984967f0390a426c16257d35f4a14811eefc32d648d2c66d603a9354f256::custom_coin::CUSTOM_COIN';
// Transfer custom coin to single recipient
await suiKit.transferCoin(recipient1, 1000, coinType);
// Transfer custom coin to multiple recipients
await suiKit.transferCoinToMany([recipient1, recipient2], [1000, 2000], coinType);

// Transfer objects
const objectIds = [
  '0xd09e2415f74a6b090387951a0297fdae72745fb0249e7e7029a9d0eafe2cab23',
  '0x7f7cfaaa3c95e38282ae2bf038bce5ea0482da3395155031c6c6f77a6f1d367b'
];
await suiKit.transferObjects(objectIds, recipient1);
```

### Stake SUI
You can use SuiKit to stake SUI.

```typescript
/**
 * This is an example of using SuiKit to stake SUI
 */
const stakeAmount = 1000;
const validatorAddress = '0x123'; // replace with real address
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

import { SuiKit, TransactionBlock } from '@scallop-dao/sui-kit';

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

## Advanced features

### Multi-accounts

SuiKit follows bip32 & bip39 standard, so you can use it to manage multiple accounts.
When init SuiKit, you can pass in your mnemonics to create a wallet with multiple accounts.

```typescript
/**
 * This is an example of using SuiKit to manage multiple accounts.
 */
import { SuiKit } from '@scallop-dao/sui-kit';

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

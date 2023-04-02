# Tookit for interacting with SUI network

## Features
- [x] Transfer SUI
- [x] Transfer Custom Coin
- [x] Publish move packages
- [x] Compatible with programmable transaction
- [x] Query data (balances, objects) from chain
- [x] Request faucet from devnet, testnet
- [x] Batch create sui accounts from mnemonic
- [x] Sign and send transactions

## Pre-requisites

1, Install the package

```bash
npm install
```

2, Set the environment variables

```bash
cp .env.example .env
```
Then set the environment variables in the `.env` file according to the documentation in it.

3, Install SUI cli (optional: only needed for publishing packages)

Please refer to the official documentation: [How to install SUI cli](https://docs.sui.io/devnet/build/install)


## How to use
```typescript
/**
 * This is an example of using SuiKit to publish a move package.
 */
import { SuiKit } from "sui-kit";

(async() => {
  const suiKit = new SuiKit()
  const balance = await suiKit.getBalance()
  if (balance.totalBalance <= 3000) {
    await suiKit.requestFaucet()
  }
  // Wait for 3 seconds before publish package
  await new Promise(resolve => setTimeout(() => resolve(true), 3000))

  const packagePath = path.join(__dirname, './sample_move/package_a')
  const result = await suiKit.publishPackage(packagePath)
  console.log('packageId: ' + result.packageId)
})();
```

```typescript
/**
 * This is an example of using SuiKit to transfer SUI from one account to another.
 */
import { SuiKit } from "../sui-kit";
import * as process from "process";
import dotenv from "dotenv";
dotenv.config();

(async() => {
  const displayBalance = async (suiKit: SuiKit) => {
    console.log(`balance for account ${suiKit.currentAddress()}: ${(await suiKit.getBalance()).totalBalance}`);
  }

  const mnemonics = process.env.MNEMONICS;

  // Account that will receive SUI
  const suiKitM = new SuiKit({ mnemonics, networkType: 'testnet' });
  await displayBalance(suiKitM)

  // Account that will send SUI
  const secretKey = process.env.SECRET_KEY;
  const suiKitS = new SuiKit({ secretKey, networkType: 'testnet' });
  await displayBalance(suiKitS)

  // Transfer all SUI from account S to account M except the gas budget
  const gasBudget = 10**3 * 1200;
  const balanceS = await suiKitS.getBalance();
  console.log(`Transfer ${balanceS.totalBalance - gasBudget} from ${suiKitS.currentAddress()} to ${suiKitM.currentAddress()}`)
  await suiKitS.transferSui(suiKitM.currentAddress(), balanceS.totalBalance - gasBudget)

  console.log('Wait 3 seconds for the transaction to be confirmed...')
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('After transfer:')
  await displayBalance(suiKitM)
  await displayBalance(suiKitS)
})();
```

```typescript
/**
 * This is an example of using SuiKit to transfer custom coin from one account to another.
 */
import { SuiKit } from "../sui-kit";
import * as process from "process";
import dotenv from "dotenv";
dotenv.config();

(async() => {
  const displayBalance = async (suiKit: SuiKit, accountIndex: number, coinType: string) => {
    console.log(`balance for account ${accountIndex}: ${(await suiKit.getBalance(coinType, { accountIndex } )).totalBalance}`);
  }

  const coinType = '0x88a66d984ade7c7f106e0c6a91cffa58b764811233363e6020978da3d358d9c4::custom_coin::CUSTOM_COIN'

  // Account that will receive SUI
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  await displayBalance(suiKit, 0, coinType)
  await displayBalance(suiKit, 1, coinType)

  console.log(`Transfer 100 coin from account0 to account1`)
  const recipient = suiKit.getAddress({ accountIndex: 1 })
  const amount = 100
  await suiKit.transferCoin(recipient, amount, coinType, { accountIndex: 0 })

  console.log('Wait 3 seconds for the transaction to be confirmed...')
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('After transfer:')
  await displayBalance(suiKit, 0, coinType)
  await displayBalance(suiKit, 1, coinType)
})();

```

```typescript
/**
 * This is an example of using SuiKit to manage multiple accounts.
 */
import dotenv from 'dotenv'
import { SuiKit } from '../sui-kit'
import {getShinamiFullNodeUrl} from "../sui-kit/lib/plugins/shinami";
dotenv.config()

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
const shinamiKey = process.env.SHINAMI_KEY || '';
const shinamiFullnode = getShinamiFullNodeUrl(shinamiKey);
const suiKit = new SuiKit({ mnemonics, fullnodeUrl: shinamiFullnode, networkType: 'testnet' })
checkAccounts(suiKit).then(() => {})
```

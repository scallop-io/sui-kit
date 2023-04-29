# Tookit for interacting with SUI network

[中文文档](./README_cn.md)

## Features
- [x] Transfer SUI, Custom Coin and objects.
- [x] Move call
- [x] Programmable transaction
- [x] Query on-chain data 
- [x] HD wallet multi-accounts
- [x] Publish & upgrade Move packages

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

const coinType = '<pkgId>::custom_coin::CUSTOM_COIN';
// Transfer custom coin to single recipient
await suiKit.transferCoin(recipient1, 1000, coinType);
// Transfer custom coin to multiple recipients
await suiKit.transferCoinToMany([recipient1, recipient2], [1000, 2000], coinType);

// Transfer objects
const objectIds = ['<objId1>', '<objId2>'];
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

### Move call
You can use SuiKit to call move functions.

```typescript
const res = await suiKit.moveCall({
  target: '0x2::coin::join',
  arguments: [coin0, coin1],
  typeArguments: [coinType],
});
console.log(res)
```

How to pass arguments? 
Suppose you have a move function like this:
```move
public entry fun test_args(
  addrs: vector<address>,
  name: vector<u8>,
  numbers: vector<u64>,
  bools: vector<bool>,
  coins: vector<Coin<SUI>>,
  ctx: &mut TxContext,
) {
  // ...
}
```
You can pass the arguments like this:
```typescript
const addr1 = '0x656b875c9c072a465048fc10643470a39ba331727719df46c004973fcfb53c95';
const addr2 = '0x10651e50cdbb4944a8fd77665d5af27f8abde6eb76a12b97444809ae4ddb1aad';
const coin1 = '0xd4a01b597b87986b04b65e04049499b445c0ee901fe8ba310b1cf29feaa86876';
const coin2 = '0x4d4a01b597b87986b04b65e04049499b445c0ee901fe8ba310b1cf29feaa8687';
suiKit.moveCall({
  target: `${pkgId}::module::test_args`,
  arguments: [
    // pass vector<address>, need to specify the vecType as 'address'
    {value: [addr1, addr2], vecType: 'address'},
    // pass vector<u8>, need to specify the vecType as 'u8'
    {value: [10, 20], vecType: 'u8'},
    // pass vector<u64>, default vecType for number array is 'u64', so no need to specify
    [34324, 234234],
    // pass vector<bool>, default vecType for boolean array is 'bool', so no need to specify
    [true, false],
    // pass vector<Coin<SUI>>, no need to specify the vecType for object array
    [coin1, coin2],
  ]
});
```
All the supported types are:
- address
- u8
- u16
- u32
- u64
- u128
- u256
- bool
- object

### Programmable transaction
With programmable transaction, you can send a transaction with multiple actions.
The following is an example using flashloan to make arbitrage.
(check [here](./examples/sample_move/custom_coin/sources/dex.move) for the corresponding Move contract code)


```typescript
import { SuiKit, SuiTxBlock } from "@scallop-dao/sui-kit";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

const treasuryA = '0xe5042357d2c2bb928f37e4d12eac594e6d02327d565e801eaf9aca4c7340c28c';
const treasuryB = '0xdd2f53171b8c886fad20e0bfecf1d4eede9d6c75762f169a9f3c3022e5ce7293';
const dexPool = '0x8a13859a8d930f3238ddd31180a5f0914e5b8dbaa31e18387066b61a563fedf9';

const pkgId = '0x3c316b6af0586343ce8e6b4be890305a1f83b7e196366f6435b22b6e3fc8e3d9';

(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics });
  const sender = suiKit.currentAddress();
  
  const tx = new SuiTxBlock();
  // 1. Make a flash loan for coinB
  const[coinB, loan] = tx.moveCall(
    `${pkgId}::custom_coin_b::flash_loan`,
    [treasuryB, 10 ** 9],
  );
  // 2. Swap from coinB to coinA, ratio is 1:1
  const coinA = tx.moveCall(
    `${pkgId}::dex::swap_a`,
    [dexPool, coinB],
  );
  // 3. Swap from coinA back to coinB, ratio is 1:2
  const coinB2 = tx.moveCall(
    `${pkgId}::dex::swap_b`,
    [dexPool, coinA]
  );
  // 4. Repay flash loan
  const [paybackCoinB] = tx.splitCoins(coinB2, [10 ** 9]);
  tx.moveCall(
    `${pkgId}::custom_coin_b::payback_loan`,
    [treasuryB, paybackCoinB, loan],
  );
  // 4. Transfer profits to sender
  tx.transferObjects([coinB2], sender);
  
  // 5. Execute transaction
  const res = await suiKit.signAndSendTxn(tx);
  console.log(res);
})();

```

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

### Publish & upgrade Move package
We have a standalone npm package to help you publish and upgrade Move package with typescript.

1. Install the package
```bash
npm install @scallop-dao/sui-package-kit
```

2. Install SUI cli
Please refer to the official documentation: [How to install SUI cli](https://docs.sui.io/devnet/build/install)

```typescript
/**
 * This is an example of using SuiKit to publish a move package
 */
import { SuiKit } from "@scallop-dao/sui-kit";
import { SuiPackagePublisher } from "@scallop-dao/sui-package-kit";

(async() => {
  const mnemonics = '<Your mnemonics>';
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });
  
  const packagePath = path.join(__dirname, './sample_move/package_a');
  const publisher = new SuiPackagePublisher();
  const result = await publisher.publishPackage(packagePath, suiKit.getSigner());
  console.log('packageId: ' + result.packageId);
})();
```

```typescript
/**
 * This is an example of using SuiKit to upgrade a move package
 */
import { SuiKit } from "@scallop-dao/sui-kit";
import { SuiPackagePublisher } from "@scallop-dao/sui-package-kit";

(async() => {
  const mnemonics = '<Your mnemonics>';
  const suiKit = new SuiKit({ mnemonics, networkType: 'devnet' });

  const upgradeCapId = '<Package upgrade cap id>';
  // Rember to set the 'published-at' in the package manifest
  const packagePath = path.join(__dirname, './sample_move/package_a_upgrade');
  const publisher = new SuiPackagePublisher();
  const result = await publisher.upgradePackage(packagePath, upgradeCapId, { skipFetchLatestGitDeps: true });
  console.log(result);
})();
```

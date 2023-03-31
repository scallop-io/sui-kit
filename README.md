# Tookit for interacting with SUI network

## Features
- [x] Publish move packages
- [x] Request faucet from devnet, testnet
- [x] Batch create sui accounts from mnemonic
- [x] Sign and send transactions
- [x] Query data (balances, objects) from chain

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
import { SuiKit } from "sui-kit";

(async() => {
	// init sui kit
	const secretKey = '<replace with secret key: both hex and base64 are supported>';
	const suiKit = new SuiKit({ secretKey, networkType: 'testnet' })
  
	// request faucet
  await suiKit.requestFaucet()
  
  // sign and send transaction
	
	// publish package
	const packagePath = '/path/to/package'
	const result = await suiKit.publishPackage(packagePath)
	console.log('packageId: ' + result.packageId)
})();
```

Advanced features: manage multiple accounts from mnemonic

```typescript
import { SuiKit } from "sui-kit";

const mnemonics = '<replace with your mnemonic>';
// init sui kit with mnemonic
const suiKit = new SuiKit({ mnemonics })
for (let i = 0; i < 10; i++) {
  // after switch account, the query and transaction will be signed by the account
	suiKit.switchAccount({ accountIndex: i });
	const address = suiKit.getAddress();
	console.log(`address for account ${i}: ${address}`)
  suiKit.getBalance().then((balance) => {
    console.log(`balance for account ${i}: ${balance.totalBalance}`)
  })
}
```

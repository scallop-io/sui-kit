# SUI网络交互工具箱

## 特点
- [x] 相比于Mystenlab的SDK，更加易于使用
- [x] 支持转账SUI和自定义代币
- [x] 从开发网络和测试网络请求水龙头
- [x] 质押SUI
- [x] 兼容可编程交易
- [x] 发布 move 包
- [x] 交易检查（无需 gas 的交易检查）
- [x] 高级特性：新增多账户支持

## 先决条件

1. 安装包

```bash
npm install @scallop-io/sui-kit
```

2. 安装SUI cli（可选：仅在发布包时需要）
请参考官方文档：[如何安装 SUI cli](https://docs.sui.io/devnet/build/install)

## 如何使用

### 转账
你可以使用SuiKit来转账SUI和其他代币。

```typescript
/**
 * 这是使用 SuiKit 将代币从一个账户转到另一个账户的示例。
 */
import { SuiKit } from '@scallop-io/sui-kit';

const secretKey = '<秘钥>';
const suiKit = new SuiKit({ secretKey });
const recipient = '0xCAFE';
suiKit.transferSui(recipient, 1000).then(() => console.log('转账了 1000 SUI'));
suiKit.transferCoin(recipient, 1000, '0xCOFFEE::coin::COIN').then(
  () => console.log('转账了 1000 COIN')
);
```

### 请求水龙头
你可以使用SuiKit来从开发网络和测试网络请求水龙头。

```typescript
import { SuiKit } from '@scallop-io/sui-kit';

const secretKey = '<密钥>';
const suiKit = new SuiKit({ secretyKey,  networkType: 'devnet' });
suiKit.requestFaucet().then(() => {
  console.log('请求水龙头成功');
});
```

### 质押SUI
你可以使用SuiKit来质押SUI。

```typescript
/**
 * 这是一个使用 SuiKit 质押 SUI 的示例
 */
import { SuiKit } from '@scallop-io/sui-kit';

const secretKey = '<密钥>';
const suiKit = new SuiKit({ secretyKey,  networkType: 'devnet' });
const stakeAmount = 1000;
const validatorAddress = '0x123';
suiKit.stakeSui(stakeAmount, validatorAddress).then(() => {
  console.log('质押成功');
});

```

### 可编程交易
通过可编程交易，您可以在一个交易中发送多个操作。下面的示例演示如何在一笔交易中向多个账户转账 SUI。

```typescript
/**
 * 这个示例演示如何使用 SuiKit 进行可编程交易
 */

import { SuiKit, TransactionBlock } from '@scallop-io/sui-kit';

const secretKey = '<密钥>';
const suiKit = new SuiKit({ secretKey });

// 构建一个交易块以将代币发送到多个账户
const tx = new TransactionBlock();

const recipients = ['0x123', '0x456', '0x789'];
recipients.forEach(recipient => {
  const [coin] = tx.splitCoins(tx.gas, [tx.pure(1000)]);
  tx.transferObjects([coin], tx.pure(recipient));
});

// 发送交易
suiKit.signAndSendTxn(tx).then(response => {
  console.log('交易摘要: ' + response.digest);
});
```

### 发布 move 模块
您可以使用 SuiKit 将 move 包发布到 SUI 网络中。
注意：您需要先安装 SUI cli。（[请参见先决条件](#先决条件)）

```typescript
/**
 * 这个示例演示如何使用 SuiKit 发布 move 模块
 */
import { SuiKit, SuiPackagePublisher } from '@scallop-io/sui-kit';

(async() => {
  const secretKey = '<密钥>';
  const suiKit = new SuiKit({ secretKey, networkType: 'devnet' });
  // 如果余额不足，则请求水龙头
  const balance = await suiKit.getBalance();
  if (balance.totalBalance <= 3000) {
    await suiKit.requestFaucet();
  }
  // 等待 3 秒后再发布包
  await new Promise(resolve => setTimeout(() => resolve(true), 3000));

  // 发布包
  const packagePath = path.join(__dirname, './example/sample_move/custom_coin');
  const publisher = new SuiPackagePublisher();
  const result = await publisher.publishPackage(packagePath, suiKit.getSigner());
  console.log('包ID: ' + result.packageId);
})();
```

## 高级特性

### 多账户支持
SuiKit 遵循 bip32 和 bip39 标准，因此您可以使用它来管理多个账户。
下面这段代码展示了如何使用 SuiKit 来管理多个账户。在初始化 SuiKit 时，您可以传入助记词以创建具有多个账户的钱包。
代码中，`checkAccounts` 函数打印了前十个账户的余额信息。在循环中，它使用 getAddress 和 getBalance 函数获取特定账户的地址和余额。

`internalTransferSui` 函数实现了内部账户之间的转账。

```typescript
/**
 * 这是一个使用 SuiKit 管理多个账户的示例代码
 */
import { SuiKit } from '@scallop-io/sui-kit';

// 展示 SUI 在多个账户中的余额
async function checkAccounts(suiKit: SuiKit) {
  const displayAccounts = async (suiKit: SuiKit, accountIndex: number) => {
    const coinType = '0x2::sui::SUI'
    const addr = suiKit.getAddress({accountIndex})
    const balance = (await suiKit.getBalance(coinType, {accountIndex})).totalBalance
    console.log(`账户 ${accountIndex}: ${addr} 余额为 ${balance} SUI`)
  }
  // 显示前10个账户
  const numAccounts = 10
  for (let i = 0; i < numAccounts; i++) {
    await displayAccounts(suiKit, i)
  }
}

// 在多个账户之间进行 SUI 转账
async function internalTransferSui(suiKit: SuiKit, fromAccountIndex: number, toAccountIndex: number, amount: number) {
  const toAddr = suiKit.getAddress({accountIndex: toAccountIndex })
  console.log(`从账户 ${fromAccountIndex} 转账 ${amount} SUI 到账户 ${toAccountIndex}`)
  return await suiKit.transferSui(toAddr, amount,  {accountIndex: fromAccountIndex})
}

// 读取环境变量 MNEMONICS，生成 SuiKit 实例
const mnemonics = process.env.MNEMONICS;
const suiKit = new SuiKit({ mnemonics })
checkAccounts(suiKit).then(() => {})
// 从账户 0 转账 1000 SUI 到账户 1
internalTransferSui(suiKit, 0, 1, 1000).then(() => {})

```

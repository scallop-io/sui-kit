import { SuiKit } from "../src";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const suiKit = new SuiKit({mnemonics: process.env.MNEMONICS, networkType: 'devnet'});
  console.log('sender', suiKit.currentAddress());
  
  const recipient1 = suiKit.getAddress({accountIndex: 1});
  const recipient2 = suiKit.getAddress({accountIndex: 2});
  
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
}

main().then(() => console.log('Done')).catch(e => console.error(e));

import { SuiKit } from "@scallop-dao/sui-kit";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics });
  console.log('sender', suiKit.currentAddress());
  
  // use internal accounts as recipients
  const recipient1 = suiKit.getAddress({accountIndex: 1});
  const recipient2 = suiKit.getAddress({accountIndex: 2});
  
  // transfer SUI to single recipient
  await suiKit.transferSui(recipient1, 1000);
  // transfer SUI to multiple recipients
  await suiKit.transferSuiToMany([recipient1, recipient2], [1000, 2000]);
  //
  const coinType = '0x2d2d9b97f29c9651c4108e6906ab0a58c2e2a0d564f1f9361185bcf056d0b768::custom_coin::CUSTOM_COIN';
  // Transfer custom coin to single recipient
  await suiKit.transferCoin(recipient1, 1000, coinType);
  // Transfer custom coin to multiple recipients
  await suiKit.transferCoinToMany([recipient1, recipient2], [1000, 2000], coinType);
  //
  // Transfer objects
  const objectIds = [
    '0xb087e7294498e0f88edd7c15bfd227a704e368d81ea2a85075e3b845f7b97423',
    '0xf74564461b31f58009770c1aa33fba85867f9807f67ecd73bb440d3b4bc29ab6'
  ];
  await suiKit.transferObjects(objectIds, recipient1);
}

main().then(() => console.log('Done')).catch(e => console.error(e));

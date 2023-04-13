import { SuiKit } from "@scallop-dao/sui-kit";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics });
  
  const coin0 = '0x0620e3fb3780ca801703982da9be426449f5f4ca106fa6baf58fd01696c2bd2d';
  const coin1 = '0xfc8a9124c692981a16d13cd23efa6a26037718193ad359b3d0b96c5445448c1f';
  const coinType = '0x2d2d9b97f29c9651c4108e6906ab0a58c2e2a0d564f1f9361185bcf056d0b768::custom_coin::CUSTOM_COIN';
  const res = await suiKit.moveCall({
    target: '0x2::coin::join',
    arguments: [coin0, coin1],
    typeArguments: [coinType],
  });
  console.log(res)
})();

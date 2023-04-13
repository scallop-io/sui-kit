import { SuiKit } from "@scallop-dao/sui-kit";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics });
  
  const amountToStake = 10**9 // 1 SUI
  const validatorAddress = '0x468afdeaa2026f07049fe78cccdb3e846528e9e36d7eacca3ff206eb4cb72381';
  const res = await suiKit.stakeSui(amountToStake, validatorAddress);
  console.log(res)
})();

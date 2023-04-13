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
  // 1. Make a flash loan
  const[coinB, loan] = tx.moveCall(
    `${pkgId}::custom_coin_b::flash_loan`,
    [treasuryB, 10 ** 9],
  );
  // 2. Swap token on DEX
  const coinA = tx.moveCall(
    `${pkgId}::dex::swap_a`,
    [dexPool, coinB],
  );
  const coinB2 = tx.moveCall(
    `${pkgId}::dex::swap_b`,
    [dexPool, coinA]
  );
  // 3. Repay flash loan
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

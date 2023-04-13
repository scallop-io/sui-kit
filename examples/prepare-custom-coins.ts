import { SuiKit, SuiTxBlock } from "@scallop-dao/sui-kit";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

const adminCapA = '0x7ee19591191d005d370ce1fc1e47448fe2d94e966274c7fd9ee77de56c91e03c';
const adminCapB = '0xd13d8b1b5005b4eca0326b5414e0b44d03d4cde9936ce33c7f54e461515cd159';
const treasuryA = '0xe5042357d2c2bb928f37e4d12eac594e6d02327d565e801eaf9aca4c7340c28c';
const treasuryB = '0xdd2f53171b8c886fad20e0bfecf1d4eede9d6c75762f169a9f3c3022e5ce7293';
const dexPool = '0x8a13859a8d930f3238ddd31180a5f0914e5b8dbaa31e18387066b61a563fedf9';

const pkgId = '0x3c316b6af0586343ce8e6b4be890305a1f83b7e196366f6435b22b6e3fc8e3d9';


(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({mnemonics});
  
  const tx = new SuiTxBlock();
  const coinA = tx.moveCall(
    `${pkgId}::custom_coin_a::mint`,
    [adminCapA, treasuryA, 10 ** 11],
  );
  const coinB = tx.moveCall(
    `${pkgId}::custom_coin_b::mint`,
    [adminCapB, treasuryB, 10 ** 11],
  );
  tx.moveCall(
    `${pkgId}::dex::top_up`,
    [dexPool, coinA, coinB],
  );
  const res = await suiKit.signAndSendTxn(tx);
  console.log(res)
})();

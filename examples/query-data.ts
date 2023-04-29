import { SuiKit, SuiTxBlock } from "@scallop-dao/sui-kit";
import * as process from "process";
import * as dotenv from "dotenv";
dotenv.config();

(async() => {
  const mnemonics = process.env.MNEMONICS;
  const suiKit = new SuiKit({ mnemonics });
  
  // query balance
  const balance = suiKit.getBalance();
  console.log(balance);
  
  // insect transaction
  const tx = new SuiTxBlock();
  tx.moveCall(`<pkgId>::<module>::<method>`, ['arg1', 'arg2']);
  const inpsectResult = suiKit.inspectTxn(tx);
  console.log(inpsectResult);
  
  // fallback to use raw provider, do anything the provider can do
  const provider = suiKit.provider();
  provider.queryEvents({
    query: {
      Sender: '0x123',
    }
  })
})();

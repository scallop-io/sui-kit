import { describe, it, expect } from 'vitest';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { SuiAccountManager } from '../src/libs/suiAccountManager';
import { MultiSigClient } from '../src/libs/multiSig';

const ENABLE_LOG = true;

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test MultiSigClient', async () => {
  const mnemonics =
    'elite balcony laundry unique quit flee farm dry buddy outside airport service';
  const accountManager = new SuiAccountManager({ mnemonics });
  const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

  const rawPubkeys: string[] = [];
  for (let i = 0; i < 5; i++) {
    const keypair = accountManager.getKeyPair({ accountIndex: i });
    const pubkey = keypair.getPublicKey().toSuiPublicKey();
    rawPubkeys.push(pubkey);
  }

  const weights = [2, 1, 1, 1, 1];
  const threshold = 3;
  const expectedMultiSigAddress =
    '0x9beec666af1077857edc0172d0f5624f6f4f15d02159769b3f4935a41985ebf4';

  const multiSigClient = MultiSigClient.fromRawEd25519PublicKeys(
    rawPubkeys,
    weights,
    threshold
  );

  it('Test multiSig address', async () => {
    const multiSigAddress = multiSigClient.multiSigAddress();

    if (ENABLE_LOG) {
      console.log(`Calculated multiSig address: ${multiSigAddress}`);
      console.log(`Expected multiSig address: ${expectedMultiSigAddress}`);
    }

    expect(multiSigAddress).toEqual(expectedMultiSigAddress);
  });

  it('Test multiSig combine with weight 2 + 1 should success', async () => {
    const tx = new TransactionBlock();
    const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure(1)]);
    tx.transferObjects([suiCoin], tx.pure(expectedMultiSigAddress));
    tx.setSender(expectedMultiSigAddress);

    const txBytes = await tx.build({ client: suiClient });

    const sig1 = await accountManager
      .getKeyPair({ accountIndex: 0 })
      .signTransactionBlock(txBytes);
    const sig2 = await accountManager
      .getKeyPair({ accountIndex: 1 })
      .signTransactionBlock(txBytes);
    const sigs = [sig1.signature, sig2.signature];

    const signature = multiSigClient.combinePartialSigs(sigs);
    const result = await suiClient.executeTransactionBlock({
      transactionBlock: txBytes,
      signature,
      options: {
        showEffects: true,
      },
    });

    if (ENABLE_LOG) {
      console.log(result);
    }

    expect(result.effects && result.effects.status.status === 'success').toBe(
      true
    );
  });

  it('Test multiSig combine with weight 1 + 1 + 1 should success', async () => {
    const tx = new TransactionBlock();
    const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure(1)]);
    tx.transferObjects([suiCoin], tx.pure(expectedMultiSigAddress));
    tx.setSender(expectedMultiSigAddress);

    const txBytes = await tx.build({ client: suiClient });

    const sig1 = await accountManager
      .getKeyPair({ accountIndex: 1 })
      .signTransactionBlock(txBytes);
    const sig2 = await accountManager
      .getKeyPair({ accountIndex: 2 })
      .signTransactionBlock(txBytes);
    const sig3 = await accountManager
      .getKeyPair({ accountIndex: 3 })
      .signTransactionBlock(txBytes);
    const sigs = [sig1.signature, sig2.signature, sig3.signature];

    const signature = multiSigClient.combinePartialSigs(sigs);
    const result = await suiClient.executeTransactionBlock({
      transactionBlock: txBytes,
      signature,
      options: {
        showEffects: true,
      },
    });

    if (ENABLE_LOG) {
      console.log(result);
    }

    expect(result.effects && result.effects.status.status === 'success').toBe(
      true
    );
  });
});

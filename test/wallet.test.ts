import { describe, it, expect } from 'vitest';
import * as dotenv from 'dotenv';
import nacl from 'tweetnacl';
import { sha256 } from '@noble/hashes/sha256';
import { secp256k1 } from '@noble/curves/secp256k1';
import { secp256r1 } from '@noble/curves/p256';
import { WalletKit } from '../src/kits/wallet';
import { color } from '../src/kits/utils/common';

dotenv.config();

const ENABLE_LOG = true;

const TEST_KEYS = {
  ED25519: {
    hex32: '0x99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828',
    hex64:
      '0x99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f4988281b2f49096e3e5dbd0fcfa9c0c0cd92d9ab3b21544b34d5dd4a65d98b878b9922',
    base6432: 'mdqVWeFekT7pqy5T49+tV12jO0m+ESW7ki4zSU9JiCg=',
    bech32:
      'suiprivkey1qzva492eu90fz0hf4vh98c7l44t4mgemfxlpzfdmjghrxj20fxyzss0q55k',
    publicKey: 'Gy9JCW4+Xb0Pz6nAwM2S2as7IVRLNNXdSmXZi4eLmSI=',
    address:
      '0x79088c4883a33769473f548e738ec96bfa00cefbed34b4be0970dacda7135de4',
  },
  Secp256k1: {
    hex32: '0x99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828',
    base6432: 'mdqVWeFekT7pqy5T49+tV12jO0m+ESW7ki4zSU9JiCg=',
    bech32:
      'suiprivkey1qxva492eu90fz0hf4vh98c7l44t4mgemfxlpzfdmjghrxj20fxyzs2s4thp',
    publicKey: 'ArjO+2br9ElgxJ9GGBLkcK04Sgr5Syt2wRHwJaCVR+z1',
    address:
      '0xeb9aea5a472b5a75d7835f08cb4d05a669a3232a05f55f328eefb4913f006a53',
  },
  Secp256r1: {
    hex32: '0x99da9559e15e913ee9ab2e53e3dfad575da33b49be1125bb922e33494f498828',
    base6432: 'mdqVWeFekT7pqy5T49+tV12jO0m+ESW7ki4zSU9JiCg=',
    bech32:
      'suiprivkey1q2va492eu90fz0hf4vh98c7l44t4mgemfxlpzfdmjghrxj20fxyzsdcrrj3',
    publicKey: 'AlUAxpA3QKyzGdZVZbNYlpV28jkpFsFAFkxjgMhjGSXR',
    address:
      '0xa3b92e5cef90450217b9210c567f64bc059793075b6cc91c288be5ca8937493c',
  },
};

describe('Test WalletKit', () => {
  it('Create Ed25519 keypair from hex format 32-bytes legacy secret key', async () => {
    const walletKit = new WalletKit({ secretKey: TEST_KEYS.ED25519.hex32 });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.ED25519.hex32));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(TEST_KEYS.ED25519.address);
  });

  it('Create Ed25519 keypair from hex format 64-bytes legacy secret key', async () => {
    const walletKit = new WalletKit({ secretKey: TEST_KEYS.ED25519.hex64 });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.ED25519.hex64));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(TEST_KEYS.ED25519.address);
  });

  it('Create Ed25519 keypair from base64 format 32-bytes secret key', async () => {
    const walletKit = new WalletKit({ secretKey: TEST_KEYS.ED25519.base6432 });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.ED25519.base6432));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(TEST_KEYS.ED25519.address);
  });

  it('Create Ed25519 keypair from bech32 format secret key', async () => {
    const walletKit = new WalletKit({ secretKey: TEST_KEYS.ED25519.bech32 });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.ED25519.bech32));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(TEST_KEYS.ED25519.address);
  });

  it('Create Secp256k1 keypair from hex format 32-bytes legacy secret key', async () => {
    const walletKit = new WalletKit({
      secretKey: TEST_KEYS.Secp256k1.hex32,
      scheme: 'Secp256k1',
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.Secp256k1.hex32));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(
      TEST_KEYS.Secp256k1.address
    );
  });

  it('Create Secp256k1 keypair from base64 format 32-bytes secret key', async () => {
    const walletKit = new WalletKit({
      secretKey: TEST_KEYS.Secp256k1.base6432,
      scheme: 'Secp256k1',
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.Secp256k1.base6432));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(
      TEST_KEYS.Secp256k1.address
    );
  });

  it('Create Secp256k1 keypair from bech32 format secret key', async () => {
    const walletKit = new WalletKit({
      secretKey: TEST_KEYS.Secp256k1.bech32,
      scheme: 'Secp256k1',
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.Secp256k1.bech32));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(
      TEST_KEYS.Secp256k1.address
    );
  });

  it('Create Secp256r1 keypair from hex format 32-bytes legacy secret key', async () => {
    const walletKit = new WalletKit({
      secretKey: TEST_KEYS.Secp256r1.hex32,
      scheme: 'Secp256r1',
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.Secp256r1.hex32));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(
      TEST_KEYS.Secp256r1.address
    );
  });

  it('Create Secp256r1 keypair from base64 format 32-bytes secret key', async () => {
    const walletKit = new WalletKit({
      secretKey: TEST_KEYS.Secp256r1.base6432,
      scheme: 'Secp256r1',
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.Secp256r1.base6432));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(
      TEST_KEYS.Secp256r1.address
    );
  });

  it('Create Secp256r1 keypair from bech32 format secret key', async () => {
    const walletKit = new WalletKit({
      secretKey: TEST_KEYS.Secp256r1.bech32,
      scheme: 'Secp256r1',
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('SecretKey:', color('green')(TEST_KEYS.Secp256r1.bech32));
    }

    expect(walletKit.keypair.toSuiAddress()).toEqual(
      TEST_KEYS.Secp256r1.address
    );
  });

  it('Create Ed25519 keypair from Mnemonics', async () => {
    const mnemonics =
      'inside road slice top brief seek truck vocal slender submit define grief index rib kiss cargo giant plug economy field mouse pulp spoon destroy';
    const walletKit = new WalletKit({ mnemonics });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('Mnemonics:', color('green')(mnemonics));
      console.info('Wallet Address:', color('green')(walletKit.address));
    }

    const signData = new TextEncoder().encode('hello world');
    const signature = await walletKit.keypair.sign(signData);
    const isValid = nacl.sign.detached.verify(
      signData,
      signature,
      walletKit.keypair.getPublicKey().toRawBytes()
    );
    expect(isValid).toBeTruthy();
  });

  it('Create Ed25519 keypair from Mnemonics with derivation path', async () => {
    const mnemonics =
      'inside road slice top brief seek truck vocal slender submit define grief index rib kiss cargo giant plug economy field mouse pulp spoon destroy';
    const walletKit = new WalletKit({ mnemonics: mnemonics });
    walletKit.switchKeypairForMnemonics({
      accountIndex: 0,
      isExternal: true,
      addressIndex: 0,
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('Mnemonics:', color('green')(mnemonics));
      console.info('Wallet Address:', color('green')(walletKit.address));
    }

    const signData = new TextEncoder().encode('hello world');
    const signature = await walletKit.keypair.sign(signData);
    const isValid = nacl.sign.detached.verify(
      signData,
      signature,
      walletKit.keypair.getPublicKey().toRawBytes()
    );
    expect(isValid).toBeTruthy();
  });

  it('Create Secp256k1 keypair from Mnemonics', async () => {
    const mnemonics =
      'inside road slice top brief seek truck vocal slender submit define grief index rib kiss cargo giant plug economy field mouse pulp spoon destroy';
    const walletKit = new WalletKit({ mnemonics, scheme: 'Secp256k1' });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('Mnemonics:', color('green')(mnemonics));
      console.info('Wallet Address:', color('green')(walletKit.address));
    }

    const signData = new TextEncoder().encode('hello world');
    const msgHash = sha256(signData);
    const signature = await walletKit.keypair.sign(signData);
    const isValid = secp256k1.verify(
      secp256k1.Signature.fromCompact(signature),
      msgHash,
      walletKit.keypair.getPublicKey().toRawBytes()
    );
    expect(isValid).toBeTruthy();
  });

  it('Create Secp256k1 keypair from Mnemonics with derivation path', async () => {
    const mnemonics =
      'inside road slice top brief seek truck vocal slender submit define grief index rib kiss cargo giant plug economy field mouse pulp spoon destroy';
    const walletKit = new WalletKit({ mnemonics, scheme: 'Secp256k1' });
    walletKit.switchKeypairForMnemonics({
      accountIndex: 1,
      isExternal: false,
      addressIndex: 0,
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('Mnemonics:', color('green')(mnemonics));
      console.info('Wallet Address:', color('green')(walletKit.address));
    }

    const signData = new TextEncoder().encode('hello world');
    const msgHash = sha256(signData);
    const signature = await walletKit.keypair.sign(signData);
    const isValid = secp256k1.verify(
      secp256k1.Signature.fromCompact(signature),
      msgHash,
      walletKit.keypair.getPublicKey().toRawBytes()
    );
    expect(isValid).toBeTruthy();
  });

  it('Create Secp256r1 keypair from Mnemonics', async () => {
    const mnemonics =
      'inside road slice top brief seek truck vocal slender submit define grief index rib kiss cargo giant plug economy field mouse pulp spoon destroy';
    const walletKit = new WalletKit({ mnemonics, scheme: 'Secp256r1' });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('Mnemonics:', color('green')(mnemonics));
      console.info('Wallet Address:', color('green')(walletKit.address));
    }

    const signData = new TextEncoder().encode('hello world');
    const msgHash = sha256(signData);
    const signature = await walletKit.keypair.sign(signData);
    const isValid = secp256r1.verify(
      secp256r1.Signature.fromCompact(signature),
      msgHash,
      walletKit.keypair.getPublicKey().toRawBytes()
    );
    expect(isValid).toBeTruthy();
  });

  it('Create Secp256r1 keypair from Mnemonics with derivation path', async () => {
    const mnemonics =
      'inside road slice top brief seek truck vocal slender submit define grief index rib kiss cargo giant plug economy field mouse pulp spoon destroy';
    const walletKit = new WalletKit({ mnemonics, scheme: 'Secp256r1' });
    walletKit.switchKeypairForMnemonics({
      accountIndex: 1,
      isExternal: false,
      addressIndex: 0,
    });

    if (ENABLE_LOG) {
      console.info('Scheme:', color('green')(walletKit.keypair.getKeyScheme()));
      console.info('Mnemonics:', color('green')(mnemonics));
      console.info('Wallet Address:', color('green')(walletKit.address));
    }

    const signData = new TextEncoder().encode('hello world');
    const msgHash = sha256(signData);
    const signature = await walletKit.keypair.sign(signData);
    const isValid = secp256r1.verify(
      secp256r1.Signature.fromCompact(signature),
      msgHash,
      walletKit.keypair.getPublicKey().toRawBytes()
    );
    expect(isValid).toBeTruthy();
  });
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bcs/index': 'src/bcs/index.ts',
    'client/index': 'src/client/index.ts',
    'cryptography/index': 'src/cryptography/index.ts',
    'faucet/index': 'src/faucet/index.ts',
    'graphql/index': 'src/graphql/index.ts',
    'keypairs/ed25519/index': 'src/keypairs/ed25519/index.ts',
    'keypairs/secp256k1/index': 'src/keypairs/secp256k1/index.ts',
    'keypairs/secp256r1/index': 'src/keypairs/secp256r1/index.ts',
    'multisig/index': 'src/multisig/index.ts',
    'transactions/index': 'src/transactions/index.ts',
    'utils/index': 'src/utils/index.ts',
    'verify/index': 'src/verify/index.ts',
    'zklogin/index': 'src/zklogin/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
  },
  splitting: true,
  sourcemap: true,
  clean: true,
});

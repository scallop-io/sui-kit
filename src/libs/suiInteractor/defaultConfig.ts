import {
  localnetConnection,
  devnetConnection,
  testnetConnection,
  mainnetConnection,
} from '@mysten/sui.js';
import type { Connection } from '@mysten/sui.js';
import type { NetworkType } from 'src/types';
export const defaultGasBudget = 10 ** 8; // 0.1 SUI, should be enough for most of the transactions
export const defaultGasPrice = 1000; // 1000 MIST


/**
 * @description Get the default fullnode url and faucet url for the given network type
 * @param networkType, 'testnet' | 'mainnet' | 'devnet' | 'localnet', default is 'devnet'
 * @returns { fullNode: string, websocket: string, faucet?: string }
 */
export const getDefaultConnection = (
  networkType: NetworkType = 'devnet'
): Connection => {
  switch (networkType) {
    case 'localnet':
      return localnetConnection;
    case 'devnet':
      return devnetConnection;
    case 'testnet':
      return testnetConnection;
    case 'mainnet':
      return mainnetConnection;
    default:
      return devnetConnection;
  }
};

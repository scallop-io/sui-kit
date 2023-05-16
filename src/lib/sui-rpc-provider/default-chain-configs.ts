import {
  localnetConnection,
  devnetConnection,
  testnetConnection,
  mainnetConnection,
} from '@mysten/sui.js'
import type { Connection } from '@mysten/sui.js'

export type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

/**
 * @description Get the default fullnode url and faucet url for the given network type
 * @param networkType, 'testnet' | 'mainnet' | 'devnet' | 'localnet', default is 'devnet'
 * @returns { fullNode: string, websocket: string, faucet?: string }
  */
export const getDefaultNetworkParams = (networkType: NetworkType = 'devnet'): Connection => {
  switch (networkType) {
    case 'localnet':
      return localnetConnection
    case 'devnet':
      return devnetConnection
    case 'testnet':
      return testnetConnection
    case 'mainnet':
      return mainnetConnection
    default:
      return devnetConnection
  }
}

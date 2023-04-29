/**
 * @description This file is used to store the default chain parameters for the different networks.
 * @author IceFox@Scallop
 */
// For localhost
export const DEFAULT_LOCALHOST_FULLNODE = "http://0.0.0.0:9000"
export const DEFAULT_LOCALHOST_FAUCET = ""

// For devnet
export const DEFAULT_DEVNET_FULLNODE ="https://fullnode.devnet.sui.io:443"
export const DEFAULT_DEVNET_FAUCET = "https://faucet.devnet.sui.io/gas"

// For testnet
export const DEFAULT_TESTNET_FULLNODE = "https://fullnode.testnet.sui.io:443"
export const DEFAULT_TESTNET_FAUCET = "https://faucet.testnet.sui.io/gas"

// For mainnet
export const DEFAULT_MAINNET_FULLNODE = "https://fullnode.mainnet.sui.io:443"
export const DEFAULT_MAINNET_FAUCET = ""


export type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'localhost';

/**
 * @description Get the default fullnode url and faucet url for the given network type
 * @param networkType, 'testnet' | 'mainnet' | 'devnet' | 'localhost', default is 'devnet'
 * @returns { fullNode: string, faucet: string }
  */
export const getDefaultNetworkParams = (networkType: NetworkType = 'devnet'): { fullNode: string, faucet: string } => {
  switch (networkType) {
    case 'localhost':
      return {
        fullNode: DEFAULT_LOCALHOST_FULLNODE,
        faucet: DEFAULT_LOCALHOST_FAUCET,
      }
    case 'testnet':
      return {
        fullNode: DEFAULT_TESTNET_FULLNODE,
        faucet: DEFAULT_TESTNET_FAUCET,
      }
    case 'mainnet':
      return {
        fullNode: DEFAULT_MAINNET_FULLNODE,
        faucet: DEFAULT_MAINNET_FAUCET,
      }
    default:
      return {
        fullNode: DEFAULT_DEVNET_FULLNODE,
        faucet: DEFAULT_DEVNET_FAUCET,
      }
  }
}

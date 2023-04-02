import {JsonRpcProvider, FaucetRateLimitError, assert, FaucetResponse} from '@mysten/sui.js'
import { retry } from 'ts-retry-promise'

/**
 * Request some SUI from faucet
 * @param address
 * @param provider
 * @returns {Promise<boolean>}, return true if the request is successful
 */
export const requestFaucet = async (address: string, provider: JsonRpcProvider) => {
  console.log('\nRequesting SUI from faucet for address: ', address)
  const resp = await retry<FaucetResponse>(() => provider.requestSuiFromFaucet(address), {
    backoff: 'EXPONENTIAL',
    // overall timeout in 60 seconds
    timeout: 1000 * 60,
    // skip retry if we hit the rate-limit error
    retryIf: (error: any) => !(error instanceof FaucetRateLimitError),
    logger: (msg) => console.warn(`Retry requesting faucet: ${msg}`.yellow),
  });
  assert(resp, FaucetResponse, 'Request faucet failed\n'.red);
  console.log('Request faucet success\n'.green);
}

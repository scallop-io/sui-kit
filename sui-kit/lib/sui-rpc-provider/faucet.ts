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
  // We need to add the following headers to the request, otherwise the request will be rejected by the faucet server
  const httpHeaders = {
    'origin': 'chrome-extension://opcgpfmipidbgpenhmajoajpbobppdil',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'accept': 'accept: */*',
    'authority': 'faucet.testnet.sui.io',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'cookie': 'sui_io_cookie={"level":["necessary","analytics"],"revision":0,"data":null,"rfc_cookie":false};'
  }
  const resp = await retry<FaucetResponse>(() => provider.requestSuiFromFaucet(address, httpHeaders), {
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

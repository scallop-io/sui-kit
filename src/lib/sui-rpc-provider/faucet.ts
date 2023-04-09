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
  const headers = {
    authority: 'faucet.testnet.sui.io',
    method: 'POST',
    path: '/gas',
    scheme: 'https',
    accept: '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
    'content-length': '105',
    'content-type': 'application/json',
    'origin': 'chrome-extension://opcgpfmipidbgpenhmajoajpbobppdil',
    cookie: '_ga=GA1.1.2092533979.1664032306; sui_io_cookie={"level":["necessary","analytics"],"revision":0,"data":null,"rfc_cookie":false}; _ga_YKP53WJMB0=GS1.1.1680531285.31.0.1680531334.11.0.0; _ga_0GW4F97GFL=GS1.1.1680826187.125.0.1680826187.60.0.0; __cf_bm=6rPjXUwuzUPy4yDlZuXgDj0v7xLPpUd5z0CFGCoN_YI-1680867579-0-AZMhU7/mKUUbUlOa27LmfW6eIFkBkXsPKqYgWjpjWpj2XzDckgUsRu/pxSRGfvXCspn3w7Df+uO1MR/b+XikJU0=; _cfuvid=zjwCXMmu19KBIVo_L9Qbq4TqFXJpophG3.EvFTxqdf4-1680867579342-0-604800000',
    'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': "macOS",
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'none',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  }
  // We need to add the following headers to the request, otherwise the request will be rejected by the faucet server
  const resp = await retry<FaucetResponse>(() => provider.requestSuiFromFaucet(address, headers), {
    backoff: 'EXPONENTIAL',
    // overall timeout in 60 seconds
    timeout: 1000 * 60,
    // skip retry if we hit the rate-limit error
    retryIf: (error: any) => !(error instanceof FaucetRateLimitError),
    logger: (msg) => console.warn(`Retry requesting faucet: ${msg}`),
  });
  assert(resp, FaucetResponse, 'Request faucet failed\n');
  console.log('Request faucet success\n');
}

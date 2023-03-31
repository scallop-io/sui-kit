import {JsonRpcProvider, FaucetRateLimitError, assert, FaucetResponse} from '@mysten/sui.js'
import { retry } from 'ts-retry-promise'

/**
 * Request some SUI from faucet
 * @param address
 * @param provider
 * @returns {Promise<boolean>}, return true if the request is successful
 */
export const requestFaucet = async (address: string, provider: JsonRpcProvider) => {
	console.log('Requesting SUI from faucet for address: ', address)
	const resp = await retry<FaucetResponse>(() => provider.requestSuiFromFaucet(address), {
		backoff: 'EXPONENTIAL',
		// overall timeout in 60 seconds
		timeout: 1000 * 60,
		// skip retry if we hit the rate-limit error
		retryIf: (error: any) => !(error instanceof FaucetRateLimitError),
		logger: (msg) => console.warn('Retrying requesting SUI from faucet: ' + msg),
	});
	assert(resp, FaucetResponse, 'Request SUI from faucet failed for address: ' + address);
	console.log('Request SUI from faucet success for address: ' + address);
}

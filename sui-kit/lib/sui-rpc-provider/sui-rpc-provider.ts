import { Connection, JsonRpcProvider } from "@mysten/sui.js";
import { requestFaucet } from './faucet'
import { NetworkType, getDefaultNetworkParams } from "./default-chain-configs";

type Params = {
	fullnodeUrl?: string;
	faucetUrl?: string;
	networkType?: NetworkType;
}

export class SuiRpcProvider {
	public fullnodeUrl: string;
	public faucetUrl: string;
	public provider: JsonRpcProvider;
	/**
	 *
	 * @param networkType, 'testnet' | 'mainnet' | 'devnet', default is 'devnet'
	 * @param fullnodeUrl, the fullnode url, default is the preconfig fullnode url for the given network type
	 * @param faucetUrl, the faucet url, default is the preconfig faucet url for the given network type
	 */
	constructor({ fullnodeUrl, faucetUrl, networkType }: Params = {}) {
		// Get the default fullnode url and faucet url for the given network type, default is 'testnet'
		const defaultNetworkParams = getDefaultNetworkParams(networkType || 'devnet');
		// Set fullnodeUrl and faucetUrl, if they are not provided, use the default value.
		this.fullnodeUrl = fullnodeUrl || defaultNetworkParams.fullNode;
		this.faucetUrl = faucetUrl || defaultNetworkParams.faucet;

		// Init the provider
		const connection = new Connection({
			fullnode: this.fullnodeUrl,
			faucet: this.faucetUrl,
		});
		this.provider = new JsonRpcProvider(connection);
	}

	/**
	 * Request some SUI from faucet
	 * @Returns {Promise<boolean>}, true if the request is successful, false otherwise.
	 */
	async requestFaucet(addr: string) {
		return requestFaucet(addr, this.provider)
	}

	async getBalance(addr: string, coinType?: string) {
		return this.provider.getBalance({ owner: addr, coinType });
	}
}

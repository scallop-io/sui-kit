/**
 * @file sui-kit.ts
 * @description This file is used to aggregate the tools that used to interact with SUI network.
 * @author IceFox
 * @version 0.1.0
 */
import {JsonRpcProvider, RawSigner, Connection, TransactionBlock} from '@mysten/sui.js'
import { NetworkType, getDefaultNetworkParams } from "./default-chain-configs";
import { requestFaucet } from "./faucet";
import {PublishOptions, publishPackage} from "./publish-package";
import { composeTransferSuiTxn } from './transfer-sui';
import { SuiAccountManager, DerivePathParams } from "./sui-account-manager";

type ToolKitParams = {
	mnemonics?: string;
	secretKey?: string;
	fullnodeUrl?: string;
	faucetUrl?: string;
	networkType?: NetworkType;
	suiBin?: string;
}
/**
 * @class SuiKit
 * @description This class is used to aggregate the tools that used to interact with SUI network.
 */
export class SuiKit {

	public accountManager: SuiAccountManager;
	public fullnodeUrl: string;
	public faucetUrl: string;
	public provider: JsonRpcProvider;
	public suiBin: string;

	/**
	 * Support the following ways to init the SuiToolkit:
	 * 1. mnemonics
	 * 2. secretKey (base64 or hex)
	 * If none of them is provided, will generate a random mnemonics with 24 words.
	 *
	 * @param mnemonics, 12 or 24 mnemonics words, separated by space
	 * @param secretKey, base64 or hex string, when mnemonics is provided, secretKey will be ignored
	 * @param networkType, 'testnet' | 'mainnet' | 'devnet', default is 'devnet'
	 * @param fullnodeUrl, the fullnode url, default is the preconfig fullnode url for the given network type
	 * @param faucetUrl, the faucet url, default is the preconfig faucet url for the given network type
	 * @param suiBin, the path to sui cli binary, default to 'cargo run --bin sui'
	 */
	constructor({ mnemonics, secretKey, networkType, fullnodeUrl, faucetUrl, suiBin }: ToolKitParams = {}) {
		// Init the account manager
		this.accountManager = new SuiAccountManager({ mnemonics, secretKey });
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

		// Set the sui binary for building and publishing packages
		this.suiBin = suiBin || 'sui';
	}

	/**
	 * if derivePathParams is not provided or mnemonics is empty, it will return the currentSigner.
	 * else:
	 * it will generate address from the mnemonic with the given derivePathParams.
	 */
	getSigner(derivePathParams?: DerivePathParams) {
		const keyPair = this.accountManager.getKeyPair(derivePathParams);
		return new RawSigner(keyPair, this.provider);
	}

	switchAccount(derivePathParams: DerivePathParams) {
		this.accountManager.switchAccount(derivePathParams);
	}

	getAddress(derivePathParams?: DerivePathParams) {
		return this.accountManager.getAddress(derivePathParams);
	}
	currentAddress() { return this.accountManager.currentAddress }


	/**
	 * Request some SUI from faucet
	 * @Returns {Promise<boolean>}, true if the request is successful, false otherwise.
	 */
	async requestFaucet(derivePathParams?: DerivePathParams) {
		const addr = this.accountManager.getAddress(derivePathParams);
		return requestFaucet(addr, this.provider)
	}

	async getBalance(coinType?: string, derivePathParams?: DerivePathParams) {
		const owner = this.accountManager.getAddress(derivePathParams);
		return this.provider.getBalance({ owner, coinType});
	}

	async signTxn(tx: Uint8Array | TransactionBlock, derivePathParams?: DerivePathParams) {
		const signer = this.getSigner(derivePathParams);
		return signer.signTransactionBlock({ transactionBlock: tx });
	}

	async signAndSendTxn(tx: Uint8Array | TransactionBlock, derivePathParams?: DerivePathParams) {
		const signer = this.getSigner(derivePathParams);
		return signer.signAndExecuteTransactionBlock({ transactionBlock: tx  })
	}

	/**
	 * publish the move package at the given path
	 * It starts a child process to call the "sui binary" to build the move package
	 * The building process takes place in a tmp directory, which would be cleaned later
	 * @param packagePath
	 */
	async publishPackage(packagePath: string, options?: PublishOptions, derivePathParams?: DerivePathParams) {
		const signer = this.getSigner(derivePathParams);
		return publishPackage(this.suiBin, packagePath, signer)
	}

	async transferSui(to: string, amount: number, derivePathParams?: DerivePathParams) {
		const tx = composeTransferSuiTxn(to, amount);
		return this.signAndSendTxn(tx, derivePathParams);
	}
}

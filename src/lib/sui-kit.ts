/**
 * @file sui-kit.ts
 * @description This file is used to aggregate the tools that used to interact with SUI network.
 * @author IceFox
 * @version 0.1.0
 */
import {Ed25519Keypair, JsonRpcProvider, RawSigner, Connection, TransactionBlock} from '@mysten/sui.js'
import { getKeyPair, DerivePathParams } from "./keypair";
import { NetworkType, getDefaultNetworkParams } from "./default-chain-configs";
import {hexOrBase64ToUint8Array} from "./util";
import { requestFaucet } from "./faucet";
import {publishPackage} from "./publish-package";

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
	private mnemonics: string;
	private secretKey: string;
	public fullnodeUrl: string;
	public faucetUrl: string;
	public provider: JsonRpcProvider;
	public currentKeyPair: Ed25519Keypair;
	public currentSigner: RawSigner;
	public currentAddress: string;
	public suiBin: string;

	/**
	 * Support the following ways to init the SuiToolkit:
	 * 1. mnemonics
	 * 2. secretKey (base64 or hex)
	 * Need to pass in either mnemonics or secretKey.
	 *
	 * @param mnemonics, 12 or 24 mnemonics words, separated by space
	 * @param secretKey, base64 or hex string, when mnemonics is provided, secretKey will be ignored
	 * @param networkType, 'testnet' | 'mainnet' | 'devnet', default is 'testnet'
	 * @param fullnodeUrl, the fullnode url, default is the preconfig fullnode url for the given network type
	 * @param faucetUrl, the faucet url, default is the preconfig faucet url for the given network type
	 * @param suiBin, the path to sui cli binary, default to 'cargo run --bin sui'
	 */
	constructor({ mnemonics, secretKey, networkType, fullnodeUrl, faucetUrl, suiBin }: ToolKitParams) {
		// Get the default fullnode url and faucet url for the given network type, default is 'testnet'
		const defaultNetworkParams = getDefaultNetworkParams(networkType || 'testnet');

		// Set fullnodeUrl and faucetUrl, if they are not provided, use the default value.
		this.fullnodeUrl = fullnodeUrl || defaultNetworkParams.fullNode;
		this.faucetUrl = faucetUrl || defaultNetworkParams.faucet;

		// Init the provider
		const connection = new Connection({
			fullnode: this.fullnodeUrl,
			faucet: this.faucetUrl,
		});
		this.provider = new JsonRpcProvider(connection);

		// Init the currentKeyPair
		// If the mnemonics or secretKey is provided, use it to init the currentKeyPair
		// Otherwise, throw an error
		this.mnemonics = mnemonics || "";
		this.secretKey = secretKey || "";
		if (this.mnemonics || this.secretKey) {
			this.currentKeyPair = this.getKeyPair();
		} else {
			throw new Error("Please provide the mnemonics or secretKey");
		}

		// Init the currentSigner
		this.currentSigner = this.getSigner();
		// Init the currentAddress
		this.currentAddress = this.getAddress();
		// Set the sui binary for building and publishing packages
		this.suiBin = suiBin || 'sui';
	}

	/**
	 * When mnemonics is provided, it will generate keyPair based on the given derivePathParams.
	 * Otherwise, it will use the secretKey to generate keyPair, and ignore the derivePathParams.
	 */
	getKeyPair(derivePathParams: DerivePathParams = {}) {
		if (this.mnemonics) {
			return getKeyPair(this.mnemonics, derivePathParams)
		} else if (!this.currentKeyPair) {
			const arrayData = hexOrBase64ToUint8Array(this.secretKey);
			return Ed25519Keypair.fromSecretKey(arrayData);
		} else {
			return this.currentKeyPair;
		}
	}

	/**
	 * When mnemonics is provided, it will generate address based on the given derivePathParams.
	 * Otherwise, it will use the currentKeyPair to generate address, and ignore the derivePathParams.
	 */
	getAddress(derivePathParams: DerivePathParams = {}) {
		return this.getKeyPair(derivePathParams).getPublicKey().toSuiAddress();
	}

	/**
	 * When mnemonics is provided, it will generate signer based on the given derivePathParams.
	 * Otherwise, it will use the currentSigner, and ignore the derivePathParams.
	 */
	getSigner(derivePathParams: DerivePathParams = {}) {
		return new RawSigner(this.getKeyPair(derivePathParams), this.provider);
	}

	/**
	 * Switch the current account with the given derivePathParams.
	 * This is only useful when the mnemonics is provided. For secretKey mode, it will always use the same account.
	 */
	switchAccount(derivePathParams: DerivePathParams = {}) {
		if (!this.mnemonics) {
			this.currentKeyPair = this.getKeyPair(derivePathParams);
			this.currentSigner = new RawSigner(this.currentKeyPair, this.provider);
			this.currentAddress = this.currentKeyPair.getPublicKey().toSuiAddress();
		}
	}

	/**
	 * Request the faucet to send some SUI to the current account.
	 * @Returns {Promise<boolean>}, true if the request is successful, false otherwise.
	 */
	async requestFaucet() {
		return requestFaucet(this.currentAddress, this.provider)
	}

	async getBalance(coinType?: string) {
		return this.provider.getBalance({ owner: this.currentAddress, coinType});
	}

	async signTxn(tx: Uint8Array | TransactionBlock) {
		return this.currentSigner.signTransactionBlock({ transactionBlock: tx });
	}

	async signAndSendTxn(tx: Uint8Array | TransactionBlock) {
		return this.currentSigner.signAndExecuteTransactionBlock({ transactionBlock: tx  })
	}

	/**
	 * publish the move package at the given path
	 * It starts a child process to call the "sui binary" to build the move package
	 * The building process takes place in a tmp directory, which would be cleaned later
	 * @param packagePath
	 */
	async publishPackage(packagePath: string) {
		return publishPackage(this.suiBin, packagePath, this.currentSigner)
	}
}

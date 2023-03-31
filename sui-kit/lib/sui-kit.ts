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
import {PublishOptions, publishPackage} from "./publish-package";
import { generateMnemonic } from './crypto';
import { composeTransferSuiTxn } from './transfer-sui';

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

		// If the mnemonics or secretKey is provided, use it
		// Otherwise, generate a random mnemonics with 24 words 
		this.mnemonics = mnemonics || "";
		this.secretKey = secretKey || "";
		if (!this.mnemonics && !this.secretKey) {
			this.mnemonics = generateMnemonic(24)
		}

		// Init the current account
		this.currentKeyPair = this.secretKey
			? Ed25519Keypair.fromSecretKey(hexOrBase64ToUint8Array(this.secretKey))
			: getKeyPair(this.mnemonics);
		this.currentSigner = new RawSigner(this.currentKeyPair, this.provider);
		this.currentAddress = this.currentKeyPair.getPublicKey().toSuiAddress();

		// Set the sui binary for building and publishing packages
		this.suiBin = suiBin || 'sui';
	}

	/**
	 * if derivePathParams is not provided or mnemonics is empty, it will return the currentKeyPair.
	 * else:
	 * it will generate keyPair from the mnemonic with the given derivePathParams.
	 */
	getKeyPair(derivePathParams?: DerivePathParams) {
		if (!derivePathParams || !this.mnemonics) return this.currentKeyPair;
		return getKeyPair(this.mnemonics, derivePathParams);
	}

	/**
	 * if derivePathParams is not provided or mnemonics is empty, it will return the currentAddress.
	 * else:
	 * it will generate address from the mnemonic with the given derivePathParams.
	 */
	getAddress(derivePathParams?: DerivePathParams) {
		if (!derivePathParams || !this.mnemonics) return this.currentAddress;
		return getKeyPair(this.mnemonics, derivePathParams).getPublicKey().toSuiAddress();
	}

	/**
	 * if derivePathParams is not provided or mnemonics is empty, it will return the currentSigner.
	 * else:
	 * it will generate address from the mnemonic with the given derivePathParams.
	 */
	getSigner(derivePathParams?: DerivePathParams) {
		if (!derivePathParams || !this.mnemonics) return this.currentSigner;
		return new RawSigner(getKeyPair(this.mnemonics, derivePathParams), this.provider);
	}

	/**
	 * Switch the current account with the given derivePathParams.
	 * This is only useful when the mnemonics is provided. For secretKey mode, it will always use the same account.
	 */
	switchAccount(derivePathParams: DerivePathParams) {
		if (this.mnemonics) {
			this.currentKeyPair = getKeyPair(this.mnemonics, derivePathParams);
			this.currentSigner = new RawSigner(this.currentKeyPair, this.provider);
			this.currentAddress = this.currentKeyPair.getPublicKey().toSuiAddress();
		}
	}

	/**
	 * Request some SUI from faucet
	 * @Returns {Promise<boolean>}, true if the request is successful, false otherwise.
	 */
	async requestFaucet(derivePathParams?: DerivePathParams) {
		const addr = this.getAddress(derivePathParams);
		return requestFaucet(addr, this.provider)
	}

	async getBalance(coinType?: string, derivePathParams?: DerivePathParams) {
		const owner = this.getAddress(derivePathParams);
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

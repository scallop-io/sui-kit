import {
  Connection,
  JsonRpcProvider,
  getObjectType,
  getObjectId,
  getObjectFields,
  getObjectDisplay,
  getObjectVersion,
  DisplayFieldsResponse,
  ObjectContentFields,
} from "@mysten/sui.js";
import { requestFaucet } from './faucet'
import { NetworkType, getDefaultNetworkParams } from "./default-chain-configs";

type ObjectData = {
  objectId: string;
  objectType: string;
  objectVersion: number;
  objectDisplay: DisplayFieldsResponse;
  objectFields: ObjectContentFields;
}

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
   * @param networkType, 'testnet' | 'mainnet' | 'devnet' | 'localhost', default is 'devnet'
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

  async getObjects(ids: string[]) {
    const options = { showContent: true, showDisplay: true, showType: true };
    const objects = await this.provider.multiGetObjects({ ids, options });
    const parsedObjects = objects.map((object) => {
      const objectId = getObjectId(object);
      const objectType = getObjectType(object);
      const objectVersion = getObjectVersion(object);
      const objectFields = getObjectFields(object);
      const objectDisplay = getObjectDisplay(object);
      return { objectId, objectType, objectVersion, objectFields, objectDisplay };
    });
    return parsedObjects as ObjectData[]
  }

  /**
   * @description Select coins that add up to the given amount.
   * @param addr the address of the owner
   * @param amount the amount that is needed for the coin
   * @param coinType the coin type, default is '0x2::SUI::SUI'
   */
  async selectCoins(addr: string, amount: number, coinType: string = '0x2::SUI::SUI') {
    const coins = await this.provider.getCoins({ owner: addr, coinType });
    let selectedCoins: {objectId: string, digest: string, version: string}[] = [];
    let totalAmount = 0;
    // Sort the coins by balance in descending order
    const coinsData = coins.data.sort((a, b) => parseInt(b.balance) - parseInt(a.balance))
    for(const coinData of coins.data) {
      selectedCoins.push({
        objectId: coinData.coinObjectId,
        digest: coinData.digest,
        version: coinData.version,
      });
      totalAmount = totalAmount + parseInt(coinData.balance);
      if (totalAmount >= amount) {
        break;
      }
    }

    if (!selectedCoins.length) {
      throw new Error('No valid coins found for the transaction.');
    }
    return selectedCoins;
  }
}

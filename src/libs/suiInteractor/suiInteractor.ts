import {
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
  JsonRpcProvider,
  Connection,
  getObjectDisplay,
  getObjectFields,
  getObjectId,
  getObjectType,
  getObjectVersion,
  getSharedObjectInitialVersion
} from '@mysten/sui.js';
import { ObjectData } from "src/types";
import { SuiOwnedObject, SuiSharedObject } from "../suiModel";
import { delay } from "./util";

/**
 * `SuiTransactionSender` is used to send transaction with a given gas coin.
 * It always uses the gas coin to pay for the gas,
 * and update the gas coin after the transaction.
 */
export class SuiInteractor {
  public readonly providers: JsonRpcProvider[];
  public currentProvider: JsonRpcProvider;
  constructor(fullNodeUrls: string[]) {
    if (fullNodeUrls.length === 0) throw new Error('fullNodeUrls must not be empty');
    this.providers = fullNodeUrls.map(url => new JsonRpcProvider(new Connection({ fullnode: url })));
    this.currentProvider = this.providers[0];
  }

  switchToNextProvider() {
    const currentProviderIdx = this.providers.indexOf(this.currentProvider);
    this.currentProvider = this.providers[(currentProviderIdx + 1) % this.providers.length];
  }

  async sendTx(
    transactionBlock: Uint8Array | string,
    signature: string | string[],
  ): Promise<SuiTransactionBlockResponse> {

    const txResOptions: SuiTransactionBlockResponseOptions = {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    }

    // const currentProviderIdx = this.providers.indexOf(this.currentProvider);
    // const providers = [
    //   ...this.providers.slice(currentProviderIdx, this.providers.length),
    //   ...this.providers.slice(0, currentProviderIdx),
    // ]

    for (const provider of this.providers) {
      try {
        const res = await provider.executeTransactionBlock({
          transactionBlock,
          signature,
          options: txResOptions
        });
        return res;
      } catch (err) {
        console.warn(`Failed to send transaction with fullnode ${provider.connection.fullnode}: ${err}`);
        await delay(2000);
      }
    }
    throw new Error('Failed to send transaction with all fullnodes');
  }
  async getObjects(ids: string[]) {
    const options = { showContent: true, showDisplay: true, showType: true, showOwner: true };

    // const currentProviderIdx = this.providers.indexOf(this.currentProvider);
    // const providers = [
    //   ...this.providers.slice(currentProviderIdx, this.providers.length),
    //   ...this.providers.slice(0, currentProviderIdx),
    // ]

    for (const provider of this.providers) {
      try {
        const objects = await provider.multiGetObjects({ ids, options });
        const parsedObjects = objects.map((object) => {
          const objectId = getObjectId(object);
          const objectType = getObjectType(object);
          const objectVersion = getObjectVersion(object);
          const objectDigest = object.data ? object.data.digest : undefined;
          const initialSharedVersion = getSharedObjectInitialVersion(object);
          const objectFields = getObjectFields(object);
          const objectDisplay = getObjectDisplay(object);
          return {
            objectId,
            objectType,
            objectVersion,
            objectDigest,
            objectFields,
            objectDisplay,
            initialSharedVersion,
          };
        });
        return parsedObjects as ObjectData[];
      } catch (err) {
        await delay(2000);
        console.warn(`Failed to get objects with fullnode ${provider.connection.fullnode}: ${err}`);
      }
    }
    throw new Error('Failed to get objects with all fullnodes');
  }

  async getObject(id: string) {
    const objects = await this.getObjects([id]);
    return objects[0];
  }

  /**
   * @description Update objects in a batch
   * @param suiObjects
   */
  async updateObjects(suiObjects: (SuiOwnedObject | SuiSharedObject)[]) {
    const objectIds = suiObjects.map((obj) => obj.objectId);
    const objects = await this.getObjects(objectIds);
    for(const object of objects) {
      const suiObject = suiObjects.find((obj) => obj.objectId === object.objectId);
      if(suiObject instanceof SuiSharedObject) {
        suiObject.initialSharedVersion = object.initialSharedVersion;
      } else if (suiObject instanceof SuiOwnedObject) {
        suiObject.version = object.objectVersion;
        suiObject.digest = object.objectDigest;
      }
    }
  }

  /**
   * @description Select coins that add up to the given amount.
   * @param addr the address of the owner
   * @param amount the amount that is needed for the coin
   * @param coinType the coin type, default is '0x2::SUI::SUI'
   */
  async selectCoins(
    addr: string,
    amount: number,
    coinType: string = '0x2::SUI::SUI'
  ) {
    const coins = await this.currentProvider.getCoins({ owner: addr, coinType });
    const selectedCoins: {
      objectId: string;
      digest: string;
      version: string;
    }[] = [];
    let totalAmount = 0;
    // Sort the coins by balance in descending order
    coins.data.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
    for (const coinData of coins.data) {
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

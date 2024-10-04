import { SuiClient } from '@mysten/sui/client';
import { SuiOwnedObject, SuiSharedObject } from '../suiModel';
import { delay } from './util';
import type {
  SuiTransactionBlockResponseOptions,
  SuiTransactionBlockResponse,
  SuiObjectDataOptions,
  SuiObjectData,
  DryRunTransactionBlockResponse,
} from '@mysten/sui/client';

/**
 * Encapsulates all functions that interact with the sui sdk
 */
export class SuiInteractor {
  public readonly clients: SuiClient[];
  public currentClient: SuiClient;
  public readonly fullNodes: string[];
  public currentFullNode: string;

  constructor(fullNodeUrls: string[]) {
    if (fullNodeUrls.length === 0)
      throw new Error('fullNodeUrls must not be empty');
    this.fullNodes = fullNodeUrls;
    this.clients = fullNodeUrls.map((url) => new SuiClient({ url }));
    this.currentFullNode = fullNodeUrls[0];
    this.currentClient = this.clients[0];
  }

  switchToNextClient() {
    const currentClientIdx = this.clients.indexOf(this.currentClient);
    this.currentClient =
      this.clients[(currentClientIdx + 1) % this.clients.length];
    this.currentFullNode =
      this.fullNodes[(currentClientIdx + 1) % this.clients.length];
  }

  async sendTx(
    transactionBlock: Uint8Array | string,
    signature: string | string[]
  ): Promise<SuiTransactionBlockResponse> {
    const txResOptions: SuiTransactionBlockResponseOptions = {
      showEvents: true,
      showEffects: true,
      showRawEffects: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    };

    for (const clientIdx in this.clients) {
      try {
        return await this.clients[clientIdx].executeTransactionBlock({
          transactionBlock,
          signature,
          options: txResOptions,
        });
      } catch (err) {
        console.warn(
          `Failed to send transaction with fullnode ${this.fullNodes[clientIdx]}: ${err}`
        );
        await delay(2000);
      }
    }
    throw new Error('Failed to send transaction with all fullnodes');
  }

  async dryRunTx(
    transactionBlock: Uint8Array
  ): Promise<DryRunTransactionBlockResponse> {
    for (const clientIdx in this.clients) {
      try {
        return await this.clients[clientIdx].dryRunTransactionBlock({
          transactionBlock,
        });
      } catch (err) {
        console.warn(
          `Failed to dry run transaction with fullnode ${this.fullNodes[clientIdx]}: ${err}`
        );
        await delay(2000);
      }
    }
    throw new Error('Failed to dry run transaction with all fullnodes');
  }

  async getObjects(
    ids: string[],
    options?: SuiObjectDataOptions
  ): Promise<SuiObjectData[]> {
    const opts: SuiObjectDataOptions = options ?? {
      showContent: true,
      showDisplay: true,
      showType: true,
      showOwner: true,
    };

    for (const clientIdx in this.clients) {
      try {
        const objects = await this.clients[clientIdx].multiGetObjects({
          ids,
          options: opts,
        });
        const parsedObjects = objects
          .map((object) => {
            return object.data;
          })
          .filter((object) => object !== null && object !== undefined);
        return parsedObjects as SuiObjectData[];
      } catch (err) {
        await delay(2000);
        console.warn(
          `Failed to get objects with fullnode ${this.fullNodes[clientIdx]}: ${err}`
        );
      }
    }
    throw new Error('Failed to get objects with all fullnodes');
  }

  async getObject(id: string, options?: SuiObjectDataOptions) {
    const objects = await this.getObjects([id], options);
    return objects[0];
  }

  /**
   * @description Update objects in a batch
   * @param suiObjects
   */
  async updateObjects(suiObjects: (SuiOwnedObject | SuiSharedObject)[]) {
    const objectIds = suiObjects.map((obj) => obj.objectId);
    const objects = await this.getObjects(objectIds);
    for (const object of objects) {
      const suiObject = suiObjects.find(
        (obj) => obj.objectId === object?.objectId
      );
      if (suiObject instanceof SuiSharedObject) {
        if (
          object.owner &&
          typeof object.owner === 'object' &&
          'Shared' in object.owner
        ) {
          suiObject.initialSharedVersion =
            object.owner.Shared.initial_shared_version;
        } else {
          suiObject.initialSharedVersion = undefined;
        }
      } else if (suiObject instanceof SuiOwnedObject) {
        suiObject.version = object?.version;
        suiObject.digest = object?.digest;
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
    const selectedCoins: {
      objectId: string;
      digest: string;
      version: string;
      balance: string;
    }[] = [];
    let totalAmount = 0;
    let hasNext = true,
      nextCursor: string | null | undefined = null;
    while (hasNext && totalAmount < amount) {
      const coins = await this.currentClient.getCoins({
        owner: addr,
        coinType: coinType,
        cursor: nextCursor,
      });
      // Sort the coins by balance in descending order
      coins.data.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
      for (const coinData of coins.data) {
        selectedCoins.push({
          objectId: coinData.coinObjectId,
          digest: coinData.digest,
          version: coinData.version,
          balance: coinData.balance,
        });
        totalAmount = totalAmount + parseInt(coinData.balance);
        if (totalAmount >= amount) {
          break;
        }
      }

      nextCursor = coins.nextCursor;
      hasNext = coins.hasNextPage;
    }

    if (!selectedCoins.length) {
      throw new Error('No valid coins found for the transaction.');
    }
    return selectedCoins;
  }
}

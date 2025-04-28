import { SuiInteractorParams } from 'src/types';
import { SuiOwnedObject, SuiSharedObject } from '../suiModel';
import { batch, delay } from './util';
import {
  type SuiTransactionBlockResponseOptions,
  type SuiTransactionBlockResponse,
  type SuiObjectDataOptions,
  type SuiObjectData,
  type DryRunTransactionBlockResponse,
  SuiClient,
  getFullnodeUrl,
} from '@mysten/sui/client';

/**
 * Encapsulates all functions that interact with the sui sdk
 */
export class SuiInteractor {
  private clients: SuiClient[] = [];
  public currentClient: SuiClient;
  private fullNodes: string[] = [];

  constructor(params: Partial<SuiInteractorParams>) {
    if ('fullnodeUrls' in params) {
      this.fullNodes = params.fullnodeUrls ?? [getFullnodeUrl('mainnet')];
      this.clients = this.fullNodes.map((url) => new SuiClient({ url }));
    } else if ('suiClients' in params && params.suiClients) {
      this.clients = params.suiClients;
    } else {
      this.clients = [new SuiClient({ url: getFullnodeUrl('mainnet') })];
    }
    this.currentClient = this.clients[0];
  }

  switchToNextClient() {
    const currentClientIdx = this.clients.indexOf(this.currentClient);
    this.currentClient =
      this.clients[(currentClientIdx + 1) % this.clients.length];
  }

  switchFullNodes(fullNodes: string[]) {
    if (fullNodes.length === 0) {
      throw new Error('fullNodes cannot be empty');
    }
    this.fullNodes = fullNodes;
    this.clients = fullNodes.map((url) => new SuiClient({ url }));
    this.currentClient = this.clients[0];
  }

  get currentFullNode() {
    if (this.fullNodes.length === 0) {
      throw new Error('No full nodes available');
    }

    const clientIdx = this.clients.indexOf(this.currentClient);
    if (clientIdx === -1) {
      throw new Error('Current client not found');
    }

    return this.fullNodes[clientIdx];
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
    options?: SuiObjectDataOptions & {
      batchSize?: number;
      switchClientDelay?: number;
    }
  ): Promise<SuiObjectData[]> {
    const opts: SuiObjectDataOptions = options ?? {
      showContent: true,
      showDisplay: true,
      showType: true,
      showOwner: true,
    };

    const batchIds = batch(ids, Math.max(options?.batchSize ?? 50, 50));
    const results: SuiObjectData[] = [];
    let lastError = null;

    for (const batch of batchIds) {
      for (const clientIdx in this.clients) {
        try {
          const objects = await this.clients[clientIdx].multiGetObjects({
            ids: batch,
            options: opts,
          });
          const parsedObjects = objects
            .map((object) => {
              return object.data;
            })
            .filter((object) => object !== null && object !== undefined);
          results.push(...(parsedObjects as SuiObjectData[]));
          lastError = null;
          break; // Exit the client loop if successful
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          await delay(options?.switchClientDelay ?? 2000);
          console.warn(
            `Failed to get objects with fullnode ${this.fullNodes[clientIdx]}: ${err}`
          );
        }
      }
      if (lastError) {
        throw new Error(
          `Failed to get objects with all fullnodes: ${lastError}`
        );
      }
    }

    return results;
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
